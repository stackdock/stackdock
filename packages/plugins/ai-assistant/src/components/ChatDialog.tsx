/**
 * AI Assistant - Chat Dialog Component (Scaffold)
 * 
 * Main chat interface component
 * 
 * NOTE: This is a minimal scaffold. Full implementation requires:
 * 1. Dialog component from shadcn/ui
 * 2. ScrollArea component
 * 3. Button component
 * 4. Proper styling with Tailwind
 */

import React, { useEffect, useRef } from 'react'
import { useChatSession } from '../client'
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
// import { ScrollArea } from '@/components/ui/scroll-area'
// import { Button } from '@/components/ui/button'

interface ChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Chat Dialog (Scaffold)
 * 
 * Full implementation requires:
 * - shadcn/ui Dialog component
 * - Markdown rendering for AI responses
 * - Code syntax highlighting
 * - Auto-scroll to bottom
 * - Loading states
 * - Error handling UI
 */
export function ChatDialog({ open, onOpenChange }: ChatDialogProps) {
  const { messages, sendMessage, isLoading } = useChatSession()
  const [input, setInput] = React.useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    await sendMessage(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div>
      {/* Scaffold: Replace with actual Dialog component */}
      {open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            maxWidth: 600,
            width: '100%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <h2 style={{ marginBottom: 16 }}>StackDock Assistant</h2>
            
            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: 16,
              padding: 8,
              border: '1px solid #e5e7eb',
              borderRadius: 4,
            }}>
              {messages.length === 0 && (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: 32 }}>
                  Ask me anything about your infrastructure...
                </p>
              )}
              
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: msg.role === 'user' ? '#dbeafe' : '#f3f4f6',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div>{msg.content}</div>
                </div>
              ))}
              
              {isLoading && (
                <div style={{ textAlign: 'center', color: '#6b7280' }}>
                  Thinking...
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: 8,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  minHeight: 60,
                  resize: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: input.trim() && !isLoading ? '#3b82f6' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                }}
              >
                Send
              </button>
            </div>
            
            <button
              onClick={() => onOpenChange(false)}
              style={{
                marginTop: 16,
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
