# Stackdock

A private, self-hosted mirror of your Substack subscriptions (across any number of accounts) and your Gumroad podcast purchases. Articles get a clean password-protected reading site; audio is mirrored to cheap object storage and served back through a single private podcast RSS feed. New items are announced to a Discord channel.

**For personal use of content you pay for. Keep the site password and feed token private — don't share links publicly.**

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

### D. Collector inbox (Substack articles)
1. Make a fresh Gmail account. In each Substack account: substack.com → click your avatar (top right) → **Settings** → **Account** → change the email to the collector address — or instead add a forwarding rule from each existing inbox (Gmail: ⚙️ → **See all settings** → **Forwarding and POP/IMAP**).
2. In the collector Gmail: enable 2-Step Verification (myaccount.google.com → **Security**), then in the Security page search box type **App passwords** → create one named `stackdock`. The 16-character code is `IMAP_PASS`.

### E. Substack private podcast feeds
While logged in as a paying subscriber, open the publication's podcast tab → look for **"Add to podcast app"** / private feed link → copy the RSS URL into `PODCAST_FEEDS`.

### F. Gumroad
- Preferred: open the product from **Library** → if the content page shows an RSS / "listen in your podcast app" link, put that URL in `PODCAST_FEEDS` and you're done.
- Fallback (cookie): logged into gumroad.com in Chrome → press **F12** → **Application** tab → left sidebar **Storage → Cookies → https://app.gumroad.com** → find the row named `_gumroad_app_session` → copy its **Value** column into `GUMROAD_SESSION_COOKIE`. (Firefox: F12 → **Storage** tab → Cookies.) Cookies last weeks–months; refresh when logs complain.

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
| Reading site | `https://yourdomain.com/` (basic auth) |
| Podcast feed (everything) | `https://yourdomain.com/feed/<FEED_TOKEN>/all.xml` — paste into any podcast app |
| Single show feed | `https://yourdomain.com/feed/<FEED_TOKEN>/show.xml?name=<feed name>` |
| Manual sync | `curl -u user:pass -X POST https://yourdomain.com/admin/sync/email` (also `/podcasts`, `/gumroad`) |
| Discord | new articles/episodes post automatically with links |

Schedules: email every 10 min, podcast feeds every 30 min, Gumroad every 6 h (all tunable in `.env`).

## Maintenance

- **Gumroad parser**: best-effort HTML scraping; if Gumroad redesigns, see the docstring in `app/ingest/gumroad.py` for the one-line fix. Prefer RSS wherever a creator offers it.
- **Backups**: `docker compose cp stackdock:/data/stackdock.db ./backup.db` (the audio itself is already safe in R2).
- **Logs**: `docker compose logs -f stackdock`
- **Cost**: ~$6/mo droplet + ~$1.50/mo per 100 GB in R2 (egress free).
