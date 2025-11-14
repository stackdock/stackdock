/**
 * Resource Queries
 * 
 * Fetch servers, webServices, domains, databases, blockVolumes, and buckets from universal tables.
 * All queries filter by user's organization for RBAC.
 */

import { query } from "../_generated/server"
import { getCurrentUser } from "../lib/rbac"

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
    
    // Fetch all buckets for this org
    const buckets = await ctx.db
      .query("buckets")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return buckets
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
