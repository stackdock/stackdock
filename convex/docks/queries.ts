/**
 * Dock Queries
 * 
 * Fetch docks (provider connections) for the current user's organization.
 */

import { query } from "../_generated/server"
import { getCurrentUser } from "../lib/rbac"
import { listProvidersWithMetadata } from "./registry"

/**
 * List all docks for the current user's organization
 */
export const listDocks = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return []
    }
    
    // Fetch all docks for this org
    // Note: encryptedApiKey is included but will be encrypted bytes
    const docks = await ctx.db
      .query("docks")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    // Return docks without encryptedApiKey for security
    return docks.map((dock) => ({
      _id: dock._id,
      _creationTime: dock._creationTime,
      orgId: dock.orgId,
      name: dock.name,
      provider: dock.provider,
      lastSyncStatus: dock.lastSyncStatus,
      lastSyncAt: dock.lastSyncAt,
      lastSyncError: dock.lastSyncError,
      syncInProgress: dock.syncInProgress,
      updatedAt: dock.updatedAt,
      // Don't expose encryptedApiKey - it's sensitive
    }))
  },
})

/**
 * List all available providers (for UI dropdown)
 * 
 * Returns providers with display names for the dock creation form.
 */
export const listAvailableProviders = query({
  handler: async () => {
    return listProvidersWithMetadata()
  },
})
