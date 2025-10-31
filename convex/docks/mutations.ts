/**
 * Dock Mutations
 * 
 * Create, sync, and manage docks (provider connections)
 */

import { v } from "convex/values"
import { mutation } from "../_generated/server"
import { getCurrentUser, checkPermission } from "../lib/rbac"
import { encryptApiKey } from "../lib/encryption"
import { getAdapter, listProviders } from "./registry"
import { ConvexError } from "convex/values"
import { internal } from "../_generated/api"

/**
 * Create a new dock (provider connection)
 * 
 * Validates credentials, encrypts API key, and creates dock record.
 * Requires "docks:full" permission (org owner only).
 */
export const createDock = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    provider: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getCurrentUser(ctx)

    // Verify user belongs to org and has docks:full permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      args.orgId,
      "docks:full"
    )
    if (!hasPermission) {
      throw new ConvexError(
        "Permission denied: Only organization owners can create docks"
      )
    }

    // Get adapter for provider
    const adapter = getAdapter(args.provider)
    if (!adapter) {
      throw new ConvexError(
        `No adapter found for provider: ${args.provider}. Available: ${listProviders().join(", ")}`
      )
    }

    // Validate credentials before saving (using action for HTTP requests)
    try {
      const validationResult = await ctx.runAction(
        internal.docks.actions.validateCredentials,
        {
          provider: args.provider,
          apiKey: args.apiKey,
        }
      )

      if (!validationResult.valid) {
        throw new ConvexError(
          "Invalid API credentials: The API key was rejected by GridPane (401 Unauthorized). Please check that your API key is correct and has not expired."
        )
      }
    } catch (error) {
      // Provide more detailed error message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      
      // If it's already a ConvexError, re-throw it
      if (error instanceof ConvexError) {
        throw error
      }
      
      throw new ConvexError(
        `Failed to validate credentials: ${errorMessage}. Please check your API key and try again.`
      )
    }

    // Encrypt API key
    const encryptedApiKey = await encryptApiKey(args.apiKey)

    // Create dock record
    const dockId = await ctx.db.insert("docks", {
      orgId: args.orgId,
      name: args.name,
      provider: args.provider,
      encryptedApiKey,
      lastSyncStatus: "pending",
      syncInProgress: false,
      updatedAt: Date.now(),
    })

    return dockId
  },
})

/**
 * Sync a dock (fetch resources from provider API)
 * 
 * Calls adapter sync functions to populate universal tables.
 */
export const syncDock = mutation({
  args: {
    dockId: v.id("docks"),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getCurrentUser(ctx)

    // Get dock
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      throw new ConvexError("Dock not found")
    }

    // Verify user belongs to dock's org and has docks:full permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      dock.orgId,
      "docks:full"
    )
    if (!hasPermission) {
      throw new ConvexError(
        "Permission denied: Only organization owners can sync docks"
      )
    }

    // Get adapter
    const adapter = getAdapter(dock.provider)
    if (!adapter) {
      throw new ConvexError(`No adapter found for provider: ${dock.provider}`)
    }

    // Prevent concurrent syncs
    if (dock.syncInProgress) {
      throw new ConvexError("Sync already in progress")
    }

    // Mark sync as in progress
    await ctx.db.patch(args.dockId, {
      syncInProgress: true,
      lastSyncStatus: "syncing",
      lastSyncAt: Date.now(),
      updatedAt: Date.now(),
    })

    try {
      // Sync resources (call adapter methods)
      if (adapter.syncServers) {
        await adapter.syncServers(ctx, dock)
      }
      if (adapter.syncWebServices) {
        await adapter.syncWebServices(ctx, dock)
      }
      if (adapter.syncDomains) {
        await adapter.syncDomains(ctx, dock)
      }
      if (adapter.syncDatabases) {
        await adapter.syncDatabases(ctx, dock)
      }

      // Mark sync as successful
      await ctx.db.patch(args.dockId, {
        syncInProgress: false,
        lastSyncStatus: "success",
        lastSyncAt: Date.now(),
        lastSyncError: undefined,
        updatedAt: Date.now(),
      })

      return { success: true }
    } catch (error) {
      // Mark sync as failed
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      await ctx.db.patch(args.dockId, {
        syncInProgress: false,
        lastSyncStatus: "error",
        lastSyncError: errorMessage,
        updatedAt: Date.now(),
      })

      throw new ConvexError(`Sync failed: ${errorMessage}`)
    }
  },
})

/**
 * Delete a dock
 * 
 * Note: Does not delete synced resources (servers, webServices, domains)
 * Those remain in universal tables but orphaned from dock.
 */
export const deleteDock = mutation({
  args: {
    dockId: v.id("docks"),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getCurrentUser(ctx)

    // Get dock
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      throw new ConvexError("Dock not found")
    }

    // Verify user belongs to dock's org and has docks:full permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      dock.orgId,
      "docks:full"
    )
    if (!hasPermission) {
      throw new ConvexError(
        "Permission denied: Only organization owners can delete docks"
      )
    }

    // Delete dock
    await ctx.db.delete(args.dockId)

    return { success: true }
  },
})
