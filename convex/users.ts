import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getCurrentUser } from "./lib/rbac"
import { auditLog } from "./lib/audit"

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
 * Ensure current user exists in database (creates if needed)
 * Call this mutation when user first signs in
 */
export const ensureCurrentUser = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }
    
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()
    
    if (existing) {
      // Log authentication event for existing user
      await auditLog(ctx, "user.login", "success", {
        orgId: existing.defaultOrgId,
      })
      return existing._id
    }
    
    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      name: identity.name || identity.email || 'User',
      email: identity.email || '',
    })
    
    // Log first-time user creation (don't log as auth event since no org yet)
    // Auth event will be logged on subsequent logins once user has an org
    
    return userId
  },
})

/**
 * Get current user (for UI)
 * Returns null if user doesn't exist yet (call ensureCurrentUser first)
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
