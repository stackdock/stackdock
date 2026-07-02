"""SQLite storage for articles and podcast episodes."""
import re
import sqlite3
import threading
import unicodedata
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
    created_at TEXT NOT NULL,
    cover_image TEXT,                  -- remote thumbnail URL (Substack cover_image)
    slug TEXT,                         -- pretty URL: /read/{slug}
    is_paid INTEGER DEFAULT 0,         -- 1 if the source post is paid-subscriber-only
    is_locked INTEGER DEFAULT 0,       -- 1 if paid but we only got a preview (no full access)
    hidden INTEGER DEFAULT 0,          -- 1 = manually hidden from the listing
    notified INTEGER DEFAULT 0,        -- 1 once announced in a Discord digest
    media_key TEXT                     -- Patreon video: the post id, for /media HLS playback
);

CREATE TABLE IF NOT EXISTS nyt_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT UNIQUE,           -- the pasted URL, dedupe key
    canonical_url TEXT,
    title TEXT NOT NULL,
    author TEXT,
    section TEXT,
    kind TEXT DEFAULT 'article',        -- article | cooking | interactive
    html TEXT,
    published_at TEXT,
    created_at TEXT NOT NULL,
    cover_image TEXT,                   -- og:image URL (hotlinked, like articles)
    slug TEXT,                          -- pretty URL: /nyt/read/{slug}
    added_by TEXT,                      -- username of the member who pulled it
    status TEXT DEFAULT 'pulling'       -- pulling | ready | failed: <reason>
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
    service TEXT NOT NULL,             -- 'substack'
    label TEXT NOT NULL,               -- e.g. "Sam's account"
    cookie TEXT NOT NULL,              -- session cookie value for the service
    handle TEXT,                       -- optional Substack username, enables public-profile discovery
    last_alert TEXT,                   -- when we last alerted about this account being stale
    last_sync TEXT,                    -- NULL until first (backfill) sync completes
    status TEXT,                       -- last sync result message
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS follows (
    user_id INTEGER NOT NULL,
    kind TEXT NOT NULL,                -- 'pub' (article publication) | 'show' (podcast feed)
    name TEXT NOT NULL,
    PRIMARY KEY (user_id, kind, name)
);

CREATE TABLE IF NOT EXISTS listen_positions (
    user_id INTEGER NOT NULL,
    slug TEXT NOT NULL,                -- episode slug
    position REAL NOT NULL DEFAULT 0,  -- seconds into the episode
    duration REAL NOT NULL DEFAULT 0,
    done INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, slug)
);

CREATE TABLE IF NOT EXISTS hidden_items (
    user_id INTEGER NOT NULL,
    kind TEXT NOT NULL,                -- 'article' | 'episode'
    ref TEXT NOT NULL,                 -- article/episode slug
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, kind, ref)   -- per-user "read it, hide it" in Your Stuff
);

CREATE TABLE IF NOT EXISTS tracked_publications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    base_url TEXT NOT NULL UNIQUE,     -- e.g. https://example.substack.com (one global mirror)
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS article_sources (
    article_id INTEGER NOT NULL,       -- content is deduped; this maps it to every
    label TEXT NOT NULL,               -- connected account that also has it (shown as badges)
    UNIQUE(article_id, label)
);

CREATE TABLE IF NOT EXISTS episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guid TEXT UNIQUE,                  -- RSS guid, dedupe key
    feed_name TEXT NOT NULL,           -- e.g. "Some Podcast (Substack)"
    title TEXT NOT NULL,
    description TEXT,
    audio_key TEXT NOT NULL,           -- object storage key
    audio_bytes INTEGER,
    audio_mime TEXT,
    duration TEXT,
    published_at TEXT,
    created_at TEXT NOT NULL,
    image_url TEXT,                    -- remote thumbnail URL from the RSS feed
    slug TEXT,                         -- pretty URL: /listen/{slug}
    paid_access INTEGER DEFAULT 0,     -- 1 = downloaded with FULL access (not a free preview)
    is_paid INTEGER DEFAULT 0,         -- 1 = the source post is paid-subscriber-only
    notified INTEGER DEFAULT 0         -- 1 once announced in a Discord digest
);
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(text: str) -> str:
    """'My Great Post!' -> 'my-great-post'. ASCII-ish, max 80 chars."""
    s = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()
    return s[:80] or "untitled"


def _unique_slug(c, table: str, title: str) -> str:
    """Return a slug unique within `table`, appending -2, -3, ... on collision."""
    base = slugify(title)
    slug, n = base, 1
    while c.execute(f"SELECT 1 FROM {table} WHERE slug = ?", (slug,)).fetchone():
        n += 1
        slug = f"{base}-{n}"
    return slug


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
        for table, col in [("articles", "added_by TEXT"),
                           ("articles", "cover_image TEXT"),
                           ("articles", "slug TEXT"),
                           ("articles", "is_paid INTEGER DEFAULT 0"),
                           ("articles", "is_locked INTEGER DEFAULT 0"),
                           ("articles", "hidden INTEGER DEFAULT 0"),
                           ("articles", "media_key TEXT"),
                           ("episodes", "image_url TEXT"),
                           ("episodes", "slug TEXT"),
                           ("episodes", "paid_access INTEGER DEFAULT 0"),
                           ("episodes", "is_paid INTEGER DEFAULT 0"),
                           ("connected_accounts", "last_alert TEXT"),
                           ("connected_accounts", "handle TEXT")]:
            try:
                c.execute(f"ALTER TABLE {table} ADD COLUMN {col}")
            except sqlite3.OperationalError:
                pass  # column already exists
        # `notified` is special: when first added, mark all existing rows as
        # already-notified so we don't blast the entire backlog into Discord.
        for table in ("articles", "episodes"):
            try:
                c.execute(f"ALTER TABLE {table} ADD COLUMN notified INTEGER DEFAULT 0")
                c.execute(f"UPDATE {table} SET notified = 1")   # runs once, on add
            except sqlite3.OperationalError:
                pass  # column already exists; leave per-row flags intact
        try:
            c.execute(
                "INSERT INTO connected_accounts (user_id, service, label, cookie, last_sync, status, created_at) "
                "SELECT user_id, 'substack', label, cookie, last_sync, status, created_at FROM substack_accounts"
            )
            c.execute("DROP TABLE substack_accounts")
        except sqlite3.OperationalError:
            pass  # old table doesn't exist
        # drop accounts for services we no longer support (e.g. the removed gumroad);
        # anything in the current SERVICES list (substack, patreon, ...) is kept.
        ph = ",".join("?" * len(SERVICES))
        c.execute(f"DELETE FROM connected_accounts WHERE service NOT IN ({ph})", SERVICES)
        # backfill slugs for rows created before slugs existed
        for table in ("articles", "episodes"):
            for row in c.execute(f"SELECT id, title FROM {table} WHERE slug IS NULL").fetchall():
                c.execute(f"UPDATE {table} SET slug = ? WHERE id = ?",
                          (_unique_slug(c, table, row["title"]), row["id"]))
        # normalize legacy RFC-822 episode dates ("Wed, 04 Jun ...") to ISO so
        # date sorting works; new inserts are normalized at ingest
        from email.utils import parsedate_to_datetime
        for row in c.execute(
                "SELECT id, published_at FROM episodes WHERE published_at LIKE '%,%'").fetchall():
            try:
                iso = parsedate_to_datetime(row["published_at"]).isoformat()
            except (TypeError, ValueError):
                continue
            c.execute("UPDATE episodes SET published_at = ? WHERE id = ?", (iso, row["id"]))
        # seed article_sources from each article's original contributor
        c.execute("INSERT OR IGNORE INTO article_sources (article_id, label) "
                  "SELECT id, added_by FROM articles WHERE added_by IS NOT NULL AND added_by != ''")


# ---------- articles ----------

def article_exists(message_id: str) -> bool:
    with conn() as c:
        r = c.execute("SELECT 1 FROM articles WHERE message_id = ?", (message_id,)).fetchone()
        return r is not None


def _norm_url(u: str | None) -> str | None:
    """host + path, no scheme/query/fragment/trailing slash — utm params and
    http/https differences must not defeat dedupe."""
    if not u:
        return None
    from urllib.parse import urlparse
    p = urlparse(u)
    return f"{p.netloc.lower()}{p.path.rstrip('/')}" or None


def find_article_match(original_url: str | None = None, publication: str | None = None,
                       title: str | None = None):
    """Find an already-mirrored article that is the SAME POST arriving from a
    different source (email vs cookie sync vs orphan sync), which therefore has
    a different message_id. Match by canonical URL first, then (pub, title)."""
    with conn() as c:
        target = _norm_url(original_url)
        if target:
            seg = target.rsplit("/", 1)[-1]
            if seg:
                for r in c.execute(
                        "SELECT * FROM articles WHERE original_url LIKE ?",
                        (f"%/{seg}%",)).fetchall():
                    if _norm_url(r["original_url"]) == target:
                        return r
        if publication and title:
            # Title fallback ONLY matches rows that aren't already canonical
            # substack posts. Canonical rows dedupe strictly by post id —
            # otherwise a pub's recurring titles ("Open Thread", "Weekly
            # Roundup") would absorb a genuinely NEW post into an old one.
            return c.execute(
                "SELECT * FROM articles WHERE lower(publication) = lower(?) "
                "AND lower(title) = lower(?) AND message_id NOT LIKE 'substack:%' "
                "LIMIT 1",
                (publication, title)).fetchone()
    return None


def absorb_article(article_id: int, *, message_id=None, html=None, cover_image=None,
                   author=None, published_at=None, original_url=None, is_paid=None,
                   source_label=None) -> None:
    """Merge a duplicate sighting of an article into the existing row:
    fill in metadata the existing row is missing, upgrade the body when the new
    source has full access (html given -> also clears is_locked), and adopt the
    canonical substack:{id} message_id so future syncs dedupe on the fast path."""
    with conn() as c:
        row = c.execute("SELECT * FROM articles WHERE id = ?", (article_id,)).fetchone()
        if not row:
            return
        updates, args = [], []

        def fill(col, val):
            if val and not row[col]:
                updates.append(f"{col} = ?"); args.append(val)

        if (message_id and message_id.startswith("substack:")
                and not (row["message_id"] or "").startswith("substack:")):
            updates.append("message_id = ?"); args.append(message_id)
        if html:
            updates.append("html = ?"); args.append(html)
            updates.append("is_locked = 0")
        fill("cover_image", cover_image)
        fill("author", author)
        fill("published_at", published_at)
        fill("original_url", original_url)
        if is_paid is not None and not row["is_paid"]:
            updates.append("is_paid = ?"); args.append(1 if is_paid else 0)
        if updates:
            args.append(article_id)
            c.execute(f"UPDATE articles SET {', '.join(updates)} WHERE id = ?", args)
    if source_label:
        add_article_source(article_id, source_label)


def get_article_by_message_id(message_id: str):
    with conn() as c:
        return c.execute("SELECT * FROM articles WHERE message_id = ?", (message_id,)).fetchone()


def add_article_source(article_id: int, label: str) -> None:
    """Credit a connected account as also having this (deduped) article."""
    if not label:
        return
    with conn() as c:
        c.execute("INSERT OR IGNORE INTO article_sources (article_id, label) VALUES (?,?)",
                  (article_id, label))


def list_article_sources(article_id: int) -> list[str]:
    with conn() as c:
        return [r["label"] for r in c.execute(
            "SELECT label FROM article_sources WHERE article_id = ? ORDER BY label",
            (article_id,)).fetchall()]


def upgrade_article_body(article_id: int, html: str, added_by: str) -> None:
    """A paying account unlocked a post we previously stored as a preview."""
    with conn() as c:
        c.execute("UPDATE articles SET html = ?, is_locked = 0, added_by = ? WHERE id = ?",
                  (html, added_by, article_id))


def insert_article(message_id, publication, title, author, original_url, html,
                   published_at, added_by=None, cover_image=None, is_paid=0, is_locked=0,
                   notified=0, media_key=None) -> int:
    with conn() as c:
        if c.execute("SELECT 1 FROM articles WHERE message_id = ?", (message_id,)).fetchone():
            return 0
        cur = c.execute(
            """INSERT OR IGNORE INTO articles
               (message_id, publication, title, author, original_url, html, published_at,
                created_at, added_by, cover_image, slug, is_paid, is_locked, notified, media_key)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (message_id, publication, title, author, original_url, html, published_at,
             now_iso(), added_by, cover_image, _unique_slug(c, "articles", title),
             1 if is_paid else 0, 1 if is_locked else 0, 1 if notified else 0, media_key),
        )
        return cur.lastrowid or 0


def set_article_media(article_id: int, media_key: str) -> None:
    with conn() as c:
        c.execute("UPDATE articles SET media_key = ? WHERE id = ?", (media_key, article_id))


_ARTICLE_COLS = (
    "id, publication, title, author, original_url, published_at, created_at, "
    "added_by, cover_image, slug, is_paid, is_locked, hidden, "
    "(SELECT GROUP_CONCAT(label, ',') FROM article_sources s WHERE s.article_id = articles.id) AS sources"
)


def _article_where(publication, publications, q, include_hidden):
    """Shared filter for list_articles / count_articles. Returns (sql, args), or
    None when the filter can match nothing (empty publications list)."""
    where, args = [], []
    if not include_hidden:
        where.append("hidden = 0")
    if publication:
        where.append("publication = ?"); args.append(publication)
    if publications is not None:
        if not publications:
            return None
        where.append(f"publication IN ({','.join('?' * len(publications))})")
        args += list(publications)
    if q:
        where.append("(title LIKE ? OR publication LIKE ? OR author LIKE ?)")
        args += [f"%{q}%", f"%{q}%", f"%{q}%"]
    return (" WHERE " + " AND ".join(where)) if where else "", args


def list_articles(limit=1000, publication=None, publications=None, q=None,
                  sort="new", include_hidden=False, offset=0):
    w = _article_where(publication, publications, q, include_hidden)
    if w is None:
        return []
    wsql, args = w
    order = "ASC" if sort == "old" else "DESC"
    args += [limit, offset]
    with conn() as c:
        return c.execute(
            f"SELECT {_ARTICLE_COLS} FROM articles{wsql} "
            f"ORDER BY COALESCE(published_at, created_at) {order} LIMIT ? OFFSET ?", args).fetchall()


def count_articles(publication=None, publications=None, q=None, include_hidden=False) -> int:
    w = _article_where(publication, publications, q, include_hidden)
    if w is None:
        return 0
    wsql, args = w
    with conn() as c:
        return c.execute(f"SELECT COUNT(*) AS n FROM articles{wsql}", args).fetchone()["n"]


def set_article_hidden(article_id: int, hidden: bool) -> None:
    with conn() as c:
        c.execute("UPDATE articles SET hidden = ? WHERE id = ?", (1 if hidden else 0, article_id))


def count_hidden_articles() -> int:
    with conn() as c:
        return c.execute("SELECT COUNT(*) AS n FROM articles WHERE hidden = 1").fetchone()["n"]


def list_publications():
    """[{'publication', 'n', 'paid'}] — paid=1 (green chip) only when we genuinely
    have paid access: at least one fully-accessible paid post AND at least as many
    accessible paid posts as locked previews. This stops a single fluke-unlocked
    post (e.g. an author freebie) from flagging a whole publication as a paid sub
    we don't actually hold. Patreon publications are always paid (you pay Patreon
    to follow a creator). Paid pubs sort first, then by article count."""
    with conn() as c:
        return c.execute(
            "SELECT publication, COUNT(*) AS n, "
            "(MAX(CASE WHEN message_id LIKE 'patreon:%' THEN 1 ELSE 0 END) = 1 "
            " OR (SUM(CASE WHEN is_paid = 1 AND is_locked = 0 THEN 1 ELSE 0 END) > 0 "
            "     AND SUM(CASE WHEN is_paid = 1 AND is_locked = 0 THEN 1 ELSE 0 END) "
            "         >= SUM(CASE WHEN is_paid = 1 AND is_locked = 1 THEN 1 ELSE 0 END))) AS paid "
            "FROM articles WHERE hidden = 0 GROUP BY publication "
            "ORDER BY paid DESC, n DESC"
        ).fetchall()


def list_articles_with_html(limit=200):
    """Newest articles including full bodies — used to build the unified RSS feeds."""
    with conn() as c:
        return c.execute(
            "SELECT * FROM articles ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?",
            (limit,),
        ).fetchall()


def get_article(article_id: int):
    with conn() as c:
        return c.execute("SELECT * FROM articles WHERE id = ?", (article_id,)).fetchone()


def get_article_by_slug(slug: str):
    with conn() as c:
        return c.execute("SELECT * FROM articles WHERE slug = ?", (slug,)).fetchone()


# ---------- episodes ----------

def episode_exists(guid: str) -> bool:
    with conn() as c:
        r = c.execute("SELECT 1 FROM episodes WHERE guid = ?", (guid,)).fetchone()
        return r is not None


def insert_episode(guid, feed_name, title, description, audio_key,
                   audio_bytes, audio_mime, duration, published_at, image_url=None,
                   paid_access=0, is_paid=0, notified=0) -> int:
    with conn() as c:
        if c.execute("SELECT 1 FROM episodes WHERE guid = ?", (guid,)).fetchone():
            return 0
        cur = c.execute(
            """INSERT OR IGNORE INTO episodes
               (guid, feed_name, title, description, audio_key, audio_bytes,
                audio_mime, duration, published_at, created_at, image_url, slug,
                paid_access, is_paid, notified)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (guid, feed_name, title, description, audio_key, audio_bytes,
             audio_mime, duration, published_at, now_iso(), image_url,
             _unique_slug(c, "episodes", title), 1 if paid_access else 0,
             1 if is_paid else 0, 1 if notified else 0),
        )
        return cur.lastrowid or 0


def get_episode_by_guid(guid: str):
    with conn() as c:
        return c.execute("SELECT * FROM episodes WHERE guid = ?", (guid,)).fetchone()


def list_unnotified_items() -> list[dict]:
    """Articles/episodes inserted as announce-worthy (notified=0) but not yet sent
    in a Discord digest. Drives a resilient digest: an interrupted sync leaves
    items unnotified and the next run sends them, so pings are never silently lost."""
    base = config.PUBLIC_BASE_URL
    items = []
    with conn() as c:
        for a in c.execute("SELECT id, slug, title, publication, original_url, published_at "
                           "FROM articles WHERE notified = 0").fetchall():
            items.append({"type": "article", "id": a["id"], "source": a["publication"],
                          "title": a["title"], "url": f"{base}/read/{a['slug']}",
                          "original_url": a["original_url"], "published_at": a["published_at"]})
        for e in c.execute("SELECT id, slug, title, feed_name, published_at "
                           "FROM episodes WHERE notified = 0").fetchall():
            items.append({"type": "episode", "id": e["id"], "source": e["feed_name"],
                          "title": e["title"], "url": f"{base}/listen/{e['slug']}",
                          "original_url": None, "published_at": e["published_at"]})
    return items


def mark_items_notified(items: list[dict]) -> None:
    art = [i["id"] for i in items if i.get("type") == "article"]
    eps = [i["id"] for i in items if i.get("type") == "episode"]
    with conn() as c:
        if art:
            c.execute(f"UPDATE articles SET notified = 1 WHERE id IN ({','.join('?' * len(art))})", art)
        if eps:
            c.execute(f"UPDATE episodes SET notified = 1 WHERE id IN ({','.join('?' * len(eps))})", eps)


def set_episode_paid(guid, is_paid) -> None:
    """Keep an existing episode's paid-show flag (green chip) current from the
    archive — cheap, no by-id fetch / no re-download. Does NOT touch paid_access
    (full-vs-preview audio), which only a paid-subscriber download can establish."""
    with conn() as c:
        c.execute("UPDATE episodes SET is_paid=? WHERE guid=?",
                  (1 if is_paid else 0, guid))


def upgrade_episode(guid, *, audio_key, audio_bytes, audio_mime,
                    duration, image_url=None, paid_access=1, is_paid=1) -> None:
    """Replace a stored episode's audio in place when a PAYING subscriber supplies
    the full version of a preview-only download. Keeps guid/slug so listening
    positions and links survive. Caller deletes the old R2 object if the key moved."""
    with conn() as c:
        c.execute(
            """UPDATE episodes SET audio_key=?, audio_bytes=?, audio_mime=?,
                 duration=?, image_url=COALESCE(?, image_url), paid_access=?, is_paid=?
               WHERE guid=?""",
            (audio_key, audio_bytes, audio_mime, duration, image_url,
             1 if paid_access else 0, 1 if is_paid else 0, guid))


def _episode_where(feed, feeds):
    """Shared filter for list_episodes / count_episodes. (sql, args) or None."""
    where, args = [], []
    if feed:
        where.append("feed_name = ?"); args.append(feed)
    if feeds is not None:
        if not feeds:
            return None
        where.append(f"feed_name IN ({','.join('?' * len(feeds))})")
        args += list(feeds)
    return (" WHERE " + " AND ".join(where)) if where else "", args


def list_episodes(limit=500, feed=None, feeds=None, sort="new", offset=0):
    w = _episode_where(feed, feeds)
    if w is None:
        return []
    wsql, args = w
    order = "ASC" if sort == "old" else "DESC"
    args += [limit, offset]
    with conn() as c:
        return c.execute(
            f"SELECT * FROM episodes{wsql} "
            f"ORDER BY COALESCE(published_at, created_at) {order} LIMIT ? OFFSET ?", args).fetchall()


def count_episodes(feed=None, feeds=None) -> int:
    w = _episode_where(feed, feeds)
    if w is None:
        return 0
    wsql, args = w
    with conn() as c:
        return c.execute(f"SELECT COUNT(*) AS n FROM episodes{wsql}", args).fetchone()["n"]


def rename_feed(old_name: str, new_name: str) -> int:
    """Consolidate episodes stored under different display names for the same show."""
    with conn() as c:
        return c.execute("UPDATE episodes SET feed_name = ? WHERE feed_name = ?",
                         (new_name, old_name)).rowcount


def list_episode_feeds():
    """[{'feed_name', 'n', 'paid'}], busiest first — podcast shows for the filter
    bar. paid=1 (green) when the show is PREDOMINANTLY paid (>= as many paid as free
    episodes), or it's a Patreon show (you pay Patreon to follow a creator)."""
    with conn() as c:
        return c.execute(
            "SELECT feed_name, COUNT(*) AS n, "
            "(MAX(CASE WHEN guid LIKE 'patreon:%' THEN 1 ELSE 0 END) = 1 "
            " OR (SUM(CASE WHEN is_paid = 1 THEN 1 ELSE 0 END) > 0 "
            "     AND SUM(CASE WHEN is_paid = 1 THEN 1 ELSE 0 END) "
            "         >= SUM(CASE WHEN is_paid = 0 THEN 1 ELSE 0 END))) AS paid "
            "FROM episodes GROUP BY feed_name ORDER BY n DESC"
        ).fetchall()


def get_episode(episode_id: int):
    with conn() as c:
        return c.execute("SELECT * FROM episodes WHERE id = ?", (episode_id,)).fetchone()


def get_episode_by_slug(slug: str):
    with conn() as c:
        return c.execute("SELECT * FROM episodes WHERE slug = ?", (slug,)).fetchone()


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


def delete_invite(code: str) -> None:
    with conn() as c:
        c.execute("DELETE FROM invites WHERE code = ?", (code,))


def clear_invites(only_used: bool = False) -> int:
    """Delete invites; only the consumed ones when only_used=True. Returns count removed."""
    with conn() as c:
        sql = "DELETE FROM invites" + (" WHERE used_by IS NOT NULL" if only_used else "")
        return c.execute(sql).rowcount


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


# ---------- connected accounts (substack) ----------

SERVICES = ("substack", "patreon")


def add_account(user_id: int, service: str, label: str, cookie: str, handle: str | None = None) -> int:
    """Connect an account, or RECONNECT one with the same (user, service, label):
    reconnecting replaces the cookie in place and keeps last_sync, so a fresh
    cookie for an account we already mirror only picks up new posts (no full
    re-backfill / no duplicate row), and clears the stale status + alert state."""
    with conn() as c:
        existing = c.execute(
            "SELECT id FROM connected_accounts WHERE user_id=? AND service=? AND label=?",
            (user_id, service, label)).fetchone()
        if existing:
            c.execute(
                "UPDATE connected_accounts SET cookie=?, handle=COALESCE(?, handle), "
                "status=NULL, last_alert=NULL WHERE id=?",
                (cookie, handle, existing["id"]))
            return existing["id"]
        cur = c.execute(
            "INSERT INTO connected_accounts (user_id, service, label, cookie, handle, created_at) "
            "VALUES (?,?,?,?,?,?)",
            (user_id, service, label, cookie, handle, now_iso()),
        )
        return cur.lastrowid


def account_exists(user_id: int, service: str, label: str) -> bool:
    with conn() as c:
        return c.execute(
            "SELECT 1 FROM connected_accounts WHERE user_id=? AND service=? AND label=?",
            (user_id, service, label)).fetchone() is not None


def account_with_cookie(service: str, cookie: str):
    """The account already using this exact cookie (any member), or None — so we
    can reject connecting one login twice."""
    with conn() as c:
        return c.execute(
            "SELECT id, user_id, label FROM connected_accounts WHERE service=? AND cookie=?",
            (service, cookie)).fetchone()


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


def toggle_follow(user_id: int, kind: str, name: str) -> bool:
    """Follow/unfollow a source. Returns True if now following."""
    assert kind in ("pub", "show")
    with conn() as c:
        cur = c.execute("DELETE FROM follows WHERE user_id=? AND kind=? AND name=?",
                        (user_id, kind, name))
        if cur.rowcount:
            return False
        c.execute("INSERT INTO follows (user_id, kind, name) VALUES (?,?,?)",
                  (user_id, kind, name))
        return True


def list_follows(user_id: int, kind: str | None = None) -> list[str]:
    q, args = "SELECT kind, name FROM follows WHERE user_id = ?", [user_id]
    if kind:
        q += " AND kind = ?"; args.append(kind)
    with conn() as c:
        return [r["name"] for r in c.execute(q + " ORDER BY name", args).fetchall()]


def set_hidden_item(user_id: int, kind: str, ref: str, hidden: bool) -> None:
    """Per-user hide/unhide of an article or episode (by slug) in Your Stuff.
    Independent of the global articles.hidden flag used on the Articles tab."""
    assert kind in ("article", "episode")
    with conn() as c:
        if hidden:
            c.execute("INSERT OR IGNORE INTO hidden_items (user_id, kind, ref, created_at) "
                      "VALUES (?,?,?,?)", (user_id, kind, ref, now_iso()))
        else:
            c.execute("DELETE FROM hidden_items WHERE user_id=? AND kind=? AND ref=?",
                      (user_id, kind, ref))


def list_hidden_refs(user_id: int, kind: str) -> set[str]:
    with conn() as c:
        return {r["ref"] for r in c.execute(
            "SELECT ref FROM hidden_items WHERE user_id=? AND kind=?",
            (user_id, kind)).fetchall()}


def upsert_listen_position(user_id: int, slug: str, position: float,
                           duration: float, done: bool) -> None:
    with conn() as c:
        c.execute(
            """INSERT INTO listen_positions (user_id, slug, position, duration, done, updated_at)
               VALUES (?,?,?,?,?,?)
               ON CONFLICT(user_id, slug) DO UPDATE SET
                 position = excluded.position, duration = excluded.duration,
                 done = excluded.done, updated_at = excluded.updated_at""",
            (user_id, slug, max(0.0, float(position)), max(0.0, float(duration)),
             1 if done else 0, now_iso()))


def get_listen_positions(user_id: int) -> dict:
    """{slug: {position, duration, done}} for every episode this user touched."""
    with conn() as c:
        return {r["slug"]: {"position": r["position"], "duration": r["duration"],
                            "done": bool(r["done"])}
                for r in c.execute(
                    "SELECT slug, position, duration, done FROM listen_positions "
                    "WHERE user_id = ?", (user_id,)).fetchall()}


def add_tracked_publication(user_id: int, name: str, base_url: str) -> int:
    """Track a publication by URL; returns 0 if the URL is already tracked by anyone."""
    with conn() as c:
        cur = c.execute(
            "INSERT OR IGNORE INTO tracked_publications (user_id, name, base_url, created_at) "
            "VALUES (?,?,?,?)", (user_id, name, base_url, now_iso()))
        return cur.lastrowid if cur.rowcount else 0


def list_tracked_publications(user_id: int | None = None):
    q, args = "SELECT * FROM tracked_publications", []
    if user_id is not None:
        q += " WHERE user_id = ?"; args.append(user_id)
    with conn() as c:
        return c.execute(q + " ORDER BY id", args).fetchall()


def delete_tracked_publication(pub_id: int, user_id: int) -> bool:
    with conn() as c:
        cur = c.execute("DELETE FROM tracked_publications WHERE id = ? AND user_id = ?",
                        (pub_id, user_id))
        return cur.rowcount == 1


def set_account_alert(account_id: int, ts: str) -> None:
    with conn() as c:
        c.execute("UPDATE connected_accounts SET last_alert = ? WHERE id = ?", (ts, account_id))


def set_account_handle(account_id: int, handle: str) -> None:
    with conn() as c:
        c.execute("UPDATE connected_accounts SET handle = ? WHERE id = ?", (handle, account_id))


def update_account(account_id: int, last_sync: str | None, status: str) -> None:
    with conn() as c:
        if last_sync:
            c.execute("UPDATE connected_accounts SET last_sync = ?, status = ? WHERE id = ?",
                      (last_sync, status, account_id))
        else:
            c.execute("UPDATE connected_accounts SET status = ? WHERE id = ?", (status, account_id))


# ---------- NYT articles (server-side browser pull) ----------

_NYT_COLS = ("id, original_url, canonical_url, title, author, section, kind, "
             "published_at, created_at, cover_image, slug, added_by, status")


def insert_nyt_pending(original_url: str, added_by: str) -> tuple[int, bool]:
    """Insert a 'pulling' stub for a pasted URL. Returns (id, created).

    If the URL was already pulled, returns the existing row's id and False so the
    caller can point the member at it instead of duplicating the fetch.
    """
    with conn() as c:
        row = c.execute("SELECT id FROM nyt_articles WHERE original_url = ?",
                        (original_url,)).fetchone()
        if row:
            return row["id"], False
        cur = c.execute(
            "INSERT INTO nyt_articles (original_url, title, added_by, status, created_at) "
            "VALUES (?, ?, ?, 'pulling', ?)",
            (original_url, original_url, added_by, now_iso()))
        return cur.lastrowid, True


def list_nyt_pending() -> list:
    with conn() as c:
        return c.execute(
            "SELECT id, original_url FROM nyt_articles WHERE status = 'pulling' "
            "ORDER BY created_at ASC").fetchall()


def finish_nyt_article(row_id: int, *, canonical_url: str, title: str, author: str,
                       section: str, kind: str, html: str, published_at: str,
                       cover_image: str) -> None:
    """Fill a pulled article's body + metadata and mark it ready."""
    with conn() as c:
        c.execute(
            "UPDATE nyt_articles SET canonical_url = ?, title = ?, author = ?, "
            "section = ?, kind = ?, html = ?, published_at = ?, cover_image = ?, "
            "slug = ?, status = 'ready' WHERE id = ?",
            (canonical_url, title, author, section, kind, html, published_at,
             cover_image, _unique_slug(c, "nyt_articles", title or "nyt"), row_id))


def set_nyt_status(row_id: int, status: str) -> None:
    with conn() as c:
        c.execute("UPDATE nyt_articles SET status = ? WHERE id = ?", (status, row_id))


def list_nyt_articles(limit: int = 10, offset: int = 0, sort: str = "new") -> list:
    order = "ASC" if sort == "old" else "DESC"
    with conn() as c:
        return c.execute(
            f"SELECT {_NYT_COLS} FROM nyt_articles WHERE status = 'ready' "
            f"ORDER BY COALESCE(published_at, created_at) {order} LIMIT ? OFFSET ?",
            (limit, offset)).fetchall()


def count_nyt_articles() -> int:
    with conn() as c:
        return c.execute(
            "SELECT COUNT(*) AS n FROM nyt_articles WHERE status = 'ready'").fetchone()["n"]


def get_nyt_article_by_slug(slug: str):
    with conn() as c:
        return c.execute("SELECT * FROM nyt_articles WHERE slug = ?", (slug,)).fetchone()


def recent_nyt_failures(limit: int = 5) -> list:
    """Recent non-ready rows (pulling / failed) to surface state on the page."""
    with conn() as c:
        return c.execute(
            "SELECT id, original_url, status, created_at FROM nyt_articles "
            "WHERE status != 'ready' ORDER BY created_at DESC LIMIT ?",
            (limit,)).fetchall()
