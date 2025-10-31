/**
 * Resource Queries
 * 
 * Fetch servers, webServices, and domains from universal tables.
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
