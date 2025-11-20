# Monitoring Architecture

> **Understanding StackDock's Dual Monitoring System**

## Overview

StackDock has **two separate, independent monitoring systems**:

### 1. Internal Monitoring (`@stackdock/monitoring`)

**Purpose:** Track StackDock's own errors and performance

**Location:** `packages/monitoring/`

**Usage:**
- Monitors the StackDock application itself
- Captures errors in StackDock's code
- Tracks StackDock's performance metrics
- Completely optional and provider-agnostic

**Architecture:**
```typescript
// Provider interface - any monitoring service can implement this
interface MonitoringProvider {
  init(config: MonitoringConfig): Promise<void>
  captureError(error: Error, context?: ErrorContext): void
  captureMessage(message: string, level?: LogLevel): void
  setUser(user: User | null): void
  addBreadcrumb(breadcrumb: Breadcrumb): void
  setContext(key: string, context: Record<string, any> | null): void
  setTag(key: string, value: string): void
  close?(): Promise<void>
}
```

**Built-in Providers:**
- ✅ Sentry (`SentryProvider`, `SentryNodeProvider`)
- ✅ No-op (`NoOpProvider`)
- 🚧 PostHog (coming soon)
- 🚧 New Relic (coming soon)

**Integration Points:**
- Web app: `apps/web/src/routes/__root.tsx` (with error boundary)
- Convex: `convex/lib/monitoring.ts` (with function wrapper)

### 2. External Monitoring (Dock Adapters)

**Purpose:** Display monitoring data from applications managed by StackDock

**Location:** `convex/docks/adapters/*/`

**Usage:**
- Reads monitoring data from external services
- Displays issues/errors from apps you manage
- Part of StackDock's multi-provider dashboard
- Uses dock adapter pattern

**Example:**
```typescript
// Sentry dock adapter - reads issues from external Sentry projects
// convex/docks/adapters/sentry/adapter.ts
export const SentryDockAdapter: DockAdapter = {
  provider: "sentry",
  validateCredentials: async (apiKey: string) => { ... },
  syncIssues: async (ctx, dock) => { 
    // Fetch issues from Sentry API
    // Store in StackDock's issues table
  }
}
```

## Key Differences

| Aspect | Internal Monitoring | External Monitoring |
|--------|-------------------|-------------------|
| **Purpose** | Track StackDock's errors | Display errors from managed apps |
| **Location** | `packages/monitoring/` | `convex/docks/adapters/` |
| **Data Flow** | StackDock → Monitoring Service | External Apps → StackDock |
| **Configuration** | Environment variables | Dock connections |
| **Optional?** | Yes, completely optional | Yes, per dock |
| **Providers** | Any (Sentry, PostHog, etc.) | Each has own adapter |

## Example: Using Both with Sentry

You can use Sentry for both internal and external monitoring with separate projects:

```
┌──────────────────────────────────────────────────────────┐
│ Sentry Organization: my-company                          │
│                                                          │
│  Project 1: stackdock-internal                           │
│  ├─ DSN: https://abc@sentry.io/123                      │
│  └─ Purpose: Track StackDock's own errors               │
│                                                          │
│  Project 2: my-app-production                            │
│  ├─ Connected via: Dock adapter                         │
│  ├─ Auth: sentryAuthToken_xyz                           │
│  └─ Purpose: Display issues from my production app      │
│                                                          │
│  Project 3: my-app-staging                               │
│  ├─ Connected via: Dock adapter                         │
│  ├─ Auth: sentryAuthToken_xyz                           │
│  └─ Purpose: Display issues from my staging app         │
└──────────────────────────────────────────────────────────┘
```

**Configuration:**

```bash
# Internal Monitoring (StackDock itself)
VITE_MONITORING_ENABLED=true
VITE_MONITORING_PROVIDER=sentry
VITE_SENTRY_DSN=https://abc@sentry.io/123

# External Monitoring (Your apps)
# Configured in UI when adding a Sentry dock
# Uses: sentryAuthToken, organization, projects[]
```

## Data Flow Diagrams

### Internal Monitoring Flow

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ StackDock   │─────▶│ @stackdock/      │─────▶│ Sentry          │
│ Application │      │ monitoring       │      │ (your project)  │
│             │      │                  │      │                 │
│ - Web App   │      │ - captureError() │      │ - stackdock-    │
│ - Convex    │      │ - captureMessage│      │   internal      │
│             │      │ - setUser()      │      │                 │
└─────────────┘      └──────────────────┘      └─────────────────┘
```

### External Monitoring Flow

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ Your App    │─────▶│ Sentry           │      │ StackDock       │
│             │      │ (your project)   │      │                 │
│ - Production│      │ - my-app-prod    │◀────▶│ - Dock Adapter  │
│ - Staging   │      │ - my-app-staging │      │ - Dashboard     │
│             │      │                  │      │ - Issues Table  │
└─────────────┘      └──────────────────┘      └─────────────────┘
```

## Migration Guide

### Before (No Internal Monitoring)

```typescript
// StackDock had no way to track its own errors
function riskyOperation() {
  try {
    // code
  } catch (error) {
    console.error(error) // Just logged to console
  }
}
```

### After (With Internal Monitoring)

```typescript
import { captureError } from '@stackdock/monitoring'

function riskyOperation() {
  try {
    // code
  } catch (error) {
    captureError(error, { operation: 'riskyOperation' })
  }
}
```

## Best Practices

### 1. Use Different Projects

**✅ Recommended:**
```
Internal: stackdock-internal (DSN)
External: your-app-* (Auth Token)
```

**❌ Not Recommended:**
```
Internal: stackdock-internal (DSN)
External: stackdock-internal (Auth Token)
```

### 2. Filter Sensitive Data

```typescript
// apps/web/src/lib/monitoring.ts
initMonitoring({
  provider: new SentryProvider({
    dsn: '...',
    beforeSend: (event) => {
      // Remove API keys, tokens, etc.
      if (event.extra?.apiKey) {
        delete event.extra.apiKey
      }
      return event
    }
  })
})
```

### 3. Disable in Development

```bash
# .env.development
VITE_MONITORING_ENABLED=false

# .env.production
VITE_MONITORING_ENABLED=true
```

### 4. Use Error Boundaries

```tsx
// Already integrated in __root.tsx
<MonitoringErrorBoundary>
  <YourApp />
</MonitoringErrorBoundary>
```

## Testing

### Test Internal Monitoring

```typescript
import { captureError, isMonitoringEnabled } from '@stackdock/monitoring'

// Check if enabled
console.log('Monitoring:', isMonitoringEnabled())

// Test error capture
captureError(new Error('Test error'), { test: true })
```

### Test External Monitoring

1. Add a Sentry dock in the UI
2. Sync the dock
3. Check the Issues page for data

## FAQs

### Q: Why two systems?

**A:** Different purposes:
- **Internal**: "Is StackDock working?"
- **External**: "Are my apps working?"

### Q: Can I use different providers?

**A:** Yes!
- **Internal**: Choose Sentry, PostHog, New Relic, or custom
- **External**: Use any dock adapter (Sentry, Betterstack, etc.)

### Q: Do I need both?

**A:** No! Both are optional:
- Internal monitoring can be disabled
- External monitoring is per-dock

### Q: Will this increase costs?

**A:** Only if you enable internal monitoring. External monitoring reads data you already have in other services.

## Related Documentation

- [Internal Monitoring Guide](./INTERNAL_MONITORING.md)
- [Dock Adapters](../../packages/docks/README.md)
- [Environment Variables](./ENVIRONMENT.md)

---

**Key Takeaway:** Internal monitoring (new) and external monitoring (existing) are completely separate systems with different purposes.
