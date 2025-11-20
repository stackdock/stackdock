/**
 * Core monitoring functionality
 * 
 * This module provides the main API for error tracking and monitoring,
 * abstracting away the specific provider implementation.
 */

import type {
  MonitoringProvider,
  InitMonitoringOptions,
  User,
  Breadcrumb,
  ErrorContext,
  LogLevel,
} from './types'

let currentProvider: MonitoringProvider | null = null
let isEnabled = false

/**
 * Initialize monitoring with a provider
 * 
 * @example
 * ```ts
 * import { initMonitoring } from '@stackdock/monitoring'
 * import { SentryProvider } from '@stackdock/monitoring/providers/sentry'
 * 
 * initMonitoring({
 *   provider: new SentryProvider({ dsn: '...' }),
 *   enabled: true,
 * })
 * ```
 */
export async function initMonitoring(options: InitMonitoringOptions): Promise<void> {
  const { provider, enabled = true, config = {} } = options

  if (!enabled) {
    console.log(`[Monitoring] Disabled`)
    isEnabled = false
    return
  }

  try {
    await provider.init({ ...config, enabled })
    currentProvider = provider
    isEnabled = true
    console.log(`[Monitoring] Initialized with ${provider.name}`)
  } catch (error) {
    console.error(`[Monitoring] Failed to initialize ${provider.name}:`, error)
    isEnabled = false
  }
}

/**
 * Capture an error
 */
export function captureError(error: Error, context?: ErrorContext): void {
  if (!isEnabled || !currentProvider) return

  try {
    currentProvider.captureError(error, context)
  } catch (err) {
    console.error('[Monitoring] Error capturing error:', err)
  }
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: LogLevel = 'info'): void {
  if (!isEnabled || !currentProvider) return

  try {
    currentProvider.captureMessage(message, level)
  } catch (err) {
    console.error('[Monitoring] Error capturing message:', err)
  }
}

/**
 * Set the current user context
 */
export function setUser(user: User | null): void {
  if (!isEnabled || !currentProvider) return

  try {
    currentProvider.setUser(user)
  } catch (err) {
    console.error('[Monitoring] Error setting user:', err)
  }
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  if (!isEnabled || !currentProvider) return

  try {
    currentProvider.addBreadcrumb(breadcrumb)
  } catch (err) {
    console.error('[Monitoring] Error adding breadcrumb:', err)
  }
}

/**
 * Set custom context data
 */
export function setContext(key: string, context: Record<string, any> | null): void {
  if (!isEnabled || !currentProvider) return

  try {
    currentProvider.setContext(key, context)
  } catch (err) {
    console.error('[Monitoring] Error setting context:', err)
  }
}

/**
 * Set a tag for filtering
 */
export function setTag(key: string, value: string): void {
  if (!isEnabled || !currentProvider) return

  try {
    currentProvider.setTag(key, value)
  } catch (err) {
    console.error('[Monitoring] Error setting tag:', err)
  }
}

/**
 * Get the current provider
 */
export function getProvider(): MonitoringProvider | null {
  return currentProvider
}

/**
 * Check if monitoring is enabled
 */
export function isMonitoringEnabled(): boolean {
  return isEnabled && currentProvider !== null
}

/**
 * Close the monitoring provider and flush any pending data
 */
export async function closeMonitoring(): Promise<void> {
  if (!currentProvider) return

  try {
    await currentProvider.close?.()
    currentProvider = null
    isEnabled = false
    console.log('[Monitoring] Closed')
  } catch (err) {
    console.error('[Monitoring] Error closing:', err)
  }
}
