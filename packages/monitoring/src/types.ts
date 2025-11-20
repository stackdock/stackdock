/**
 * Core types for the monitoring system
 */

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal'

export interface User {
  id: string
  email?: string
  username?: string
  [key: string]: any
}

export interface Breadcrumb {
  message: string
  category?: string
  level?: LogLevel
  data?: Record<string, any>
  timestamp?: number
}

export interface ErrorContext {
  [key: string]: any
}

export interface MonitoringConfig {
  enabled?: boolean
  environment?: string
  release?: string
  debug?: boolean
  beforeSend?: (event: any) => any | null
  beforeBreadcrumb?: (breadcrumb: Breadcrumb) => Breadcrumb | null
}

/**
 * Interface that all monitoring providers must implement
 * 
 * This allows StackDock to support multiple monitoring solutions
 * (Sentry, PostHog, New Relic, etc.) through a common interface.
 */
export interface MonitoringProvider {
  /**
   * Provider identifier (e.g., 'sentry', 'posthog', 'newrelic')
   */
  readonly name: string

  /**
   * Initialize the provider with configuration
   */
  init(config: MonitoringConfig): Promise<void> | void

  /**
   * Capture an error with optional context
   */
  captureError(error: Error, context?: ErrorContext): void

  /**
   * Capture a message with a specific level
   */
  captureMessage(message: string, level?: LogLevel): void

  /**
   * Set the current user context
   */
  setUser(user: User | null): void

  /**
   * Add a breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void

  /**
   * Set custom context data
   */
  setContext(key: string, context: Record<string, any> | null): void

  /**
   * Set a tag for filtering
   */
  setTag(key: string, value: string): void

  /**
   * Close the provider and flush any pending data
   */
  close?(): Promise<void> | void
}

/**
 * Configuration for initializing monitoring
 */
export interface InitMonitoringOptions {
  provider: MonitoringProvider
  enabled?: boolean
  config?: Omit<MonitoringConfig, 'enabled'>
}
