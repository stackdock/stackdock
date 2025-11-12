/**
 * Dock Queries
 * 
 * Fetch docks (provider connections) for the current user's organization.
 */

import { query } from "../_generated/server"
import { v } from "convex/values"
import { getCurrentUser } from "../lib/rbac"
import { listProvidersWithMetadata } from "./registry"
import { ConvexError } from "convex/values"

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

/**
 * Get backup schedules for a dock
 * Reads from backupSchedules table (synced during dock sync)
 */
export const getBackupSchedules = query({
  args: {
    dockId: v.optional(v.id("docks")), // Optional: filter by dock
    siteId: v.optional(v.number()), // Optional: filter by site
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return []
    }

    // Build query
    let query = ctx.db
      .query("backupSchedules")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))

    // Filter by dock if provided
    if (args.dockId) {
      // Verify user has access to this dock
      const dock = await ctx.db.get(args.dockId)
      if (!dock || dock.orgId !== membership.orgId) {
        throw new ConvexError("Unauthorized: You don't have access to this dock")
      }
      
      // Use dock-specific index (args.dockId is guaranteed to be defined here)
      query = ctx.db
        .query("backupSchedules")
        .withIndex("by_dockId", (q) => q.eq("dockId", args.dockId!))
    }

    // Collect all schedules
    let schedules = await query.collect()

    // Filter by site if provided
    if (args.siteId) {
      schedules = schedules.filter((s) => s.siteId === args.siteId)
    }

    return schedules
  },
})

/**
 * Get backup integrations for a dock
 * Reads from backupIntegrations table (synced during dock sync)
 */
export const getBackupIntegrations = query({
  args: {
    dockId: v.optional(v.id("docks")), // Optional: filter by dock
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return []
    }

    // Build query
    let query = ctx.db
      .query("backupIntegrations")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))

    // Filter by dock if provided
    if (args.dockId) {
      // Verify user has access to this dock
      const dock = await ctx.db.get(args.dockId)
      if (!dock || dock.orgId !== membership.orgId) {
        throw new ConvexError("Unauthorized: You don't have access to this dock")
      }
      
      // Use dock-specific index (args.dockId is guaranteed to be defined here)
      query = ctx.db
        .query("backupIntegrations")
        .withIndex("by_dockId", (q) => q.eq("dockId", args.dockId!))
    }

    // Collect all integrations
    const integrations = await query.collect()

    return integrations
  },
})
