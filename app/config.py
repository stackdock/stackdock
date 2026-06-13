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
# Signs session cookies. Generate with: openssl rand -hex 32
SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-me")
# Used once, to seed the first admin account on an empty database
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

# ---- Podcast feeds (Substack private per-subscriber feeds, anything RSS) ----
# JSON object: {"Feed display name": "https://...rss-url..."}
try:
    PODCAST_FEEDS: dict[str, str] = json.loads(os.getenv("PODCAST_FEEDS", "{}"))
except json.JSONDecodeError:
    PODCAST_FEEDS = {}

# ---- Substack cookie sync ----
# Max posts to backfill per publication on an account's first sync
SUBSTACK_BACKFILL_POSTS = int(os.getenv("SUBSTACK_BACKFILL_POSTS", "50"))
SUBSTACK_POLL_MINUTES = int(os.getenv("SUBSTACK_POLL_MINUTES", "60"))
# Publications Substack's subscriptions API doesn't return (some paid / podcast
# subs). JSON list of {"name": ..., "base_url": ...} synced for EVERY connected
# account, in addition to the auto-discovered list.
try:
    SUBSTACK_EXTRA_PUBS: list[dict] = json.loads(os.getenv("SUBSTACK_EXTRA_PUBS", "[]"))
except json.JSONDecodeError:
    SUBSTACK_EXTRA_PUBS = []

# ---- Stale-cookie reminders ----
# Re-alert this often (hours) while a cookie stays stale. 0 = alert once only.
STALE_REMINDER_HOURS = int(os.getenv("STALE_REMINDER_HOURS", "24"))

# ---- Object storage (Cloudflare R2 / Backblaze B2 / any S3-compatible) ----
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "")
S3_ACCESS_KEY_ID = os.getenv("S3_ACCESS_KEY_ID", "")
S3_SECRET_ACCESS_KEY = os.getenv("S3_SECRET_ACCESS_KEY", "")
S3_BUCKET = os.getenv("S3_BUCKET", "stackdock")
# Optional: if the bucket is served from a public/custom domain (e.g. R2 custom domain),
# set it here and enclosure links will be plain URLs. Otherwise presigned URLs are used.
S3_PUBLIC_BASE_URL = os.getenv("S3_PUBLIC_BASE_URL", "").rstrip("/")
PRESIGN_EXPIRY_SECONDS = int(os.getenv("PRESIGN_EXPIRY_SECONDS", str(7 * 24 * 3600)))

# ---- Cloud provider metrics (optional, for /status) ----
# Cloudflare: read-only token with Account Analytics:Read. Account ID is on the R2 page.
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN", "")
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
# DigitalOcean: read-only token; droplet ID is the number in the droplet's dashboard URL.
DO_API_TOKEN = os.getenv("DO_API_TOKEN", "")
DO_DROPLET_ID = os.getenv("DO_DROPLET_ID", "")

# ---- GitHub Actions pipeline badges (optional, for /status) ----
# "owner/name" of the repo; badges are hidden when blank. Comma-separated workflow
# file names as they live in .github/workflows/. Private-repo badges only render
# for viewers signed in to GitHub.
GITHUB_REPO = os.getenv("GITHUB_REPO", "stackdock/stackdock")
# ci.yml runs the test suite on every push (incl. main); deploy.yml runs on a
# published release. Both badges are meaningful. Override via GITHUB_WORKFLOWS.
GITHUB_WORKFLOWS = [w.strip() for w in
                    os.getenv("GITHUB_WORKFLOWS", "ci.yml,deploy.yml").split(",") if w.strip()]

# ---- Discord ----
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")

# ---- Generic outbound webhook (optional) ----
# If set, every sync that finds new content POSTs ONE combined JSON payload here:
# {"source": "stackdock", "new_articles": [...], "new_episodes": [...]}.
# Use it to push the aggregated firehose into anything (n8n, Zapier, your own bot).
OUTBOUND_WEBHOOK_URL = os.getenv("OUTBOUND_WEBHOOK_URL", "")

# ---- Scheduler intervals (minutes) ----
EMAIL_POLL_MINUTES = int(os.getenv("EMAIL_POLL_MINUTES", "10"))
PODCAST_POLL_MINUTES = int(os.getenv("PODCAST_POLL_MINUTES", "30"))
