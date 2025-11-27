/**
 * AI Assistant Backend - Tests
 */

import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, formatMessagesForOpenAI, formatMessagesForAnthropic } from '../src/backend'
import type { Message, InfrastructureContext } from '../src/types'

describe('AI Assistant Backend', () => {
  describe('buildSystemPrompt', () => {
    it('should build system prompt with infrastructure context', () => {
      const context: InfrastructureContext = {
        servers: { count: 5, providers: ['DigitalOcean', 'Vultr'] },
        webServices: { count: 10, providers: ['Vercel', 'Netlify'] },
        domains: { count: 3, providers: ['Cloudflare'] },
        databases: { count: 2, providers: ['Neon', 'Turso'] },
      }

      const prompt = buildSystemPrompt(context)

      expect(prompt).toContain('5 servers')
      expect(prompt).toContain('DigitalOcean, Vultr')
      expect(prompt).toContain('10 web services')
      expect(prompt).toContain('infrastructure assistant')
    })
  })

  describe('formatMessagesForOpenAI', () => {
    it('should format messages with system prompt', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello', timestamp: Date.now() },
      ]
      const systemPrompt = 'You are an assistant'

      const formatted = formatMessagesForOpenAI(messages, systemPrompt)

      expect(formatted).toHaveLength(2)
      expect(formatted[0]).toEqual({ role: 'system', content: systemPrompt })
      expect(formatted[1]).toEqual({ role: 'user', content: 'Hello' })
    })
  })

  describe('formatMessagesForAnthropic', () => {
    it('should format messages without system messages', () => {
      const messages: Message[] = [
        { role: 'system', content: 'System prompt', timestamp: Date.now() },
        { role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      const formatted = formatMessagesForAnthropic(messages)

      expect(formatted).toHaveLength(2)
      expect(formatted[0].role).toBe('user') // system converted to user
      expect(formatted[1].role).toBe('user')
    })
  })
})
