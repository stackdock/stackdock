"""HTTP-level tests via FastAPI TestClient (lifespan/scheduler not started)."""
import pytest

from app import auth, config, db


def test_healthz(client):
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_login_page_renders(client):
    r = client.get("/login")
    assert r.status_code == 200
    assert "password" in r.text.lower()


def test_protected_route_redirects_to_login(client):
    r = client.get("/", follow_redirects=False)
    assert r.status_code == 303
    assert "/login" in r.headers["location"]


def test_status_requires_auth(client):
    r = client.get("/status", follow_redirects=False)
    assert r.status_code == 303
    assert "/login" in r.headers["location"]


def test_bad_login_shows_error(client, user):
    r = client.post("/login", data={"username": "alice", "password": "wrong"},
                    follow_redirects=False)
    assert r.status_code == 200
    assert "wrong" in r.text.lower()


def test_login_success_sets_session_and_grants_access(client, user, monkeypatch):
    # avoid a real R2 round-trip on the /status page
    class _FakeClient:
        def head_bucket(self, Bucket):  # noqa: N803 - boto3 kwarg name
            return {}
    from app import storage
    monkeypatch.setattr(storage, "client", lambda: _FakeClient())

    r = client.post("/login", data={"username": "alice", "password": "hunter2"},
                    follow_redirects=False)
    assert r.status_code == 303
    assert auth.SESSION_COOKIE in r.cookies  # session issued

    # the stored cookie now grants access to a protected page
    r2 = client.get("/status")
    assert r2.status_code == 200
    assert "uptime" in r2.text.lower()


def test_feed_requires_correct_token(client):
    assert client.get("/feed/wrong-token/all.xml").status_code == 404
    r = client.get(f"/feed/{config.FEED_TOKEN}/all.xml")
    assert r.status_code == 200
    assert "application/rss+xml" in r.headers["content-type"]


def test_admin_route_forbidden_for_member(client, user, monkeypatch):
    # log in as a non-admin and hit /admin
    client.post("/login", data={"username": "alice", "password": "hunter2"})
    r = client.get("/admin", follow_redirects=False)
    assert r.status_code == 403
