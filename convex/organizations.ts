import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getCurrentUser } from "./lib/rbac"

/**
 * Create a new organization
 */
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Create organization
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      ownerId: user._id,
    })
    
    // Create default Admin role
    const adminRoleId = await ctx.db.insert("roles", {
      orgId,
      name: "Admin",
      permissions: {
        projects: "full",
        resources: "full",
        docks: "full",
        operations: "full",
        settings: "full",
      },
    })
    
    // Add creator as member with Admin role
    await ctx.db.insert("memberships", {
      orgId,
      userId: user._id,
      orgRole: adminRoleId,
    })
    
    // Update user's default org
    await ctx.db.patch(user._id, {
      defaultOrgId: orgId,
    })
    
    return orgId
  },
})

/**
 * List organizations user belongs to
 */
export const list = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect()
    
    const orgs = await Promise.all(
      memberships.map((m) => ctx.db.get(m.orgId))
    )
    
    return orgs.filter((org): org is NonNullable<typeof org> => org !== null)
  },
})
