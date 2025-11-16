/**
 * Monitoring Queries
 * 
 * Fetch monitoring resources (monitors, issues) for the current user's organization
 */

import { v } from "convex/values"
import { query } from "../_generated/server"
import { getCurrentUser, checkPermission } from "../lib/rbac"
import { ConvexError } from "convex/values"

/**
 * List all monitors for the current user's organization
 * 
 * Requires "monitoring:read" permission.
 */
export const listMonitors = query({
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
    
    // Check monitoring:read permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      membership.orgId,
      "monitoring:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: monitoring:read required")
    }
    
    // Get all monitors for this org
    const monitors = await ctx.db
      .query("monitors")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return monitors
  },
})

/**
 * List all issues for the current user's organization
 * 
 * Requires "monitoring:read" permission.
 */
export const listIssues = query({
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
    
    // Check monitoring:read permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      membership.orgId,
      "monitoring:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: monitoring:read required")
    }
    
    // Get all issues for this org
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return issues
  },
})
