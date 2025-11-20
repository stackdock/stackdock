# @stackdock/monitoring

> **Modular internal monitoring and error tracking for StackDock**

This package provides a plugin-based system for tracking StackDock's own errors and performance, separate from the monitoring data StackDock displays from external applications.

## Philosophy

StackDock is built on flexibility - you own your infrastructure choices. This monitoring package follows the same principle:

- **Provider Agnostic**: Use Sentry, PostHog, New Relic, or any other monitoring provider
- **Plugin Architecture**: Providers are adapters that implement a common interface
- **Zero Lock-in**: Switch providers without changing your application code
- **Optional**: Monitoring is completely optional - run without it if you prefer

## Quick Start

### 1. Choose Your Provider

```typescript
import { initMonitoring } from '@stackdock/monitoring'
import { SentryProvider } from '@stackdock/monitoring/providers/sentry'

// Initialize with Sentry
initMonitoring({
  provider: new SentryProvider({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  }),
  enabled: true,
})
```

### 2. Add Error Boundary (React)

```tsx
import { MonitoringErrorBoundary } from '@stackdock/monitoring'

function App() {
  return (
    <MonitoringErrorBoundary fallback={<ErrorFallback />}>
      <YourApp />
    </MonitoringErrorBoundary>
  )
}
```

### 3. Capture Events

```typescript
import { captureError, captureMessage, setUser } from '@stackdock/monitoring'

// Capture errors
try {
  riskyOperation()
} catch (error) {
  captureError(error, { context: 'riskyOperation' })
}

// Log messages
captureMessage('User completed onboarding', 'info')

// Set user context
setUser({ id: user.id, email: user.email })
```

## Supported Providers

### Sentry (Built-in)

```bash
npm install @sentry/browser @sentry/react
```

```typescript
import { SentryProvider } from '@stackdock/monitoring/providers/sentry'

const provider = new SentryProvider({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

### PostHog (Planned)

```typescript
import { PostHogProvider } from '@stackdock/monitoring/providers/posthog'
```

### New Relic (Planned)

```typescript
import { NewRelicProvider } from '@stackdock/monitoring/providers/newrelic'
```

### Custom Provider

Implement the `MonitoringProvider` interface:

```typescript
import type { MonitoringProvider } from '@stackdock/monitoring'

class MyProvider implements MonitoringProvider {
  async init(config: MonitoringConfig): Promise<void> {
    // Initialize your provider
  }

  captureError(error: Error, context?: Record<string, any>): void {
    // Send error to your service
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void {
    // Send message to your service
  }

  setUser(user: { id: string; email?: string; [key: string]: any }): void {
    // Set user context
  }

  addBreadcrumb(breadcrumb: { message: string; category?: string; data?: any }): void {
    // Add breadcrumb
  }
}
```

## Architecture

This package is separate from StackDock's dock adapters that read monitoring data from external apps:

```
┌─────────────────────────────────────────────┐
│ StackDock Application                       │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ @stackdock/monitoring                 │ │
│  │ (tracks StackDock's own errors)       │ │
│  │                                       │ │
│  │  ┌─────────┐  ┌──────────┐          │ │
│  │  │ Sentry  │  │ PostHog  │  ...     │ │
│  │  │ Provider│  │ Provider │          │ │
│  │  └─────────┘  └──────────┘          │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ convex/docks/adapters/sentry/         │ │
│  │ (reads Sentry issues from other apps) │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# Enable/disable monitoring
VITE_MONITORING_ENABLED=true

# Provider configuration (example with Sentry)
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_SENTRY_ENVIRONMENT=production

# Server-side (Convex)
MONITORING_ENABLED=true
SENTRY_DSN=https://...@sentry.io/...
```

### Runtime Configuration

```typescript
initMonitoring({
  provider: new SentryProvider({ dsn: '...' }),
  enabled: process.env.NODE_ENV === 'production',
  beforeSend: (event) => {
    // Filter or modify events before sending
    return event
  },
})
```

## Features

- ✅ Error tracking
- ✅ Message logging
- ✅ User context
- ✅ Breadcrumbs
- ✅ React error boundaries
- ✅ Provider abstraction
- 🚧 Performance tracing (coming soon)
- 🚧 Session replay (coming soon)

## Related Documentation

- [Architecture Overview](../../docs/architecture/ARCHITECTURE.md)
- [Dock Adapters](../docks/README.md) - External monitoring data
- [Environment Variables](../../docs/guides/ENVIRONMENT.md)

---

**Remember**: This monitors StackDock itself. To display monitoring data from your applications, use dock adapters like `convex/docks/adapters/sentry/`.
