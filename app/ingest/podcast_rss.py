"""Poll podcast RSS feeds and mirror new episodes into object storage.

Works with:
  * Substack private podcast feeds (paid subs get a per-subscriber feed URL —
    publication page -> ... -> "Private RSS feed", or /account/settings)
  * Any other standard podcast RSS feed
"""
import logging
import threading
from email.utils import parsedate_to_datetime
import re
from urllib.parse import urlparse

import feedparser
import requests

from .. import config, db, notify, storage

log = logging.getLogger("stackdock.podcasts")

CHUNK = 1024 * 256


def _slug(s: str) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()
    return s[:80] or "untitled"


def _download_to_storage(audio_url: str, key: str, headers: dict | None = None) -> tuple[int, str]:
    """Stream a remote audio file directly into object storage. Returns (bytes, mime)."""
    with requests.get(audio_url, stream=True, timeout=120, headers=headers or {}) as r:
        r.raise_for_status()
        mime = r.headers.get("Content-Type", "audio/mpeg").split(";")[0]
        size = int(r.headers.get("Content-Length", 0))
        r.raw.decode_content = True
        storage.upload_stream(r.raw, key, mime)
        return size, mime


def _iso_date(entry) -> str:
    """Normalize RSS pubDates (RFC 822, e.g. 'Wed, 04 Jun 2025 ...') to ISO so
    they string-sort correctly next to Substack's ISO post_date values."""
    raw = entry.get("published", "")
    if not raw:
        return ""
    try:
        return parsedate_to_datetime(raw).isoformat()
    except (TypeError, ValueError):
        return raw


def _entry_image(entry, parsed) -> str | None:
    """Best-effort episode thumbnail: itunes per-episode image, else feed image."""
    img = entry.get("image")
    if isinstance(img, dict) and img.get("href"):
        return img["href"]
    feed_img = parsed.feed.get("image")
    if isinstance(feed_img, dict) and feed_img.get("href"):
        return feed_img["href"]
    return parsed.feed.get("itunes_image", {}).get("href") if isinstance(
        parsed.feed.get("itunes_image"), dict) else None


_RUN_LOCK = threading.Lock()


def run() -> int:
    if not _RUN_LOCK.acquire(blocking=False):
        log.info("%s sync already running; skipping overlapping run.", __name__)
        return 0
    try:
        return _run()
    finally:
        _RUN_LOCK.release()


def _run() -> int:
    """Poll all configured feeds once. Returns number of new episodes."""
    if not config.PODCAST_FEEDS:
        log.info("No podcast feeds configured; skipping.")
        return 0

    new_count, items = 0, []
    for feed_name, feed_url in config.PODCAST_FEEDS.items():
        try:
            parsed = feedparser.parse(feed_url)
        except Exception as e:
            log.warning("Failed to parse feed %s: %s", feed_name, e)
            continue

        for entry in parsed.entries:
            guid = entry.get("id") or entry.get("link") or entry.get("title", "")
            if not guid or db.episode_exists(guid):
                continue

            enclosure = None
            for enc in entry.get("enclosures", []):
                if enc.get("href"):
                    enclosure = enc
                    break
            if not enclosure:
                continue

            title = entry.get("title", "(untitled)")
            audio_url = enclosure["href"]
            ext = urlparse(audio_url).path.rsplit(".", 1)
            ext = ext[1].lower() if len(ext) == 2 and len(ext[1]) <= 4 else "mp3"
            key = f"podcasts/{_slug(feed_name)}/{_slug(title)}.{ext}"

            try:
                log.info("Downloading episode: [%s] %s", feed_name, title)
                size, mime = _download_to_storage(audio_url, key)
            except Exception as e:
                log.warning("Download failed for %s: %s", title, e)
                continue

            episode_id = db.insert_episode(
                guid=guid,
                feed_name=feed_name,
                title=title,
                description=entry.get("summary", ""),
                audio_key=key,
                audio_bytes=size,
                audio_mime=mime,
                duration=entry.get("itunes_duration", ""),
                published_at=_iso_date(entry),
                image_url=_entry_image(entry, parsed),
                paid_access=1,  # private per-subscriber feeds always deliver full audio
            )
            if episode_id:
                new_count += 1
                items.append({
                    "type": "episode",
                    "source": feed_name,
                    "title": title,
                    "url": f"{config.PUBLIC_BASE_URL}/listen/{db.get_episode(episode_id)['slug']}",
                    "original_url": entry.get("link"),
                    "published_at": entry.get("published", ""),
                })

    notify.push_new_items(items)  # one digest + one outbound POST per run
    return new_count
