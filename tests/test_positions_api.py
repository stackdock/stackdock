"""Cross-device listening-position sync API."""
import pytest
from fastapi.testclient import TestClient

from app import db
from app.main import app


@pytest.fixture
def client(fresh_db):
    with TestClient(app) as c:
        c.post("/login", data={"username": "admin", "password": "admin-pass"})
        db.insert_episode("g1", "Show", "Ep One", "", "k.mp3", 1, "audio/mpeg",
                          "", "2026-01-01T00:00:00")
        yield c


def test_requires_auth(fresh_db):
    with TestClient(app) as c:
        assert c.get("/api/positions", follow_redirects=False).status_code in (303, 401)


def test_round_trip_and_upsert(client):
    assert client.get("/api/positions").json() == {}
    r = client.post("/api/positions/ep-one",
                    json={"position": 123.4, "duration": 1800, "done": False})
    assert r.status_code == 200
    got = client.get("/api/positions").json()["ep-one"]
    assert got["position"] == pytest.approx(123.4) and got["done"] is False
    # upsert moves forward, done flag flips
    client.post("/api/positions/ep-one",
                json={"position": 1799, "duration": 1800, "done": True})
    got = client.get("/api/positions").json()["ep-one"]
    assert got["position"] == pytest.approx(1799) and got["done"] is True


def test_position_is_monotonic_unless_override(client):
    """A stale tab beaconing an OLD position must not rewind a further position
    from another device — unless it flags an explicit scrub (override)."""
    client.post("/api/positions/ep-one", json={"position": 1000, "duration": 1800})
    # a stale push with a lower position is ignored (monotonic)
    client.post("/api/positions/ep-one", json={"position": 200, "duration": 1800})
    assert client.get("/api/positions").json()["ep-one"]["position"] == pytest.approx(1000)
    # a deliberate scrub-back (override) DOES set the lower position
    client.post("/api/positions/ep-one",
                json={"position": 200, "duration": 1800, "override": True})
    assert client.get("/api/positions").json()["ep-one"]["position"] == pytest.approx(200)


def test_done_sets_exact_position(client):
    client.post("/api/positions/ep-one", json={"position": 1500, "duration": 1800})
    # marking done pushes position 0 with done=True — must apply despite monotonic
    client.post("/api/positions/ep-one", json={"position": 0, "duration": 1800, "done": True})
    got = client.get("/api/positions").json()["ep-one"]
    assert got["done"] is True and got["position"] == pytest.approx(0)


def test_api_returns_401_not_redirect_when_unauthed(fresh_db):
    """API clients (fetch/sendBeacon) must see a real error, not a 200 login page
    behind a 303 — otherwise the offline saver caches the login page as audio."""
    with TestClient(app) as c:
        assert c.get("/api/positions", follow_redirects=False).status_code == 401


def test_beacon_payload_accepted(client):
    # sendBeacon posts text/plain blobs, not application/json
    r = client.post("/api/positions/ep-one",
                    content='{"position": 42, "duration": 100, "done": false}',
                    headers={"Content-Type": "text/plain"})
    assert r.status_code == 200
    assert client.get("/api/positions").json()["ep-one"]["position"] == 42


def test_validation(client):
    assert client.post("/api/positions/ep-one", json={"position": -5}).status_code == 400
    assert client.post("/api/positions/ep-one", json={"position": 1e9}).status_code == 400
    assert client.post("/api/positions/nope", json={"position": 1}).status_code == 404
    assert client.post("/api/positions/ep-one", content="not json",
                       headers={"Content-Type": "text/plain"}).status_code == 400


def test_positions_are_per_user(client):
    client.post("/api/positions/ep-one", json={"position": 50, "duration": 100})
    import bcrypt
    db.create_user("friend", bcrypt.hashpw(b"pw123456", bcrypt.gensalt()).decode())
    # switch user within the same client/session
    client.post("/logout")
    client.post("/login", data={"username": "friend", "password": "pw123456"})
    assert client.get("/api/positions").json() == {}
    client.post("/api/positions/ep-one", json={"position": 75, "duration": 100})
    assert client.get("/api/positions").json()["ep-one"]["position"] == 75
    # switch back: first user's position untouched
    client.get("/logout")
    client.post("/login", data={"username": "admin", "password": "admin-pass"})
    assert client.get("/api/positions").json()["ep-one"]["position"] == 50
