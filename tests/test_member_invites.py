"""Member-created invites: unlocked at 30 days, tracked by creator."""
import pytest
from fastapi.testclient import TestClient

from app import auth, db
from app.main import app


@pytest.fixture
def setup(fresh_db):
    db.create_user("admin", auth.hash_password("admin-pass"), is_admin=True)
    db.create_user("newbie", auth.hash_password("newpass99"))
    uid = db.create_user("veteran", auth.hash_password("vetpass99"))
    with db.conn() as c:
        c.execute("UPDATE users SET created_at = datetime('now','-45 days') WHERE id = ?", (uid,))


def login(username, password):
    c = TestClient(app)
    assert c.post("/login", data={"username": username, "password": password}).status_code in (200, 303)
    return c


def test_new_account_locked(setup):
    c = login("newbie", "newpass99")
    assert "unlock" in c.get("/account").text
    assert c.post("/account/invite").status_code == 403


def test_veteran_creates_tracked_invite_that_works(setup):
    c = login("veteran", "vetpass99")
    page = c.post("/account/invite")
    assert page.status_code == 200 and "signup?invite=" in page.text
    (inv,) = db.list_invites_by("veteran")
    assert inv["created_by"] == "veteran" and inv["used_by"] is None
    # the invite admits a signup
    s = TestClient(app)
    r = s.post("/signup", data={"invite": inv["code"], "username": "friend",
                                "password": "friendpw1", "password2": "friendpw1"})
    assert r.status_code in (200, 303)
    (inv,) = db.list_invites_by("veteran")
    assert inv["used_by"] == "friend"


def test_admin_invite_tracked_and_listed(setup):
    c = login("admin", "admin-pass")
    c.post("/admin/invite")
    (inv,) = db.list_invites_by("admin")
    assert inv["created_by"] == "admin"
    assert "by admin" in c.get("/admin").text
