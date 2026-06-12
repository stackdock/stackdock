# CLAUDE.md — Agent handoff for Stackdock setup

You are helping the user deploy **Stackdock**: a private FastAPI app that mirrors their paid Substack newsletters (via a collector email inbox over IMAP) and their Gumroad/Substack podcast purchases (via RSS feeds + an optional Gumroad session cookie) to a DigitalOcean droplet, with audio stored in Cloudflare R2, a private podcast RSS feed, Discord webhook notifications, and **multi-user session auth** (invite-only signup, bcrypt passwords, admin-generated one-time reset links — see `app/auth.py`). Deploys run via GitHub Actions on push to `main`.

Auth model: first admin is seeded from `BASIC_AUTH_USER`/`BASIC_AUTH_PASS` on an empty DB; `SECRET_KEY` signs session cookies (generate with `openssl rand -hex 32`); invites and reset links are created at `/admin`. The podcast feed stays token-protected (no session) because podcast apps need plain URLs.

Read `README.md` for the full architecture and click-by-click UI instructions. This file tells you how to run the setup.

## Security rules (non-negotiable)

1. NEVER ask the user to paste secrets (API keys, cookies, passwords, SSH private keys) into the chat. Direct them to put values into `.env` on the server or GitHub Secrets themselves, or have them edit files locally.
2. NEVER commit `.env`, SSH keys, or any credential. `.gitignore` already excludes `.env` — verify before every commit (`git status`).
3. NEVER print the contents of `.env` or `~/.ssh/*` into chat output or logs. If you must verify a var is set, use e.g. `grep -c '^S3_SECRET' .env` or `test -n "$VAR"` patterns.
4. This app mirrors paid content for personal use. Do not add features that publish content publicly, remove auth, or weaken the feed token.

## Division of labor

**Only the human can do these (browser UIs — walk them through using README Part 1):**
- Create the DigitalOcean droplet + add their SSH public key (cloud.digitalocean.com → Create → Droplets)
- DNS A record for their domain
- Cloudflare R2 bucket + API token (dash.cloudflare.com → R2)
- Collector Gmail account, Substack email changes/forwarding, Gmail app password
- Copy Substack private podcast feed URLs from each publication
- Gumroad session cookie from browser DevTools (Application → Cookies → app.gumroad.com → `_gumroad_app_session`)
- Discord webhook URL (Server Settings → Integrations → Webhooks)
- GitHub repo creation + the three Actions secrets: `DROPLET_HOST`, `DROPLET_USER`, `DROPLET_SSH_KEY`

**You can do these (terminal/code):**
- Local smoke test, git init/commit/push
- Generate `FEED_TOKEN` (`openssl rand -hex 24`) and a strong `BASIC_AUTH_PASS`
- Guide or perform droplet bootstrap over SSH (Docker install, clone to `/opt/stackdock`, compose up)
- Edit `Caddyfile` with their domain
- Debug failed deploys, parse logs, fix code

## Setup sequence (follow in order)

1. **Local sanity check** (optional but fast):
   `pip install -r requirements.txt && DATA_DIR=./data uvicorn app.main:app` → GET `http://localhost:8000/healthz` should return `{"ok": true}`.
2. **Push to GitHub** (private repo recommended). Confirm `.env` is NOT tracked.
3. Human creates droplet + DNS + the three GitHub secrets (README Parts 1A, 1B, Part 3 step 3).
4. **Droplet bootstrap** (over SSH, README Part 2):
   - `curl -fsSL https://get.docker.com | sh`
   - `git clone <repo> /opt/stackdock` — if repo is private, generate a deploy key on the droplet and have the human add it: repo → Settings → Deploy keys.
   - `cp .env.example .env` → human fills credentials (you may scaffold non-secret values: SITE_TITLE, PUBLIC_BASE_URL, poll intervals, IMAP_HOST/PORT).
   - Set domain in `Caddyfile`.
   - `docker compose up -d --build`
5. **Verify**:
   - `docker compose logs -f stackdock` shows "Stackdock started"
   - `https://<domain>/healthz` returns ok; `/` prompts for basic auth
   - Trigger each ingester: `use the buttons on /admin (or POST /admin/sync/email as a logged-in admin)` (also `/podcasts`, `/gumroad`) and check `new_items` + Discord channel
   - Subscribe to `https://<domain>/feed/<FEED_TOKEN>/all.xml` in a podcast app
6. **Test CI/CD**: make a trivial commit to `main`, watch repo → Actions tab → deploy job → health check passes.

## Architecture quick map

```
app/main.py              FastAPI routes, session auth pages, APScheduler jobs
app/auth.py              bcrypt, signed session cookies, invites, reset links
app/config.py            all env vars
app/db.py                SQLite (articles, episodes) at $DATA_DIR/stackdock.db
app/storage.py           S3-compatible client (R2); url_for() = presigned or public URL
app/metrics.py           optional Cloudflare R2 + DigitalOcean metrics for /status
                         (read-only tokens: CLOUDFLARE_API_TOKEN/_ACCOUNT_ID, DO_API_TOKEN/_DROPLET_ID;
                         cached 5 min; soft-fails to "not configured")
app/feedgen.py           private RSS feed XML
app/notify.py            Discord webhook embeds
app/ingest/substack.py       PRIMARY article source: per-user substack.sid cookies (added at /accounts)
                             → subscriptions → archive backfill → full post bodies
app/ingest/email_ingest.py   optional fallback: IMAP poll → parse Substack emails → articles
app/ingest/podcast_rss.py    poll PODCAST_FEEDS → stream audio to R2 → episodes
app/ingest/gumroad.py        per-user _gumroad_app_session cookies (added at /accounts); library scrape is fragile — see its docstring. First sync per account is a silent backfill.
.github/workflows/deploy.yml SSH deploy: reset to origin/main, compose up, health check
docker-compose.yml       stackdock (internal :8000) + caddy (80/443, auto-HTTPS) + uptime-kuma (status.<domain>, external healthz monitor — first visit creates its admin; point a monitor at /healthz and wire the Discord webhook in its UI)
```

## Known gotchas

- Port 8000 is `expose`d, not published — health checks from the droplet host must go through the compose network (the workflow already does: `docker compose exec -T caddy wget -qO- http://stackdock:8000/healthz`).
- Caddy needs the DNS A record live and port 80/443 open before it can issue a cert. DO droplets have no firewall by default; if the human enabled one, allow 22/80/443.
- Gmail IMAP requires an **app password** (2FA on). Auth failures usually mean a normal password was used.
- The Gumroad scraper reads the library from Gumroad's Inertia.js page (`<div id="app" data-page="...">` → `props.results`). If it returns 0 purchases, the cookie expired or the frontend changed — `_extract_purchases` in app/ingest/gumroad.py explains the fix. NOTE: Gumroad now Cloudflare-bot-blocks the per-product `/d/<token>` content pages (403) for headless requests, so audio can't be downloaded server-side — the sync still *lists* purchases but, for audio products, you must grab the product's private RSS feed URL and add it to `PODCAST_FEEDS`. Prefer RSS feeds.
- Substack cookie sync uses unofficial endpoints (api/v1/subscriptions, /archive, /posts/{slug}); written defensively in app/ingest/substack.py. First sync per account is a silent backfill (no Discord spam); later syncs notify. Custom-domain publications may come back link-only (the substack.com cookie doesn't apply there) — that's expected, posts still list with links to the original.
- Members' substack.sid and _gumroad_app_session cookies are stored in SQLite on the server. There is NO env var for the Gumroad cookie anymore — accounts are connected in the UI at /accounts. Treat the droplet and DB backups as sensitive.
- Email ingest only processes UNSEEN messages from `IMAP_ALLOWED_SENDER_DOMAINS`. If testing with old mail, mark messages unread first.
- Deploys do a `git reset --hard origin/main` in `/opt/stackdock` — never store uncommitted changes or secrets in tracked files there. `.env` is untracked and survives deploys.
- SQLite + audio DB live in the `stackdock-data` Docker volume; `docker compose down -v` would destroy it. Audio itself is safe in R2.
