# Netlify Platform Integration

This document describes StackDock's integration with Netlify platform features.

## Overview

StackDock now leverages Netlify as a deployment platform in addition to using it as a data source. This integration includes:

- ✅ **Documentation Site** - Fumadocs app deployed on Netlify
- ✅ **Netlify Functions** - Serverless API endpoints
- ✅ **Edge Functions** - Global edge-side logic
- ✅ **Netlify Forms** - Contact form integration in marketing site
- ✅ **Deploy Previews** - Automated preview deployments
- ✅ **Deployment Configuration** - Complete netlify.toml configurations

## Architecture

### Applications

```
stackdock/
├── apps/
│   ├── docs/           # Documentation site (Fumadocs + Netlify)
│   ├── marketing/      # Marketing site (Next.js + Netlify Forms)
│   └── web/            # Main web app (TanStack Start + Convex)
├── netlify.toml        # Marketing site deployment config
└── docs/guides/        # Deployment guides
```

### Deployment Strategy

#### Documentation Site (apps/docs)

**Recommended: Subdomain Deployment**
- **URL:** `docs.stackdock.com`
- **Netlify Site:** Separate Netlify site
- **Base Directory:** `apps/docs`
- **Build Command:** `npm run build`
- **Publish Directory:** `.next`

**Alternative: Subfolder Deployment**
- **URL:** `stackdock.com/docs`
- **Method:** Proxy redirects from marketing site
- **Note:** More complex, not recommended

#### Marketing Site (apps/marketing)

- **URL:** `stackdock.com`
- **Netlify Site:** Main Netlify site
- **Build Command:** `npm run build:marketing`
- **Publish Directory:** `apps/marketing/.next`

## Netlify Features

### 1. Netlify Functions

Serverless functions located in `apps/docs/netlify/functions/`:

#### hello.ts
```typescript
// Endpoint: /.netlify/functions/hello
// Example: /.netlify/functions/hello?name=World
```

Simple greeting function demonstrating basic Netlify Functions usage.

#### api-status.ts
```typescript
// Endpoint: /.netlify/functions/api-status
```

Health check endpoint providing service status and uptime information.

**Usage:**
```bash
curl https://docs.stackdock.com/.netlify/functions/api-status
```

### 2. Netlify Edge Functions

Edge functions located in `apps/docs/netlify/edge-functions/`:

#### add-header.ts
```typescript
// Runs on all requests: /*
```

Adds custom headers to responses, including geographic information.

#### geo-location.ts
```typescript
// Endpoint: /api/geo
```

Returns geographic information about the request using Netlify's edge context.

**Usage:**
```bash
curl https://docs.stackdock.com/api/geo
```

### 3. Netlify Forms

Contact form component in marketing site at `apps/marketing/components/netlify-contact-form.tsx`.

**Features:**
- Automatic form detection via `data-netlify="true"`
- Spam protection with honeypot field
- Custom submission handling
- Email notifications (configure in Netlify UI)

**Integration:**
```tsx
import { NetlifyContactForm } from '@/components/netlify-contact-form';

// Use in any page
<NetlifyContactForm />
```

### 4. Deploy Previews

Automated deploy previews are configured for:
- Pull requests
- Branch deployments
- Manual deploys

**Preview URLs:**
- PR: `deploy-preview-{pr-number}--stackdock-docs.netlify.app`
- Branch: `{branch-name}--stackdock-docs.netlify.app`

## Configuration Files

### apps/docs/netlify.toml

Complete Netlify configuration for the documentation site:
- Build settings
- Environment variables
- Next.js plugin
- Security headers
- Cache control
- Functions configuration

### netlify.toml (root)

Configuration for the marketing site:
- Build settings for marketing app
- Security headers
- Static asset caching
- Optional proxy to docs subdomain

## Local Development

### Documentation Site

```bash
# Standard Next.js development
npm run dev:docs

# With Netlify Functions and Edge Functions
cd apps/docs
netlify dev
```

### Marketing Site

```bash
npm run dev:marketing
```

### All Apps

```bash
npm run dev:all
```

## Deployment Steps

### Initial Setup

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   netlify login
   ```

2. **Create Documentation Site:**
   ```bash
   netlify sites:create --name stackdock-docs
   ```

3. **Link Repository:**
   - Connect GitHub repository in Netlify UI
   - Configure build settings
   - Set environment variables

4. **Configure Custom Domain:**
   - Add `docs.stackdock.com` in Netlify domain settings
   - Update DNS with CNAME record

### Continuous Deployment

Once configured, deployments are automatic:
- Push to main branch → Production deployment
- Open pull request → Deploy preview
- Push to branch → Branch deployment

## Environment Variables

### Required

Set in Netlify site settings:

```env
NODE_VERSION=20
NPM_VERSION=10
```

### Optional

Add any custom variables needed:

```env
NEXT_PUBLIC_SITE_URL=https://docs.stackdock.com
```

## Monitoring

### Build Logs

View in Netlify UI:
1. Select deployment
2. View build logs
3. Check for errors or warnings

### Function Logs

Real-time function monitoring:
```bash
netlify functions:log
```

### Analytics

Enable in Netlify UI:
- Site Settings → Analytics
- View traffic, performance, form submissions

## Testing

### Local Testing

```bash
# Test functions locally
cd apps/docs
netlify dev

# Test specific function
curl http://localhost:8888/.netlify/functions/hello
```

### Production Testing

```bash
# Test deployed functions
curl https://docs.stackdock.com/.netlify/functions/api-status

# Test edge function
curl https://docs.stackdock.com/api/geo
```

## Documentation

Comprehensive guides available:
- [Netlify Deployment Guide](/docs/guides/netlify-deployment.md)
- [Docs App README](/apps/docs/README.md)
- [Docs Deployment Instructions](/apps/docs/DEPLOYMENT.md)

## Resources

### Netlify
- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Edge Functions](https://docs.netlify.com/edge-functions/overview/)
- [Netlify Forms](https://docs.netlify.com/forms/setup/)

### Fumadocs
- [Fumadocs Documentation](https://fumadocs.dev/)
- [Fumadocs Examples](https://github.com/fuma-nama/fumadocs/tree/main/examples)

### Next.js on Netlify
- [Next.js Plugin](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Deployment Guide](https://docs.netlify.com/integrations/frameworks/next-js/overview/)

## Success Criteria

- [x] Fumadocs app scaffolded in `apps/docs`
- [x] Netlify configuration files created
- [x] Netlify Functions examples implemented
- [x] Edge Functions examples implemented
- [x] Netlify Forms component created
- [x] Deploy preview configuration
- [x] Documentation completed
- [ ] Production deployment (requires Netlify account setup)
- [ ] Custom domain configuration (requires DNS access)
- [ ] Form notifications configured (requires Netlify UI access)

## Next Steps

1. **Set up Netlify Account:**
   - Create account or log in
   - Connect GitHub repository

2. **Deploy Documentation Site:**
   - Create new Netlify site for docs
   - Configure build settings
   - Set up custom domain

3. **Deploy Marketing Site:**
   - Create Netlify site for marketing
   - Configure build settings
   - Set up main domain

4. **Test Integration:**
   - Verify functions work
   - Test edge functions
   - Submit test form
   - Create test PR for deploy preview

5. **Configure Notifications:**
   - Set up form email notifications
   - Configure build notifications
   - Set up deploy hooks

## Support

For issues or questions:
- Check [documentation guides](/docs/guides/)
- Review [Netlify documentation](https://docs.netlify.com/)
- Open an issue in the repository
