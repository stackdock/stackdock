"""Shoutbox: chat + merged site-wide comment feed."""
import pytest
from fastapi.testclient import TestClient

from app import auth, db
from app.main import app

ANCHOR = {"text": "quick brown fox", "prefix": "", "suffix": ""}


@pytest.fixture
def setup(fresh_db):
    db.insert_article("m1", "Pub", "Deep Post", "a", None,
                      "<p>quick brown fox</p>", None)
    db.create_user("admin", auth.hash_password("admin-pass"), is_admin=True)
    db.create_user("alice", auth.hash_password("hunter22"), is_admin=False)


def login(username, password):
    c = TestClient(app)
    assert c.post("/login", data={"username": username, "password": password}).status_code in (200, 303)
    return c


@pytest.fixture
def admin(setup):
    return login("admin", "admin-pass")


@pytest.fixture
def alice(setup):
    return login("alice", "hunter22")


def test_requires_auth(setup):
    c = TestClient(app)
    assert c.get("/api/shoutbox", follow_redirects=False).status_code in (303, 401)


def test_chat_and_comments_merge(admin, alice):
    admin.post("/api/shoutbox", json={"body": "first shout"})
    alice.post("/api/comments/article/deep-post", json={"anchor": ANCHOR, "body": "a comment"})
    alice.post("/api/shoutbox", json={"body": "second shout"})
    d = admin.get("/api/shoutbox").json()
    assert d["me"] == "admin" and d["admin"] is True
    kinds = [(i["type"], i["author"], i["body"]) for i in d["items"]]
    assert kinds == [("chat", "admin", "first shout"),
                     ("comment", "alice", "a comment"),
                     ("chat", "alice", "second shout")]
    c = d["items"][1]
    assert (c["kind"], c["ref"], c["title"]) == ("article", "deep-post", "Deep Post")
    assert c["thread_id"]


def test_validation(admin):
    assert admin.post("/api/shoutbox", json={"body": ""}).status_code == 400
    assert admin.post("/api/shoutbox", json={"body": "x" * 501}).status_code == 400


def test_delete_permissions(admin, alice):
    sid = alice.post("/api/shoutbox", json={"body": "mine"}).json()["id"]
    assert admin.post(f"/api/shoutbox/delete/{sid}").status_code == 200   # admin may
    sid = alice.post("/api/shoutbox", json={"body": "again"}).json()["id"]
    other = login("admin", "admin-pass")
    db.create_user("bob", auth.hash_password("bobpass99"))
    bob = login("bob", "bobpass99")
    assert bob.post(f"/api/shoutbox/delete/{sid}").status_code == 403     # stranger may not
    assert alice.post(f"/api/shoutbox/delete/{sid}").status_code == 200   # own
    assert other.post(f"/api/shoutbox/delete/{sid}").status_code == 404   # gone


def test_widget_renders(admin):
    page = admin.get("/help").text
    assert "shout-fab" in page and "shout-panel" in page
