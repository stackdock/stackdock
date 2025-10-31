/**
 * Dock Actions
 * 
 * Actions for external HTTP requests (Convex mutations can't use fetch)
 */

import { v } from "convex/values"
import { internalAction } from "../_generated/server"
import { getAdapter } from "./registry"

/**
 * Validate API credentials for a provider
 * 
 * This is an internal action because it needs to make external HTTP requests,
 * which mutations cannot do. It's called from mutations, not from the client.
 */
export const validateCredentials = internalAction({
  args: {
    provider: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`[Dock Action] Validating credentials for provider: ${args.provider}`)
    
    const adapter = getAdapter(args.provider)
    if (!adapter) {
      throw new Error(`No adapter found for provider: ${args.provider}`)
    }

    try {
      console.log(`[Dock Action] Calling adapter.validateCredentials`)
      const isValid = await adapter.validateCredentials(args.apiKey)
      console.log(`[Dock Action] Validation result: ${isValid}`)
      return { valid: isValid }
    } catch (error) {
      console.error(`[Dock Action] Validation error:`, error)
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      throw new Error(`Failed to validate credentials: ${errorMessage}`)
    }
  },
})
