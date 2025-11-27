/**
 * AI Assistant Plugin - Backend
 * 
 * Convex actions for AI provider integration
 * 
 * NOTE: This file is a scaffold. Full implementation requires:
 * 1. Convex action setup with proper typing
 * 2. OpenAI/Anthropic API integration
 * 3. Infrastructure context queries
 * 4. RBAC enforcement
 * 5. Audit logging
 */

import type { Message, InfrastructureContext, ChatResponse } from './types'

/**
 * AI Chat Action (Scaffold)
 * 
 * This is a placeholder for the Convex action that will:
 * - Accept user messages
 * - Query infrastructure context
 * - Call OpenAI/Anthropic API
 * - Return AI response
 * 
 * Full implementation requires Convex setup in apps/web or convex/
 */
export interface ChatActionArgs {
  orgId: string
  userId: string
  messages: Message[]
  context?: {
    resourceType?: string
    resourceIds?: string[]
    currentPage?: string
  }
}

/**
 * Build system prompt with infrastructure context
 */
export function buildSystemPrompt(context: InfrastructureContext): string {
  return `You are an infrastructure assistant for StackDock, a multi-cloud management platform.

User's Infrastructure:
- ${context.servers.count} servers across ${context.servers.providers.join(', ')}
- ${context.webServices.count} web services across ${context.webServices.providers.join(', ')}
- ${context.domains.count} domains across ${context.domains.providers.join(', ')}
- ${context.databases.count} databases across ${context.databases.providers.join(', ')}

You can help users:
1. Understand their infrastructure status
2. Find specific resources
3. Get recommendations
4. Troubleshoot issues
5. Learn about their providers

Always be helpful, concise, and accurate. If you don't have information, say so.`
}

/**
 * Format messages for OpenAI API
 */
export function formatMessagesForOpenAI(
  messages: Message[],
  systemPrompt: string
): Array<{ role: string; content: string }> {
  return [
    { role: 'system', content: systemPrompt },
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  ]
}

/**
 * Format messages for Anthropic API
 */
export function formatMessagesForAnthropic(
  messages: Message[]
): Array<{ role: string; content: string }> {
  // Anthropic doesn't use system messages in messages array
  // System prompt is passed separately
  return messages.map(msg => ({
    role: msg.role === 'system' ? 'user' : msg.role,
    content: msg.content,
  }))
}

/**
 * Call OpenAI API (scaffold)
 */
export async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  model: string = 'gpt-4o'
): Promise<ChatResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  
  return {
    role: 'assistant',
    content: data.choices[0].message.content,
    timestamp: Date.now(),
    metadata: {
      model: data.model,
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
      estimatedCost: calculateOpenAICost(
        data.usage.prompt_tokens,
        data.usage.completion_tokens,
        model
      ),
    },
  }
}

/**
 * Call Anthropic API (scaffold)
 */
export async function callAnthropic(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  apiKey: string,
  model: string = 'claude-3-5-sonnet-20241022'
): Promise<ChatResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  
  return {
    role: 'assistant',
    content: data.content[0].text,
    timestamp: Date.now(),
    metadata: {
      model: data.model,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      estimatedCost: calculateAnthropicCost(
        data.usage.input_tokens,
        data.usage.output_tokens,
        model
      ),
    },
  }
}

/**
 * Calculate OpenAI API cost
 * Pricing as of Nov 2024
 */
function calculateOpenAICost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
  }

  const rates = pricing[model] || pricing['gpt-4o']
  
  return (
    (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000
  )
}

/**
 * Calculate Anthropic API cost
 * Pricing as of Nov 2024
 */
function calculateAnthropicCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
  }

  const rates = pricing[model] || pricing['claude-3-5-sonnet-20241022']
  
  return (
    (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000
  )
}
