"""Pull infrastructure metrics into /status from Cloudflare and DigitalOcean.

Both providers are optional: with no tokens in .env the dashboard simply shows
"not configured". All calls soft-fail and are cached for METRICS_TTL seconds
so the status page stays fast and stays inside API rate limits.

Tokens to create (read-only is all we need):
  Cloudflare: dash.cloudflare.com/profile/api-tokens → Create Token →
              Custom → Account | Account Analytics | Read
  DigitalOcean: cloud.digitalocean.com → API (left sidebar) → Generate New
                Token → Read scope only. Droplet ID is in the droplet's URL.
"""
import logging
import time
from datetime import datetime, timedelta, timezone

import requests

from . import config

log = logging.getLogger("stackdock.metrics")

METRICS_TTL = 300  # seconds
_cache: dict[str, tuple[float, dict]] = {}


def _cached(key: str, fn):
    now = time.time()
    hit = _cache.get(key)
    if hit and now - hit[0] < METRICS_TTL:
        return hit[1]
    val = fn()
    _cache[key] = (now, val)
    return val


# ---------------- Cloudflare R2 ----------------

_R2_QUERY = """
query($account: String!, $bucket: String!, $since: Time!) {
  viewer {
    accounts(filter: {accountTag: $account}) {
      r2StorageAdaptiveGroups(
        limit: 1
        filter: {bucketName: $bucket, datetime_geq: $since}
        orderBy: [datetime_DESC]
      ) {
        max { payloadSize metadataSize objectCount }
        dimensions { datetime }
      }
    }
  }
}
"""


def _fetch_r2() -> dict:
    if not (config.CLOUDFLARE_API_TOKEN and config.CLOUDFLARE_ACCOUNT_ID):
        return {"configured": False}
    try:
        # Cloudflare caps the storage-analytics window at ~33 days; ask for the
        # most recent sample in the last 2 days.
        since = (datetime.now(timezone.utc) - timedelta(days=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
        r = requests.post(
            "https://api.cloudflare.com/client/v4/graphql",
            json={"query": _R2_QUERY,
                  "variables": {"account": config.CLOUDFLARE_ACCOUNT_ID,
                                "bucket": config.S3_BUCKET, "since": since}},
            headers={"Authorization": f"Bearer {config.CLOUDFLARE_API_TOKEN}"},
            timeout=15,
        )
        data = r.json()
        if r.status_code != 200 or data.get("errors"):
            msg = (data.get("errors") or [{}])[0].get("message", f"HTTP {r.status_code}")
            return {"configured": True, "ok": False, "error": msg}
        groups = (data["data"]["viewer"]["accounts"][0]["r2StorageAdaptiveGroups"])
        if not groups:
            return {"configured": True, "ok": True, "size_gb": 0.0, "objects": 0,
                    "as_of": "no data yet"}
        g = groups[0]
        size = (g["max"].get("payloadSize") or 0) + (g["max"].get("metadataSize") or 0)
        return {
            "configured": True, "ok": True,
            "size_gb": round(size / 1e9, 2),
            "objects": g["max"].get("objectCount") or 0,
            "est_cost_month": round(size / 1e9 * 0.015, 2),  # R2 $0.015/GB-month
            "as_of": (g["dimensions"].get("datetime") or "")[:16],
        }
    except Exception as e:
        return {"configured": True, "ok": False, "error": f"{type(e).__name__}: {e}"}


def r2_metrics() -> dict:
    return _cached("r2", _fetch_r2)


# ---------------- DigitalOcean droplet ----------------

def _do_get(s: requests.Session, path: str, params=None) -> dict | None:
    r = s.get(f"https://api.digitalocean.com/v2{path}", params=params, timeout=15)
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code} on {path}")
    return r.json()


def _latest_value(metric_json: dict) -> float | None:
    """Pull the most recent value out of a DO monitoring timeseries response."""
    try:
        values = metric_json["data"]["result"][0]["values"]
        return float(values[-1][1])
    except (KeyError, IndexError, TypeError, ValueError):
        return None


def _fetch_do() -> dict:
    if not (config.DO_API_TOKEN and config.DO_DROPLET_ID):
        return {"configured": False}
    try:
        s = requests.Session()
        s.headers["Authorization"] = f"Bearer {config.DO_API_TOKEN}"

        droplet = _do_get(s, f"/droplets/{config.DO_DROPLET_ID}")["droplet"]
        out = {
            "configured": True, "ok": True,
            "status": droplet.get("status", "unknown"),
            "size": droplet.get("size_slug", "?"),
            "region": (droplet.get("region") or {}).get("slug", "?"),
        }

        # monitoring timeseries (requires the DO metrics agent, on by default on new droplets)
        end = datetime.now(timezone.utc)
        start = end - timedelta(minutes=15)
        ts = {"host_id": str(config.DO_DROPLET_ID),
              "start": str(int(start.timestamp())), "end": str(int(end.timestamp()))}

        load5 = _latest_value(_do_get(s, "/monitoring/metrics/droplet/load_5", ts))
        mem_total = _latest_value(_do_get(s, "/monitoring/metrics/droplet/memory_total", ts))
        mem_avail = _latest_value(_do_get(s, "/monitoring/metrics/droplet/memory_available", ts))

        out["load_5"] = round(load5, 2) if load5 is not None else None
        if mem_total and mem_avail is not None:
            out["mem_used_pct"] = round((mem_total - mem_avail) / mem_total * 100)
        else:
            out["mem_used_pct"] = None
        return out
    except Exception as e:
        return {"configured": True, "ok": False, "error": f"{type(e).__name__}: {e}"}


def do_metrics() -> dict:
    return _cached("do", _fetch_do)


# ---------------- NYT (cookie + residential proxy health) ----------------

# ASN/org hints — mirror app/ingest/nyt.py so the status reads the same way.
_NYT_RESIDENTIAL = ("comcast", "charter", "spectrum", "verizon", "at&t", "att ",
                    "t-mobile", "tmobile", "cox", "centurylink", "frontier",
                    "cablevision", "optimum", "rcn", "grande", "windstream",
                    "mediacom", "sparklight", "cable", "communications",
                    "broadband", "telecom", "fios", "wireless")
_NYT_HOSTING = ("rocks computer", "hosting", "datacenter", "data center", "cloud",
                "server", "colo", "zayo", "digitalocean", "amazon", "google",
                "ovh", "hetzner", "linode", "vultr")


def _fetch_nyt() -> dict:
    """Cookie presence + a live one-shot proxy check (exit IP / country / ASN).

    Cheap enough to cache for 5 min like the other metrics — one HTTP GET through
    the proxy, no browser. Soft-fails so it can never break /status.
    """
    cookie_set = bool(config.NYT_COOKIE)
    proxy_set = bool(config.NYT_PROXY_SERVER)
    if not cookie_set and not proxy_set:
        return {"configured": False}
    out = {"configured": True, "cookie_set": cookie_set, "proxy_set": proxy_set}
    if proxy_set:
        try:
            user = f"{config.NYT_PROXY_USER}__cr.us"      # US exit, no sticky needed
            scheme, rest = config.NYT_PROXY_SERVER.split("://", 1)
            px = f"{scheme}://{user}:{config.NYT_PROXY_PASS}@{rest}"
            r = requests.get("https://ipinfo.io/json",
                             proxies={"http": px, "https": px}, timeout=20)
            j = r.json()
            org = j.get("org", "")
            residential = (any(h in org.lower() for h in _NYT_RESIDENTIAL)
                           and not any(h in org.lower() for h in _NYT_HOSTING))
            out.update({
                "proxy_ok": r.status_code == 200 and j.get("country") == "US",
                "proxy_ip": j.get("ip"), "proxy_country": j.get("country"),
                "proxy_org": org, "proxy_residential": residential,
            })
        except Exception as e:
            out["proxy_ok"] = False
            out["proxy_error"] = f"{type(e).__name__}: {e}"
    return out


def nyt_metrics() -> dict:
    return _cached("nyt", _fetch_nyt)
