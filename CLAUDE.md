# CLAUDE.md — Agent handoff for Stackdock setup

You are helping the user deploy **Stackdock**: a private FastAPI app that mirrors their paid Substack newsletters (via per-user substack.sid cookies, with an optional IMAP fallback) and their Substack podcast subscriptions (via private per-subscriber RSS feeds in PODCAST_FEEDS) to a DigitalOcean droplet, with audio stored in Cloudflare R2, a private podcast RSS feed, Discord webhook notifications, and **multi-user session auth** (invite-only signup, bcrypt passwords, admin-generated one-time reset links — see `app/auth.py`). Deploys run via GitHub Actions on push to `main`.

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
   - Trigger each ingester: use the buttons on /admin (or POST /admin/sync/email as a logged-in admin; also `/podcasts`, `/substack`) and check `new_items` + Discord channel
   - Subscribe to `https://<domain>/feed/<FEED_TOKEN>/all.xml` in a podcast app;
     `/feed/<FEED_TOKEN>/articles.xml` and `/everything.xml` work in any RSS reader
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
app/feedgen.py           private RSS feeds: all.xml (audio, for podcast apps),
                         articles.xml (full-text articles), everything.xml (both merged)
app/notify.py            ONE Discord digest embed per sync run (notify_digest) listing all
                         new items across every member, plus an optional generic outbound
                         JSON webhook (OUTBOUND_WEBHOOK_URL) that gets one combined payload
app/ingest/substack.py       PRIMARY source: per-user substack.sid cookies (added at /accounts)
                             → subscriptions (api/v1/subscriptions?tvOnly=false) + SUBSTACK_EXTRA_PUBS
                             → archive → per-post via substack.com/api/v1/posts/by-id/{id} (cross-domain,
                             cookie always applies). TEXT posts → articles (full body if the account pays,
                             else preview marked is_locked); PODCAST posts → download full podcast_url audio
                             to R2 → episodes. Custom-domain pubs auto-resolved via redirect.
app/ingest/email_ingest.py   optional fallback: IMAP poll → parse Substack emails → articles
app/ingest/podcast_rss.py    poll PODCAST_FEEDS (Substack private podcast feeds, or any RSS)
                             → stream audio to R2 → episodes (with feed thumbnails)
.github/workflows/deploy.yml SSH deploy: reset to origin/main, compose up, health check
docker-compose.yml       stackdock (internal :8000) + caddy (80/443, auto-HTTPS) + uptime-kuma (status.<domain>, external healthz monitor — first visit creates its admin; point a monitor at /healthz and wire the Discord webhook in its UI)
```

## Known gotchas

- Port 8000 is `expose`d, not published — health checks from the droplet host must go through the compose network (the workflow already does: `docker compose exec -T caddy wget -qO- http://stackdock:8000/healthz`).
- Caddy needs the DNS A record live and port 80/443 open before it can issue a cert. DO droplets have no firewall by default; if the human enabled one, allow 22/80/443.
- Gmail IMAP requires an **app password** (2FA on). Auth failures usually mean a normal password was used.
- Substack has NO official public API; sync uses the substack.sid cookie against unofficial endpoints (written defensively in app/ingest/substack.py). Hard-won details:
  - `api/v1/subscriptions` now REQUIRES `?tvOnly=false` or it 400s ("param tvOnly invalid value"), which used to look like "no subscriptions".
  - That endpoint only returns a CURATED handful (6 even when the account follows 35+). The COMPLETE list lives at `api/v1/user/{handle}/public_profile` (`.subscriptions[]`, with `membership_state` = `subscribed`=paid / `free_signup`=free). The handle is auto-detected from the cookie via `api/v1/user/profile/self` (no need to ask the user for it; the optional handle field on /accounts is just a fallback). sync always merges the public-profile list (requires the member's reading list to be public). `SUBSTACK_EXTRA_PUBS` / tracked_publications still cover anything the profile misses.
  - Post bodies/audio are fetched via `substack.com/api/v1/posts/by-id/{id}` (the substack.com cookie applies cross-domain, so it returns FULL paid content + the full podcast_url for pubs the account actually pays for — unlike `{custom-domain}/api/v1/posts/{slug}`, which only previews).
  - "The Substack Post" (subdomain `post`) is Substack's auto-subscribed promo blog and is skipped (`SKIP_SUBDOMAINS`).
  - Paid detection: a post is paid if `audience == "only_paid"`; it's LOCKED (preview only) when body_html lacks Substack's paywall marker (`paywall-jump` / `paywalltodom` / `class="paywall`). When you CAN read a paid post, body_html includes that marker (you see past the wall); a no-access preview omits it entirely. (Length ratios are unreliable — some previews run several paragraphs.) Stored as `articles.is_paid` / `articles.is_locked`; UI shows green "paid" (full) or red "paid 🔒" (preview).
  - Content is deduped across members by post id. `article_sources(article_id, label)` records EVERY connected account that also has a post (shown as per-account badges). When an account that pays unlocks a post we previously stored as a locked preview, `upgrade_article_body` replaces the body + clears is_locked. Each member can also Track-by-URL pubs at /accounts (tracked_publications).
  - PODCAST-type posts: the full episode audio (podcast_url from posts/by-id) is downloaded to R2 and stored as an episode — the cookie path gets full paid audio even when the post TEXT is a locked preview. PODCAST_FEEDS (private per-subscriber RSS) still works too for non-cookie podcasts.
  - First sync per account is a silent backfill (no Discord spam); later syncs notify. Reset an account's `last_sync` to NULL to force a fresh silent backfill.
- Members' substack.sid cookies are stored in SQLite on the server. Accounts are connected in the UI at /accounts. Treat the droplet and DB backups as sensitive.
- Email ingest only processes UNSEEN messages from `IMAP_ALLOWED_SENDER_DOMAINS`. If testing with old mail, mark messages unread first.
- Deploys do a `git reset --hard origin/main` in `/opt/stackdock` — never store uncommitted changes or secrets in tracked files there. `.env` is untracked and survives deploys.
- SQLite + audio DB live in the `stackdock-data` Docker volume; `docker compose down -v` would destroy it. Audio itself is safe in R2.

- Content URLs are slugs: articles at `/read/{slug}`, episodes (in-browser player page) at `/listen/{slug}`. Slugs are generated at insert (db._unique_slug, collisions get -2/-3 suffixes) and backfilled for old rows on startup (db.init). Old `/article/{id}` and `/episode/{id}` URLs 301-redirect to the slug versions.
- Thumbnails: articles store Substack's `cover_image` URL; episodes store the RSS feed/episode image URL. Both are remote hotlinked URLs with a CSS fallback tile — nothing is downloaded or generated server-side.
- Aggregation model: every member's connected Substack account contributes all of its subscriptions; posts dedupe globally by `substack:{post_id}` (two members subscribed to the same blog never create duplicates). The index, the three /feed/<token>/ URLs, the Discord digest, and OUTBOUND_WEBHOOK_URL all operate on this single merged pool.
- Notifications are batched: ingesters collect new items and call notify.push_new_items once per run (one Discord embed + one outbound JSON POST), instead of one message per article.
- Discovery resilience (restored after the June 2026 tvOnly incident): get_publications tries SUBSCRIPTION_REQUESTS shapes in order (tvOnly=false first) and RAISES SubscriptionsApiError with Substack's verbatim error body instead of silently returning [] — a silent [] is what disguised the tvOnly 400 as "no subscriptions" for days. Fallback chain when it raises: (1) public profile endpoint substack.com/api/v1/user/{handle}/public_profile (no auth, same method as the substack-api PyPI library; needs the member's handle saved on the account and a visible reading list), (2) DB tracked publications (/accounts -> Track publications by URL, member-facing complement to the admin-only SUBSTACK_EXTRA_PUBS env var; owner's pubs sync with their cookie through the full by-id/podcast pipeline, pubs whose owner has no account sync anonymously with paid posts link-only).
- Debugging "connected a cookie but nothing pulls": run scripts/debug_substack.py ON THE DROPLET with the cookie in env var SUBSTACK_SID (never as a CLI arg, never pasted into chat); optional SUBSTACK_HANDLE tests profile discovery. It distinguishes expired cookie, Cloudflare IP challenge, wrong encoding, and changed request shapes (dumps 400 bodies verbatim — they name the missing param).
- If a member's cookie was ever exposed (pasted into a chat, committed, etc.), have them sign out of that Substack browser session to invalidate it, then reconnect a fresh cookie at /accounts.
