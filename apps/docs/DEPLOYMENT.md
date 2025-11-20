# Deployment Instructions

## Quick Start

This Fumadocs application is configured for deployment on Netlify.

### Option 1: Subdomain Deployment (Recommended)

Deploy on `docs.stackdock.com`:

1. **Create Netlify Site:**
   ```bash
   netlify sites:create --name stackdock-docs
   ```

2. **Configure in Netlify UI:**
   - Base directory: `apps/docs`
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `20`

3. **Set Custom Domain:**
   - Add custom domain: `docs.stackdock.com`
   - Configure DNS CNAME to point to Netlify

### Option 2: Subfolder Deployment

To deploy at `stackdock.com/docs` (more complex):

1. Deploy marketing site as main site
2. Add proxy redirects in root `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/docs/*"
     to = "https://docs.stackdock.com/:splat"
     status = 200
     force = true
   ```

**Recommendation:** Use subdomain approach for simpler configuration.

## Features Included

### Netlify Functions
- `netlify/functions/hello.ts` - Example serverless function
- `netlify/functions/api-status.ts` - Health check endpoint

### Netlify Edge Functions
- `netlify/edge-functions/add-header.ts` - Custom header injection
- `netlify/edge-functions/geo-location.ts` - Geographic information

### Configuration
- `netlify.toml` - Build and deployment settings
- Security headers configured
- Static asset caching optimized
- Deploy preview support

## Local Development

```bash
# From repository root
npm run dev:docs

# Or from apps/docs
npm run dev
```

Open http://localhost:3002

## Testing with Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run development server with Functions
cd apps/docs
netlify dev
```

This will:
- Start Next.js dev server
- Enable Netlify Functions at `/.netlify/functions/*`
- Enable Edge Functions

## Build Issues

### Google Fonts in Restricted Environments

If you encounter font loading errors in CI/CD:
- This is due to network restrictions
- Build will work fine in Netlify's environment
- Fonts are properly configured for production

### Dependencies

Ensure all dependencies are installed:
```bash
npm install
```

## Environment Variables

Set in Netlify UI:
- `NODE_VERSION`: `20`
- `NPM_VERSION`: `10`

Add any custom environment variables needed for your functions.

## Resources

- [Full Deployment Guide](/docs/guides/netlify-deployment.md)
- [Netlify Documentation](https://docs.netlify.com/)
- [Fumadocs Documentation](https://fumadocs.dev/)
