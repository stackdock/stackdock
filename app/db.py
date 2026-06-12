"""SQLite storage for articles and podcast episodes."""
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone

from . import config

_lock = threading.Lock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT UNIQUE,            -- email Message-ID, dedupe key
    publication TEXT,                  -- e.g. "Astral Codex Ten"
    title TEXT NOT NULL,
    author TEXT,
    original_url TEXT,
    html TEXT NOT NULL,
    published_at TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invites (
    code TEXT PRIMARY KEY,
    used_by TEXT,                      -- username that consumed it
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reset_tokens (
    token_hash TEXT PRIMARY KEY,       -- sha256 of token; raw token only in the link
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS connected_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    service TEXT NOT NULL,             -- 'substack' | 'gumroad'
    label TEXT NOT NULL,               -- e.g. "Sam's account"
    cookie TEXT NOT NULL,              -- session cookie value for the service
    last_alert TEXT,                   -- when we last alerted about this account being stale
    last_sync TEXT,                    -- NULL until first (backfill) sync completes
    status TEXT,                       -- last sync result message
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guid TEXT UNIQUE,                  -- RSS guid or gumroad file id, dedupe key
    feed_name TEXT NOT NULL,           -- e.g. "Some Podcast (Substack)" or "Gumroad: Product"
    title TEXT NOT NULL,
    description TEXT,
    audio_key TEXT NOT NULL,           -- object storage key
    audio_bytes INTEGER,
    audio_mime TEXT,
    duration TEXT,
    published_at TEXT,
    created_at TEXT NOT NULL
);
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def conn():
    with _lock:
        c = sqlite3.connect(config.DB_PATH)
        c.row_factory = sqlite3.Row
        try:
            yield c
            c.commit()
        finally:
            c.close()


def init():
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    with conn() as c:
        c.executescript(SCHEMA)
        # lightweight migrations for existing databases
        try:
            c.execute("ALTER TABLE articles ADD COLUMN added_by TEXT")
        except sqlite3.OperationalError:
            pass  # column already exists
        try:
            c.execute("ALTER TABLE connected_accounts ADD COLUMN last_alert TEXT")
        except sqlite3.OperationalError:
            pass  # column already exists
        try:
            c.execute(
                "INSERT INTO connected_accounts (user_id, service, label, cookie, last_sync, status, created_at) "
                "SELECT user_id, 'substack', label, cookie, last_sync, status, created_at FROM substack_accounts"
            )
            c.execute("DROP TABLE substack_accounts")
        except sqlite3.OperationalError:
            pass  # old table doesn't exist


# ---------- articles ----------

def article_exists(message_id: str) -> bool:
    with conn() as c:
        r = c.execute("SELECT 1 FROM articles WHERE message_id = ?", (message_id,)).fetchone()
        return r is not None


def insert_article(message_id, publication, title, author, original_url, html,
                   published_at, added_by=None) -> int:
    with conn() as c:
        cur = c.execute(
            """INSERT OR IGNORE INTO articles
               (message_id, publication, title, author, original_url, html, published_at,
                created_at, added_by)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (message_id, publication, title, author, original_url, html, published_at,
             now_iso(), added_by),
        )
        return cur.lastrowid or 0


def list_articles(limit=1000, publication=None):
    with conn() as c:
        if publication:
            return c.execute(
                "SELECT id, publication, title, author, original_url, published_at, created_at, added_by "
                "FROM articles WHERE publication = ? "
                "ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?",
                (publication, limit),
            ).fetchall()
        return c.execute(
            "SELECT id, publication, title, author, original_url, published_at, created_at, added_by "
            "FROM articles ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?",
            (limit,),
        ).fetchall()


def list_publications():
    with conn() as c:
        return [r["publication"] for r in c.execute(
            "SELECT publication, COUNT(*) AS n FROM articles GROUP BY publication ORDER BY n DESC"
        ).fetchall()]


def get_article(article_id: int):
    with conn() as c:
        return c.execute("SELECT * FROM articles WHERE id = ?", (article_id,)).fetchone()


# ---------- episodes ----------

def episode_exists(guid: str) -> bool:
    with conn() as c:
        r = c.execute("SELECT 1 FROM episodes WHERE guid = ?", (guid,)).fetchone()
        return r is not None


def insert_episode(guid, feed_name, title, description, audio_key,
                   audio_bytes, audio_mime, duration, published_at) -> int:
    with conn() as c:
        cur = c.execute(
            """INSERT OR IGNORE INTO episodes
               (guid, feed_name, title, description, audio_key, audio_bytes,
                audio_mime, duration, published_at, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (guid, feed_name, title, description, audio_key, audio_bytes,
             audio_mime, duration, published_at, now_iso()),
        )
        return cur.lastrowid or 0


def list_episodes(limit=500):
    with conn() as c:
        return c.execute(
            "SELECT * FROM episodes ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()


def get_episode(episode_id: int):
    with conn() as c:
        return c.execute("SELECT * FROM episodes WHERE id = ?", (episode_id,)).fetchone()


# ---------- users / invites / resets ----------

def user_count() -> int:
    with conn() as c:
        return c.execute("SELECT COUNT(*) AS n FROM users").fetchone()["n"]


def get_user_by_name(username: str):
    with conn() as c:
        return c.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()


def get_user(user_id: int):
    with conn() as c:
        return c.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def list_users():
    with conn() as c:
        return c.execute("SELECT id, username, is_admin, created_at FROM users ORDER BY id").fetchall()


def create_user(username: str, password_hash: str, is_admin: bool = False) -> int:
    with conn() as c:
        cur = c.execute(
            "INSERT INTO users (username, password_hash, is_admin, created_at) VALUES (?,?,?,?)",
            (username, password_hash, int(is_admin), now_iso()),
        )
        return cur.lastrowid


def set_password(user_id: int, password_hash: str) -> None:
    with conn() as c:
        c.execute("UPDATE users SET password_hash = ? WHERE id = ?", (password_hash, user_id))


def create_invite(code: str) -> None:
    with conn() as c:
        c.execute("INSERT INTO invites (code, created_at) VALUES (?,?)", (code, now_iso()))


def list_invites():
    with conn() as c:
        return c.execute("SELECT * FROM invites ORDER BY created_at DESC").fetchall()


def consume_invite(code: str, username: str) -> bool:
    """Atomically claim an unused invite. Returns True if it was valid."""
    with conn() as c:
        cur = c.execute(
            "UPDATE invites SET used_by = ? WHERE code = ? AND used_by IS NULL",
            (username, code),
        )
        return cur.rowcount == 1


def create_reset_token(token_hash: str, user_id: int, expires_at: str) -> None:
    with conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO reset_tokens (token_hash, user_id, expires_at, used) VALUES (?,?,?,0)",
            (token_hash, user_id, expires_at),
        )


def consume_reset_token(token_hash: str):
    """Mark a token used if valid and unexpired; return the user_id or None."""
    with conn() as c:
        row = c.execute(
            "SELECT user_id, expires_at, used FROM reset_tokens WHERE token_hash = ?",
            (token_hash,),
        ).fetchone()
        if not row or row["used"] or row["expires_at"] < now_iso():
            return None
        c.execute("UPDATE reset_tokens SET used = 1 WHERE token_hash = ?", (token_hash,))
        return row["user_id"]


# ---------- connected accounts (substack, gumroad) ----------

SERVICES = ("substack", "gumroad")


def add_account(user_id: int, service: str, label: str, cookie: str) -> int:
    with conn() as c:
        cur = c.execute(
            "INSERT INTO connected_accounts (user_id, service, label, cookie, created_at) VALUES (?,?,?,?,?)",
            (user_id, service, label, cookie, now_iso()),
        )
        return cur.lastrowid


def list_accounts(service: str | None = None, user_id: int | None = None):
    q = "SELECT * FROM connected_accounts WHERE 1=1"
    args = []
    if service is not None:
        q += " AND service = ?"; args.append(service)
    if user_id is not None:
        q += " AND user_id = ?"; args.append(user_id)
    with conn() as c:
        return c.execute(q + " ORDER BY id", args).fetchall()


def delete_account(account_id: int, user_id: int) -> bool:
    """Users can only delete their own accounts."""
    with conn() as c:
        cur = c.execute(
            "DELETE FROM connected_accounts WHERE id = ? AND user_id = ?",
            (account_id, user_id),
        )
        return cur.rowcount == 1


def set_account_alert(account_id: int, ts: str) -> None:
    with conn() as c:
        c.execute("UPDATE connected_accounts SET last_alert = ? WHERE id = ?", (ts, account_id))


def update_account(account_id: int, last_sync: str | None, status: str) -> None:
    with conn() as c:
        if last_sync:
            c.execute("UPDATE connected_accounts SET last_sync = ?, status = ? WHERE id = ?",
                      (last_sync, status, account_id))
        else:
            c.execute("UPDATE connected_accounts SET status = ? WHERE id = ?", (status, account_id))
