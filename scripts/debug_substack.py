"""Diagnose why a Substack cookie isn't pulling subscriptions.

Run this ON THE DROPLET (so it tests the same IP Stackdock syncs from):

    cd /opt/stackdock
    SUBSTACK_SID='<paste cookie value>' docker compose exec -T \
        -e SUBSTACK_SID stackdock python scripts/debug_substack.py

or locally:  SUBSTACK_SID='<cookie>' python scripts/debug_substack.py

Never put the cookie on the command line of a shared machine's shell history
if you can avoid it; `read -s SUBSTACK_SID && export SUBSTACK_SID` works too.
"""
import json
import os
import sys
from urllib.parse import unquote

import requests

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124 Safari/537.36")
ENDPOINT = "https://substack.com/api/v1/subscriptions"

# Same candidate shapes app/ingest/substack.py tries when the plain GET 400s
CANDIDATES = [
    (ENDPOINT, {"tvOnly": "false"}),  # required since June 2026; bare GET 400s
    (ENDPOINT, None),
    ("https://substack.com/api/v1/reader/subscriptions", None),
]


def probe(label: str, cookie: str) -> bool:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    s.cookies.set("substack.sid", cookie, domain=".substack.com")
    r = None
    for url, params in CANDIDATES:
        try:
            r = s.get(url, params=params, timeout=30)
        except requests.RequestException as e:
            print(f"[{label}] network error on {url}: {e}")
            continue
        shape = f"{url}{'?' + '&'.join(f'{k}={v}' for k, v in params.items()) if params else ''}"
        print(f"[{label}] {shape} -> HTTP {r.status_code}")
        if r.status_code == 400:
            # express-validator bodies are tiny and NAME the missing param — print verbatim
            print(f"[{label}] 400 body verbatim: {r.text[:500]}")
            continue
        if r.status_code == 200:
            break
    if r is None:
        return False

    print(f"[{label}] final: HTTP {r.status_code}  content-type={r.headers.get('Content-Type', '?')}")

    body = r.text or ""
    if "Just a moment" in body or "cf-challenge" in body or "challenge-platform" in body:
        print(f"[{label}] >>> Cloudflare bot challenge — Substack is blocking this IP "
              f"(common for datacenter/droplet IPs). The cookie may be FINE; the IP is the problem.")
        return False
    if r.status_code in (401, 403):
        print(f"[{label}] >>> auth rejected — cookie is expired/invalid for this form.")
        return False
    if r.status_code != 200:
        print(f"[{label}] >>> unexpected status. First 200 chars:\n{body[:200]}")
        return False

    try:
        data = r.json()
    except ValueError:
        print(f"[{label}] >>> 200 but not JSON (probably an HTML page). First 200 chars:\n{body[:200]}")
        return False

    # same defensive walk as app/ingest/substack.py
    pubs, seen = [], set()

    def walk(node):
        if isinstance(node, dict):
            sub, custom, name = node.get("subdomain"), node.get("custom_domain"), node.get("name")
            if name and (sub or custom):
                base = f"https://{custom}" if custom else f"https://{sub}.substack.com"
                if base not in seen:
                    seen.add(base)
                    pubs.append((name, base))
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for x in node:
                walk(x)

    walk(data)
    print(f"[{label}] OK — found {len(pubs)} publication(s):")
    for name, base in pubs[:20]:
        print(f"    - {name}  ({base})")
    if not pubs:
        print(f"[{label}] >>> auth OK but the JSON walk found nothing. Top-level keys: "
              f"{list(data)[:10] if isinstance(data, dict) else type(data).__name__} — "
              f"Substack may have changed the response shape; paste these keys to your agent.")
    return bool(pubs)


def probe_profile(handle: str) -> None:
    """No-auth discovery via the public profile (what the substack-api library uses)."""
    s = requests.Session()
    s.headers["User-Agent"] = UA
    url = f"https://substack.com/api/v1/user/{handle}/public_profile"
    try:
        r = s.get(url, timeout=30)
    except requests.RequestException as e:
        print(f"[profile] network error: {e}")
        return
    print(f"[profile] {url} -> HTTP {r.status_code}")
    if r.status_code != 200:
        print(f"[profile] body[:200]: {r.text[:200]}")
        return
    try:
        subs = (r.json() or {}).get("subscriptions") or []
    except ValueError:
        print("[profile] 200 but not JSON")
        return
    print(f"[profile] {len(subs)} subscription(s) visible on the public profile:")
    for sub in subs[:20]:
        pub = (sub or {}).get("publication") or {}
        print(f"    - {pub.get('name')}  ({pub.get('custom_domain') or (str(pub.get('subdomain')) + '.substack.com')})"
              f"  [{sub.get('membership_state')}]")
    if not subs:
        print("[profile] none — your reading list may be hidden on your profile settings.")


def main() -> int:
    cookie = os.environ.get("SUBSTACK_SID", "").strip()
    if not cookie:
        print("Set SUBSTACK_SID in the environment first (see docstring). Not as an argument —"
              " keep it out of shell history and chat logs.")
        return 2

    variants = [("as-pasted", cookie)]
    decoded = unquote(cookie)
    if decoded != cookie:
        variants.append(("url-decoded", decoded))
    else:
        print("note: cookie has no %-escapes; if you copied a decoded value, also try the"
              " encoded form straight from DevTools (it normally starts with s%3A).")

    handle = os.environ.get("SUBSTACK_HANDLE", "").strip().lstrip("@")
    if handle:
        probe_profile(handle)
    else:
        print("tip: also set SUBSTACK_HANDLE=<your username> to test no-auth"
              " public-profile discovery (the substack-api library's method).")

    ok = any(probe(label, value) for label, value in variants)
    if ok:
        print("\nA variant works -> reconnect that exact value at /accounts, then press Sync now.")
    else:
        print("\nNo variant worked from this machine. If the same cookie works in your browser,"
              " the droplet IP is likely Cloudflare-blocked: try the email/IMAP fallback for"
              " articles, or sync from a residential IP.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
