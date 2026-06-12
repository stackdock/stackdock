"""Database layer: users, invites, reset tokens, connected accounts, migration."""
import sqlite3
from datetime import datetime, timedelta, timezone

import pytest

from app import config, db


def test_init_is_idempotent(fresh_db):
    db.init()  # second call must not raise
    assert db.user_count() == 0


def test_user_crud_and_count(fresh_db):
    assert db.user_count() == 0
    uid = db.create_user("bob", "hash", is_admin=False)
    assert db.user_count() == 1
    assert db.get_user(uid)["username"] == "bob"
    assert db.get_user_by_name("bob")["id"] == uid
    assert db.get_user(99999) is None


def test_invite_consumed_once(fresh_db):
    db.create_invite("INV1")
    assert db.consume_invite("INV1", "newuser") is True
    # already used -> rejected
    assert db.consume_invite("INV1", "someoneelse") is False
    # unknown code -> rejected
    assert db.consume_invite("NOPE", "x") is False


def test_reset_token_expiry(fresh_db):
    uid = db.create_user("carol", "hash")
    past = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    db.create_reset_token("hash-expired", uid, past)
    assert db.consume_reset_token("hash-expired") is None  # expired

    future = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    db.create_reset_token("hash-valid", uid, future)
    assert db.consume_reset_token("hash-valid") == uid
    assert db.consume_reset_token("hash-valid") is None  # burned


def test_connected_accounts_crud(fresh_db):
    uid = db.create_user("dave", "hash")
    aid = db.add_account(uid, "substack", "My Sub", "sid-cookie")
    db.add_account(uid, "gumroad", "My Gum", "gum-cookie")

    assert len(db.list_accounts(user_id=uid)) == 2
    assert len(db.list_accounts(service="substack")) == 1
    assert len(db.list_accounts(service="gumroad")) == 1

    # delete is scoped to the owner
    assert db.delete_account(aid, user_id=99999) is False
    assert db.delete_account(aid, user_id=uid) is True
    assert len(db.list_accounts(user_id=uid)) == 1


def test_update_account_and_alert(fresh_db):
    uid = db.create_user("erin", "hash")
    aid = db.add_account(uid, "substack", "L", "c")
    db.update_account(aid, db.now_iso(), "OK: 3 new")
    row = db.list_accounts(user_id=uid)[0]
    assert row["status"] == "OK: 3 new"
    assert row["last_sync"] is not None

    db.set_account_alert(aid, "2026-01-01T00:00:00+00:00")
    row = db.list_accounts(user_id=uid)[0]
    assert row["last_alert"] == "2026-01-01T00:00:00+00:00"


def test_migration_from_legacy_substack_accounts(tmp_path, monkeypatch):
    """An old DB with a `substack_accounts` table is migrated into
    `connected_accounts` with service='substack' on init()."""
    db_path = tmp_path / "legacy.db"
    monkeypatch.setattr(config, "DATA_DIR", tmp_path)
    monkeypatch.setattr(config, "DB_PATH", db_path)

    # hand-build the pre-zip5 schema with one row
    c = sqlite3.connect(db_path)
    c.executescript(
        """
        CREATE TABLE substack_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            label TEXT NOT NULL,
            cookie TEXT NOT NULL,
            last_sync TEXT,
            status TEXT,
            created_at TEXT
        );
        INSERT INTO substack_accounts (user_id, label, cookie, last_sync, status, created_at)
        VALUES (7, 'Legacy Pub', 'old-sid', NULL, 'OK', '2026-01-01T00:00:00+00:00');
        """
    )
    c.commit()
    c.close()

    db.init()  # runs the migration

    rows = db.list_accounts()
    assert len(rows) == 1
    assert rows[0]["service"] == "substack"
    assert rows[0]["label"] == "Legacy Pub"
    assert rows[0]["cookie"] == "old-sid"
    # old table is gone
    with db.conn() as c:
        names = {r[0] for r in c.execute(
            "SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
    assert "substack_accounts" not in names
    assert "connected_accounts" in names


def test_services_constant():
    assert db.SERVICES == ("substack", "gumroad")
