import { useEffect, useCallback } from 'react'

export type KeyHandler = (key: string) => void

export interface KeyboardHandlers {
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onEnter?: () => void
  onEscape?: () => void
  onTab?: () => void
  onBackspace?: () => void
  onKey?: (key: string) => void
}

/**
 * Hook for handling keyboard input in TUI
 */
export function useKeyboard(handlers: KeyboardHandlers): void {
  const handleKey = useCallback(
    (key: string) => {
      switch (key) {
        case 'up':
        case '\u001b[A':
          handlers.onArrowUp?.()
          break
        case 'down':
        case '\u001b[B':
          handlers.onArrowDown?.()
          break
        case 'left':
        case '\u001b[D':
          handlers.onArrowLeft?.()
          break
        case 'right':
        case '\u001b[C':
          handlers.onArrowRight?.()
          break
        case 'enter':
        case '\r':
        case '\n':
          handlers.onEnter?.()
          break
        case 'escape':
        case '\u001b':
          handlers.onEscape?.()
          break
        case 'tab':
        case '\t':
          handlers.onTab?.()
          break
        case 'backspace':
        case '\b':
        case '\u007f':
          handlers.onBackspace?.()
          break
        default:
          handlers.onKey?.(key)
          break
      }
    },
    [handlers]
  )

  useEffect(() => {
    // Set up raw mode for terminal input if available
    let stdin: NodeJS.ReadStream | null = null
    let wasRaw = false

    if (typeof process !== 'undefined' && process.stdin) {
      stdin = process.stdin
      wasRaw = stdin.isRaw || false

      if (!wasRaw) {
        stdin.setRawMode(true)
        stdin.resume()
        stdin.setEncoding('utf8')
      }

      const onData = (data: string) => {
        handleKey(data)
      }

      stdin.on('data', onData)

      // Cleanup
      return () => {
        if (stdin) {
          stdin.removeListener('data', onData)
          if (!wasRaw) {
            stdin.setRawMode(false)
            stdin.pause()
          }
        }
      }
    }
  }, [handleKey])
}
