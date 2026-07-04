"""mde.tv catalogue + on-demand download.

Catalogue (series/episodes/video detail) is PUBLIC JSON at api.mde.tv/v1.

Auth: mde uses a 15-min access JWT + a rotating refresh JWT (NOT a session
cookie). We store both in the DB and mint fresh access tokens on demand:
`GET /v1/auth` with BOTH cookies returns a new access token AND a new refresh
token via Set-Cookie — the refresh token rotates every call, so we persist both
under a lock so concurrent refreshes can't strand a dead token.

Video: episodes are Bunny Stream HLS on stream.mde.tv, protected by a BunnyCDN
token that mde's backend signs inside the Bunny embed player — the API never
hands it over. So we open the watch page in Camoufox (with a fresh token),
intercept the player's request for the signed `playlist.m3u8`, then ffmpeg-remux
the 1080p (or best ≤1080p) video + audio into an mp4 streamed straight to R2.
"""
import base64
import json
import logging
import re
import subprocess
import threading
import time

import requests

from .. import config, db, storage

log = logging.getLogger("stackdock.mde")

_UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
       "(KHTML, like Gecko) Chrome/124 Safari/537.36")
_BUNNY_REFERER = "https://player.mediadelivery.net/"
_DL_LOCK = threading.Lock()
_TOKEN_LOCK = threading.Lock()
_cache: dict[str, tuple[float, object]] = {}


class MdeError(RuntimeError):
    pass


# ---------------- auth (store + auto-refresh, rotating) ----------------

def _jwt_exp(tok: str) -> int:
    try:
        p = tok.split(".")[1]
        p += "=" * (-len(p) % 4)
        return int(json.loads(base64.urlsafe_b64decode(p)).get("exp", 0))
    except Exception:                                          # noqa: BLE001
        return 0


_MDE_HDRS = {"User-Agent": _UA, "Origin": "https://www.mde.tv",
             "Referer": "https://www.mde.tv/"}


def _store(a: str, r: str) -> tuple[str, str]:
    db.set_mde_tokens(a, r)
    log.info("mde: fresh access token (exp in %ds)", _jwt_exp(a) - int(time.time()))
    return a, r


def _refresh(access: str, refresh: str) -> tuple[str, str] | None:
    """GET /v1/auth with both cookies -> fresh access + rotated refresh, or None."""
    try:
        r = requests.get("https://api.mde.tv/v1/auth",
                         cookies={"mde-access-token": access, "mde-refresh-token": refresh},
                         headers=_MDE_HDRS, allow_redirects=False, timeout=25)
        na, nr = r.cookies.get("mde-access-token"), r.cookies.get("mde-refresh-token")
        return _store(na, nr or refresh) if na else None
    except Exception as e:                                     # noqa: BLE001
        log.info("mde refresh failed (%s), will log in", e)
        return None


def _login() -> tuple[str, str]:
    """Mint a fresh token pair by logging in — the self-healing fallback."""
    if not (config.MDE_EMAIL and config.MDE_PASSWORD):
        raise MdeError("mde.tv not connected — set MDE_EMAIL/MDE_PASSWORD (or seed tokens).")
    r = requests.post("https://api.mde.tv/v1/auth/login", headers=_MDE_HDRS,
                      json={"email": config.MDE_EMAIL, "password": config.MDE_PASSWORD},
                      allow_redirects=False, timeout=25)
    na, nr = r.cookies.get("mde-access-token"), r.cookies.get("mde-refresh-token")
    if not na:
        raise MdeError(f"mde.tv login failed (HTTP {r.status_code}) — check credentials.")
    return _store(na, nr or "")


def access_token() -> str:
    """A currently-valid access token. Try stored -> refresh -> login. Persists
    every result (refresh rotates the token, so we must)."""
    with _TOKEN_LOCK:
        at, rt = db.get_mde_tokens()
        if not at and not rt and (config.MDE_ACCESS_TOKEN or config.MDE_REFRESH_TOKEN):
            at, rt = config.MDE_ACCESS_TOKEN, config.MDE_REFRESH_TOKEN
        if at and _jwt_exp(at) - time.time() > 90:
            return at
        if rt:
            got = _refresh(at or "", rt)
            if got:
                return got[0]
        return _login()[0]


# ---------------- public catalogue ----------------

def _cached(key: str, fn):
    now = time.time()
    hit = _cache.get(key)
    if hit and now - hit[0] < config.MDE_CACHE_SECONDS:
        return hit[1]
    val = fn()
    _cache[key] = (now, val)
    return val


def _get(path: str) -> dict:
    r = requests.get(f"{config.MDE_API_BASE}{path}",
                     headers={"User-Agent": _UA, "Origin": "https://www.mde.tv",
                              "Referer": "https://www.mde.tv/"}, timeout=30)
    if r.status_code >= 400:
        raise MdeError(f"mde.tv API {r.status_code} for {path}")
    return r.json()


def list_series() -> list[dict]:
    return _cached("series", lambda: _get("/series").get("series", []))


def list_episodes(tag: str):
    def fetch():
        d = _get(f"/series/{tag}/videos")
        return d.get("series", {}), d.get("videos", [])
    return _cached(f"eps:{tag}", fetch)


def get_video(video_id: str) -> dict:
    return _get(f"/videos/{video_id}").get("video", {})


# ---------------- signed URL via Camoufox interception ----------------

def _signed_playlist(series_tag: str, video_tag: str) -> str:
    """Open the watch page in a real browser and intercept the Bunny player's
    request for the signed master playlist.m3u8."""
    at = access_token()
    _, rt = db.get_mde_tokens()
    watch_url = f"https://www.mde.tv/series/{series_tag}/{video_tag}"
    cookies = [{"name": n, "value": v, "domain": ".mde.tv", "path": "/"}
               for n, v in (("mde-access-token", at), ("mde-refresh-token", rt)) if v]

    from camoufox.sync_api import Camoufox
    found = {"url": None}
    try:
        with Camoufox(headless=True) as browser:
            page = browser.new_page()
            page.context.add_cookies(cookies)

            def on_req(req):
                u = req.url
                if "stream.mde.tv" in u and "playlist.m3u8" in u and not found["url"]:
                    found["url"] = u
            page.on("request", on_req)

            page.goto(watch_url, wait_until="commit", timeout=60000)
            for _ in range(25):                       # ~50s max
                if found["url"]:
                    break
                page.wait_for_timeout(2000)
                # nudge any play button (Bunny iframe usually loads the manifest on
                # init, but click a visible play control just in case)
                try:
                    page.locator("button:has-text('play'), .play, video").first.click(
                        timeout=500, no_wait_after=True)
                except Exception:                     # noqa: BLE001
                    pass
            browser.close()
    finally:
        # Camoufox leaves headless Firefox procs behind (like the NYT engine); reap
        # them so they don't accumulate + OOM the box before ffmpeg runs.
        for pat in ("camoufox", "firefox"):
            try:
                subprocess.run(["pkill", "-9", "-f", pat], timeout=10, check=False)
            except Exception:                         # noqa: BLE001
                pass
    if not found["url"]:
        raise MdeError("could not capture the signed playlist URL from the player "
                       "(watch page/player may have changed, or token invalid).")
    return found["url"]


def _pick_variant(master_url: str) -> tuple[str, str]:
    """Fetch the master playlist and return (video_variant_url, audio_url) for the
    best rendition <= 1080p."""
    r = requests.get(master_url, headers={"User-Agent": _UA, "Referer": _BUNNY_REFERER},
                     timeout=30)
    r.raise_for_status()
    base = master_url.rsplit("/", 1)[0] + "/"
    lines = r.text.splitlines()
    audio_uri = None
    for ln in lines:
        m = re.search(r'TYPE=AUDIO[^\n]*URI="([^"]+)"', ln)
        if m:
            audio_uri = m.group(1)
    best = None  # (height, url)
    for i, ln in enumerate(lines):
        if ln.startswith("#EXT-X-STREAM-INF"):
            hm = re.search(r"RESOLUTION=\d+x(\d+)", ln)
            h = int(hm.group(1)) if hm else 0
            uri = lines[i + 1].strip() if i + 1 < len(lines) else ""
            if uri and h <= 1080 and (best is None or h > best[0]):
                best = (h, uri)
    if not best:
        raise MdeError("no <=1080p rendition found in playlist")
    v = best[1] if best[1].startswith("http") else base + best[1]
    a = (audio_uri if audio_uri and audio_uri.startswith("http")
         else base + audio_uri) if audio_uri else None
    return v, a


# ---------------- download job ----------------

def run() -> int:
    pending = db.list_mde_pending()
    for row in pending:
        download(row["video_id"])
    return len(pending)


def download(video_id: str) -> None:
    if not _DL_LOCK.acquire(blocking=False):
        log.info("mde download already running; %s queued for next run.", video_id)
        return
    try:
        _download(video_id)
    finally:
        _DL_LOCK.release()


def _download(video_id: str) -> None:
    row = db.get_mde_download(video_id)
    if not row or row["status"] == "ready":
        return
    db.set_mde_status(video_id, "downloading")
    try:
        v = get_video(video_id)
        video_tag = v.get("tag")
        series_tag = row["series_tag"] or v.get("series_tag")
        if not video_tag or not series_tag:
            raise MdeError("missing series/video tag")
        master = _signed_playlist(series_tag, video_tag)
        video_url, audio_url = _pick_variant(master)

        key = f"mde/{series_tag}/{video_id}.mp4"
        hdr = f"Referer: {_BUNNY_REFERER}\r\nUser-Agent: {_UA}\r\n"
        cmd = ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
               "-headers", hdr, "-i", video_url]
        if audio_url:
            cmd += ["-headers", hdr, "-i", audio_url]
        cmd += ["-map", "0:v:0"] + (["-map", "1:a:0"] if audio_url else [])
        # aac_adtstoasc converts the HLS AAC bitstream so it muxes into mp4;
        # fragmented mp4 streamed to stdout (no temp file — disk is tight).
        cmd += ["-c", "copy", "-bsf:a", "aac_adtstoasc", "-f", "mp4",
                "-movflags", "frag_keyframe+empty_moov+default_base_moof", "pipe:1"]
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            storage.upload_stream(proc.stdout, key, "video/mp4")
        finally:
            proc.stdout.close()
            err = proc.stderr.read().decode("utf-8", "replace")[-500:]
            rc = proc.wait()
        if rc != 0:
            raise MdeError(f"ffmpeg failed (rc={rc}): {err}")
        db.finish_mde_download(video_id, r2_key=key, size_bytes=0)
        log.info("mde: downloaded %s -> %s", video_id, key)
    except Exception as e:                                     # noqa: BLE001
        db.set_mde_status(video_id, f"failed: {e}"[:300])
        log.warning("mde download failed for %s: %s", video_id, e)
