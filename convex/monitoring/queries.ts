/**
 * Monitoring Queries
 * 
 * Fetch monitoring resources (monitors, alerts) for the current user's organization
 * 
 * **Terminology Note**: Some providers (like Sentry) call these "issues", but StackDock
 * calls them "alerts" to avoid confusion with GitHub issues, bug trackers, etc.
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
 * Returns issues from all connected monitoring providers (Sentry, Rollbar, etc.)
 * 
 * **Terminology Note**: Sentry calls these "issues", but StackDock uses "alerts" in user-facing
 * contexts to avoid confusion with GitHub issues, bug trackers, etc. Internally, we use "issues"
 * table for backward compatibility and semantic clarity (these are error tracking issues).
 * 
 * @requires monitoring:read permission
 * @returns Array of issue documents from the issues table
 * 
 * @example
 * ```ts
 * const issues = await ctx.runQuery(api.monitoring.queries.listIssues, {})
 * ```
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

/**
 * List all alerts for the current user's organization
 * 
 * **Semantic Alias**: This query returns the same data as `listIssues`, but uses
 * "alerts" terminology for semantic clarity. Sentry calls them "issues", but StackDock
 * uses "alerts" in user-facing contexts to avoid confusion with GitHub issues, bug trackers, etc.
 * 
 * Internally queries the `issues` table (for backward compatibility).
 * 
 * @requires monitoring:read permission
 * @returns Array of alert documents from the issues table
 * 
 * @example
 * ```ts
 * const alerts = await ctx.runQuery(api.monitoring.queries.listAlerts, {})
 * ```
 */
export const listAlerts = query({
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
    
    // Query issues table (backward compatible), return as "alerts"
    const alerts = await ctx.db
      .query("issues")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return alerts
  },
})
