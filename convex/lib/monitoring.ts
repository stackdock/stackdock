/**
 * Internal monitoring for Convex backend
 * 
 * This tracks errors in StackDock's Convex functions, separate from
 * the monitoring data displayed from external applications.
 * 
 * NOTE: Currently disabled to avoid bundling issues with @sentry/node.
 * 
 * To enable monitoring in Convex:
 * 1. Move this to an action file with "use node" directive
 * 2. Or use a different monitoring solution that doesn't require Node.js APIs
 * 3. Or implement a webhook-based approach that sends errors to an external service
 * 
 * @stackdock/monitoring package is for frontend use only, not Convex backend.
 */

// Disabled: Sentry requires Node.js APIs which aren't available in Convex functions
// Monitoring is currently disabled - see function comments for details

/**
 * Initialize Sentry for Convex
 * Call this once when the Convex app starts
 * 
 * DISABLED: @sentry/node requires Node.js APIs which aren't available in Convex functions.
 * To use this, move to an action with "use node" directive.
 */
export async function initConvexMonitoring() {
  // Monitoring disabled - @sentry/node requires Node.js APIs
  console.log('[Convex Monitoring] Disabled - requires Node.js APIs (move to action with "use node")')
  return
  
  /* DISABLED CODE - Uncomment if moving to action with "use node"
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
  */
}

/**
 * Capture an error in Convex functions
 * 
 * DISABLED: Currently a no-op. Enable by moving Sentry initialization to an action with "use node".
 */
export function captureError(error: Error, context?: Record<string, any>): void {
  // Monitoring disabled - no-op for now
  // Log to console instead
  console.error('[Convex Monitoring] Error (monitoring disabled):', error.message, context)
  return
  
  /* DISABLED CODE
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
  */
}

/**
 * Capture a message in Convex functions
 * 
 * DISABLED: Currently a no-op. Enable by moving Sentry initialization to an action with "use node".
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info'
): void {
  // Monitoring disabled - no-op for now
  // Log to console instead
  console.log(`[Convex Monitoring] ${level.toUpperCase()}: ${message}`)
  return
  
  /* DISABLED CODE
  if (!MONITORING_ENABLED || !isInitialized || !Sentry) {
    return
  }

  try {
    Sentry.captureMessage(message, level as any)
  } catch (err) {
    console.error('[Convex Monitoring] Error capturing message:', err)
  }
  */
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
