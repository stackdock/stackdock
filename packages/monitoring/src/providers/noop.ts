/**
 * No-op monitoring provider
 * 
 * A provider that does nothing - useful for testing or when monitoring is disabled.
 */

import type {
  MonitoringProvider,
  MonitoringConfig,
  User,
  Breadcrumb,
  ErrorContext,
  LogLevel,
} from '../types'

export class NoOpProvider implements MonitoringProvider {
  readonly name = 'noop'

  init(_config: MonitoringConfig): void {
    // Do nothing
  }

  captureError(_error: Error, _context?: ErrorContext): void {
    // Do nothing
  }

  captureMessage(_message: string, _level?: LogLevel): void {
    // Do nothing
  }

  setUser(_user: User | null): void {
    // Do nothing
  }

  addBreadcrumb(_breadcrumb: Breadcrumb): void {
    // Do nothing
  }

  setContext(_key: string, _context: Record<string, any> | null): void {
    // Do nothing
  }

  setTag(_key: string, _value: string): void {
    // Do nothing
  }

  close(): void {
    // Do nothing
  }
}
