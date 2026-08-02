"""Poll generic article RSS/Atom feeds (ARTICLE_FEEDS) into the articles pool.

For blogs that aren't Substack (e.g. a Hugo site like lukesmith.xyz whose
index.xml carries the FULL article body in each item). ARTICLE_FEEDS is a JSON
dict {publication name: feed url}, mirroring PODCAST_FEEDS. Items dedupe on
rss:{guid}; the first sync of a publication is a silent backfill (notified=1),
later new items ride the resilient Discord digest via notify.flush(). Bodies
are stored as-is and scrubbed at render time by the `sanitize` filter like
every other remote-HTML source.
"""
import logging
import threading
from email.utils import parsedate_to_datetime

import feedparser
import requests

from .. import config, db, notify

log = logging.getLogger("stackdock.rss")

_RUN_LOCK = threading.Lock()


def _fetch(url: str):
    """requests with a timeout, then feedparser on the bytes — feedparser's own
    fetching has NO timeout and a black-holed host would wedge the thread."""
    r = requests.get(url, timeout=30, headers={"User-Agent": "stackdock/1.0"})
    r.raise_for_status()
    return feedparser.parse(r.content)


def _iso_date(entry) -> str:
    """RFC-822 pubDates -> ISO so they string-sort next to Substack dates."""
    raw = entry.get("published", "") or entry.get("updated", "")
    if not raw:
        return ""
    try:
        return parsedate_to_datetime(raw).isoformat()
    except (TypeError, ValueError):
        return raw


def _entry_html(entry) -> str:
    for c in entry.get("content") or []:          # Atom full-content entries
        if c.get("value"):
            return c["value"]
    return entry.get("summary") or entry.get("description") or ""


def _entry_image(entry):
    for m in (entry.get("media_thumbnail") or []) + (entry.get("media_content") or []):
        if m.get("url"):
            return m["url"]
    return None


def run() -> int:
    if not _RUN_LOCK.acquire(blocking=False):
        log.info("rss article sync already running; skipping overlapping run.")
        return 0
    try:
        new = 0
        for name, url in config.ARTICLE_FEEDS.items():
            try:
                parsed = _fetch(url)
            except Exception as e:
                log.warning("Article feed %s (%s) failed: %s", name, url, e)
                continue
            is_backfill = not db.publication_has_articles(name)
            notified = 1 if is_backfill else 0
            got = 0
            for entry in parsed.entries:
                guid = entry.get("id") or entry.get("link")
                if not guid:
                    continue
                mid = f"rss:{guid}"
                if db.article_exists(mid):
                    continue
                aid = db.insert_article(
                    message_id=mid, publication=name,
                    title=entry.get("title") or "(untitled)", author=name,
                    original_url=entry.get("link") or url, html=_entry_html(entry),
                    published_at=_iso_date(entry), cover_image=_entry_image(entry),
                    notified=notified)
                if aid:
                    got += 1
            if got:
                log.info("[%s] %d new article(s)%s", name, got,
                         " (silent backfill)" if is_backfill else "")
            new += got
        notify.flush()  # resilient digest (DB-driven; survives interrupted runs)
        return new
    finally:
        _RUN_LOCK.release()
