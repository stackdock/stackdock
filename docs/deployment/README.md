# Deployment Documentation

This directory contains deployment guides for StackDock applications and services.

## Available Guides

### [Cloudflare Pages](./cloudflare-pages.md)
Deploy the marketing site (`apps/marketing`) to Cloudflare Pages.

**Key Topics:**
- Wrangler configuration
- Manual deployment via CLI
- Disabling automatic builds
- GitHub Actions workflow (optional)
- Environment variables setup

## Quick Start

### Marketing Site → Cloudflare Pages

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Navigate to marketing site
cd apps/marketing

# Build
npm run build

# Deploy
npx wrangler pages deploy .next --project-name=stackdock-marketing
```

See [cloudflare-pages.md](./cloudflare-pages.md) for detailed instructions.

## Coming Soon

- **Documentation Site → Netlify**: Deploy Fumadocs-based documentation
- **Web App → Vercel/Convex**: Main application deployment
- **Workers Deployment**: API endpoints and edge functions

## Related Documentation

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions](https://docs.github.com/en/actions)
