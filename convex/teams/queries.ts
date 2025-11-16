/**
 * Team Queries
 * 
 * Fetch teams for the current user's organization
 */

import { v } from "convex/values"
import { query } from "../_generated/server"
import { getCurrentUser } from "../lib/rbac"
import { ConvexError } from "convex/values"

/**
 * List all teams for the current user's organization
 */
export const listTeams = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Verify user belongs to org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_org_user", (q) => q.eq("orgId", args.orgId).eq("userId", user._id))
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized")
    }
    
    // Return teams
    return await ctx.db
      .query("teams")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect()
  },
})
