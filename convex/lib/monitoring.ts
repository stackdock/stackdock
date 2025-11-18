/**
 * Internal monitoring for Convex backend
 * 
 * This tracks errors in StackDock's Convex functions, separate from
 * the monitoring data displayed from external applications.
 * 
 * Note: This uses a simplified approach without importing the full
 * @stackdock/monitoring package to avoid bundling issues in Convex.
 */

// Check if Sentry is enabled via environment variable
const MONITORING_ENABLED = process.env.MONITORING_ENABLED === 'true'
const SENTRY_DSN = process.env.SENTRY_DSN

let Sentry: any = null
let isInitialized = false

/**
 * Initialize Sentry for Convex
 * Call this once when the Convex app starts
 */
export async function initConvexMonitoring() {
  if (!MONITORING_ENABLED || !SENTRY_DSN) {
    console.log('[Convex Monitoring] Disabled or no DSN provided')
    return
  }

  if (isInitialized) {
    return
  }

  try {
    Sentry = await import('@sentry/node')
    
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.CONVEX_CLOUD_URL ? 'production' : 'development',
      tracesSampleRate: process.env.CONVEX_CLOUD_URL ? 0.1 : 1.0,
      beforeSend(event: any) {
        // Remove sensitive data from Convex context
        if (event.extra) {
          // Remove any API keys or tokens
          delete event.extra.apiKey
          delete event.extra.token
          delete event.extra.credentials
        }
        return event
      },
    })

    isInitialized = true
    console.log('[Convex Monitoring] Initialized with Sentry')
  } catch (error) {
    console.error('[Convex Monitoring] Failed to initialize:', error)
  }
}

/**
 * Capture an error in Convex functions
 */
export function captureError(error: Error, context?: Record<string, any>): void {
  if (!MONITORING_ENABLED || !isInitialized || !Sentry) {
    return
  }

  try {
    Sentry.captureException(error, {
      extra: context,
    })
  } catch (err) {
    console.error('[Convex Monitoring] Error capturing error:', err)
  }
}

/**
 * Capture a message in Convex functions
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info'
): void {
  if (!MONITORING_ENABLED || !isInitialized || !Sentry) {
    return
  }

  try {
    Sentry.captureMessage(message, level as any)
  } catch (err) {
    console.error('[Convex Monitoring] Error capturing message:', err)
  }
}

/**
 * Wrap a Convex function with error tracking
 * 
 * @example
 * ```ts
 * export const myMutation = mutation(
 *   withMonitoring(async (ctx, args) => {
 *     // Your code here
 *   })
 * )
 * ```
 */
export function withMonitoring<T extends (...args: any[]) => any>(
  fn: T
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      // Capture error
      if (error instanceof Error) {
        captureError(error, {
          function: fn.name,
          args: JSON.stringify(args),
        })
      }
      
      // Re-throw to let Convex handle it
      throw error
    }
  }) as T
}
