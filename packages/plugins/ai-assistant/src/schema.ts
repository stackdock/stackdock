/**
 * AI Assistant Plugin - Convex Schema
 * 
 * Database schema for AI chat conversations
 */

import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const aiAssistantSchema = {
  /**
   * AI Chat Sessions
   * 
   * Stores conversation history between users and the AI assistant
   */
  aiChats: defineTable({
    /** Organization ID (multi-tenant isolation) */
    orgId: v.string(),
    
    /** User ID (Clerk user ID) */
    userId: v.string(),
    
    /** Conversation messages */
    messages: v.array(
      v.object({
        role: v.union(
          v.literal('user'),
          v.literal('assistant'),
          v.literal('system')
        ),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
    
    /** Resource context (optional) */
    context: v.optional(
      v.object({
        resourceType: v.optional(v.string()),
        resourceIds: v.optional(v.array(v.string())),
        currentPage: v.optional(v.string()),
      })
    ),
    
    /** Metadata */
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        totalTokens: v.optional(v.number()),
        totalCost: v.optional(v.number()),
      })
    ),
  })
    .index('by_org', ['orgId'])
    .index('by_user', ['userId'])
    .index('by_org_and_user', ['orgId', 'userId']),
}
