"""Poll YouTube channels via their per-channel RSS feed and notify on new uploads.

No API key needed: every channel exposes
    https://www.youtube.com/feeds/videos.xml?channel_id=UC...
We resolve @handle -> UC... channel id once by scraping the channel page.

A new upload with "PRIORITY" in the title @everyones the Discord server; every
other upload gets a normal webhook notification. Nothing is downloaded — this is
a notify + browsable-index service (videos link/embed straight to YouTube).
"""
import logging
import re
import threading
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import feedparser
import requests

from .. import config, db, notify

log = logging.getLogger("stackdock.youtube")

_RUN_LOCK = threading.Lock()
_UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
       "(KHTML, like Gecko) Chrome/124 Safari/537.36")


def normalize_handle(raw: str) -> str | None:
    """Accept a @handle, a full channel URL, or a plain name -> bare handle."""
    raw = (raw or "").strip()
    if not raw:
        return None
    m = re.search(r"youtube\.com/@([A-Za-z0-9._-]+)", raw)
    if m:
        return m.group(1)
    # a /channel/UC... or /c/name or /user/name URL — keep the last path segment
    m = re.search(r"youtube\.com/(?:channel|c|user)/([A-Za-z0-9._-]+)", raw)
    if m:
        return m.group(1)
    return raw.lstrip("@") or None


def resolve_channel(handle: str) -> tuple[str | None, str]:
    """@handle (or UC id) -> (channel_id, display_name). ('', reason) on failure."""
    if handle.startswith("UC") and len(handle) > 20:
        cid = handle
    else:
        try:
            r = requests.get(f"https://www.youtube.com/@{handle}",
                             headers={"User-Agent": _UA,
                                      "Accept-Language": "en-US,en;q=0.9"},
                             timeout=20)
        except requests.RequestException as e:
            return "", f"request error: {e}"
        if r.status_code >= 400:
            return "", f"channel page HTTP {r.status_code}"
        # externalId / the canonical /channel/ link are the PAGE OWNER's id; the
        # first "channelId" in the HTML is often a related/recommended channel.
        m = (re.search(r'"externalId":"(UC[\w-]+)"', r.text)
             or re.search(r"youtube\.com/channel/(UC[\w-]+)", r.text)
             or re.search(r'"channelId":"(UC[\w-]+)"', r.text))
        if not m:
            return "", "could not find channel id (is the @handle right?)"
        cid = m.group(1)
    # display name via the feed's title
    parsed = feedparser.parse(_feed_url(cid))
    name = parsed.feed.get("title") or handle
    return cid, name


def _feed_url(channel_id: str) -> str:
    return f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"


def _iso(entry) -> str:
    raw = entry.get("published", "")
    for parse in (lambda s: datetime.fromisoformat(s.replace("Z", "+00:00")),
                  parsedate_to_datetime):
        try:
            return parse(raw).astimezone(timezone.utc).isoformat()
        except (TypeError, ValueError):
            continue
    return raw


def _video_id(entry) -> str | None:
    vid = entry.get("yt_videoid")
    if vid:
        return vid
    m = re.search(r"[?&]v=([\w-]{11})", entry.get("link", ""))
    return m.group(1) if m else None


def run() -> int:
    if not _RUN_LOCK.acquire(blocking=False):
        log.info("%s sync already running; skipping overlapping run.", __name__)
        return 0
    try:
        return _run()
    finally:
        _RUN_LOCK.release()


def _run() -> int:
    channels = db.list_youtube_channels()
    if not channels:
        return 0

    for ch in channels:
        cid = ch["channel_id"]
        cname = ch["name"]
        if not cid:
            cid, name = resolve_channel(ch["handle"])
            if not cid:
                log.warning("YouTube: could not resolve @%s: %s", ch["handle"], name)
                continue
            db.set_youtube_channel_meta(ch["id"], cid, name)
            cname = name          # use the freshly-resolved name, not the stale row
        cname = cname or cid
        is_backfill = ch["last_sync"] is None
        try:
            parsed = feedparser.parse(_feed_url(cid))
        except Exception as e:                                  # noqa: BLE001
            log.warning("YouTube: feed parse failed for %s: %s", cname, e)
            continue

        for entry in parsed.entries:
            vid = _video_id(entry)
            if not vid or db.youtube_video_exists(vid):
                continue
            title = entry.get("title", "(untitled)")
            db.insert_youtube_video(
                video_id=vid, channel=cname, title=title,
                url=f"https://www.youtube.com/watch?v={vid}",
                published_at=_iso(entry),
                thumbnail=f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                priority=1 if "priority" in title.lower() else 0,
                # first sync per channel is a silent backfill (don't blast history)
                notified=1 if is_backfill else 0,
            )
        db.set_youtube_channel_sync(ch["id"], db.now_iso())

    # Resilient notify: announce everything still unnotified, then mark it — a
    # crash mid-run leaves items pending and the next run sends them.
    pending = db.list_unnotified_youtube()
    if pending:
        priority = [dict(v) for v in pending if v["priority"]]
        normal = [dict(v) for v in pending if not v["priority"]]
        notify.notify_youtube(priority, normal)
        db.mark_youtube_notified([v["id"] for v in pending])
    return len(pending)
