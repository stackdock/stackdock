/**
 * Provisioning Queries
 * 
 * Queries for provisioning status and operations.
 * Supports real-time subscriptions via Convex useQuery().
 */

import { v } from "convex/values"
import { query } from "../_generated/server"
import { getCurrentUser, checkPermission } from "../lib/rbac"
import { ConvexError } from "convex/values"
import type { Id } from "../_generated/dataModel"

/**
 * Map provisioningState to status for frontend
 */
function mapProvisioningStateToStatus(
  provisioningState: "provisioning" | "provisioned" | "failed" | "deprovisioning" | undefined
): "idle" | "validating" | "provisioning" | "success" | "error" {
  if (!provisioningState) {
    return "idle"
  }
  
  switch (provisioningState) {
    case "provisioning":
      return "provisioning"
    case "provisioned":
      return "success"
    case "failed":
      return "error"
    case "deprovisioning":
      return "provisioning" // Show as provisioning during deprovisioning
    default:
      return "idle"
  }
}

/**
 * Get provisioning status for a given provisionId
 * 
 * The provisionId can be:
 * - A resourceId (Id from universal table) - directly query the resource
 * - An sstResourceId - query by sstResourceId and sstStackName
 * - A providerResourceId - query by providerResourceId (with dockId if available)
 * 
 * Supports real-time subscriptions via Convex useQuery().
 * 
 * @param provisionId - Provision tracking ID (resourceId, sstResourceId, or providerResourceId)
 * @returns Provisioning status with resource metadata
 * 
 * @example
 * ```typescript
 * // In frontend component
 * const status = useQuery(api.provisioning.queries.getProvisionStatus, {
 *   provisionId: resourceId
 * })
 * ```
 */
export const getProvisionStatus = query({
  args: {
    provisionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getCurrentUser(ctx)

    // Try to find resource in universal tables
    // provisionId could be:
    // 1. A resourceId (Id from universal table) - try direct lookup
    // 2. An sstResourceId - query by sstResourceId
    // 3. A providerResourceId - query by providerResourceId

    const tableTypes: Array<"servers" | "webServices" | "databases" | "domains"> = [
      "servers",
      "webServices",
      "databases",
      "domains",
    ]

    let resource: any = null
    let resourceType: "server" | "webService" | "database" | "domain" | null = null
    let foundTable: typeof tableTypes[number] | null = null

    // First, try direct lookup (if provisionId is a resourceId)
    for (const tableType of tableTypes) {
      try {
        const possibleResource = await ctx.db.get(args.provisionId as Id<typeof tableType>)
        if (possibleResource) {
          resource = possibleResource
          foundTable = tableType
          resourceType =
            tableType === "servers"
              ? "server"
              : tableType === "webServices"
              ? "webService"
              : tableType === "databases"
              ? "database"
              : "domain"
          break
        }
      } catch {
        // Invalid ID format, continue searching
      }
    }

    // If not found by direct lookup, try querying by sstResourceId or providerResourceId
    if (!resource) {
      for (const tableType of tableTypes) {
        // Try querying by sstResourceId using the by_sst_resource index
        const bySstResource = await ctx.db
          .query(tableType)
          .withIndex("by_sst_resource", (q) =>
            q.eq("sstResourceId", args.provisionId)
          )
          .first()

        if (bySstResource) {
          resource = bySstResource
          foundTable = tableType
          resourceType =
            tableType === "servers"
              ? "server"
              : tableType === "webServices"
              ? "webService"
              : tableType === "databases"
              ? "database"
              : "domain"
          break
        }

        // Try querying by providerResourceId (no index, so this is slower)
        // Only do this if we haven't found it yet
        if (!resource) {
          const byProviderResource = await ctx.db
            .query(tableType)
            .withIndex("by_dock_resource", (q) =>
              q.eq("providerResourceId", args.provisionId)
            )
            .first()

          if (byProviderResource) {
            resource = byProviderResource
            foundTable = tableType
            resourceType =
              tableType === "servers"
                ? "server"
                : tableType === "webServices"
                ? "webService"
                : tableType === "databases"
                ? "database"
                : "domain"
            break
          }
        }
      }
    }

    // If still not found, return error
    if (!resource || !foundTable || !resourceType) {
      throw new ConvexError(`Provisioning resource not found: ${args.provisionId}`)
    }

    // Verify user has access to the resource's org
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      resource.orgId,
      "provisioning:read"
    )

    // Also check provisioning:full as fallback
    if (!hasPermission) {
      const hasFullPermission = await checkPermission(
        ctx,
        user._id,
        resource.orgId,
        "provisioning:full"
      )
      if (!hasFullPermission) {
        throw new ConvexError(
          "Permission denied: provisioning:read or provisioning:full permission required"
        )
      }
    }

    // Get dock for provider information
    const dock = await ctx.db.get(resource.dockId)
    if (!dock) {
      throw new ConvexError("Dock not found")
    }

    // Map provisioningState to frontend status
    const status = mapProvisioningStateToStatus(resource.provisioningState)

    // Calculate progress (rough estimate based on state)
    let progress: number | undefined
    if (status === "provisioning") {
      progress = 50 // Show 50% while provisioning
    } else if (status === "success") {
      progress = 100
    } else if (status === "error") {
      progress = 0
    } else {
      progress = 0
    }

    // Extract error message if provisioning failed
    let error: string | undefined
    if (status === "error" && resource.provisioningState === "failed") {
      // Check if there's an error in fullApiData or use a generic message
      error = resource.fullApiData?.error?.message || "Provisioning failed"
    }

    // Return status object
    return {
      provisionId: args.provisionId,
      status,
      resourceId: resource._id as Id<typeof foundTable>,
      resourceType,
      provider: resource.provider,
      dockId: resource.dockId,
      error,
      progress,
      createdAt: resource.provisionedAt || resource._creationTime,
      updatedAt: resource.updatedAt || resource._creationTime,
      // Additional metadata
      provisioningSource: resource.provisioningSource || "api",
      sstResourceId: resource.sstResourceId,
      sstStackName: resource.sstStackName,
      provisioningState: resource.provisioningState,
    }
  },
})

/**
 * List all provisioning operations for an organization
 * 
 * Returns all resources with provisioning metadata for the user's organization.
 * Supports real-time subscriptions.
 * 
 * @param orgId - Organization ID (optional, defaults to user's org)
 * @returns Array of provisioning status objects
 */
export const listProvisioningOperations = query({
  args: {
    orgId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getCurrentUser(ctx)

    // Get user's org from memberships if orgId not provided
    let orgId = args.orgId
    if (!orgId) {
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first()

      if (!membership) {
        return []
      }

      orgId = membership.orgId
    }

    // Verify user has access to the org
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      orgId,
      "provisioning:read"
    )

    if (!hasPermission) {
      const hasFullPermission = await checkPermission(
        ctx,
        user._id,
        orgId,
        "provisioning:full"
      )
      if (!hasFullPermission) {
        throw new ConvexError(
          "Permission denied: provisioning:read or provisioning:full permission required"
        )
      }
    }

    // Query all universal tables for resources with provisioning metadata
    const tableTypes: Array<"servers" | "webServices" | "databases" | "domains"> = [
      "servers",
      "webServices",
      "databases",
      "domains",
    ]

    const operations: Array<{
      provisionId: string
      status: "idle" | "validating" | "provisioning" | "success" | "error"
      resourceId: Id<"servers" | "webServices" | "databases" | "domains">
      resourceType: "server" | "webService" | "database" | "domain"
      provider: string
      dockId: Id<"docks">
      createdAt: number
      updatedAt: number
    }> = []

    for (const tableType of tableTypes) {
      const resources = await ctx.db
        .query(tableType)
        .withIndex("by_orgId", (q) => q.eq("orgId", orgId!))
        .filter((q) => q.neq(q.field("provisioningSource"), undefined))
        .collect()

      for (const resource of resources) {
        const resourceType =
          tableType === "servers"
            ? "server"
            : tableType === "webServices"
            ? "webService"
            : tableType === "databases"
            ? "database"
            : "domain"

        const status = mapProvisioningStateToStatus(resource.provisioningState)

        operations.push({
          provisionId: resource._id, // Use resourceId as provisionId
          status,
          resourceId: resource._id as Id<typeof tableType>,
          resourceType,
          provider: resource.provider,
          dockId: resource.dockId,
          createdAt: resource.provisionedAt || resource._creationTime,
          updatedAt: resource.updatedAt || resource._creationTime,
        })
      }
    }

    // Sort by updatedAt (most recent first)
    operations.sort((a, b) => b.updatedAt - a.updatedAt)

    return operations
  },
})
