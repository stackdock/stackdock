/**
 * AI Assistant Plugin
 * 
 * Main entry point for the AI infrastructure assistant plugin
 */

export * from './types'
export { aiAssistantSchema } from './schema'

// Re-export for convenience
export type { AIAssistantConfig, Message, ChatSession } from './types'
