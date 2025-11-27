/**
 * AI Assistant - Chat Input Component (Scaffold)
 */

import React from 'react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
}

/**
 * Chat Input Component (Scaffold)
 * 
 * Full implementation should include:
 * - Auto-resize textarea
 * - Character counter
 * - Send button with loading state
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 * - Suggested prompts dropdown
 */
export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) {
        onSend()
      }
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          padding: 8,
          border: '1px solid #d1d5db',
          borderRadius: 4,
          minHeight: 60,
          resize: 'none',
          opacity: disabled ? 0.5 : 1,
        }}
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        style={{
          padding: '8px 16px',
          backgroundColor: !disabled && value.trim() ? '#3b82f6' : '#d1d5db',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: !disabled && value.trim() ? 'pointer' : 'not-allowed',
        }}
      >
        Send
      </button>
    </div>
  )
}
