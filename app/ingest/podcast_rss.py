"""Poll podcast RSS feeds and mirror new episodes into object storage.

Works with:
  * Substack private podcast feeds (paid subs get a per-subscriber feed URL —
    publication page -> ... -> "Private RSS feed", or /account/settings)
  * Any other standard podcast RSS feed
"""
import hashlib
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


def _download_to_storage(audio_url: str, key: str, headers: dict | None = None,
                         cookies=None) -> tuple[int, str]:
    """Stream a remote audio file directly into object storage. Returns (bytes, mime).

    `cookies` should be a requests CookieJar (NOT a raw Cookie header): requests
    scopes jar cookies by domain and drops them on a cross-host redirect, whereas
    a manually-set Cookie header would leak to whatever CDN the audio URL redirects
    to (Substack's podcast_url often 302s to a third-party host)."""
    with requests.get(audio_url, stream=True, timeout=120,
                      headers=headers or {}, cookies=cookies) as r:
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

    new_count = 0
    for feed_name, feed_url in config.PODCAST_FEEDS.items():
        try:
            # fetch with an explicit timeout, then parse the bytes: feedparser's
            # own URL fetch uses urllib with NO timeout, so a black-holed feed
            # host would wedge this thread forever while it holds _RUN_LOCK (every
            # later scheduled poll then non-blocking-skips -> ingest silently dead)
            resp = requests.get(feed_url, timeout=30,
                                headers={"User-Agent": "Stackdock/1.0 (+podcast-mirror)"})
            resp.raise_for_status()
            parsed = feedparser.parse(resp.content)
        except Exception as e:
            log.warning("Failed to fetch/parse feed %s: %s", feed_name, e)
            continue

        # first poll of a brand-new feed is a silent backfill (like every other
        # ingester) so adding a feed with a big back-catalogue doesn't blast the
        # whole history into Discord / the outbound webhook
        is_backfill = not db.feed_has_episodes(feed_name)

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
            # hash the guid into the key so two episodes sharing a title don't
            # collide on one R2 object and overwrite each other's audio
            gid = hashlib.sha1(guid.encode()).hexdigest()[:10]
            key = f"podcasts/{_slug(feed_name)}/{gid}-{_slug(title)}.{ext}"

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
                notified=0 if not is_backfill else 1,   # backfill is silent
            )
            if episode_id:
                new_count += 1   # counts backfill too; the notified flag gates Discord

    notify.flush()  # resilient digest (DB-driven; survives interrupted runs)
    return new_count
