/**
 * React integration for monitoring
 * 
 * Provides React-specific components like error boundaries.
 */

import { Component, type ReactNode } from 'react'
import { captureError } from './core'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, errorInfo: { componentStack?: string | null }) => ReactNode)
  onError?: (error: Error, errorInfo: { componentStack?: string | null }) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: { componentStack?: string | null } | null
}

/**
 * Error boundary that captures errors and sends them to the monitoring provider
 * 
 * @example
 * ```tsx
 * import { MonitoringErrorBoundary } from '@stackdock/monitoring'
 * 
 * function App() {
 *   return (
 *     <MonitoringErrorBoundary fallback={<ErrorFallback />}>
 *       <YourApp />
 *     </MonitoringErrorBoundary>
 *   )
 * }
 * ```
 */
export class MonitoringErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string | null }): void {
    // Capture error with monitoring provider
    captureError(error, {
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
    })

    // Update state
    this.setState({ errorInfo })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallback } = this.props
      const { error, errorInfo } = this.state

      // Render custom fallback if provided
      if (fallback !== undefined) {
        // Check if fallback is a function
        if (typeof fallback === 'function') {
          if (error && errorInfo) {
            return fallback(error, errorInfo)
          }
          return null
        }
        // Otherwise it's a ReactNode
        return fallback
      }

      // Default fallback UI
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>We've been notified and are looking into it.</p>
        </div>
      )
    }

    return this.props.children
  }
}
