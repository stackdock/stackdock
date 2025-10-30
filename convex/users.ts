import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getCurrentUser } from "./lib/rbac"

/**
 * Sync user from Clerk webhook
 */
export const syncFromClerk = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first()
    
    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
      })
      return existing._id
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        name: args.name,
        email: args.email,
      })
    }
  },
})

/**
 * Get current user (for UI)
 */
export const getCurrent = query({
  handler: async (ctx) => {
    try {
      return await getCurrentUser(ctx)
    } catch {
      return null
    }
  },
})
