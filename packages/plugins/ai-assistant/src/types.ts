/**
 * AI Assistant Plugin - Type Definitions
 * 
 * TypeScript types for the AI infrastructure assistant
 */

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface ChatSession {
  id: string
  orgId: string
  userId: string
  messages: Message[]
  context?: ResourceContext
  createdAt: number
  updatedAt: number
}

export interface ResourceContext {
  /** Resource type being discussed (e.g., "servers", "webServices") */
  resourceType?: string
  /** IDs of specific resources being discussed */
  resourceIds?: string[]
  /** Current page/route for context */
  currentPage?: string
}

export interface InfrastructureContext {
  servers: {
    count: number
    providers: string[]
  }
  webServices: {
    count: number
    providers: string[]
  }
  domains: {
    count: number
    providers: string[]
  }
  databases: {
    count: number
    providers: string[]
  }
}

export interface AIProvider {
  name: string
  chat(messages: Message[], context?: InfrastructureContext): Promise<string>
  streamChat?(messages: Message[], context?: InfrastructureContext): AsyncGenerator<string>
}

export interface AIAssistantConfig {
  /** AI provider: OpenAI or Anthropic */
  provider: 'openai' | 'anthropic'
  /** API key for the provider */
  apiKey: string
  /** Model to use (optional, uses provider default) */
  model?: string
  /** Custom system prompt (optional) */
  systemPrompt?: string
  /** Enable streaming responses (optional, default: false) */
  streaming?: boolean
  /** Rate limit: messages per hour (optional, default: 50) */
  rateLimit?: number
}

export interface ChatResponse {
  role: 'assistant'
  content: string
  timestamp: number
  metadata?: {
    model: string
    inputTokens: number
    outputTokens: number
    estimatedCost: number
  }
}

export interface ChatError {
  type: 'rate_limit' | 'api_error' | 'permission_denied' | 'unknown'
  message: string
  retryAfter?: number
}

/**
 * Hook return type for useChatSession
 */
export interface UseChatSessionReturn {
  messages: Message[]
  sendMessage: (content: string, context?: ResourceContext) => Promise<void>
  isLoading: boolean
  error: ChatError | null
  clearMessages: () => void
}
