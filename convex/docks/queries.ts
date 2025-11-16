/**
 * Dock Queries
 * 
 * Queries for listing docks and retrieving sync configurations
 */

import { v } from "convex/values"
import { query, internalQuery } from "../_generated/server"
import { getCurrentUser, checkPermission } from "../lib/rbac"
import { ConvexError } from "convex/values"
import { getProviderSyncConfig as getProviderSyncConfigFn } from "./syncIntervals"
import { listProvidersWithMetadata } from "./registry"
import type { Doc, Id } from "../_generated/dataModel"

/**
 * List all docks for the current user's organization
 * 
 * Requires "docks:read" permission.
 */
export const listDocks = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized")
    }
    
    // Check docks:read permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      membership.orgId,
      "docks:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: docks:read required")
    }
    
    // Get all docks for this org
    const docks = await ctx.db
      .query("docks")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return docks
  },
})

/**
 * Get a single dock by ID
 * 
 * Requires "docks:read" permission.
 */
export const getDock = query({
  args: {
    dockId: v.id("docks"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized")
    }
    
    // Get the dock
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      return null
    }
    
    // Verify dock belongs to user's org
    if (dock.orgId !== membership.orgId) {
      throw new ConvexError("Dock not found")
    }
    
    // Check docks:read permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      membership.orgId,
      "docks:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: docks:read required")
    }
    
    return dock
  },
})

/**
 * Get sync configuration for a provider
 * 
 * Returns recommended and absolute minimum sync intervals based on API rate limits.
 */
export const getProviderSyncConfig = query({
  args: {
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    return getProviderSyncConfigFn(args.provider)
  },
})

/**
 * List repositories from repositories table
 * 
 * This query returns all repositories synced from GitHub, GitLab, etc.
 * Used by Code table to display repositories.
 * 
 * NOTE: Repositories are synced to repositories table during dock sync.
 * Code table queries repositories table directly - completely separate from StackDock projects.
 */
export const listGitHubRepositories = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized")
    }
    
    // Check resources:read permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      membership.orgId,
      "resources:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: resources:read required")
    }
    
    // Get all repositories for this org
    const repositories = await ctx.db
      .query("repositories")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    console.log(`[listGitHubRepositories] DEBUG: Found ${repositories.length} repositories for org ${membership.orgId}`)
    
    return repositories
  },
})

/**
 * List all available providers
 * 
 * Returns list of providers with display names for UI.
 */
export const listAvailableProviders = query({
  args: {},
  handler: async (ctx) => {
    // No permission check needed - this is just metadata
    return listProvidersWithMetadata()
  },
})

/**
 * List backup schedules for the current user's organization
 * 
 * Requires "operations:read" permission.
 */
export const getBackupSchedules = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized")
    }
    
    // Check operations:read permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      membership.orgId,
      "operations:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: operations:read required")
    }
    
    // Get all backup schedules for this org
    const schedules = await ctx.db
      .query("backupSchedules")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return schedules
  },
})

/**
 * List backup integrations for the current user's organization
 * 
 * Requires "operations:read" permission.
 */
export const getBackupIntegrations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized")
    }
    
    // Check operations:read permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      membership.orgId,
      "operations:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: operations:read required")
    }
    
    // Get all backup integrations for this org
    const integrations = await ctx.db
      .query("backupIntegrations")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return integrations
  },
})

/**
 * Internal query: Get dock for action (with permission check)
 * 
 * Used by actions to get dock and verify user has access
 */
export const getDockForAction = internalQuery({
  args: {
    dockId: v.id("docks"),
  },
  handler: async (ctx, args) => {
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      return null
    }
    
    // For internal queries, we assume permission is checked at the action level
    // Return dock with hasPermission flag (always true for internal queries)
    return {
      ...dock,
      hasPermission: true,
    }
  },
})

/**
 * Internal query: List docks eligible for auto-sync
 * 
 * Returns docks that:
 * - Have auto-sync enabled
 * - Are not currently syncing
 * - Are not in backoff period
 */
export const listDocksForAutoSync = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    
    const allDocks = await ctx.db
      .query("docks")
      .collect()
    
    // Filter docks eligible for sync
    const eligibleDocks = allDocks.filter((dock) => {
      const syncConfig = dock.syncConfig
      
      // Must have auto-sync enabled
      if (!syncConfig?.enabled) {
        return false
      }
      
      // Must not be currently syncing
      if (dock.syncInProgress) {
        return false
      }
      
      // Must not be in backoff period
      if (syncConfig.backoffUntil && syncConfig.backoffUntil > now) {
        return false
      }
      
      // Check if enough time has passed since last sync
      if (syncConfig.lastSyncAttempt) {
        const timeSinceLastSync = now - syncConfig.lastSyncAttempt
        const minInterval = syncConfig.intervalSeconds || 120 // Default 2 minutes
        if (timeSinceLastSync < minInterval * 1000) {
          return false
        }
      }
      
      return true
    })
    
    return eligibleDocks
  },
})

/**
 * Internal query: Check sync status for all docks (for debugging)
 */
export const checkSyncStatusInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const allDocks = await ctx.db
      .query("docks")
      .collect()
    
    const docks = allDocks.map((dock) => {
      const syncConfig = dock.syncConfig
      const eligible = !!(syncConfig?.enabled && !dock.syncInProgress && (!syncConfig.backoffUntil || syncConfig.backoffUntil <= now))
      const reason = !syncConfig?.enabled 
        ? "auto-sync disabled"
        : dock.syncInProgress
        ? "sync in progress"
        : syncConfig.backoffUntil && syncConfig.backoffUntil > now
        ? `backoff until ${new Date(syncConfig.backoffUntil).toISOString()}`
        : eligible
        ? "eligible"
        : "unknown"
      
      return {
        ...dock,
        eligible,
        reason,
      }
    })
    
    return { docks }
  },
})

/**
 * Internal query: Check if dock can sync based on rate limits
 */
export const checkRateLimit = internalQuery({
  args: {
    dockId: v.id("docks"),
  },
  handler: async (ctx, args) => {
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      return { canSync: false, reason: "Dock not found" }
    }
    
    const syncConfig = dock.syncConfig
    const now = Date.now()
    
    // Check backoff period
    if (syncConfig?.backoffUntil && syncConfig.backoffUntil > now) {
      return {
        canSync: false,
        reason: `Backoff period active until ${new Date(syncConfig.backoffUntil).toISOString()}`,
      }
    }
    
    // Check sync interval
    if (syncConfig?.lastSyncAttempt) {
      const timeSinceLastSync = now - syncConfig.lastSyncAttempt
      const minInterval = syncConfig.intervalSeconds || 120 // Default 2 minutes
      if (timeSinceLastSync < minInterval * 1000) {
        const waitSeconds = Math.ceil((minInterval * 1000 - timeSinceLastSync) / 1000)
        return {
          canSync: false,
          reason: `Sync interval not met. Wait ${waitSeconds} more seconds.`,
        }
      }
    }
    
    // Check if currently syncing
    if (dock.syncInProgress) {
      return {
        canSync: false,
        reason: "Sync already in progress",
      }
    }
    
    return { canSync: true }
  },
})
