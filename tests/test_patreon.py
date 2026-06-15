"""Patreon ingest: post->article/episode mapping + dedupe, against a fake stream."""
import pytest

from app import db
from app.ingest import patreon


def _post(pid, title, is_paid, can_view, content=None, teaser=None, ptype="text_only"):
    return {"id": pid, "type": "post",
            "attributes": {"title": title, "is_paid": is_paid,
                           "current_user_can_view": can_view, "content": content,
                           "teaser_text": teaser, "post_type": ptype,
                           "published_at": "2026-06-01T00:00:00.000+00:00",
                           "url": f"https://www.patreon.com/posts/{pid}"},
            "relationships": {"campaign": {"data": {"id": "c1", "type": "campaign"}}}}


def _stream():
    return ([_post("1", "Free One", False, True, "<p>free body</p>"),
             _post("2", "Paid Open", True, True, "<p>paid full body</p>"),
             _post("3", "Paid Locked", True, False, None, "just the teaser")],
            {"c1": "Frienji"})


@pytest.fixture
def world(fresh_db, monkeypatch):
    monkeypatch.setattr(patreon, "_authenticated", lambda s: True)
    monkeypatch.setattr(patreon, "fetch_stream", lambda s, n: _stream())
    monkeypatch.setattr(patreon.notify, "flush", lambda: None)


def test_patreon_maps_posts_to_articles(world):
    new, status = patreon.sync_account({"cookie": "sess-cookie-long-enough",
                                        "label": "erin", "last_sync": None})
    assert new == 3
    arts = {a["title"]: a for a in db.list_articles(publications=["Frienji"])}
    assert (arts["Free One"]["is_paid"], arts["Free One"]["is_locked"]) == (0, 0)
    assert (arts["Paid Open"]["is_paid"], arts["Paid Open"]["is_locked"]) == (1, 0)
    assert (arts["Paid Locked"]["is_paid"], arts["Paid Locked"]["is_locked"]) == (1, 1)
    assert "Frienji" in {p["publication"] for p in db.list_publications()}  # 1 subscription


def test_patreon_resync_dedupes_and_credits(world):
    patreon.sync_account({"cookie": "c1", "label": "erin", "last_sync": None})
    patreon.sync_account({"cookie": "c2", "label": "sam",
                          "last_sync": "2026-01-01T00:00:00+00:00"})
    arts = db.list_articles(publications=["Frienji"])
    assert len(arts) == 3                                   # no duplicates by patreon:{id}
    srcs = db.list_article_sources(arts[0]["id"])
    assert "erin" in srcs and "sam" in srcs                 # both accounts credited
