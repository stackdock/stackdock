# Stackdock

A private, self-hosted mirror of your Substack subscriptions (across any number of accounts) and your Gumroad podcast purchases, shared as a dashboard with a small invite-only group. Articles get a clean reading site behind real user logins; audio is mirrored to cheap object storage and served back through a single private podcast RSS feed. New items are announced to a Discord channel.

**For a small private group sharing content it pays for. Keep it invite-only and never share links publicly.**

## Accounts & logins

- The first admin account is seeded from `BASIC_AUTH_USER`/`BASIC_AUTH_PASS` in `.env` on first boot.
- Admin → `/admin` → **Create invite link** → send the single-use link to a friend → they pick their own username/password at `/signup`.
- Everyone can change their password at `/account`.
- Forgotten password: admin → `/admin` → **Generate reset link** next to the user → DM them the one-time link (valid 1 hour).
- The `/admin` page also has buttons to trigger email/podcast/Gumroad syncs manually.

Deployment model: code lives on GitHub → every push to `main` triggers GitHub Actions → it SSHes into your DigitalOcean droplet, pulls the latest code, and rebuilds the Docker stack. Secrets (`.env`) live only on the droplet, never in the repo.

---

## Part 1 — Accounts & credentials (where everything is in each UI)

> ⚠️ Tokens, cookies, and keys go straight into the `.env` file on your server or into GitHub Secrets. Never commit them, and never paste them into chats or issues.

### A. DigitalOcean droplet
1. Sign in at cloud.digitalocean.com.
2. Top-right green **Create** button → **Droplets**.
3. Choose a region near you → **Ubuntu 24.04 LTS** → Droplet Type: **Basic** → CPU options: **Regular / 1 GB ($6/mo)** is plenty.
4. Under **Choose Authentication Method** pick **SSH Key** → **New SSH Key**. On your computer run `ssh-keygen -t ed25519 -f ~/.ssh/stackdock` and paste the contents of `stackdock.pub` (the public key) into the box.
5. Create the droplet and note its **IPv4 address** (shown on the droplet's page).

### B. Domain
At your DNS provider, create an **A record** pointing your domain (e.g. `stack.example.com`) at the droplet's IP. If your domain is on Cloudflare: dashboard → your domain → **DNS** → **Add record** → Type A, name `stack`, the droplet IP. Set the proxy cloud to **DNS only (grey)** so Caddy can issue its own certificate.

### C. Cloudflare R2 (storage)
1. dash.cloudflare.com → left sidebar **R2 Object Storage** → **Create bucket** → name it `stackdock`.
2. Back on the R2 overview page → right side **Manage R2 API Tokens** → **Create API token** → Permissions: **Object Read & Write** → scope it to the `stackdock` bucket → Create.
3. Copy the **Access Key ID** and **Secret Access Key** (shown once) → these are `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`.
4. Your endpoint is `https://<account_id>.r2.cloudflarestorage.com` — the account ID is shown on the same token page and on the bucket's **Settings** tab.

### D. Substack accounts (primary article source — in-app, no env needed)
After deploy, each member logs in → **Accounts** page → pastes the value of their `substack.sid` cookie (substack.com logged in → F12 → **Application**/Storage → Cookies → `https://substack.com` → copy the **Value** of `substack.sid`). The app pulls each account's subscription list and backfills up to `SUBSTACK_BACKFILL_POSTS` past posts per publication (first sync is silent; new posts after that go to Discord). Articles show who contributed them, and the home page filters by publication. Cookies are stored in the server's database — only connect accounts on a server run by someone you trust.

### D2. Collector inbox (optional fallback — Substack articles via email)
1. Make a fresh Gmail account. In each Substack account: substack.com → click your avatar (top right) → **Settings** → **Account** → change the email to the collector address — or instead add a forwarding rule from each existing inbox (Gmail: ⚙️ → **See all settings** → **Forwarding and POP/IMAP**).
2. In the collector Gmail: enable 2-Step Verification (myaccount.google.com → **Security**), then in the Security page search box type **App passwords** → create one named `stackdock`. The 16-character code is `IMAP_PASS`.

### E. Substack private podcast feeds
While logged in as a paying subscriber, open the publication's podcast tab → look for **"Add to podcast app"** / private feed link → copy the RSS URL into `PODCAST_FEEDS`.

### F. Gumroad (in-app, no env needed)
- Preferred: open the product from **Library** → if the content page shows an RSS / "listen in your podcast app" link, put that URL in `PODCAST_FEEDS` and you're done.
- Otherwise each member connects their own Gumroad account on the **Accounts** page after deploy: logged into gumroad.com → **F12** → **Application** tab → **Storage → Cookies → https://app.gumroad.com** → copy the **Value** of `_gumroad_app_session` and paste it into the Connect Gumroad form. (Firefox: F12 → **Storage** tab.) Purchased audio backfills silently on first sync, then new files notify Discord. Cookies last weeks–months; reconnect when the account status says it's invalid.

### G. Discord webhook
In your server: click the server name (top left) → **Server Settings** → **Integrations** → **Webhooks** → **New Webhook** → set the channel → **Copy Webhook URL** → that's `DISCORD_WEBHOOK_URL`.

---

## Part 2 — One-time server setup

SSH in and prepare the droplet:

```bash
ssh -i ~/.ssh/stackdock root@YOUR_DROPLET_IP

# install docker
curl -fsSL https://get.docker.com | sh

# clone your repo (after you've pushed this code to GitHub — see Part 3)
git clone https://github.com/YOURNAME/stackdock.git /opt/stackdock
cd /opt/stackdock

# secrets live only here
cp .env.example .env
nano .env                      # fill everything in (Part 1 credentials)
openssl rand -hex 24           # paste output as FEED_TOKEN in .env
openssl rand -hex 32           # paste output as SECRET_KEY in .env
nano Caddyfile                 # replace example.com with your domain

docker compose up -d --build
```

Visit `https://yourdomain.com` — Caddy provisions HTTPS automatically (give DNS a few minutes). Log in with your `BASIC_AUTH_USER`/`PASS`.

> If your repo is **private**, the droplet needs read access to pull: GitHub → repo → **Settings** → **Deploy keys** → **Add deploy key** → paste a public key generated on the droplet (`ssh-keygen -t ed25519` there, read-only is fine).

---

## Part 3 — GitHub repo + Actions auto-deploy

1. Create a repo: github.com → **+** (top right) → **New repository** → name `stackdock` → **Private**.
2. Push this code:
   ```bash
   cd stackdock
   git init && git add . && git commit -m "initial"
   git branch -M main
   git remote add origin git@github.com:YOURNAME/stackdock.git
   git push -u origin main
   ```
3. Add the three deploy secrets: repo page → **Settings** tab → left sidebar **Secrets and variables → Actions** → **New repository secret**, three times:

   | Secret name | Value |
   |---|---|
   | `DROPLET_HOST` | the droplet's IP address |
   | `DROPLET_USER` | `root` (or your sudo user) |
   | `DROPLET_SSH_KEY` | the **private** key — entire contents of `~/.ssh/stackdock` (the file *without* `.pub`), including the BEGIN/END lines |

4. Done. Every push to `main` now redeploys. You can also deploy manually: repo → **Actions** tab → **Deploy to DigitalOcean** → **Run workflow**. Each run ends with a health check and prints container logs if it fails.

What the workflow does (`.github/workflows/deploy.yml`): SSH to the droplet → `git reset --hard origin/main` in `/opt/stackdock` → `docker compose up -d --build` → health check. Your `.env` on the droplet is untouched by deploys.

---

## Part 4 — Using it

| What | Where |
|---|---|
| Reading site | `https://yourdomain.com/` (login) |
| Invite a friend / reset a password / manual sync | `https://yourdomain.com/admin` (admin only) |
| Podcast feed (everything) | `https://yourdomain.com/feed/<FEED_TOKEN>/all.xml` — paste into any podcast app |
| Single show feed | `https://yourdomain.com/feed/<FEED_TOKEN>/show.xml?name=<feed name>` |
| Discord | new articles/episodes post automatically with links |

Schedules: email every 10 min, podcast feeds every 30 min, Gumroad every 6 h (all tunable in `.env`).

## Monitoring

- **In-app:** `/status` (logged in) shows uptime, object-storage reachability, disk usage, library counts, every sync job's last result and next run, and each connected account's cookie health.
- **External (Uptime Kuma, open source):** ships in `docker-compose.yml`. Add a DNS A record for `status.yourdomain.com` → droplet IP, set the subdomain in `Caddyfile`, then visit it once to create the Kuma admin account. Add a monitor: type **HTTP(s)**, URL `https://yourdomain.com/healthz`, interval 60s. Then **Settings → Notifications → Discord** and paste the same webhook URL — you'll get pinged if the whole site goes down, which the app itself can't tell you. Kuma also gives you a shareable status page if you want one (keep it private or password-protect it).

## Maintenance

- **Gumroad parser**: best-effort HTML scraping; if Gumroad redesigns, see the docstring in `app/ingest/gumroad.py` for the one-line fix. Prefer RSS wherever a creator offers it.
- **Backups**: `docker compose cp stackdock:/data/stackdock.db ./backup.db` (the audio itself is already safe in R2).
- **Logs**: `docker compose logs -f stackdock`
- **Cost**: ~$6/mo droplet + ~$1.50/mo per 100 GB in R2 (egress free).
