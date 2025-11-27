/**
 * Utils - Tests
 * 
 * Smoke tests to verify test infrastructure works
 */

import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('foo', 'bar')
      expect(result).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', false && 'hidden', 'visible')
      expect(result).toBe('base visible')
    })

    it('should merge tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4')
      // Should have px-4 (later value wins)
      expect(result).toContain('px-4')
    })
  })
})
