"""mde.tv catalogue + on-demand download.

The catalogue (series list, episode lists, video detail) is PUBLIC JSON at
api.mde.tv/v1 — no auth. Only the download (the signed stream URL) needs the
member's mde-access-token. Nothing here runs on a schedule: the catalogue is
fetched lazily when someone opens the tab / a series (cached), and a video is
only downloaded to R2 when someone clicks it.
"""
import logging
import threading
import time
from urllib.parse import urlparse

import requests

from .. import config, db, storage

log = logging.getLogger("stackdock.mde")

_UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
       "(KHTML, like Gecko) Chrome/124 Safari/537.36")
_DL_LOCK = threading.Lock()
_cache: dict[str, tuple[float, object]] = {}


class MdeError(RuntimeError):
    pass


def _cached(key: str, fn):
    now = time.time()
    hit = _cache.get(key)
    if hit and now - hit[0] < config.MDE_CACHE_SECONDS:
        return hit[1]
    val = fn()
    _cache[key] = (now, val)
    return val


def _get(path: str, auth: bool = False) -> dict:
    headers = {"User-Agent": _UA, "Origin": "https://www.mde.tv",
               "Referer": "https://www.mde.tv/"}
    cookies = {}
    if auth:
        tok = config.MDE_ACCESS_TOKEN
        headers["Authorization"] = f"Bearer {tok}"
        cookies["mde-access-token"] = tok
    r = requests.get(f"{config.MDE_API_BASE}{path}", headers=headers,
                     cookies=cookies, timeout=30)
    if r.status_code == 403:
        raise MdeError("mde.tv rejected the token (expired or not subscribed) — "
                       "reconnect a fresh cookie.")
    if r.status_code >= 400:
        raise MdeError(f"mde.tv API {r.status_code} for {path}")
    return r.json()


# ---------------- public catalogue ----------------

def list_series() -> list[dict]:
    """All series (public). Cached."""
    return _cached("series", lambda: _get("/series").get("series", []))


def list_episodes(tag: str) -> tuple[dict, list[dict]]:
    """(series, [videos]) for one series tag (public). Cached per tag."""
    def fetch():
        data = _get(f"/series/{tag}/videos")
        return data.get("series", {}), data.get("videos", data.get("series", {}).get("videos", []))
    return _cached(f"eps:{tag}", fetch)


def get_video(video_id: str) -> dict:
    return _get(f"/videos/{video_id}").get("video", {})


# ---------------- authed download ----------------

def _signed_source(video_id: str) -> str:
    """Ask mde.tv to sign the video and return a downloadable URL."""
    data = _get(f"/videos/{video_id}/sign", auth=True)
    # the response shape isn't documented; accept the common fields
    for k in ("url", "source", "video", "signedUrl", "signed_url", "hls", "mp4", "playlist"):
        v = data.get(k)
        if isinstance(v, str) and v.startswith("http"):
            return v
    # sometimes nested under "video" / "sources"
    for parent in ("video", "data", "result"):
        node = data.get(parent)
        if isinstance(node, dict):
            for k in ("url", "source", "hls", "mp4", "signedUrl"):
                if isinstance(node.get(k), str) and node[k].startswith("http"):
                    return node[k]
    raise MdeError(f"sign response had no downloadable URL: keys={list(data.keys())}")


def run() -> int:
    """Process every queued ('pending') download. Returns count attempted."""
    pending = db.list_mde_pending()
    for row in pending:
        download(row["video_id"])
    return len(pending)


def download(video_id: str) -> None:
    """Download one video to R2 and mark it ready. Serialized (one at a time) so
    a big file can't stack with another on the small box. Updates mde_downloads."""
    if not _DL_LOCK.acquire(blocking=False):
        log.info("mde download already running; %s will be picked up next.", video_id)
        return
    try:
        _download(video_id)
    finally:
        _DL_LOCK.release()


def _download(video_id: str) -> None:
    row = db.get_mde_download(video_id)
    if not row or row["status"] == "ready":
        return
    try:
        src = _signed_source(video_id)
        if ".m3u8" in src.lower():
            raise MdeError("video is HLS (segmented) — single-file download not "
                           "supported yet; needs ffmpeg remux.")
        ext = (urlparse(src).path.rsplit(".", 1)[-1] or "mp4").lower()
        ext = ext if len(ext) <= 4 else "mp4"
        key = f"mde/{row['series_tag']}/{video_id}.{ext}"
        headers = {"User-Agent": _UA, "Referer": "https://www.mde.tv/"}
        with requests.get(src, stream=True, timeout=120, headers=headers) as resp:
            resp.raise_for_status()
            mime = resp.headers.get("Content-Type", "video/mp4").split(";")[0]
            size = int(resp.headers.get("Content-Length", 0))
            resp.raw.decode_content = True
            storage.upload_stream(resp.raw, key, mime)
        db.finish_mde_download(video_id, r2_key=key, size_bytes=size)
        log.info("mde: downloaded %s -> %s (%d bytes)", video_id, key, size)
    except Exception as e:                                      # noqa: BLE001
        db.set_mde_status(video_id, f"failed: {e}"[:300])
        log.warning("mde download failed for %s: %s", video_id, e)
