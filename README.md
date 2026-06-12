# Stackdock

A small self-hosted, multi-user content service. It ingests articles and audio
from configured feeds/sources into one private reading site plus a set of
token-protected RSS feeds, stores media in S3-compatible object storage, and
posts new-item notifications to a webhook. It runs as a Docker stack behind
Caddy (automatic HTTPS) and deploys from GitHub via Actions.

## Stack

- **App:** FastAPI (Python), server-rendered HTML, APScheduler for periodic jobs.
- **Auth:** session cookies (itsdangerous), bcrypt passwords, invite-only signup,
  admin-generated one-time reset links. First admin seeded from env on first boot.
- **Data:** SQLite for metadata (`$DATA_DIR/stackdock.db`); S3-compatible object
  storage (e.g. Cloudflare R2) for audio. RSS output: `all.xml` (audio),
  `articles.xml` (full-text), `everything.xml` (merged) — each behind a feed token.
- **Edge:** Caddy reverse proxy with auto-HTTPS.
- **Notify:** one digest per sync to a Discord webhook; optional generic outbound
  JSON webhook (`OUTBOUND_WEBHOOK_URL`).
- **Deploy:** push to `main` → GitHub Actions → SSH to host → `docker compose up`.
  Secrets live in `.env` on the host, never in the repo.

## Configuration (`.env`)

Copy `.env.example` to `.env` and fill it in. Key variables:

| Var | Purpose |
|---|---|
| `PUBLIC_BASE_URL` | Public URL of the app |
| `SECRET_KEY` | Signs session cookies (`openssl rand -hex 32`) |
| `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` | Seeds the first admin on an empty DB |
| `FEED_TOKEN` | Protects the RSS feed URLs (`openssl rand -hex 24`) |
| `S3_ENDPOINT_URL` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_BUCKET` | Object storage |
| `DISCORD_WEBHOOK_URL` | New-item notifications (optional) |
| `*_POLL_MINUTES` | Per-job scheduler intervals |
| `CLOUDFLARE_*` / `DO_*` | Optional read-only tokens for the `/status` metrics panels |

Secrets go only into `.env` on the server (or GitHub Actions secrets). Never
commit them or paste them into issues/chats.

## Infrastructure

- **Host:** any Linux box with Docker (e.g. a $6/mo VPS, 1 GB RAM is enough).
- **DNS:** an A record for your domain → host IP (DNS-only, not proxied, so Caddy
  can issue its certificate). Optional A record for `status.<domain>` if you use
  the bundled Uptime Kuma.
- **Object storage:** an S3-compatible bucket + a read/write API token scoped to it.

## One-time server setup

```bash
ssh root@YOUR_HOST_IP
curl -fsSL https://get.docker.com | sh
git clone <your-repo> /opt/stackdock && cd /opt/stackdock
cp .env.example .env && nano .env        # fill in config
nano Caddyfile                           # set your domain
docker compose up -d --build
```

Visit `https://yourdomain.com` (Caddy provisions HTTPS automatically) and log in
with the seeded admin credentials. If the repo is private, add a read-only deploy
key on the host so it can pull.

## Auto-deploy (GitHub Actions)

Add three repository secrets under **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `DROPLET_HOST` | host IP |
| `DROPLET_USER` | `root` (or a sudo user) |
| `DROPLET_SSH_KEY` | the **private** SSH key for that user |

Every push to `main` then runs the test suite and, on green, SSHes to the host,
`git reset --hard origin/main`, rebuilds the compose stack, and health-checks it.
`.env` on the host is untouched by deploys. You can also run it manually from the
**Actions** tab.

## Usage

| What | Where |
|---|---|
| Reading site | `https://yourdomain.com/` (login) |
| Admin (invites, password resets, manual syncs) | `/admin` |
| Account settings | `/account` |
| Status / health | `/status` (logged in), `/healthz` (public JSON) |
| RSS feeds | `/feed/<FEED_TOKEN>/all.xml`, `/articles.xml`, `/everything.xml` |

- Admins create single-use invite links at `/admin`; invitees set their own
  credentials at `/signup`. Password resets are one-time admin-generated links.
- The listing supports search, newest/oldest sort, per-publication/show filters,
  and hiding items.
- Scheduler intervals are configured per job in `.env`.

## Monitoring

- **In-app:** `/status` shows uptime, object-storage reachability, disk usage,
  per-job last result + next run, and (with optional Cloudflare/DigitalOcean
  read-only tokens) storage and host metrics.
- **External:** an Uptime Kuma container ships in `docker-compose.yml`. Point a
  DNS A record for `status.<domain>` at the host, set it in `Caddyfile`, then add
  an HTTP monitor against `/healthz` and wire a Discord notification.

## Maintenance

- **Backup:** `docker compose cp stackdock:/data/stackdock.db ./backup.db`
  (media already lives in object storage).
- **Logs:** `docker compose logs -f stackdock`
- **Cost:** ~$6/mo host + a few cents/GB of object storage (egress free on R2).
