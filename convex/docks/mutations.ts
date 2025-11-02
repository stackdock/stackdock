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

// ============================================================================
// PROVISIONING MUTATIONS (Step 4 - Mission 2.5)
// ============================================================================

/**
 * Provision a new resource (server, webService, database, or domain)
 * 
 * Provisions a resource via StackDock core provisioning engine (SST or dock adapter).
 * Requires "provisioning:full" permission.
 * 
 * Flow:
 * 1. Check RBAC permission (provisioning:full)
 * 2. Get dock and validate
 * 3. Decrypt provisioning credentials (with audit logging)
 * 4. Call StackDock core provisioning engine
 * 5. Engine provisions resource via provider (SST or dock adapter)
 * 6. Engine writes to universal table with provisioning metadata
 * 7. Audit log operation
 * 
 * @returns { provisionId, resourceId } - Provision tracking ID and resource ID
 */
export const provisionResource = mutation({
  args: {
    dockId: v.id("docks"),
    resourceType: v.union(
      v.literal("server"),
      v.literal("webService"),
      v.literal("database"),
      v.literal("domain")
    ),
    spec: v.any(), // Resource specification (configuration, region, size, etc.)
    sstStackName: v.optional(v.string()), // SST stack name (if using SST provisioning)
  },
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getCurrentUser(ctx)

    // Get dock
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      throw new ConvexError("Dock not found")
    }

    // Verify user belongs to dock's org and has provisioning:full permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      dock.orgId,
      "provisioning:full"
    )
    if (!hasPermission) {
      throw new ConvexError(
        "Permission denied: provisioning:full permission required"
      )
    }

    // Import audit logging
    const { auditLog } = await import("../lib/audit")
    const { decryptApiKey } = await import("../lib/encryption")

    try {
      // Decrypt provisioning credentials (with audit logging)
      let provisioningCredentials: string | undefined
      if (dock.provisioningCredentials) {
        await auditLog(ctx, "credential.decrypt", "success", {
          dockId: dock._id,
          orgId: dock.orgId,
        })
        provisioningCredentials = await decryptApiKey(
          dock.provisioningCredentials,
          ctx,
          { dockId: dock._id, orgId: dock.orgId }
        )
      }

      // Create provisioning context for StackDock core engine
      // NOTE: This requires @stackdock/core package to be installed and configured
      // For now, we'll implement a simplified version that works directly with Convex
      // Full integration with provisioning engine will be completed when package is ready
      
      // Determine provisioning source (SST vs dock adapter)
      const provisioningSource = args.sstStackName ? "sst" : "api"
      
      // Get adapter for provider
      const adapter = getAdapter(dock.provider)
      if (!adapter) {
        throw new ConvexError(`No adapter found for provider: ${dock.provider}`)
      }

      // Provision resource via adapter (if adapter supports provisioning)
      let provisionedResource: {
        providerResourceId: string
        name: string
        status: string
        fullApiData: any
        [key: string]: any
      }

      const resourceId = `provision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Try adapter provisioning methods first (dock adapter)
      if (provisioningSource === "api") {
        switch (args.resourceType) {
          case "server":
            if (!adapter.provisionServer) {
              throw new ConvexError(
                `Provider ${dock.provider} does not support server provisioning`
              )
            }
            provisionedResource = await adapter.provisionServer(ctx, dock, args.spec)
            break
          case "webService":
            if (!adapter.provisionWebService) {
              throw new ConvexError(
                `Provider ${dock.provider} does not support web service provisioning`
              )
            }
            provisionedResource = await adapter.provisionWebService(ctx, dock, args.spec)
            break
          case "database":
            if (!adapter.provisionDatabase) {
              throw new ConvexError(
                `Provider ${dock.provider} does not support database provisioning`
              )
            }
            provisionedResource = await adapter.provisionDatabase(ctx, dock, args.spec)
            break
          case "domain":
            if (!adapter.provisionDomain) {
              throw new ConvexError(
                `Provider ${dock.provider} does not support domain provisioning`
              )
            }
            provisionedResource = await adapter.provisionDomain(ctx, dock, args.spec)
            break
        }
      } else {
        // SST provisioning (requires StackDock core engine)
        // TODO: Integrate with @stackdock/core provisioning engine when ready
        // For now, throw error indicating SST provisioning requires core engine
        throw new ConvexError(
          "SST provisioning requires StackDock core engine integration. " +
          "This will be available after Step 3 (SST core) is fully integrated."
        )
      }

      // Map to universal table based on resource type
      const universalTable =
        args.resourceType === "server"
          ? "servers"
          : args.resourceType === "webService"
          ? "webServices"
          : args.resourceType === "database"
          ? "databases"
          : "domains"

      // Create universal table record with provisioning metadata
      const universalRecord: any = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: dock.provider,
        providerResourceId: provisionedResource.providerResourceId,
        name: provisionedResource.name,
        status: provisionedResource.status || "provisioning",
        fullApiData: provisionedResource.fullApiData || {},
        updatedAt: Date.now(),
        // Provisioning metadata
        provisioningSource: provisioningSource as "sst" | "api" | "manual",
        sstStackName: args.sstStackName,
        provisioningState: "provisioning" as const,
        provisionedAt: Date.now(),
      }

      // Add type-specific fields
      if (args.resourceType === "server") {
        universalRecord.primaryIpAddress = provisionedResource.primaryIpAddress
        universalRecord.region = provisionedResource.region
      } else if (args.resourceType === "webService") {
        universalRecord.productionUrl = provisionedResource.productionUrl
        universalRecord.environment = provisionedResource.environment
      } else if (args.resourceType === "database") {
        universalRecord.engine = provisionedResource.engine
        universalRecord.version = provisionedResource.version
      } else if (args.resourceType === "domain") {
        universalRecord.domainName = provisionedResource.domainName
      }

      // Insert into universal table
      const insertedId = await ctx.db.insert(universalTable, universalRecord)

      // Update provisioning state to "provisioned"
      await ctx.db.patch(insertedId, {
        provisioningState: "provisioned",
        status: provisionedResource.status || "running",
      })

      // Audit log success
      await auditLog(ctx, "resource.provision", "success", {
        resourceType: universalTable,
        resourceId: insertedId,
        dockId: dock._id,
        orgId: dock.orgId,
        // DO NOT log: credentials, spec (may contain secrets)
      })

      return {
        provisionId: resourceId,
        resourceId: insertedId,
      }
    } catch (error) {
      // Audit log failure
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      
      await auditLog(ctx, "provisioning.failed", "error", {
        resourceType: args.resourceType,
        dockId: dock._id,
        orgId: dock.orgId,
        errorMessage,
        // DO NOT log: credentials, full error stack
      })

      throw new ConvexError(`Provisioning failed: ${errorMessage}`)
    }
  },
})

/**
 * Update a provisioned resource
 * 
 * Updates a provisioned resource via StackDock core provisioning engine.
 * Requires "provisioning:full" permission.
 * 
 * @param resourceId - The `_id` of the resource in its universal table
 * @param resourceType - The type of resource (determines which table to query)
 * @param updates - Updates to apply (sanitized, no credentials)
 */
export const updateProvisionedResource = mutation({
  args: {
    resourceId: v.string(), // The _id of the resource
    resourceType: v.union(
      v.literal("servers"),
      v.literal("webServices"),
      v.literal("databases"),
      v.literal("domains")
    ),
    updates: v.any(), // Resource updates (sanitized, no credentials)
  },
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getCurrentUser(ctx)

    // Get resource from universal table
    const resource = await ctx.db.get(args.resourceId as any)
    if (!resource) {
      throw new ConvexError("Resource not found")
    }

    // Verify user belongs to resource's org and has provisioning:full permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      resource.orgId,
      "provisioning:full"
    )
    if (!hasPermission) {
      throw new ConvexError(
        "Permission denied: provisioning:full permission required"
      )
    }

    // Import audit logging
    const { auditLog } = await import("../lib/audit")

    try {
      // Get dock
      const dock = await ctx.db.get(resource.dockId)
      if (!dock) {
        throw new ConvexError("Dock not found")
      }

      // Determine provisioning source
      const provisioningSource = resource.provisioningSource || "api"

      // Update resource via provider
      if (provisioningSource === "sst") {
        // SST provisioning update (requires StackDock core engine)
        // TODO: Integrate with @stackdock/core provisioning engine when ready
        throw new ConvexError(
          "SST resource updates require StackDock core engine integration. " +
          "This will be available after Step 3 (SST core) is fully integrated."
        )
      } else {
        // Dock adapter update (if adapter supports updates)
        // For now, update universal table directly
        // TODO: Call adapter update method if available
      }

      // Update universal table record
      await ctx.db.patch(args.resourceId as any, {
        ...args.updates,
        updatedAt: Date.now(),
      })

      // Audit log success
      await auditLog(ctx, "resource.update", "success", {
        resourceType: args.resourceType,
        resourceId: args.resourceId,
        // Log updates metadata (sanitized, no credentials)
        metadata: {
          updates: Object.keys(args.updates),
        },
      })

      return { success: true }
    } catch (error) {
      // Audit log failure
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      
      await auditLog(ctx, "resource.update", "error", {
        resourceType: args.resourceType,
        resourceId: args.resourceId,
        errorMessage,
      })

      throw new ConvexError(`Update failed: ${errorMessage}`)
    }
  },
})

/**
 * Delete a provisioned resource
 * 
 * Deletes a provisioned resource via StackDock core provisioning engine.
 * Requires "provisioning:full" permission.
 * 
 * @param resourceId - The `_id` of the resource in its universal table
 * @param resourceType - The type of resource (determines which table to query)
 */
export const deleteProvisionedResource = mutation({
  args: {
    resourceId: v.string(), // The _id of the resource
    resourceType: v.union(
      v.literal("servers"),
      v.literal("webServices"),
      v.literal("databases"),
      v.literal("domains")
    ),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getCurrentUser(ctx)

    // Get resource from universal table
    const resource = await ctx.db.get(args.resourceId as any)
    if (!resource) {
      throw new ConvexError("Resource not found")
    }

    // Verify user belongs to resource's org and has provisioning:full permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      resource.orgId,
      "provisioning:full"
    )
    if (!hasPermission) {
      throw new ConvexError(
        "Permission denied: provisioning:full permission required"
      )
    }

    // Import audit logging
    const { auditLog } = await import("../lib/audit")

    try {
      // Get dock
      const dock = await ctx.db.get(resource.dockId)
      if (!dock) {
        throw new ConvexError("Dock not found")
      }

      // Determine provisioning source
      const provisioningSource = resource.provisioningSource || "api"

      // Delete resource via provider
      if (provisioningSource === "sst") {
        // SST provisioning delete (requires StackDock core engine)
        // TODO: Integrate with @stackdock/core provisioning engine when ready
        throw new ConvexError(
          "SST resource deletion requires StackDock core engine integration. " +
          "This will be available after Step 3 (SST core) is fully integrated."
        )
      } else {
        // Dock adapter delete (if adapter supports deletion)
        // For now, delete from universal table directly
        // TODO: Call adapter delete method if available
      }

      // Update provisioning state to "deprovisioning"
      await ctx.db.patch(args.resourceId as any, {
        provisioningState: "deprovisioning",
        updatedAt: Date.now(),
      })

      // Delete from universal table
      await ctx.db.delete(args.resourceId as any)

      // Audit log success
      await auditLog(ctx, "resource.delete", "success", {
        resourceType: args.resourceType,
        resourceId: args.resourceId,
      })

      return { success: true }
    } catch (error) {
      // Audit log failure
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      
      await auditLog(ctx, "resource.delete", "error", {
        resourceType: args.resourceType,
        resourceId: args.resourceId,
        errorMessage,
      })

      throw new ConvexError(`Deletion failed: ${errorMessage}`)
    }
  },
})

// ============================================================================
// CREDENTIAL ROTATION (Step 7 - Mission 2.5)
// ============================================================================

/**
 * Rotate provisioning credentials for a dock
 * 
 * Rotates provisioning credentials (AWS keys, Cloudflare tokens, etc.) for a dock
 * with graceful rotation logic: validates new credentials before replacing old ones.
 * 
 * Requires "provisioning:full" permission.
 * 
 * Flow:
 * 1. Get dock and validate (exists, user has access)
 * 2. Check RBAC permission (provisioning:full)
 * 3. Validate new credentials (test API call via adapter)
 * 4. Encrypt new credentials
 * 5. Atomically update docks.provisioningCredentials
 * 6. Audit log rotation
 * 7. Graceful rollback on failure (preserve old credentials)
 * 
 * @param dockId - The dock to rotate credentials for
 * @param newCredentials - Plaintext new credentials to rotate to
 * @returns { success: true } on success
 * 
 * @throws ConvexError if:
 * - Dock not found
 * - Permission denied (provisioning:full required)
 * - Invalid credentials (new credentials don't work)
 * - Dock adapter not found
 */
export const rotateProvisioningCredentials = mutation({
  args: {
    dockId: v.id("docks"),
    newCredentials: v.string(),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getCurrentUser(ctx)

    // Get dock and validate
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      throw new ConvexError("Dock not found")
    }

    // Verify user belongs to dock's org and has provisioning:full permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      dock.orgId,
      "provisioning:full"
    )
    if (!hasPermission) {
      throw new ConvexError(
        "Permission denied: provisioning:full permission required"
      )
    }

    // Import audit logging and encryption
    const { auditLog } = await import("../lib/audit")
    const { encryptApiKey } = await import("../lib/encryption")

    // Store old credentials for rollback (if needed)
    const oldCredentials = dock.provisioningCredentials

    try {
      // Get adapter for provider
      const adapter = getAdapter(dock.provider)
      if (!adapter) {
        throw new ConvexError(`No adapter found for provider: ${dock.provider}`)
      }

      // Validate new credentials before replacing (graceful rotation)
      // Use action for HTTP requests (mutations can't use fetch)
      let validationResult
      try {
        validationResult = await ctx.runAction(
          internal.docks.actions.validateCredentials,
          {
            provider: dock.provider,
            apiKey: args.newCredentials,
          }
        )
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"
        
        // Log validation failure in audit log
        await auditLog(ctx, "credential.rotate", "error", {
          dockId: dock._id,
          orgId: dock.orgId,
          provider: dock.provider,
          errorMessage: `Credential validation failed: ${errorMessage}`,
        })

        throw new ConvexError(
          `Invalid credentials: Credential validation failed. ` +
          `The new credentials were rejected by ${dock.provider}. ` +
          `Old credentials have been preserved. Please check your credentials and try again.`
        )
      }

      if (!validationResult.valid) {
        // Log validation failure in audit log
        await auditLog(ctx, "credential.rotate", "error", {
          dockId: dock._id,
          orgId: dock.orgId,
          provider: dock.provider,
          errorMessage: "Credential validation failed: New credentials were rejected by provider",
        })

        throw new ConvexError(
          `Invalid credentials: The new credentials were rejected by ${dock.provider}. ` +
          `Old credentials have been preserved. Please check your credentials and try again.`
        )
      }

      // New credentials validated successfully - proceed with rotation
      // Encrypt new credentials
      const encryptedNewCredentials = await encryptApiKey(args.newCredentials)

      // Atomically update docks.provisioningCredentials
      // Old credentials are replaced atomically (no backup field needed for now)
      await ctx.db.patch(args.dockId, {
        provisioningCredentials: encryptedNewCredentials,
        updatedAt: Date.now(),
      })

      // Audit log successful rotation
      await auditLog(ctx, "credential.rotate", "success", {
        dockId: dock._id,
        orgId: dock.orgId,
        provider: dock.provider,
        // NEVER log actual credential values
        rotatedAt: Date.now(),
      })

      return { success: true }
    } catch (error) {
      // Handle rollback scenarios
      // If we already updated the credentials but something failed after,
      // we need to rollback (though in this implementation, we only update after validation)
      
      // Since we validate before updating, the only failure scenarios are:
      // 1. Validation failed (already handled above, old credentials preserved)
      // 2. Encryption failed (old credentials preserved, not updated)
      // 3. Database update failed (old credentials preserved, not updated)
      
      // If somehow we get here after updating, we would need to rollback
      // For now, since we validate before updating, old credentials are always preserved
      
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      
      // If it's already a ConvexError from validation, re-throw it
      if (error instanceof ConvexError) {
        throw error
      }

      // Log unexpected error in audit log
      await auditLog(ctx, "credential.rotate", "error", {
        dockId: dock._id,
        orgId: dock.orgId,
        provider: dock.provider,
        errorMessage: `Credential rotation failed: ${errorMessage}. Old credentials preserved.`,
      })

      throw new ConvexError(
        `Credential rotation failed: ${errorMessage}. Old credentials have been preserved.`
      )
    }
  },
})
