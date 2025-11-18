# Deploying Marketing Site to Cloudflare Pages

This guide covers deploying the StackDock marketing site (`apps/marketing`) to Cloudflare Pages.

## Overview

The marketing site is a Next.js application configured for deployment to Cloudflare Pages. Automatic builds are **disabled by default** to prevent build failures during development.

## Prerequisites

- Cloudflare account
- `wrangler` CLI installed: `npm install -g wrangler`
- Authenticated with Cloudflare: `wrangler login`

## Configuration Files

- `apps/marketing/wrangler.toml` - Cloudflare Pages configuration
- `apps/marketing/next.config.mjs` - Next.js configuration
- `.github/workflows/deploy-cloudflare-pages.yml` - GitHub Actions workflow (optional)

## Disabling Automatic Builds

### Option 1: Disable in Cloudflare Dashboard

To prevent Cloudflare from automatically building on every push:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Select your **stackdock-marketing** project
4. Go to **Settings** → **Builds & deployments**
5. Scroll to **Build configuration**
6. Toggle **Automatic builds** to **OFF**
7. Click **Save**

This prevents Cloudflare from triggering builds automatically when you push to your repository.

### Option 2: Disable GitHub Integration

If you connected your GitHub repository to Cloudflare Pages:

1. Go to **Settings** → **Builds & deployments**
2. Under **Source**, click **Disconnect** next to your GitHub repository
3. This completely removes the GitHub integration

You can still deploy manually using Wrangler CLI (see below).

### Option 3: Disable GitHub Actions Workflow

The GitHub Actions workflow for Cloudflare Pages deployment is disabled by default:

```yaml
# .github/workflows/deploy-cloudflare-pages.yml
on:
  workflow_dispatch:  # Manual trigger only
  # push:            # Commented out - no automatic triggers
  #   branches:
  #     - main
```

To keep it disabled, do not uncomment the `push` trigger.

## Manual Deployment

### Using Wrangler CLI

Deploy from your local machine:

```bash
# Navigate to marketing site
cd apps/marketing

# Build the site
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy .next --project-name=stackdock-marketing
```

### Using GitHub Actions (Manual Trigger)

Trigger deployment from GitHub UI:

1. Go to repository **Actions** tab
2. Select **Deploy to Cloudflare Pages** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Project Setup (First Time)

### Create Pages Project

```bash
# Navigate to marketing site
cd apps/marketing

# Create a new Pages project
npx wrangler pages project create stackdock-marketing

# Follow the prompts:
# - Production branch: main
# - Build command: npm run build
# - Build output directory: .next
```

### Set Environment Variables

If your marketing site needs environment variables:

```bash
# Set a production environment variable
npx wrangler pages secret put MY_SECRET --project-name=stackdock-marketing

# Or set via dashboard:
# Dashboard → Workers & Pages → stackdock-marketing → Settings → Environment variables
```

## Build Configuration

The marketing site builds using Next.js:

```json
// apps/marketing/package.json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev -p 3001",
    "start": "next start -p 3001"
  }
}
```

Next.js outputs to `.next/` by default. Cloudflare Pages can deploy the `.next/` directory directly.

## Troubleshooting

### Build Fails with "Module not found"

Ensure all dependencies are installed:

```bash
cd apps/marketing
npm install
```

### Build Fails with "next: command not found"

The build command needs to run from the correct directory:

```bash
# In wrangler.toml, ensure:
[build]
command = "npm run build"
```

### Deployment Fails with "Invalid Pages project"

Create the project first:

```bash
npx wrangler pages project create stackdock-marketing
```

### Want to Re-enable Automatic Builds

Follow the steps in "Disabling Automatic Builds" but toggle **Automatic builds** to **ON**.

## Next Steps

- [ ] Deploy marketing site to Cloudflare Pages
- [ ] Configure custom domain
- [ ] Set up preview deployments for PRs
- [ ] Monitor build logs and performance

## Related

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
