/**
 * Authentication Activity Queries
 * 
 * Provides queries for viewing authentication activity logs in the organization.
 */

import { v } from "convex/values"
import { query } from "../_generated/server"
import { getCurrentUser, checkPermission } from "../lib/rbac"

/**
 * List authentication activity logs for an organization
 * 
 * Returns audit logs filtered to authentication events (user.login)
 * with pagination and date range filtering.
 * 
 * RBAC: Users must have at least "settings:read" permission
 */
export const listAuthActivity = query({
  args: {
    orgId: v.id("organizations"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const user = await getCurrentUser(ctx)
    
    // Check RBAC: user must have at least "settings:read" permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      args.orgId,
      "settings:read"
    )
    
    if (!hasPermission) {
      throw new Error("Permission denied: settings:read required to view auth activity")
    }
    
    // Build query for auth events
    const limit = args.limit || 100
    // Use a higher limit for initial query to account for filtering
    // We'll filter to auth events after, so fetch more than needed
    const queryLimit = Math.min(limit * 5, 1000) // Fetch up to 5x the limit, max 1000
    
    // Query logs with org filter and timestamp filter if provided
    // Use by_org index with timestamp range for efficient querying
    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_org", (q) => {
        if (args.startDate) {
          return q.eq("orgId", args.orgId).gte("timestamp", args.startDate)
        }
        return q.eq("orgId", args.orgId)
      })
      .order("desc")
    
    // Limit documents read to avoid hitting Convex's 32k limit
    const allLogs = await query.take(queryLimit)
    
    // Filter to authentication events and apply end date filter
    const authLogs = allLogs.filter(log => {
      // Filter to auth events (user.login, user.logout, etc.)
      const isAuthEvent = log.action.startsWith("user.") || log.action === "auth.login"
      
      // Apply end date filter if provided
      if (args.endDate && log.timestamp > args.endDate) {
        return false
      }
      
      return isAuthEvent
    })
    
    // Apply limit
    const limitedLogs = authLogs.slice(0, limit)
    
    // Enrich with user names
    const logsWithUsers = await Promise.all(
      limitedLogs.map(async (log) => {
        const logUser = await ctx.db.get(log.userId)
        return {
          ...log,
          userName: logUser?.name || "Unknown User",
          userEmail: logUser?.email || "",
        }
      })
    )
    
    return {
      logs: logsWithUsers,
      total: authLogs.length,
      hasMore: authLogs.length > limit,
    }
  },
})

/**
 * Get authentication activity stats for an organization
 * 
 * Returns summary statistics about authentication activity.
 * 
 * RBAC: Users must have at least "settings:read" permission
 */
export const getAuthActivityStats = query({
  args: {
    orgId: v.id("organizations"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const user = await getCurrentUser(ctx)
    
    // Check RBAC
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      args.orgId,
      "settings:read"
    )
    
    if (!hasPermission) {
      throw new Error("Permission denied: settings:read required to view auth activity")
    }
    
    const days = args.days || 30
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000)
    
    // Query logs with limit to avoid hitting Convex's 32k document limit
    // For stats, we only need a sample - use a reasonable limit
    const maxLogsForStats = 10000 // Reasonable limit for stats calculation
    
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_org", (q) => 
        q.eq("orgId", args.orgId).gte("timestamp", startDate)
      )
      .order("desc")
      .take(maxLogsForStats) // Limit documents read
    
    // Filter to auth events
    const authLogs = logs.filter(log => 
      log.action.startsWith("user.") || log.action === "auth.login"
    )
    
    // Calculate stats
    const totalLogins = authLogs.filter(log => 
      log.action === "user.login" || log.action === "auth.login"
    ).length
    
    const uniqueUsers = new Set(authLogs.map(log => log.userId)).size
    
    const failedAttempts = authLogs.filter(log => 
      log.result === "error"
    ).length
    
    return {
      totalLogins,
      uniqueUsers,
      failedAttempts,
      periodDays: days,
    }
  },
})
