"""Generate a private podcast RSS feed of everything mirrored into storage.

Subscribe to {PUBLIC_BASE_URL}/feed/{FEED_TOKEN}/all.xml in any podcast app.
"""
from email.utils import format_datetime
from datetime import datetime, timezone
from xml.sax.saxutils import escape

from . import config, db, storage


def _rfc2822(iso_or_text: str | None) -> str:
    if not iso_or_text:
        return format_datetime(datetime.now(timezone.utc))
    try:
        return format_datetime(datetime.fromisoformat(iso_or_text))
    except ValueError:
        return iso_or_text  # feedparser dates are usually already RFC 2822


def build_feed(feed_filter: str | None = None) -> str:
    episodes = db.list_episodes()
    if feed_filter:
        episodes = [e for e in episodes if e["feed_name"] == feed_filter]

    items = []
    for e in episodes:
        url = storage.url_for(e["audio_key"])
        items.append(f"""
    <item>
      <title>{escape(e["title"])}</title>
      <guid isPermaLink="false">{escape(e["guid"])}</guid>
      <description>{escape((e["description"] or "")[:2000])}</description>
      <pubDate>{escape(_rfc2822(e["published_at"] or e["created_at"]))}</pubDate>
      <enclosure url="{escape(url)}" length="{e["audio_bytes"] or 0}" type="{escape(e["audio_mime"] or "audio/mpeg")}"/>
      <itunes:author>{escape(e["feed_name"])}</itunes:author>
    </item>""")

    title = escape(feed_filter or f"{config.SITE_TITLE} — All Episodes")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>{title}</title>
    <link>{escape(config.PUBLIC_BASE_URL)}</link>
    <description>Private mirror feed. Do not share.</description>
    <language>en</language>{"".join(items)}
  </channel>
</rss>"""
