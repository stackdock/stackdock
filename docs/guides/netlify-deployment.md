# Netlify Deployment Guide

This guide covers deploying StackDock components to Netlify, including the documentation site, marketing site, and platform features.

## Overview

StackDock integrates with Netlify in multiple ways:

1. **Documentation Site** (`apps/docs`) - Fumadocs-based documentation
2. **Marketing Site** (`apps/marketing`) - Next.js marketing site with Netlify Forms
3. **Netlify Functions** - Serverless API endpoints
4. **Edge Functions** - Global edge-side logic

## Architecture Decisions

### Subdomain vs Subfolder

We've chosen the **subdomain approach** for the documentation site:

- ✅ **Subdomain** (`docs.stackdock.com`) - **Recommended**
  - Simpler deployment configuration
  - Independent builds and deployments
  - Better performance (separate CDN)
  - Easier to maintain and update
  
- ❌ **Subfolder** (`stackdock.com/docs`)
  - Requires complex proxy/rewrite configuration
  - Single build pipeline
  - More difficult to maintain
  - Not recommended for this monorepo structure

## Deploying the Documentation Site

### Prerequisites

1. Netlify account
2. GitHub repository connected to Netlify
3. Custom domain configured (optional)

### Setup Steps

#### 1. Create New Netlify Site

```bash
# Using Netlify CLI
netlify sites:create --name stackdock-docs
```

Or via Netlify UI:
1. Go to https://app.netlify.com/start
2. Connect your GitHub repository
3. Choose the `stackdock/stackdock` repository

#### 2. Configure Build Settings

In Netlify site settings, configure:

**Build Settings:**
- Base directory: `apps/docs`
- Build command: `npm run build`
- Publish directory: `.next`

**Environment Variables:**
- `NODE_VERSION`: `20`
- `NPM_VERSION`: `10`

#### 3. Configure Custom Domain

1. Go to Domain settings in Netlify
2. Add custom domain: `docs.stackdock.com`
3. Configure DNS:
   ```
   docs.stackdock.com  CNAME  stackdock-docs.netlify.app
   ```

#### 4. Enable Deploy Previews

Netlify automatically creates deploy previews for pull requests:
- Preview URL: `deploy-preview-{pr-number}--stackdock-docs.netlify.app`
- Branch deploys: `{branch-name}--stackdock-docs.netlify.app`

### Configuration Files

The docs app includes a `netlify.toml` configuration:

```toml
[build]
  command = "npm run build"
  publish = ".next"
  base = "apps/docs"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "10"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## Deploying the Marketing Site

The marketing site can be deployed similarly:

**Build Settings:**
- Base directory: `.` (root)
- Build command: `npm run build:marketing`
- Publish directory: `apps/marketing/.next`

The root `netlify.toml` includes configuration for the marketing site.

## Netlify Functions

### Function Examples

The docs app includes example functions in `apps/docs/netlify/functions/`:

1. **hello.ts** - Basic hello world function
   - Endpoint: `/.netlify/functions/hello`
   - Query params: `?name=World`

2. **api-status.ts** - Health check endpoint
   - Endpoint: `/.netlify/functions/api-status`
   - Returns service status and uptime

### Testing Functions Locally

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run local development server
cd apps/docs
netlify dev
```

### Deploying Functions

Functions are automatically deployed when you push to Netlify. No additional configuration needed.

## Netlify Edge Functions

Edge Functions run at the CDN edge for improved performance.

### Edge Function Examples

Located in `apps/docs/netlify/edge-functions/`:

1. **add-header.ts** - Adds custom headers to all responses
2. **geo-location.ts** - Returns geographic information
   - Endpoint: `/api/geo`

### Testing Edge Functions Locally

```bash
cd apps/docs
netlify dev
```

Edge functions will run locally with mock geo data.

## Netlify Forms

The marketing site includes a contact form component that uses Netlify Forms.

### Form Component

Located at `apps/marketing/components/netlify-contact-form.tsx`

### How It Works

1. Add `data-netlify="true"` to form element
2. Include hidden field: `<input type="hidden" name="form-name" value="contact" />`
3. Netlify automatically detects and processes the form
4. Submissions appear in Netlify UI under Forms tab

### Form Notifications

Configure email notifications in Netlify:
1. Go to Site settings > Forms
2. Add form notifications
3. Configure email recipients

### Spam Protection

Forms include:
- Honeypot field (`netlify-honeypot="bot-field"`)
- reCAPTCHA (optional, configure in Netlify UI)

## Deploy Previews

Netlify automatically creates deploy previews for:
- Pull requests
- Branch deploys
- Manual deploys

### PR Integration

When you create a PR, Netlify will:
1. Build the site
2. Deploy to preview URL
3. Comment on PR with preview link
4. Update checks status

## Environment Variables

### Required Variables

Set these in Netlify site settings:

```
NODE_VERSION=20
NPM_VERSION=10
```

### Secret Variables

For API keys and secrets:
1. Never commit secrets to git
2. Add in Netlify UI under Site settings > Environment variables
3. Secrets are encrypted and only available during builds

### Context-Specific Variables

Set different values for different contexts:

```toml
[context.production.environment]
  API_URL = "https://api.stackdock.com"

[context.deploy-preview.environment]
  API_URL = "https://api-preview.stackdock.com"
```

## Monitoring and Logs

### View Logs

1. Go to Netlify site dashboard
2. Click on a deploy
3. View build logs and function logs

### Function Logs

Real-time function logs:
```bash
netlify functions:log
```

### Analytics

Enable Netlify Analytics:
1. Go to Site settings > Analytics
2. Enable Netlify Analytics
3. View traffic, performance, and form submissions

## Troubleshooting

### Build Failures

Common issues:

1. **Node version mismatch**
   - Set `NODE_VERSION` environment variable
   
2. **Missing dependencies**
   - Ensure `package.json` includes all dependencies
   - Run `npm install` locally to verify

3. **Build timeout**
   - Increase build timeout in site settings
   - Optimize build process

### Function Issues

1. **Function not found (404)**
   - Verify function is in `netlify/functions/` directory
   - Check function export format

2. **Function timeout**
   - Default timeout: 10 seconds (free tier)
   - Optimize function code
   - Use background functions for long tasks

### Form Issues

1. **Forms not appearing in Netlify UI**
   - Ensure `data-netlify="true"` attribute is present
   - Check form name matches hidden field

2. **Spam submissions**
   - Enable honeypot field
   - Enable reCAPTCHA in Netlify settings

## Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Netlify Edge Functions](https://docs.netlify.com/edge-functions/overview/)
- [Netlify Forms](https://docs.netlify.com/forms/setup/)
- [Fumadocs Documentation](https://fumadocs.dev/)

## Next Steps

1. Set up Netlify account and connect repository
2. Deploy docs site on subdomain
3. Configure custom domain
4. Test Netlify Functions and Edge Functions
5. Add contact form to marketing site
6. Configure form notifications
7. Monitor deployments and analytics
