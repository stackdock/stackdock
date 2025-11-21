import { useEffect, useState } from 'react'

export interface TerminalSize {
  width: number
  height: number
}

/**
 * Hook for tracking terminal size and handling resize events
 */
export function useTerminal(): TerminalSize {
  const [size, setSize] = useState<TerminalSize>(() => {
    // Get initial size from process.stdout if available
    if (typeof process !== 'undefined' && process.stdout) {
      return {
        width: process.stdout.columns || 80,
        height: process.stdout.rows || 24,
      }
    }
    return { width: 80, height: 24 }
  })

  useEffect(() => {
    // Handle terminal resize events
    const handleResize = () => {
      if (typeof process !== 'undefined' && process.stdout) {
        setSize({
          width: process.stdout.columns || 80,
          height: process.stdout.rows || 24,
        })
      }
    }

    // Listen for resize events if available
    if (typeof process !== 'undefined' && process.stdout) {
      process.stdout.on('resize', handleResize)
    }

    // Cleanup
    return () => {
      if (typeof process !== 'undefined' && process.stdout) {
        process.stdout.off('resize', handleResize)
      }
    }
  }, [])

  return size
}
