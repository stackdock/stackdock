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


# ---------- articles ----------

def article_exists(message_id: str) -> bool:
    with conn() as c:
        r = c.execute("SELECT 1 FROM articles WHERE message_id = ?", (message_id,)).fetchone()
        return r is not None


def insert_article(message_id, publication, title, author, original_url, html, published_at) -> int:
    with conn() as c:
        cur = c.execute(
            """INSERT OR IGNORE INTO articles
               (message_id, publication, title, author, original_url, html, published_at, created_at)
               VALUES (?,?,?,?,?,?,?,?)""",
            (message_id, publication, title, author, original_url, html, published_at, now_iso()),
        )
        return cur.lastrowid or 0


def list_articles(limit=200):
    with conn() as c:
        return c.execute(
            "SELECT id, publication, title, author, original_url, published_at, created_at "
            "FROM articles ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()


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
