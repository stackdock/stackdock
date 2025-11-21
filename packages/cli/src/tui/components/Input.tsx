import { useState } from 'react'
import { useKeyboard } from '../hooks/useKeyboard'
import { colorize, statusColors } from '../utils/colors'

export interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  validator?: (value: string) => string | null
  onSubmit?: (value: string) => void
  label?: string
  disabled?: boolean
}

/**
 * Input field component for TUI
 */
export function Input({
  value,
  onChange,
  placeholder = '',
  validator,
  onSubmit,
  label,
  disabled = false,
}: InputProps) {
  const [cursorPosition, setCursorPosition] = useState(value.length)
  const [error, setError] = useState<string | null>(null)

  // Handle keyboard input
  useKeyboard({
    onKey: (key: string) => {
      if (disabled) return

      // Handle printable characters
      if (key.length === 1 && key >= ' ') {
        const newValue = value.slice(0, cursorPosition) + key + value.slice(cursorPosition)
        const validationError = validator ? validator(newValue) : null
        
        if (!validationError) {
          onChange(newValue)
          setCursorPosition((pos) => pos + 1)
          setError(null)
        } else {
          setError(validationError)
        }
      }
    },
    onBackspace: () => {
      if (disabled || cursorPosition === 0) return
      
      const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition)
      const validationError = validator ? validator(newValue) : null
      
      onChange(newValue)
      setCursorPosition((pos) => pos - 1)
      setError(validationError || null)
    },
    onEnter: () => {
      if (disabled || !onSubmit) return
      
      const validationError = validator ? validator(value) : null
      if (!validationError) {
        onSubmit(value)
      }
    },
    onArrowLeft: () => {
      if (disabled) return
      setCursorPosition((pos) => Math.max(0, pos - 1))
    },
    onArrowRight: () => {
      if (disabled) return
      setCursorPosition((pos) => Math.min(value.length, pos + 1))
    },
  })

  // Display input field
  const displayText = value ? value : colorize(placeholder, 'muted')
  const cursorChar = cursorPosition < value.length ? value[cursorPosition] : ' '

  return (
    <box>
      {label && <text>{label}</text>}
      <box>
        <text>{displayText}</text>
        {!disabled && <span>{cursorChar}</span>}
      </box>
      {error && <text>{statusColors.error(error)}</text>}
    </box>
  )
}
