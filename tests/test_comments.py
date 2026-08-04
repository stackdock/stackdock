"""Comment threads (article highlights, episode timestamps) + reply notifications."""
import pytest
from fastapi.testclient import TestClient

from app import auth, db
from app.main import app

ANCHOR = {"text": "the quick brown fox", "prefix": "Once upon a time ", "suffix": " jumped over"}


@pytest.fixture
def setup(fresh_db):
    db.insert_article("m1", "Pub", "Deep Post", "a", None,
                      "<p>Once upon a time the quick brown fox jumped over the fence.</p>",
                      None)
    db.insert_episode("g1", "Show", "Ep One", "", "k.mp3", 1, "audio/mpeg",
                      "", "2026-01-01T00:00:00")
    db.create_user("admin", auth.hash_password("admin-pass"), is_admin=True)
    db.create_user("alice", auth.hash_password("hunter22"), is_admin=False)


def login(username, password):
    c = TestClient(app)
    r = c.post("/login", data={"username": username, "password": password})
    assert r.status_code in (200, 303)
    return c


@pytest.fixture
def admin(setup):
    return login("admin", "admin-pass")


@pytest.fixture
def alice(setup):
    return login("alice", "hunter22")


def test_requires_auth(setup):
    c = TestClient(app)
    assert c.get("/api/comments/article/deep-post",
                 follow_redirects=False).status_code in (303, 401)


def test_thread_roundtrip_article(admin):
    r = admin.post("/api/comments/article/deep-post",
                   json={"anchor": ANCHOR, "body": "first!"})
    assert r.status_code == 200
    tid = r.json()["thread_id"]
    d = admin.get("/api/comments/article/deep-post").json()
    assert d["me"] == "admin" and d["admin"] is True
    (t,) = d["threads"]
    assert t["id"] == tid and t["comments"][0]["body"] == "first!"


def test_reply_notifies_participants_not_author(admin, alice):
    tid = admin.post("/api/comments/article/deep-post",
                     json={"anchor": ANCHOR, "body": "hot take"}).json()["thread_id"]
    assert alice.post(f"/api/threads/{tid}/reply",
                      json={"body": "disagree"}).status_code == 200
    # the thread creator gets a notification; the replier does not
    items = admin.get("/api/notifications").json()["items"]
    assert len(items) == 1
    n = items[0]
    assert (n["author"], n["kind"], n["ref"], n["thread_id"]) == \
        ("alice", "article", "deep-post", tid)
    assert n["title"] == "Deep Post" and "disagree" in n["snippet"]
    assert alice.get("/api/notifications").json()["items"] == []
    # replying back notifies alice (a participant), not admin
    admin.post(f"/api/threads/{tid}/reply", json={"body": "fair"})
    assert len(alice.get("/api/notifications").json()["items"]) == 1


def test_mark_read_one_and_all(admin, alice):
    tid = admin.post("/api/comments/article/deep-post",
                     json={"anchor": ANCHOR, "body": "x"}).json()["thread_id"]
    alice.post(f"/api/threads/{tid}/reply", json={"body": "r1"})
    alice.post(f"/api/threads/{tid}/reply", json={"body": "r2"})
    items = admin.get("/api/notifications").json()["items"]
    assert len(items) == 2
    admin.post("/api/notifications/read", json={"id": items[0]["id"]})
    assert len(admin.get("/api/notifications").json()["items"]) == 1
    admin.post("/api/notifications/read", json={})
    assert admin.get("/api/notifications").json()["items"] == []


def test_delete_permissions_and_thread_cleanup(admin, alice):
    tid = alice.post("/api/comments/article/deep-post",
                     json={"anchor": ANCHOR, "body": "mine"}).json()["thread_id"]
    cid = db.list_comment_threads("article", "deep-post")[0]["comments"][0]["id"]
    other = login("admin", "admin-pass")
    # non-author non-admin forbidden
    c2 = alice.post(f"/api/threads/comment/{cid}/delete")
    assert c2.status_code == 200          # own comment
    assert db.list_comment_threads("article", "deep-post") == []   # emptied thread gone
    # admin can delete someone else's
    tid = alice.post("/api/comments/article/deep-post",
                     json={"anchor": ANCHOR, "body": "again"}).json()["thread_id"]
    cid = db.list_comment_threads("article", "deep-post")[0]["comments"][0]["id"]
    assert other.post(f"/api/threads/comment/{cid}/delete").status_code == 200
    assert tid  # silence lint


def test_non_author_cannot_delete(admin, alice):
    admin.post("/api/comments/article/deep-post", json={"anchor": ANCHOR, "body": "x"})
    cid = db.list_comment_threads("article", "deep-post")[0]["comments"][0]["id"]
    assert alice.post(f"/api/threads/comment/{cid}/delete").status_code == 403


def test_episode_timestamp_anchor(admin):
    r = admin.post("/api/comments/episode/ep-one",
                   json={"anchor": {"t": 754}, "body": "great bit"})
    assert r.status_code == 200
    (t,) = admin.get("/api/comments/episode/ep-one").json()["threads"]
    assert '"t": 754' in t["anchor"].replace("'", '"') or '"t":754' in t["anchor"]


def test_validation(admin):
    bad = [
        ({"anchor": ANCHOR, "body": ""}, 400),
        ({"anchor": ANCHOR, "body": "x" * 4001}, 400),
        ({"anchor": {"text": ""}, "body": "x"}, 400),
        ({"anchor": {"text": "y" * 501}, "body": "x"}, 400),
        ({"anchor": "nope", "body": "x"}, 400),
    ]
    for payload, code in bad:
        assert admin.post("/api/comments/article/deep-post", json=payload).status_code == code
    assert admin.post("/api/comments/episode/ep-one",
                      json={"anchor": {"t": -5}, "body": "x"}).status_code == 400
    assert admin.post("/api/comments/article/no-such-slug",
                      json={"anchor": ANCHOR, "body": "x"}).status_code == 404
    assert admin.post("/api/threads/99999/reply", json={"body": "x"}).status_code == 404


def test_pages_render_with_comment_ui(admin):
    page = admin.get("/read/deep-post").text
    assert "cmt-panel" in page and "notif-dot" in page
    # episode comment UI is gated on audio being configured (none in tests)
    assert admin.get("/listen/ep-one").status_code == 200
