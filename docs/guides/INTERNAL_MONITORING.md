# Internal Monitoring Guide

> **Track StackDock's own errors with flexible, plugin-based monitoring**

## Overview

StackDock has **two separate monitoring systems**:

1. **Internal Monitoring** (`@stackdock/monitoring` package) - Tracks StackDock's own errors
2. **External Monitoring** (Dock adapters) - Displays monitoring data from your applications

This guide covers **internal monitoring** only.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ StackDock Application                                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ @stackdock/monitoring (Internal Monitoring)             │  │
│  │ Purpose: Track StackDock's own errors & performance     │  │
│  │                                                          │  │
│  │  Provider Options:                                       │  │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐            │  │
│  │  │ Sentry  │  │ PostHog  │  │ New Relic  │  ...       │  │
│  │  └─────────┘  └──────────┘  └────────────┘            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ convex/docks/adapters/sentry/ (External Monitoring)     │  │
│  │ Purpose: Read Sentry issues from apps you manage       │  │
│  │                                                          │  │
│  │  Displays issues from:                                   │  │
│  │  - Your production apps                                  │  │
│  │  - Your staging apps                                     │  │
│  │  - Any connected Sentry projects                        │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Difference:**
- **Internal**: Tracks errors **in** StackDock itself
- **External**: Displays errors **from** apps managed by StackDock

## Quick Start

### 1. Choose Your Provider

Internal monitoring is **completely optional** and supports multiple providers:

- ✅ **Sentry** (built-in)
- 🚧 **PostHog** (coming soon)
- 🚧 **New Relic** (coming soon)
- 📦 **Custom** (implement `MonitoringProvider` interface)

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Enable internal monitoring
VITE_MONITORING_ENABLED=true
VITE_MONITORING_PROVIDER=sentry

# Sentry configuration
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_ENVIRONMENT=production

# Convex backend monitoring
MONITORING_ENABLED=true
SENTRY_DSN=https://...@sentry.io/...
```

### 3. That's It!

Monitoring is already integrated into:
- ✅ Web app (`apps/web/src/routes/__root.tsx`)
- ✅ Error boundaries (`MonitoringErrorBoundary`)
- ✅ Convex functions (`convex/lib/monitoring.ts`)

## Configuration Options

### Provider: Sentry

```typescript
// apps/web/src/lib/monitoring.ts
initMonitoring({
  provider: new SentryProvider({
    dsn: process.env.VITE_SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1, // 10% of transactions
  }),
  enabled: true,
})
```

### Provider: None (Disable)

```bash
# .env
VITE_MONITORING_ENABLED=false
VITE_MONITORING_PROVIDER=none
```

### Provider: Custom

```typescript
import type { MonitoringProvider } from '@stackdock/monitoring'

class MyProvider implements MonitoringProvider {
  readonly name = 'my-provider'
  
  async init(config: MonitoringConfig): Promise<void> {
    // Initialize your monitoring service
  }
  
  captureError(error: Error, context?: Record<string, any>): void {
    // Send error to your service
  }
  
  // ... implement other methods
}

// Use it
initMonitoring({
  provider: new MyProvider(),
  enabled: true,
})
```

## Usage Examples

### Capture Errors

```typescript
import { captureError } from '@stackdock/monitoring'

try {
  riskyOperation()
} catch (error) {
  captureError(error, { 
    component: 'UserOnboarding',
    userId: user.id 
  })
}
```

### Log Messages

```typescript
import { captureMessage } from '@stackdock/monitoring'

captureMessage('Payment processed successfully', 'info')
captureMessage('Rate limit approaching', 'warning')
```

### Set User Context

```typescript
import { setUser } from '@stackdock/monitoring'

// After user signs in
setUser({
  id: user.id,
  email: user.email,
  organization: user.org.name,
})

// After user signs out
setUser(null)
```

### Add Breadcrumbs

```typescript
import { addBreadcrumb } from '@stackdock/monitoring'

addBreadcrumb({
  message: 'User clicked provision button',
  category: 'user-action',
  level: 'info',
  data: { provider: 'cloudflare', resourceType: 'server' }
})
```

### Convex Functions

```typescript
// convex/lib/monitoring.ts
import { withMonitoring } from '../../lib/monitoring'

export const myMutation = mutation(
  withMonitoring(async (ctx, args) => {
    // Your code - errors are automatically captured
    const result = await riskyOperation()
    return result
  })
)
```

## Environment Variables Reference

### Web App (Client)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_MONITORING_ENABLED` | No | `false` | Enable/disable monitoring |
| `VITE_MONITORING_PROVIDER` | No | `none` | Provider: `sentry`, `posthog`, `newrelic`, `none` |
| `VITE_SENTRY_DSN` | If Sentry | - | Sentry Data Source Name |
| `VITE_ENVIRONMENT` | No | `development` | Environment name |
| `VITE_APP_VERSION` | No | - | App version for release tracking |

### Convex Backend (Server)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONITORING_ENABLED` | No | `false` | Enable/disable monitoring |
| `SENTRY_DSN` | If Sentry | - | Sentry Data Source Name |

## Provider Comparison

| Feature | Sentry | PostHog | New Relic | Custom |
|---------|--------|---------|-----------|--------|
| Error tracking | ✅ | 🚧 | 🚧 | 📝 |
| Performance tracing | ✅ | 🚧 | 🚧 | 📝 |
| User context | ✅ | 🚧 | 🚧 | 📝 |
| Breadcrumbs | ✅ | 🚧 | 🚧 | 📝 |
| React error boundaries | ✅ | 🚧 | 🚧 | 📝 |
| Source maps | ✅ | 🚧 | 🚧 | 📝 |
| Session replay | 🚧 | 🚧 | 🚧 | 📝 |

**Legend:**
- ✅ Implemented
- 🚧 Coming soon
- 📝 Implement yourself

## Separate Sentry Projects

If using Sentry for both internal and external monitoring:

```
Internal Monitoring (StackDock itself):
  DSN: https://abc@o123.sentry.io/456
  Project: stackdock-app
  
External Monitoring (Your apps):
  Dock adapter: convex/docks/adapters/sentry/
  Auth Token: sentryAuthToken_xyz
  Organization: your-org
  Projects: your-app-production, your-app-staging
```

**Important:** Use **different** Sentry projects for internal vs external monitoring to keep them separate.

## Troubleshooting

### Monitoring Not Working

1. Check environment variables:
   ```bash
   echo $VITE_MONITORING_ENABLED
   echo $VITE_MONITORING_PROVIDER
   echo $VITE_SENTRY_DSN
   ```

2. Check browser console:
   ```
   [Monitoring] Initialized with sentry
   ```

3. Check provider configuration:
   ```typescript
   import { isMonitoringEnabled } from '@stackdock/monitoring'
   console.log('Monitoring enabled:', isMonitoringEnabled())
   ```

### Build Errors

If you get build errors about Sentry:

1. Ensure you're using the correct Sentry package:
   - Web: `@sentry/react`
   - Convex: `@sentry/node`

2. Check that packages are installed:
   ```bash
   npm list @sentry/react @sentry/node
   ```

### No Errors in Sentry

1. Test error capture:
   ```typescript
   import { captureError } from '@stackdock/monitoring'
   captureError(new Error('Test error'))
   ```

2. Check Sentry project settings
3. Verify DSN is correct
4. Check network requests in DevTools

## FAQs

### Q: Do I need to use Sentry for internal monitoring?

**A:** No! You can use PostHog, New Relic, or any custom provider. You can also disable monitoring entirely.

### Q: Can I use a different provider for web vs Convex?

**A:** Yes! Configure them independently:
- Web: `apps/web/src/lib/monitoring.ts`
- Convex: `convex/lib/monitoring.ts`

### Q: Will this conflict with the Sentry dock adapter?

**A:** No! They are completely separate:
- **Internal monitoring**: Tracks StackDock's errors (this package)
- **Dock adapter**: Reads Sentry issues from external apps (different code)

### Q: How do I add PostHog support?

**A:** Implement `MonitoringProvider` interface:

```typescript
// packages/monitoring/src/providers/posthog.ts
export class PostHogProvider implements MonitoringProvider {
  // ... implement interface
}
```

Then use it:

```typescript
import { PostHogProvider } from '@stackdock/monitoring/providers/posthog'

initMonitoring({
  provider: new PostHogProvider({ apiKey: '...' }),
  enabled: true,
})
```

### Q: How do I filter sensitive data?

**A:** Use `beforeSend` callback:

```typescript
initMonitoring({
  provider: new SentryProvider({ dsn: '...' }),
  config: {
    beforeSend(event) {
      // Remove sensitive fields
      if (event.request?.headers) {
        delete event.request.headers.Authorization
        delete event.request.headers.Cookie
      }
      return event
    }
  }
})
```

## Related Documentation

- [Architecture Overview](../architecture/ARCHITECTURE.md)
- [Dock Adapters](../../packages/docks/README.md)
- [Environment Variables](./ENVIRONMENT.md)
- [Sentry Dock Adapter](../../convex/docks/adapters/sentry/)

---

**Remember:** This is for tracking StackDock's own errors. To display monitoring data from your applications, use dock adapters.
