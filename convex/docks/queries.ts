/**
 * Dock Queries
 * 
 * Fetch docks (provider connections) for the current user's organization.
 */

import { query, internalQuery } from "../_generated/server"
import { v } from "convex/values"
import { getCurrentUser, checkPermission } from "../lib/rbac"
import { listProvidersWithMetadata } from "./registry"
import { ConvexError } from "convex/values"
import { internal } from "../_generated/api"
// Import getProviderSyncConfig function (not query) - we'll use it in the query handler
import type { ProviderSyncConfig } from "./syncIntervals"
import { getProviderSyncConfig as getProviderSyncConfigFn } from "./syncIntervals"

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
      syncConfig: dock.syncConfig,
      updatedAt: dock.updatedAt,
      // Don't expose encryptedApiKey - it's sensitive
    }))
  },
})

/**
 * Check sync status and eligibility (for debugging)
 */
export const checkSyncStatus = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return { docks: [], summary: "No organization found" }
    }
    
    const docks = await ctx.db
      .query("docks")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    const now = Date.now()
    
    const dockStatuses = docks.map((dock) => {
      const syncConfig = dock.syncConfig || { enabled: false, intervalSeconds: 60 }
      const lastSync = syncConfig.lastSyncAttempt || 0
      const timeSinceLastSync = lastSync ? now - lastSync : null
      
      let eligible = false
      let reason = ""
      
      if (!syncConfig.enabled) {
        reason = "sync disabled"
      } else if (dock.syncInProgress) {
        reason = "sync in progress"
      } else if (syncConfig.backoffUntil && syncConfig.backoffUntil > now) {
        reason = `in backoff until ${new Date(syncConfig.backoffUntil).toISOString()}`
      } else {
        const intervalMs = syncConfig.intervalSeconds * 1000
        if (timeSinceLastSync !== null && timeSinceLastSync < intervalMs) {
          reason = `interval not passed (${Math.ceil((intervalMs - timeSinceLastSync) / 1000)}s remaining)`
        } else {
          eligible = true
          reason = "eligible"
        }
      }
      
      return {
        name: dock.name,
        provider: dock.provider,
        enabled: syncConfig.enabled,
        lastSync: timeSinceLastSync ? `${Math.round(timeSinceLastSync / 1000)}s ago` : "never",
        status: dock.lastSyncStatus,
        eligible,
        reason,
        consecutiveFailures: syncConfig.consecutiveFailures || 0,
      }
    })
    
    const eligibleCount = dockStatuses.filter(d => d.eligible).length
    
    return {
      docks: dockStatuses,
      summary: `${eligibleCount} of ${docks.length} docks eligible for sync`,
    }
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

/**
 * Internal query: Get dock for action (with permission check)
 * Used by actions to verify user has access to dock before decrypting API key
 */
export const getDockForAction = internalQuery({
  args: {
    dockId: v.id("docks"),
  },
  handler: async (ctx, args) => {
    // Get dock
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      return null
    }
    
    // Get current user (actions pass auth token)
    const user = await getCurrentUser(ctx)
    
    // Check permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      dock.orgId,
      "docks:read" // Read permission is sufficient for fetching commits
    )
    
    return {
      _id: dock._id,
      orgId: dock.orgId,
      provider: dock.provider,
      encryptedApiKey: dock.encryptedApiKey,
      hasPermission,
    }
  },
})

/**
 * List docks eligible for auto-sync
 * 
 * Returns docks that:
 * - Have auto-sync enabled
 * - Are not currently syncing
 * - Are not in backoff period
 * - Have passed their sync interval
 */
export const listDocksForAutoSync = internalQuery({
  handler: async (ctx) => {
    const now = Date.now()

    const docks = await ctx.db
      .query("docks")
      .collect()

    return docks.filter((dock) => {
      // Check if auto-sync is enabled
      if (!dock.syncConfig?.enabled) return false

      // Check if currently syncing
      if (dock.syncInProgress) return false

      // Check if in backoff period
      if (dock.syncConfig.backoffUntil && dock.syncConfig.backoffUntil > now) {
        return false
      }

      // Check if enough time has passed since last sync
      const intervalMs = (dock.syncConfig.intervalSeconds || 60) * 1000
      const lastSync = dock.syncConfig.lastSyncAttempt || 0
      if (now - lastSync < intervalMs) {
        return false
      }

      return true
    })
  },
})

/**
 * Check if dock can sync based on rate limits
 * 
 * Returns:
 * - canSync: boolean
 * - reason: string (if cannot sync)
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

    const rateLimitInfo = dock.rateLimitInfo
    if (!rateLimitInfo) {
      // No rate limit info yet, allow sync
      return { canSync: true }
    }

    const now = Date.now()

    // Check if we have remaining requests
    if (rateLimitInfo.remaining !== undefined && rateLimitInfo.remaining <= 0) {
      // Check if reset time has passed
      if (rateLimitInfo.reset && rateLimitInfo.reset > now) {
        const waitSeconds = Math.ceil((rateLimitInfo.reset - now) / 1000)
        return {
          canSync: false,
          reason: `Rate limit exhausted. Reset in ${waitSeconds} seconds.`,
        }
      }
    }

    // Check retry-after
    if (rateLimitInfo.retryAfter) {
      const retryAfterMs = rateLimitInfo.retryAfter * 1000
      if (now < retryAfterMs) {
        const waitSeconds = Math.ceil((retryAfterMs - now) / 1000)
        return {
          canSync: false,
          reason: `Rate limit retry-after: ${waitSeconds} seconds.`,
        }
      }
    }

    return { canSync: true }
  },
})

/**
 * Internal query: Check sync status (no auth required, for CLI debugging)
 * 
 * This can be called from CLI: npx convex run docks/queries:checkSyncStatusInternal
 */
export const checkSyncStatusInternal = internalQuery({
  handler: async (ctx) => {
    const docks = await ctx.db.query("docks").collect()
    const now = Date.now()

    const dockStatuses = docks.map((dock) => {
      const syncConfig = dock.syncConfig || { enabled: false, intervalSeconds: 60 }
      const lastSync = syncConfig.lastSyncAttempt || 0
      const timeSinceLastSync = lastSync ? now - lastSync : null

      let eligible = false
      let reason = ""

      if (!syncConfig.enabled) {
        reason = "sync disabled"
      } else if (dock.syncInProgress) {
        reason = "sync in progress"
      } else if (syncConfig.backoffUntil && syncConfig.backoffUntil > now) {
        reason = `in backoff until ${new Date(syncConfig.backoffUntil).toISOString()}`
      } else {
        const intervalMs = syncConfig.intervalSeconds * 1000
        if (timeSinceLastSync !== null && timeSinceLastSync < intervalMs) {
          reason = `interval not passed (${Math.ceil((intervalMs - timeSinceLastSync) / 1000)}s remaining)`
        } else {
          eligible = true
          reason = "eligible"
        }
      }

      return {
        name: dock.name,
        provider: dock.provider,
        enabled: syncConfig.enabled,
        lastSync: timeSinceLastSync ? `${Math.round(timeSinceLastSync / 1000)}s ago` : "never",
        status: dock.lastSyncStatus,
        eligible,
        reason,
        consecutiveFailures: syncConfig.consecutiveFailures || 0,
      }
    })

    const eligibleCount = dockStatuses.filter(d => d.eligible).length

    return {
      docks: dockStatuses,
      summary: `${eligibleCount} of ${docks.length} docks eligible for sync`,
      totalDocks: docks.length,
    }
  },
})

/**
 * Debug sync status for a specific dock
 * 
 * Returns detailed sync eligibility information for debugging
 */
export const debugSyncStatus = internalQuery({
  args: {
    dockId: v.id("docks"),
  },
  handler: async (ctx, args) => {
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      return { error: "Dock not found" }
    }

    const now = Date.now()
    const syncConfig = dock.syncConfig || {
      enabled: true,
      intervalSeconds: 60,
      consecutiveFailures: 0,
    }

    // Check eligibility criteria
    const checks = {
      enabled: syncConfig.enabled,
      notSyncing: !dock.syncInProgress,
      notInBackoff: !(syncConfig.backoffUntil && syncConfig.backoffUntil > now),
      intervalPassed: (() => {
        const intervalMs = (syncConfig.intervalSeconds || 60) * 1000
        const lastSync = syncConfig.lastSyncAttempt || 0
        const timeSinceLastSync = now - lastSync
        return {
          passed: timeSinceLastSync >= intervalMs,
          timeSinceLastSync,
          intervalMs,
          lastSyncAttempt: syncConfig.lastSyncAttempt,
        }
      })(),
    }

    const eligible = checks.enabled && checks.notSyncing && checks.notInBackoff && checks.intervalPassed.passed

    // Rate limit check (inline logic since we can't call another query from within a query)
    const rateLimitInfo = dock.rateLimitInfo
    let rateLimitCheck: { canSync: boolean; reason?: string } = { canSync: true }
    
    if (rateLimitInfo) {
      const { remaining, reset, retryAfter } = rateLimitInfo
      if (remaining !== undefined && remaining <= 0) {
        if (reset && reset > now) {
          rateLimitCheck = {
            canSync: false,
            reason: `Rate limit exhausted. Reset in ${Math.ceil((reset - now) / 1000)} seconds.`
          }
        }
      }
      if (retryAfter && now < retryAfter * 1000) {
        rateLimitCheck = {
          canSync: false,
          reason: `Rate limit retry-after: ${Math.ceil((retryAfter * 1000 - now) / 1000)} seconds.`
        }
      }
    }

    return {
      dockId: dock._id,
      name: dock.name,
      provider: dock.provider,
      syncConfig: {
        enabled: syncConfig.enabled,
        intervalSeconds: syncConfig.intervalSeconds,
        lastSyncAttempt: syncConfig.lastSyncAttempt,
        lastSyncAttemptISO: syncConfig.lastSyncAttempt ? new Date(syncConfig.lastSyncAttempt).toISOString() : null,
        consecutiveFailures: syncConfig.consecutiveFailures || 0,
        backoffUntil: syncConfig.backoffUntil,
        backoffUntilISO: syncConfig.backoffUntil ? new Date(syncConfig.backoffUntil).toISOString() : null,
      },
      syncStatus: {
        syncInProgress: dock.syncInProgress,
        lastSyncStatus: dock.lastSyncStatus,
        lastSyncAt: dock.lastSyncAt,
        lastSyncAtISO: dock.lastSyncAt ? new Date(dock.lastSyncAt).toISOString() : null,
        lastSyncError: dock.lastSyncError,
      },
      eligibility: {
        eligible,
        checks,
        reason: eligible ? "Eligible for sync" : (() => {
          if (!checks.enabled) return "Auto-sync disabled"
          if (!checks.notSyncing) return "Sync in progress"
          if (!checks.notInBackoff) return `In backoff until ${new Date(syncConfig.backoffUntil!).toISOString()}`
          if (!checks.intervalPassed.passed) return `Interval not passed (${Math.round(checks.intervalPassed.timeSinceLastSync / 1000)}s / ${checks.intervalPassed.intervalMs / 1000}s)`
          return "Unknown reason"
        })(),
      },
      rateLimit: rateLimitCheck,
    }
  },
})

/**
 * Get provider sync configuration
 * 
 * Returns recommended and minimum sync intervals for a provider.
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
 * Get a single dock by ID
 * 
 * Returns dock details including sync config.
 */
export const getDock = query({
  args: {
    dockId: v.id("docks"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    const dock = await ctx.db.get(args.dockId)
    if (!dock) return null
    
    // Verify user belongs to dock's org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership || membership.orgId !== dock.orgId) {
      return null
    }
    
    // Return dock without encryptedApiKey for security
    return {
      _id: dock._id,
      _creationTime: dock._creationTime,
      orgId: dock.orgId,
      name: dock.name,
      provider: dock.provider,
      lastSyncStatus: dock.lastSyncStatus,
      lastSyncAt: dock.lastSyncAt,
      lastSyncError: dock.lastSyncError,
      syncInProgress: dock.syncInProgress,
      syncConfig: dock.syncConfig,
      updatedAt: dock.updatedAt,
    }
  },
})
