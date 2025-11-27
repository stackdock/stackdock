/**
 * AI Assistant - Chat Message Component (Scaffold)
 */

import React from 'react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

/**
 * Chat Message Component (Scaffold)
 * 
 * Full implementation should include:
 * - Markdown rendering for AI responses
 * - Code syntax highlighting
 * - Copy button for code blocks
 * - Timestamp formatting
 * - Avatar/icon for role
 */
export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  return (
    <div
      style={{
        marginBottom: 12,
        padding: 12,
        borderRadius: 8,
        backgroundColor: role === 'user' ? '#dbeafe' : '#f3f4f6',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {role === 'user' ? 'You' : 'Assistant'}
      </div>
      <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
      {timestamp && (
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
