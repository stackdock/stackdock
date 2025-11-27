/**
 * AI Assistant Client - Tests
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ChatMessage } from '../src/components/ChatMessage'
import { getSuggestedPrompts } from '../src/client'

describe('AI Assistant Client', () => {
  describe('ChatMessage', () => {
    it('should render user message', () => {
      const { getByText } = render(
        <ChatMessage role="user" content="Hello, AI!" />
      )

      expect(getByText('Hello, AI!')).toBeDefined()
      expect(getByText('You')).toBeDefined()
    })

    it('should render assistant message', () => {
      const { getByText } = render(
        <ChatMessage role="assistant" content="Hello, user!" />
      )

      expect(getByText('Hello, user!')).toBeDefined()
      expect(getByText('Assistant')).toBeDefined()
    })
  })

  describe('getSuggestedPrompts', () => {
    it('should return default prompts when no page specified', () => {
      const prompts = getSuggestedPrompts()

      expect(prompts).toHaveLength(3)
      expect(prompts[0]).toContain('status')
    })

    it('should return server-specific prompts for servers page', () => {
      const prompts = getSuggestedPrompts('/dashboard/infrastructure/servers')

      expect(prompts).toHaveLength(3)
      expect(prompts.some(p => p.includes('servers'))).toBe(true)
    })

    it('should return web-service prompts for web-services page', () => {
      const prompts = getSuggestedPrompts('/dashboard/infrastructure/web-services')

      expect(prompts).toHaveLength(3)
      expect(prompts.some(p => p.includes('services') || p.includes('deployed'))).toBe(true)
    })
  })
})
