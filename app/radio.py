"""Member radio: submit a song (text or a URL from any platform) -> yt-dlp
resolves it on YouTube -> m4a audio lands in R2 -> /radio plays the pool as a
synced pseudo-live station. Personal use for the member group, like everything
else here; the station page is session-authed and nothing is ever public.

Resolution: a YouTube URL downloads directly; any other URL gets its page's
og:title and becomes a search; plain text is a search (ytsearch1). We only take
YouTube's native AAC stream (bestaudio[ext=m4a]) so no ffmpeg is needed in the
image and iOS plays it natively.

Bot-check reality: YouTube regularly refuses datacenter IPs ("Sign in to
confirm you're not a bot"). On that failure the download retries once through
the DataImpulse residential proxy already configured for the NYT pull
(NYT_PROXY_*), with a fresh sticky session per attempt.
"""
import html
import logging
import random
import re
import tempfile
import threading
from pathlib import Path

import requests

from . import config, db, storage

log = logging.getLogger("stackdock.radio")

_RUN_LOCK = threading.Lock()

_YT_HOSTS = ("youtube.com", "youtu.be", "music.youtube.com", "m.youtube.com")
_RETRY_HINTS = (
    # bot-checked (datacenter IP / burned proxy exit)
    "confirm you're not a bot", "confirm you are not a bot",
    "sign in to confirm", "429", "captcha",
    # transient mid-download failures through a flaky proxy exit (seen live
    # 3 Aug 2026: SSL EOF and a 36 KB-short truncation) — a fresh session fixes
    "unexpected_eof", "eof occurred", "bytes read", "incompleteread",
    "connection reset", "timed out",
)


def _is_url(s: str) -> bool:
    return s.startswith(("http://", "https://"))


def _og_title(url: str) -> str | None:
    """Best-effort page title for non-YouTube links (Spotify/SoundCloud/etc.
    expose og:title), so a pasted link becomes a usable search query."""
    try:
        r = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        m = (re.search(r'<meta[^>]+property="og:title"[^>]+content="([^"]+)"', r.text)
             or re.search(r"<title[^>]*>([^<]+)</title>", r.text))
        return html.unescape(m.group(1)).strip() if m else None
    except requests.RequestException:
        return None


def _target(query: str) -> str:
    """What we hand yt-dlp."""
    q = query.strip()
    if _is_url(q):
        host = q.split("/")[2].lower().removeprefix("www.")
        if any(host == h or host.endswith("." + h) for h in _YT_HOSTS):
            return q
        title = _og_title(q)
        if not title:
            raise RuntimeError("couldn't read a title from that link — paste the song name instead")
        return f"ytsearch1:{title}"
    return f"ytsearch1:{q}"


def _proxy() -> str | None:
    """A fresh sticky-session residential proxy URL (DataImpulse via NYT_PROXY_*)."""
    if not (config.NYT_PROXY_SERVER and config.NYT_PROXY_USER):
        return None
    sessid = f"{config.NYT_PROXY_SESSION_PREFIX}radio{random.getrandbits(32):08x}"
    user = (f"{config.NYT_PROXY_USER}__cr.us;sessid.{sessid};"
            f"sessttl.{config.NYT_PROXY_STICKY_MINUTES}")
    scheme, rest = config.NYT_PROXY_SERVER.split("://", 1)
    return f"{scheme}://{user}:{config.NYT_PROXY_PASS}@{rest}"


def _ydl_opts(tmpdir: str, proxy: str | None) -> dict:
    opts = {
        "format": "bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]",
        "noplaylist": True,
        "outtmpl": str(Path(tmpdir) / "%(id)s.%(ext)s"),
        "quiet": True, "no_warnings": True,
        "socket_timeout": 30,
        "max_filesize": 100 * 1024 * 1024,
    }
    # a youtube.com cookies.txt beats the bot-check with no proxy traffic at
    # all (preferred path); yt-dlp rewrites the file when YouTube rotates values
    if config.RADIO_COOKIES_FILE and Path(config.RADIO_COOKIES_FILE).exists():
        opts["cookiefile"] = config.RADIO_COOKIES_FILE
    if proxy:
        opts["proxy"] = proxy
    return opts


def _download(query: str) -> dict:
    """Resolve + download one track. Returns {title, artist, source_url,
    audio_key, duration}. Raises with a member-readable message on failure."""
    import yt_dlp

    target = _target(query)
    last_err = None
    # direct first, then FRESH residential sessions on bot-check: DataImpulse
    # exits vary in quality (live test 3 Aug 2026: first session bot-checked,
    # next one sailed through), so one proxy try isn't enough
    for attempt in range(1 + config.RADIO_PROXY_TRIES):
        proxy = None if attempt == 0 else _proxy()
        if attempt and proxy is None:
            break                                # no proxy configured; done
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                with yt_dlp.YoutubeDL(_ydl_opts(tmpdir, proxy)) as ydl:
                    info = ydl.extract_info(target, download=False)
                    if info.get("entries") is not None:      # search result
                        entries = [e for e in info["entries"] if e]
                        if not entries:
                            raise RuntimeError("no YouTube result for that")
                        info = entries[0]
                    dur = float(info.get("duration") or 0)
                    if dur > config.RADIO_MAX_MINUTES * 60:
                        raise RuntimeError(
                            f"too long ({round(dur / 60)} min; cap is {config.RADIO_MAX_MINUTES})")
                    src = info.get("webpage_url") or info.get("original_url") or target
                    if db.radio_source_exists(src):
                        raise RuntimeError("already on the station")
                    ydl.download([info.get("webpage_url") or target])
                files = list(Path(tmpdir).iterdir())
                if not files:
                    raise RuntimeError("download produced no file")
                f = files[0]
                key = f"radio/{info['id']}.{f.suffix.lstrip('.') or 'm4a'}"
                with open(f, "rb") as fh:
                    storage.upload_stream(fh, key, "audio/mp4")
                return {"title": info.get("track") or info.get("title") or query,
                        "artist": info.get("artist") or info.get("uploader") or "",
                        "source_url": src, "audio_key": key, "duration": dur}
            except Exception as e:                            # noqa: BLE001
                last_err = e
                msg = str(e).lower()
                if any(h in msg for h in _RETRY_HINTS):
                    log.info("radio: retryable failure (attempt %d); trying a fresh proxy session",
                             attempt + 1)
                    continue
                raise
    raise last_err if last_err else RuntimeError("download failed")


def _spotify_playlist_tracks(url: str) -> list[str]:
    """Track queries ('title artist') from a PUBLIC Spotify playlist via the
    no-auth embed page (__NEXT_DATA__ JSON; the embed lists up to ~100 tracks,
    plenty for a station playlist)."""
    import json as _json

    pid = re.search(r"playlist/([A-Za-z0-9]+)", url)
    if not pid:
        return []
    r = requests.get(f"https://open.spotify.com/embed/playlist/{pid.group(1)}",
                     timeout=20, headers={"User-Agent": "Mozilla/5.0"})
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
                  r.text, re.S)
    if not m:
        return []

    def find(o):
        if isinstance(o, dict):
            if "trackList" in o:
                return o["trackList"]
            for v in o.values():
                if (x := find(v)) is not None:
                    return x
        elif isinstance(o, list):
            for v in o:
                if (x := find(v)) is not None:
                    return x
        return None

    entries = find(_json.loads(m.group(1))) or []
    out = []
    for e in entries:
        title, artist = (e.get("title") or "").strip(), (e.get("subtitle") or "").strip()
        if title:
            out.append(f"{title} {artist}".strip())
    return out


def sync_playlists() -> int:
    """Queue every not-yet-seen track from the watched playlists (RADIO_PLAYLISTS).
    Dedupe is by the exact query string, so failed tracks stay failed instead of
    re-queueing forever."""
    added = 0
    for url in config.RADIO_PLAYLISTS:
        try:
            queries = _spotify_playlist_tracks(url)
        except requests.RequestException as e:
            log.warning("radio: playlist fetch failed (%s): %s", url, e.__class__.__name__)
            continue
        for q in queries:
            if not db.radio_query_exists(q):
                db.add_radio_track(q, added_by="playlist")
                added += 1
    if added:
        log.info("radio: %d new track(s) queued from watched playlists", added)
    return added


def run() -> int:
    """Process pending submissions. Scheduler job 'radio' + triggered on submit."""
    if not _RUN_LOCK.acquire(blocking=False):
        return 0
    try:
        sync_playlists()
        done = 0
        for t in db.radio_pending():
            try:
                meta = _download(t["query"])
                db.radio_set_ready(t["id"], **meta)
                log.info("radio: [%s] ready — %s", t["added_by"], meta["title"])
                done += 1
            except Exception as e:                            # noqa: BLE001
                db.radio_set_failed(t["id"], str(e))
                log.warning("radio: [%s] failed (%s): %s", t["added_by"], t["query"], e)
        return done
    finally:
        _RUN_LOCK.release()
