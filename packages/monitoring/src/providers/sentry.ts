/**
 * Sentry monitoring provider for browser/React environments
 * 
 * Implements the MonitoringProvider interface for Sentry.
 * Uses @sentry/react for browser environments.
 */

import type {
  MonitoringProvider,
  MonitoringConfig,
  User,
  Breadcrumb,
  ErrorContext,
  LogLevel,
} from '../types'

// Dynamic imports to support optional dependency
type SentryBrowser = typeof import('@sentry/react')

export interface SentryProviderConfig {
  dsn: string
  environment?: string
  release?: string
  tracesSampleRate?: number
  debug?: boolean
  integrations?: any[]
  beforeSend?: (event: any) => any | null
  beforeBreadcrumb?: (breadcrumb: any) => any | null
}

export class SentryProvider implements MonitoringProvider {
  readonly name = 'sentry'
  private sentry: SentryBrowser | null = null
  private config: SentryProviderConfig

  constructor(config: SentryProviderConfig) {
    this.config = config
  }

  async init(monitoringConfig: MonitoringConfig): Promise<void> {
    try {
      // Use @sentry/react for browser environments
      this.sentry = await import('@sentry/react')

      if (!this.sentry) {
        throw new Error('Sentry SDK not found. Install @sentry/react or @sentry/browser')
      }

      this.sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment || monitoringConfig.environment || 'development',
        tracesSampleRate: this.config.tracesSampleRate ?? 1.0,
        debug: this.config.debug ?? monitoringConfig.debug ?? false,
        ...(this.config.release || monitoringConfig.release ? { release: this.config.release || monitoringConfig.release } : {}),
        ...(this.config.integrations ? { integrations: this.config.integrations } : {}),
        beforeSend: (event) => {
          // Apply custom beforeSend from config
          if (this.config.beforeSend) {
            event = this.config.beforeSend(event)
          }
          
          // Apply monitoring config beforeSend
          if (monitoringConfig.beforeSend) {
            event = monitoringConfig.beforeSend(event)
          }

          return event
        },
        beforeBreadcrumb: (breadcrumb) => {
          // Apply custom beforeBreadcrumb from config
          if (this.config.beforeBreadcrumb) {
            breadcrumb = this.config.beforeBreadcrumb(breadcrumb)
          }

          // Apply monitoring config beforeBreadcrumb (convert types)
          if (monitoringConfig.beforeBreadcrumb && breadcrumb.message) {
            const converted = monitoringConfig.beforeBreadcrumb({
              message: breadcrumb.message,
              ...(breadcrumb.category ? { category: breadcrumb.category } : {}),
              level: breadcrumb.level as any,
              ...(breadcrumb.data ? { data: breadcrumb.data } : {}),
              ...(breadcrumb.timestamp ? { timestamp: breadcrumb.timestamp } : {}),
            })
            if (converted) {
              breadcrumb = { ...breadcrumb, ...converted }
            }
          }

          return breadcrumb
        },
      })
    } catch (error) {
      throw new Error(`Failed to initialize Sentry: ${error}`)
    }
  }

  captureError(error: Error, context?: ErrorContext): void {
    if (!this.sentry) return

    this.sentry.captureException(error, {
      extra: context,
    })
  }

  captureMessage(message: string, level: LogLevel = 'info'): void {
    if (!this.sentry) return

    this.sentry.captureMessage(message, level as any)
  }

  setUser(user: User | null): void {
    if (!this.sentry) return

    this.sentry.setUser(user)
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    if (!this.sentry) return

    this.sentry.addBreadcrumb({
      message: breadcrumb.message,
      ...(breadcrumb.category ? { category: breadcrumb.category } : {}),
      level: breadcrumb.level as any,
      ...(breadcrumb.data ? { data: breadcrumb.data } : {}),
      ...(breadcrumb.timestamp ? { timestamp: breadcrumb.timestamp } : {}),
    })
  }

  setContext(key: string, context: Record<string, any> | null): void {
    if (!this.sentry) return

    this.sentry.setContext(key, context)
  }

  setTag(key: string, value: string): void {
    if (!this.sentry) return

    this.sentry.setTag(key, value)
  }

  async close(): Promise<void> {
    if (!this.sentry) return

    await this.sentry.close(2000)
  }
}
