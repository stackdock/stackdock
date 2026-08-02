"""Generic article-feed ingest: full-body storage, dedupe, silent backfill."""
import pytest

from app import config, db
from app.ingest import rss_articles


class _Feed:
    def __init__(self, entries):
        self.entries = entries


def _entry(guid, title, body, link=None):
    return {"id": guid, "title": title, "link": link or f"https://blog.test/{guid}",
            "published": "Thu, 10 Apr 2025 10:36:55 +0200",
            "content": [{"value": body}]}


@pytest.fixture
def world(fresh_db, monkeypatch):
    feed = _Feed([_entry("p1", "First Post", "<p>Full first body</p>"),
                  _entry("p2", "Second Post", "<p>Full second body</p>")])
    monkeypatch.setattr(config, "ARTICLE_FEEDS", {"Test Blog": "https://blog.test/index.xml"})
    monkeypatch.setattr(rss_articles, "_fetch", lambda url: feed)
    monkeypatch.setattr(rss_articles.notify, "flush", lambda: None)
    return feed


def test_backfill_is_silent_and_full_bodies_stored(world):
    assert rss_articles.run() == 2
    arts = {a["title"]: db.get_article_by_slug(a["slug"])
            for a in db.list_articles(publications=["Test Blog"])}
    assert "Full first body" in arts["First Post"]["html"]
    assert arts["First Post"]["published_at"].startswith("2025-04-10")  # RFC822 -> ISO
    assert not db.list_unnotified_items()          # first sync never Discord-blasts


def test_new_item_notifies_and_dedupes(world):
    rss_articles.run()
    world.entries.append(_entry("p3", "Third Post", "<p>Fresh</p>"))
    assert rss_articles.run() == 1                 # only the new item, no dupes
    pending = {i["title"] for i in db.list_unnotified_items()}
    assert pending == {"Third Post"}
    assert rss_articles.run() == 0                 # fully idempotent
