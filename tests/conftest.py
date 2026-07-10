"""Shared pytest fixtures.

Every test runs against a throwaway SQLite database in a tmp dir and a fixed
set of fake env vars, so nothing touches the real .env, R2, or network.
"""
import os
from pathlib import Path

import pytest

# --- set env BEFORE importing the app so config picks these up at import time ---
os.environ.setdefault("DATA_DIR", "/tmp/stackdock-test-bootstrap")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-real")
os.environ.setdefault("FEED_TOKEN", "test-feed-token")
os.environ.setdefault("BASIC_AUTH_USER", "admin")
os.environ.setdefault("BASIC_AUTH_PASS", "admin-pass")
os.environ.setdefault("PUBLIC_BASE_URL", "http://testserver")
os.environ.setdefault("DISCORD_WEBHOOK_URL", "")  # disabled -> notify is a no-op
os.environ.setdefault("STALE_REMINDER_HOURS", "24")
# Hard-blank every outbound integration so a developer's real .env can never
# leak a live webhook/bucket/inbox into a test run. config.load_dotenv() won't
# override an already-set var, and these are set before the app import above.
for _leaky in ("OUTBOUND_WEBHOOK_URL", "S3_ENDPOINT_URL", "S3_ACCESS_KEY_ID",
               "S3_SECRET_ACCESS_KEY", "S3_PUBLIC_BASE_URL", "PODCAST_FEEDS",
               "IMAP_HOST", "IMAP_USER", "IMAP_PASS"):
    os.environ[_leaky] = ""

from app import config, db  # noqa: E402


@pytest.fixture
def fresh_db(tmp_path, monkeypatch):
    """Point the app at an empty DB for this test and run migrations."""
    db_path = tmp_path / "stackdock.db"
    monkeypatch.setattr(config, "DATA_DIR", Path(tmp_path))
    monkeypatch.setattr(config, "DB_PATH", db_path)
    db.init()
    return db_path


@pytest.fixture
def client(fresh_db):
    """A FastAPI TestClient. Instantiated WITHOUT the lifespan context so the
    APScheduler / ingest jobs never start during tests."""
    from fastapi.testclient import TestClient

    from app.main import app
    return TestClient(app)


@pytest.fixture
def user(fresh_db):
    """Create and return a plain member user (username 'alice')."""
    from app import auth
    uid = db.create_user("alice", auth.hash_password("hunter2"), is_admin=False)
    return db.get_user(uid)
