import { ConvexError } from "convex/values"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import type { Id } from "../_generated/dataModel"

/**
 * Get the currently authenticated user from Clerk
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new ConvexError("Not authenticated")
  }
  
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .first()
  
  if (!user) {
    throw new ConvexError("User not found in database")
  }
  
  return user
}

/**
 * Check if user has a specific permission in an organization
 */
export async function checkPermission(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">,
  permission: string
): Promise<boolean> {
  // Get user's membership in the organization
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_org_user", (q) => 
      q.eq("orgId", orgId).eq("userId", userId)
    )
    .first()
  
  if (!membership) {
    return false
  }
  
  // Get the role
  const role = await ctx.db.get(membership.orgRole as Id<"roles">)
  if (!role) {
    return false
  }
  
  // Parse permission (format: "resource:level")
  // Supports: "projects:full", "docks:read", "provisioning:full", etc.
  const [resource, level] = permission.split(":") as [
    keyof typeof role.permissions,
    "read" | "full"
  ]
  
  const rolePermission = role.permissions[resource]
  
  // Handle undefined permissions (e.g., "provisioning" may be undefined for old roles)
  if (rolePermission === undefined) {
    // Default behavior: if permission doesn't exist, deny access
    // This ensures new permissions (like "provisioning") are opt-in
    return false
  }
  
  // Check permission level
  if (rolePermission === "none") return false
  if (rolePermission === "full") return true
  if (rolePermission === "read" && level === "read") return true
  
  return false
}

/**
 * RBAC middleware for mutations
 * Wraps a mutation handler and checks permissions before execution
 */
export function withRBAC(permission: string) {
  return <Args extends { orgId: Id<"organizations"> }>(
    handler: (ctx: MutationCtx, args: Args, user: any) => Promise<any>
  ) => {
    return async (ctx: MutationCtx, args: Args) => {
      // Get current user
      const user = await getCurrentUser(ctx)
      
      // Check permission
      const hasPermission = await checkPermission(
        ctx,
        user._id,
        args.orgId,
        permission
      )
      
      if (!hasPermission) {
        throw new ConvexError(`Permission denied: ${permission}`)
      }
      
      // Execute handler with user context
      return handler(ctx, args, user)
    }
  }
}
