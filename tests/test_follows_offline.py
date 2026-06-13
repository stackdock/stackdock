"""Your Stuff (follows) + offline-save plumbing."""
import pytest
from fastapi.testclient import TestClient

from app import db, storage
from app.main import app


@pytest.fixture
def client(fresh_db):
    with TestClient(app) as c:
        c.post("/login", data={"username": "admin", "password": "admin-pass"})
        db.insert_article("m1", "Blog A", "Alpha Article", "x", None, "<p>x</p>", "2026-01-01")
        db.insert_article("m2", "Blog B", "Bravo Article", "x", None, "<p>x</p>", "2026-01-02")
        db.insert_episode("g1", "Show A", "Alpha Episode", "", "k1.mp3", 5, "audio/mpeg", "", "2026-01-01")
        db.insert_episode("g2", "Show B", "Bravo Episode", "", "k2.mp3", 5, "audio/mpeg", "", "2026-01-02")
        yield c


def test_follow_toggle_and_db(client):
    uid = db.list_accounts() and None  # admin user id is 1 (seeded first)
    r = client.post("/follow", data={"kind": "pub", "name": "Blog A", "back": "/?tab=text"},
                    follow_redirects=False)
    assert r.status_code == 303 and r.headers["location"] == "/?tab=text"
    assert db.list_follows(1, "pub") == ["Blog A"]
    client.post("/follow", data={"kind": "pub", "name": "Blog A"})  # toggle off
    assert db.list_follows(1, "pub") == []
    assert client.post("/follow", data={"kind": "nope", "name": "x"}).status_code == 400


def test_open_redirect_blocked(client):
    r = client.post("/follow", data={"kind": "pub", "name": "Blog A",
                                     "back": "//evil.example"}, follow_redirects=False)
    assert r.headers["location"] == "/"


def test_mine_tab_filters_to_follows(client):
    client.post("/follow", data={"kind": "pub", "name": "Blog A"})
    client.post("/follow", data={"kind": "show", "name": "Show B"})
    # Your Stuff is split into Articles / Podcasts sub-tabs (default = articles)
    r = client.get("/?tab=mine")
    assert "Alpha Article" in r.text and "Bravo Article" not in r.text
    assert "Alpha Episode" not in r.text
    r = client.get("/?tab=mine&sub=podcasts")
    assert "Bravo Episode" in r.text and "Alpha Episode" not in r.text
    assert "Alpha Article" not in r.text
    # empty state when nothing followed
    client.post("/follow", data={"kind": "pub", "name": "Blog A"})
    client.post("/follow", data={"kind": "show", "name": "Show B"})
    r = client.get("/?tab=mine")
    assert "Nothing here yet" in r.text


def test_mine_hide_persists_per_user(client):
    import bcrypt
    client.post("/follow", data={"kind": "pub", "name": "Blog A"})
    slug = db.list_articles(publications=["Blog A"])[0]["slug"]
    # hidden items are excluded from the default Your Stuff view, shown under "read/hidden"
    client.post("/mine/hide", data={"kind": "article", "ref": slug})
    assert "Alpha Article" not in client.get("/?tab=mine").text
    assert "Alpha Article" in client.get("/?tab=mine&hidden=1").text
    # persists across requests; unhide restores it
    client.post("/mine/hide", data={"kind": "article", "ref": slug, "unhide": "1"})
    assert "Alpha Article" in client.get("/?tab=mine").text
    # another user who follows the same pub is NOT affected by the first user's hide
    client.post("/mine/hide", data={"kind": "article", "ref": slug})
    db.create_user("friend2", bcrypt.hashpw(b"pw123456", bcrypt.gensalt()).decode())
    client.get("/logout")
    client.post("/login", data={"username": "friend2", "password": "pw123456"})
    client.post("/follow", data={"kind": "pub", "name": "Blog A"})
    assert "Alpha Article" in client.get("/?tab=mine").text


def test_follows_are_per_user(client):
    import bcrypt
    client.post("/follow", data={"kind": "pub", "name": "Blog A"})
    db.create_user("friend", bcrypt.hashpw(b"pw123456", bcrypt.gensalt()).decode())
    client.get("/logout")
    client.post("/login", data={"username": "friend", "password": "pw123456"})
    r = client.get("/?tab=mine")
    assert "Nothing here yet" in r.text


def test_audio_proxy(client, monkeypatch):
    monkeypatch.setattr(storage, "open_stream",
                        lambda key: (iter([b"abc", b"def"]), "audio/mpeg", 6))
    r = client.get("/audio/alpha-episode")
    assert r.status_code == 200 and r.content == b"abcdef"
    assert r.headers["content-type"].startswith("audio/mpeg")
    assert r.headers["cache-control"] == "no-store"
    assert client.get("/audio/nope").status_code == 404


def test_audio_proxy_requires_auth(fresh_db):
    with TestClient(app) as c:
        assert c.get("/audio/anything", follow_redirects=False).status_code in (303, 401)


def test_offline_page_unauthenticated(fresh_db):
    with TestClient(app) as c:
        r = c.get("/offline")
        assert r.status_code == 200
        assert "stackdock-audio-v1" in r.text and "Save for offline" in r.text


def test_articles_and_podcasts_paginate(client):
    # client fixture already added 2 articles + 2 episodes; push past one page
    for i in range(60):
        db.insert_article(f"pg{i}", "Blog A", f"Article {i}", "x", None, "<p>x</p>",
                          f"2026-02-{(i % 28) + 1:02d}")
    r = client.get("/?tab=text")
    assert "page 1 of" in r.text and "page=2" in r.text       # pager rendered
    assert "page 1 of 1" not in r.text                        # more than one page
    r2 = client.get("/?tab=text&page=2")
    assert "page 2 of" in r2.text
