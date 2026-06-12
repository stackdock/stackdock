"""Central configuration. Everything comes from environment variables (.env)."""
import json
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path(os.getenv("DATA_DIR", "/data"))
DB_PATH = DATA_DIR / "stackdock.db"

# ---- Site / auth ----
SITE_TITLE = os.getenv("SITE_TITLE", "Stackdock")
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
BASIC_AUTH_USER = os.getenv("BASIC_AUTH_USER", "admin")
BASIC_AUTH_PASS = os.getenv("BASIC_AUTH_PASS", "change-me")
# Long random token that protects the podcast RSS feed URL (podcast apps can't do basic auth well)
FEED_TOKEN = os.getenv("FEED_TOKEN", "set-a-long-random-token")

# ---- IMAP (Substack article ingestion via email) ----
IMAP_HOST = os.getenv("IMAP_HOST", "")
IMAP_PORT = int(os.getenv("IMAP_PORT", "993"))
IMAP_USER = os.getenv("IMAP_USER", "")
IMAP_PASS = os.getenv("IMAP_PASS", "")
IMAP_FOLDER = os.getenv("IMAP_FOLDER", "INBOX")
# Only ingest mail whose From address matches one of these domains
IMAP_ALLOWED_SENDER_DOMAINS = [
    d.strip().lower()
    for d in os.getenv("IMAP_ALLOWED_SENDER_DOMAINS", "substack.com,substackcdn.com").split(",")
    if d.strip()
]

# ---- Podcast feeds (Substack private feeds, Gumroad product feeds, anything RSS) ----
# JSON object: {"Feed display name": "https://...rss-url..."}
try:
    PODCAST_FEEDS: dict[str, str] = json.loads(os.getenv("PODCAST_FEEDS", "{}"))
except json.JSONDecodeError:
    PODCAST_FEEDS = {}

# ---- Gumroad (cookie-based library sync) ----
GUMROAD_SESSION_COOKIE = os.getenv("GUMROAD_SESSION_COOKIE", "")

# ---- Object storage (Cloudflare R2 / Backblaze B2 / any S3-compatible) ----
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "")
S3_ACCESS_KEY_ID = os.getenv("S3_ACCESS_KEY_ID", "")
S3_SECRET_ACCESS_KEY = os.getenv("S3_SECRET_ACCESS_KEY", "")
S3_BUCKET = os.getenv("S3_BUCKET", "stackdock")
# Optional: if the bucket is served from a public/custom domain (e.g. R2 custom domain),
# set it here and enclosure links will be plain URLs. Otherwise presigned URLs are used.
S3_PUBLIC_BASE_URL = os.getenv("S3_PUBLIC_BASE_URL", "").rstrip("/")
PRESIGN_EXPIRY_SECONDS = int(os.getenv("PRESIGN_EXPIRY_SECONDS", str(7 * 24 * 3600)))

# ---- Discord ----
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")

# ---- Scheduler intervals (minutes) ----
EMAIL_POLL_MINUTES = int(os.getenv("EMAIL_POLL_MINUTES", "10"))
PODCAST_POLL_MINUTES = int(os.getenv("PODCAST_POLL_MINUTES", "30"))
GUMROAD_POLL_MINUTES = int(os.getenv("GUMROAD_POLL_MINUTES", "360"))
