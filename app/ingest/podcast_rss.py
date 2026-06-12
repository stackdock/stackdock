"""Poll podcast RSS feeds and mirror new episodes into object storage.

Works with:
  * Substack private podcast feeds (paid subs get a per-subscriber feed URL)
  * Gumroad product RSS feeds (creators can enable these per product)
  * Any other standard podcast RSS feed
"""
import logging
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


def run() -> int:
    """Poll all configured feeds once. Returns number of new episodes."""
    if not config.PODCAST_FEEDS:
        log.info("No podcast feeds configured; skipping.")
        return 0

    new_count = 0
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
                published_at=entry.get("published", ""),
            )
            if episode_id:
                new_count += 1
                notify.notify_episode(episode_id, feed_name, title, storage.url_for(key))

    return new_count
