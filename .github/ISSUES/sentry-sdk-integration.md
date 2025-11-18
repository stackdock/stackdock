---
title: Integrate Sentry SDK for StackDock Error Tracking
labels: post-mvp,quality-review,enhancement,monitoring
priority: medium
category: monitoring
estimated-hours: 4-6
related-plan: docs/stand-downs/active/analysis-post-mvp.md
---

## Goal

Install and configure Sentry SDK to track StackDock's own errors, separate from the Sentry issues that StackDock displays from other applications.

## Current State

**Score**: 3/10

- ✅ Sentry API integration (excellent)
- ✅ Adapter implementation for issues
- ✅ Monitoring UI for Sentry issues
- ❌ No Sentry SDK installed
- ❌ StackDock's own errors NOT tracked
- ❌ No error boundaries with Sentry

## Current Architecture

StackDock uses Sentry as a **data source**:
- Reads Sentry issues from OTHER apps via API
- Displays issues in monitoring dashboard
- Does NOT track StackDock's own errors

## Implementation Steps

### 1. Install Sentry SDK
```bash
npm install @sentry/browser @sentry/node
```

### 2. Initialize Sentry
- Add `Sentry.init()` in app entry point
- Configure DSN and environment
- Set up error boundaries

### 3. Add Error Boundaries
- Wrap app with Sentry error boundary
- Add error boundaries to critical routes
- Configure error reporting

### 4. Add Performance Tracing
- Enable performance monitoring
- Add transaction tracking
- Monitor API calls and page loads

### 5. Configure Source Maps
- Set up source map upload
- Configure build process
- Enable source map debugging

## Files to Create/Update

- `apps/web/src/lib/sentry.ts` - Sentry initialization (new)
- `apps/web/src/routes/__root.tsx` - Add Sentry provider
- `apps/web/src/components/error-boundary.tsx` - Error boundary (new)
- `convex/lib/sentry.ts` - Server-side Sentry (new)
- `vite.config.ts` - Source map configuration
- `.env.example` - Add SENTRY_DSN

## Success Criteria

- [ ] Sentry SDK installed and configured
- [ ] Error tracking working for StackDock
- [ ] Error boundaries implemented
- [ ] Performance tracing enabled
- [ ] Source maps uploaded
- [ ] Separate from managed Sentry issues

## Related Documentation

See `docs/stand-downs/active/analysis-post-mvp.md` for full analysis.

## Note

This is **separate** from the Sentry adapter that reads issues from other apps. This tracks StackDock's own errors and performance.
