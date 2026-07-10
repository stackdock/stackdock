"""Generate a private podcast RSS feed of everything mirrored into storage.

Subscribe to {PUBLIC_BASE_URL}/feed/{FEED_TOKEN}/all.xml in any podcast app.
"""
from email.utils import format_datetime
from datetime import datetime, timezone
from xml.sax.saxutils import escape, quoteattr

from . import config, db, storage


def _attr(value: str) -> str:
    """XML attribute value WITH surrounding quotes, fully escaped. escape() alone
    does not escape `"`, so a quote in a URL or a remote Content-Type header would
    break the enclosure element (a dead feed for every podcast app)."""
    return quoteattr(value or "")


def _audio_url(row) -> str:
    """Direct audio URL; falls back to the listen page if storage isn't configured (dev)."""
    try:
        return storage.url_for(row["audio_key"])
    except Exception:
        return f"{config.PUBLIC_BASE_URL}/listen/{row['slug']}"


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
        url = _audio_url(e)
        items.append(f"""
    <item>
      <title>{escape(e["title"])}</title>
      <guid isPermaLink="false">{escape(e["guid"])}</guid>
      <description>{escape((e["description"] or "")[:2000])}</description>
      <pubDate>{escape(_rfc2822(e["published_at"] or e["created_at"]))}</pubDate>
      <enclosure url={_attr(url)} length="{e["audio_bytes"] or 0}" type={_attr(e["audio_mime"] or "audio/mpeg")}/>
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


# ---- Unified feeds: every blog from every member, one URL ----

def _article_item(a) -> str:
    link = f"{config.PUBLIC_BASE_URL}/read/{a['slug']}"
    return f"""
    <item>
      <title>{escape(a["title"])}</title>
      <link>{escape(link)}</link>
      <guid isPermaLink="false">{escape(a["message_id"] or link)}</guid>
      <pubDate>{escape(_rfc2822(a["published_at"] or a["created_at"]))}</pubDate>
      <author>{escape(a["author"] or a["publication"] or "")}</author>
      <category>{escape(a["publication"] or "")}</category>
      <description>{escape((a["html"] or "")[:50000])}</description>
    </item>"""


def build_articles_feed(limit: int = 200) -> str:
    """RSS of mirrored article text across ALL connected accounts (token-protected)."""
    items = "".join(_article_item(a) for a in db.list_articles_with_html(limit))
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>{escape(config.SITE_TITLE)} — All Articles</title>
    <link>{escape(config.PUBLIC_BASE_URL)}</link>
    <description>Unified mirror of every Substack subscription across all members</description>{items}
  </channel>
</rss>
"""


def build_combined_feed(limit: int = 200) -> str:
    """Articles + episodes merged into one feed, newest first."""
    def sort_key(row):
        return row["published_at"] or row["created_at"] or ""

    arts = [("a", a) for a in db.list_articles_with_html(limit)]
    eps = [("e", e) for e in db.list_episodes(limit)]
    merged = sorted(arts + eps, key=lambda t: sort_key(t[1]), reverse=True)[:limit]

    items = []
    for kind, row in merged:
        if kind == "a":
            items.append(_article_item(row))
        else:
            url = _audio_url(row)
            items.append(f"""
    <item>
      <title>{escape(row["title"])}</title>
      <link>{escape(f"{config.PUBLIC_BASE_URL}/listen/{row['slug']}")}</link>
      <guid isPermaLink="false">{escape(row["guid"])}</guid>
      <pubDate>{escape(_rfc2822(row["published_at"] or row["created_at"]))}</pubDate>
      <category>{escape(row["feed_name"])}</category>
      <description>{escape((row["description"] or "")[:2000])}</description>
      <enclosure url={_attr(url)} length="{row["audio_bytes"] or 0}" type={_attr(row["audio_mime"] or "audio/mpeg")}/>
    </item>""")

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>{escape(config.SITE_TITLE)} — Everything</title>
    <link>{escape(config.PUBLIC_BASE_URL)}</link>
    <description>Every article and episode from every member, one feed</description>{"".join(items)}
  </channel>
</rss>
"""
