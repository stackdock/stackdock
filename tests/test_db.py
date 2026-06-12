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
    db.add_account(uid, "substack", "Friend's Sub", "sid-cookie-2")

    assert len(db.list_accounts(user_id=uid)) == 2
    assert len(db.list_accounts(service="substack")) == 2

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
    assert db.SERVICES == ("substack",)


def test_slugs_generated_and_unique(fresh_db):
    a1 = db.insert_article("m1", "Pub", "Hello World!", "a", "http://x", "<p>x</p>", None)
    a2 = db.insert_article("m2", "Pub", "Hello World!", "a", "http://x", "<p>y</p>", None)
    assert db.get_article(a1)["slug"] == "hello-world"
    assert db.get_article(a2)["slug"] == "hello-world-2"
    assert db.get_article_by_slug("hello-world")["id"] == a1

    e1 = db.insert_episode("g1", "Feed", "Ep One", "", "k1", 1, "audio/mpeg", "", None)
    assert db.get_episode_by_slug("ep-one")["id"] == e1
    # duplicate guid is a no-op and must not burn a slug suffix
    assert db.insert_episode("g1", "Feed", "Ep One", "", "k1", 1, "audio/mpeg", "", None) == 0
    assert db.insert_episode("g2", "Feed", "Ep One", "", "k2", 1, "audio/mpeg", "", None) != 0
    assert db.get_episode_by_slug("ep-one-2")["guid"] == "g2"


def test_cover_image_and_image_url_stored(fresh_db):
    aid = db.insert_article("m9", "Pub", "T", "a", None, "<p>x</p>", None,
                            cover_image="https://cdn/x.png")
    assert db.get_article(aid)["cover_image"] == "https://cdn/x.png"
    eid = db.insert_episode("g9", "Feed", "T", "", "k", 1, "audio/mpeg", "", None,
                            image_url="https://cdn/y.png")
    assert db.get_episode(eid)["image_url"] == "https://cdn/y.png"


def test_account_handle_stored_and_migrated(fresh_db):
    uid = db.create_user("erin", "hash")
    db.add_account(uid, "substack", "Erin's", "cookie-value-long-enough", handle="erinreads")
    assert db.list_accounts(user_id=uid)[0]["handle"] == "erinreads"
    db.add_account(uid, "substack", "No handle", "cookie-value-long-enough-2")
    assert db.list_accounts(user_id=uid)[1]["handle"] is None


def test_tracked_publications_crud(fresh_db):
    uid = db.create_user("frank", "hash")
    pid = db.add_tracked_publication(uid, "Blog X", "https://x.substack.com")
    assert pid and db.add_tracked_publication(uid, "Dup", "https://x.substack.com") == 0
    assert len(db.list_tracked_publications(user_id=uid)) == 1
    assert db.delete_tracked_publication(pid, user_id=99999) is False
    assert db.delete_tracked_publication(pid, user_id=uid) is True


def test_paid_flags_present_in_both_list_branches(fresh_db):
    db.insert_article("m1", "P", "T", "a", None, "<p>x</p>", None, is_paid=1, is_locked=1)
    for rows in (db.list_articles(), db.list_articles(publication="P")):
        assert (rows[0]["is_paid"], rows[0]["is_locked"]) == (1, 1)


def test_delete_and_clear_invites(fresh_db):
    db.create_invite("A"); db.create_invite("B"); db.create_invite("C")
    db.consume_invite("B", "bob")          # B is now used
    db.delete_invite("A")                   # remove one unused
    assert {i["code"] for i in db.list_invites()} == {"B", "C"}
    removed = db.clear_invites(only_used=True)   # clears B
    assert removed == 1
    assert {i["code"] for i in db.list_invites()} == {"C"}


def test_article_search_sort_and_hide(fresh_db):
    db.insert_article("m1", "Pub A", "Alpha about cats", "x", None, "<p>1</p>", "2026-01-01T00:00:00+00:00")
    db.insert_article("m2", "Pub B", "Beta about dogs", "x", None, "<p>2</p>", "2026-01-03T00:00:00+00:00")
    db.insert_article("m3", "Pub A", "Gamma cats again", "x", None, "<p>3</p>", "2026-01-02T00:00:00+00:00")

    # search by title
    assert {a["title"] for a in db.list_articles(q="cats")} == {"Alpha about cats", "Gamma cats again"}
    # sort newest-first vs oldest-first
    assert [a["title"] for a in db.list_articles(sort="new")][0] == "Beta about dogs"
    assert [a["title"] for a in db.list_articles(sort="old")][0] == "Alpha about cats"

    # hide one -> excluded by default, included with include_hidden
    aid = db.list_articles(q="dogs")[0]["id"]
    db.set_article_hidden(aid, True)
    assert "Beta about dogs" not in {a["title"] for a in db.list_articles()}
    assert db.count_hidden_articles() == 1
    assert "Beta about dogs" in {a["title"] for a in db.list_articles(include_hidden=True)}
    db.set_article_hidden(aid, False)
    assert db.count_hidden_articles() == 0


def test_rename_feed_consolidates_episodes(fresh_db):
    db.insert_episode("g1", "Mystery Grove (conundrumcluster)", "Ep1", "", "k1", 1, "audio/mpeg", "", None)
    db.insert_episode("g2", "Mystery Grove", "Ep2", "", "k2", 1, "audio/mpeg", "", None)
    db.rename_feed("Mystery Grove (conundrumcluster)", "The Conundrum Cluster")
    db.rename_feed("Mystery Grove", "The Conundrum Cluster")
    feeds = {f["feed_name"]: f["n"] for f in db.list_episode_feeds()}
    assert feeds == {"The Conundrum Cluster": 2}
