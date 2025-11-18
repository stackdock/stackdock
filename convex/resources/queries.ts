/**
 * Resource Queries
 * 
 * Fetch servers, webServices, domains, databases, blockVolumes, and buckets from universal tables.
 * All queries filter by user's organization for RBAC.
 * 
 * Includes paginated versions for large datasets.
 */

import { query, internalQuery } from "../_generated/server"
import { v } from "convex/values"
import { getCurrentUser, checkPermission } from "../lib/rbac"
import { ConvexError } from "convex/values"
import type { PaginationResult } from "convex/server"

/**
 * List all servers for the current user's organization
 */
export const listServers = query({
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
    
    // Fetch all servers for this org
    const servers = await ctx.db
      .query("servers")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return servers
  },
})

/**
 * List all web services for the current user's organization
 */
export const listWebServices = query({
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
    
    // Fetch all web services for this org
    const webServices = await ctx.db
      .query("webServices")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return webServices
  },
})

/**
 * List all domains for the current user's organization
 */
export const listDomains = query({
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
    
    // Fetch all domains for this org
    const domains = await ctx.db
      .query("domains")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return domains
  },
})

/**
 * List all databases for the current user's organization
 */
export const listDatabases = query({
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
    
    // Fetch all databases for this org
    const databases = await ctx.db
      .query("databases")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return databases
  },
})

/**
 * List all block volumes for the current user's organization
 */
export const listBlockVolumes = query({
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
    
    // Fetch all block volumes for this org
    const volumes = await ctx.db
      .query("blockVolumes")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return volumes
  },
})

/**
 * List all buckets for the current user's organization
 * 
 * CRITICAL: This query is reactive - Convex useQuery() automatically updates when data changes.
 * No caching issues - Convex handles reactivity automatically via WebSocket subscriptions.
 */
export const listBuckets = query({
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
    
    // Fetch all buckets for this org
    // This query is automatically reactive - Convex will push updates when buckets are deleted
    const buckets = await ctx.db
      .query("buckets")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return buckets
  },
})

/**
 * Internal query: Debug buckets for a specific dock
 * Can be called from CLI: npx convex run resources/queries:debugBuckets --args '{"dockId":"..."}'
 */
export const debugBuckets = internalQuery({
  args: {
    dockId: v.id("docks"),
  },
  handler: async (ctx, args) => {
    const buckets = await ctx.db
      .query("buckets")
      .withIndex("by_dockId", (q) => q.eq("dockId", args.dockId))
      .collect()
    
    return buckets.map(b => ({
      _id: b._id,
      name: b.name,
      providerResourceId: b.providerResourceId,
      provider: b.provider,
      provisioningSource: b.provisioningSource,
      updatedAt: b.updatedAt,
    }))
  },
})

/**
 * Get counts for dashboard stats
 */
export const getCounts = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return { servers: 0, webServices: 0, domains: 0 }
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
    
    // Count servers
    const servers = await ctx.db
      .query("servers")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    // Count web services
    const webServices = await ctx.db
      .query("webServices")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    // Count domains
    const domains = await ctx.db
      .query("domains")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return {
      servers: servers.length,
      webServices: webServices.length,
      domains: domains.length,
    }
  },
})

// == PAGINATED QUERIES ==

/**
 * List servers with pagination
 * 
 * Use this for large datasets (>100 servers) to improve performance.
 */
export const listServersPaginated = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return {
        page: [],
        isDone: true,
        continueCursor: undefined,
      }
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
    
    // Fetch servers with pagination
    const result = await ctx.db
      .query("servers")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .paginate(args.paginationOpts)
    
    return result
  },
})

/**
 * List domains with pagination
 * 
 * Use this for large datasets (>100 domains) to improve performance.
 */
export const listDomainsPaginated = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return {
        page: [],
        isDone: true,
        continueCursor: undefined,
      }
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
    
    // Fetch domains with pagination
    const result = await ctx.db
      .query("domains")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .paginate(args.paginationOpts)
    
    return result
  },
})

/**
 * List databases with pagination
 * 
 * Use this for large datasets (>100 databases) to improve performance.
 */
export const listDatabasesPaginated = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return {
        page: [],
        isDone: true,
        continueCursor: undefined,
      }
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
    
    // Fetch databases with pagination
    const result = await ctx.db
      .query("databases")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .paginate(args.paginationOpts)
    
    return result
  },
})

/**
 * List web services with pagination
 * 
 * Use this for large datasets (>100 web services) to improve performance.
 */
export const listWebServicesPaginated = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return {
        page: [],
        isDone: true,
        continueCursor: undefined,
      }
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
    
    // Fetch web services with pagination
    const result = await ctx.db
      .query("webServices")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .paginate(args.paginationOpts)
    
    return result
  },
})
