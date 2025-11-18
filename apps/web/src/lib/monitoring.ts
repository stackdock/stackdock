/**
 * Internal monitoring initialization for StackDock web app
 * 
 * This tracks StackDock's own errors, separate from the monitoring data
 * displayed from external applications via dock adapters.
 */

import { initMonitoring, SentryProvider, NoOpProvider } from '@stackdock/monitoring'

/**
 * Initialize monitoring for the web application
 * 
 * Supports multiple providers through environment variables:
 * - VITE_MONITORING_PROVIDER: 'sentry' | 'posthog' | 'newrelic' | 'none'
 * - VITE_MONITORING_ENABLED: 'true' | 'false'
 * - VITE_SENTRY_DSN: Sentry DSN (required if provider is 'sentry')
 */
export function initWebMonitoring() {
  const provider = import.meta.env.VITE_MONITORING_PROVIDER || 'none'
  const enabled = import.meta.env.VITE_MONITORING_ENABLED === 'true'
  const environment = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development'

  if (!enabled || provider === 'none') {
    console.log('[Monitoring] Disabled or no provider specified')
    return initMonitoring({
      provider: new NoOpProvider(),
      enabled: false,
    })
  }

  switch (provider) {
    case 'sentry': {
      const dsn = import.meta.env.VITE_SENTRY_DSN

      if (!dsn) {
        console.error('[Monitoring] Sentry provider selected but VITE_SENTRY_DSN not set')
        return initMonitoring({
          provider: new NoOpProvider(),
          enabled: false,
        })
      }

      return initMonitoring({
        provider: new SentryProvider({
          dsn,
          environment,
          tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
          beforeSend: (event) => {
            // Filter out sensitive data if needed
            // Remove PII, credentials, etc.
            return event
          },
        }),
        enabled: true,
        config: {
          environment,
          release: import.meta.env.VITE_APP_VERSION || undefined,
        },
      })
    }

    case 'posthog':
      console.warn('[Monitoring] PostHog provider not yet implemented')
      return initMonitoring({
        provider: new NoOpProvider(),
        enabled: false,
      })

    case 'newrelic':
      console.warn('[Monitoring] New Relic provider not yet implemented')
      return initMonitoring({
        provider: new NoOpProvider(),
        enabled: false,
      })

    default:
      console.error(`[Monitoring] Unknown provider: ${provider}`)
      return initMonitoring({
        provider: new NoOpProvider(),
        enabled: false,
      })
  }
}
