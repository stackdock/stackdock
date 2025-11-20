/**
 * @stackdock/monitoring
 * 
 * Modular internal monitoring and error tracking for StackDock.
 * 
 * This package provides a plugin-based system for tracking StackDock's own
 * errors and performance, separate from the monitoring data StackDock displays
 * from external applications.
 * 
 * @example
 * ```ts
 * import { initMonitoring } from '@stackdock/monitoring'
 * import { SentryProvider } from '@stackdock/monitoring/providers/sentry'
 * 
 * // Initialize monitoring
 * initMonitoring({
 *   provider: new SentryProvider({ dsn: '...' }),
 *   enabled: true,
 * })
 * 
 * // Use monitoring
 * import { captureError, setUser } from '@stackdock/monitoring'
 * 
 * captureError(new Error('Something went wrong'))
 * setUser({ id: '123', email: 'user@example.com' })
 * ```
 */

// Core functionality
export {
  initMonitoring,
  captureError,
  captureMessage,
  setUser,
  addBreadcrumb,
  setContext,
  setTag,
  getProvider,
  isMonitoringEnabled,
  closeMonitoring,
} from './core'

// Types
export type {
  MonitoringProvider,
  InitMonitoringOptions,
  MonitoringConfig,
  User,
  Breadcrumb,
  ErrorContext,
  LogLevel,
} from './types'

// React components (optional, only imported if needed)
export { MonitoringErrorBoundary } from './react'

// Providers
export { SentryProvider } from './providers/sentry'
export { NoOpProvider } from './providers/noop'

export type { SentryProviderConfig } from './providers/sentry'
