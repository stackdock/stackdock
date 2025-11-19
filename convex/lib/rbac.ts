import { ConvexError } from "convex/values"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import type { Id } from "../_generated/dataModel"

// ============================================================================
// TYPE-SAFE PERMISSIONS
// ============================================================================

/**
 * Resource types in the RBAC system
 * 
 * These types are defined here for Convex compatibility. For external packages,
 * use types from @stackdock/shared package.
 * 
 * @see packages/shared/src/rbac.ts for shared type definitions
 */
export type RBACResource = 
  | "projects"
  | "resources"
  | "docks"
  | "operations"
  | "settings"
  | "provisioning"
  | "monitoring"

/**
 * Permission levels in the RBAC system
 */
export type RBACLevel = "none" | "read" | "full"

/**
 * Permission string format: "resource:level"
 * 
 * This provides compile-time type safety for permission checks.
 * 
 * @example
 * ```typescript
 * const permission: Permission = "docks:full" // OK
 * const badPermission: Permission = "invalid:permission" // Type error!
 * ```
 */
export type Permission = `${RBACResource}:${RBACLevel}`

/**
 * Common permission constants
 * 
 * Use these for consistency and autocomplete.
 */
export const Permissions = {
  // Projects
  PROJECTS_FULL: "projects:full" as const,
  PROJECTS_READ: "projects:read" as const,
  
  // Resources (infrastructure)
  RESOURCES_FULL: "resources:full" as const,
  RESOURCES_READ: "resources:read" as const,
  
  // Docks (provider connections)
  DOCKS_FULL: "docks:full" as const,
  DOCKS_READ: "docks:read" as const,
  
  // Operations (backup/restore)
  OPERATIONS_FULL: "operations:full" as const,
  OPERATIONS_READ: "operations:read" as const,
  
  // Settings (org/team/role management)
  SETTINGS_FULL: "settings:full" as const,
  SETTINGS_READ: "settings:read" as const,
  
  // Provisioning (infrastructure provisioning)
  PROVISIONING_FULL: "provisioning:full" as const,
  PROVISIONING_READ: "provisioning:read" as const,
  
  // Monitoring (monitoring and alerting)
  MONITORING_FULL: "monitoring:full" as const,
  MONITORING_READ: "monitoring:read" as const,
} satisfies Record<string, Permission>

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
 * 
 * **Type Safety**: Accepts Permission type for compile-time validation.
 * 
 * @param ctx - Convex context
 * @param userId - User ID
 * @param orgId - Organization ID
 * @param permission - Permission to check (e.g., "docks:full")
 * @returns True if user has permission
 * 
 * @example
 * ```typescript
 * // With type safety
 * const hasAccess = await checkPermission(ctx, user._id, orgId, Permissions.DOCKS_FULL)
 * 
 * // Backward compatible
 * const hasAccess = await checkPermission(ctx, user._id, orgId, "docks:full")
 * ```
 */
export async function checkPermission(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">,
  permission: Permission
): Promise<boolean>
export async function checkPermission(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">,
  permission: string
): Promise<boolean>
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
 * 
 * **Type Safety**: Accepts Permission type for compile-time validation.
 * 
 * @param permission - Permission required to execute the mutation
 * @returns Middleware function that wraps the handler
 * 
 * @example
 * ```typescript
 * // With type safety
 * export const createDock = mutation({
 *   handler: withRBAC(Permissions.DOCKS_FULL)(async (ctx, args, user) => {
 *     // ...
 *   })
 * })
 * 
 * // Backward compatible
 * export const createDock = mutation({
 *   handler: withRBAC("docks:full")(async (ctx, args, user) => {
 *     // ...
 *   })
 * })
 * ```
 */
export function withRBAC(permission: Permission): <Args extends { orgId: Id<"organizations"> }>(
  handler: (ctx: MutationCtx, args: Args, user: any) => Promise<any>
) => (ctx: MutationCtx, args: Args) => Promise<any>
export function withRBAC(permission: string): <Args extends { orgId: Id<"organizations"> }>(
  handler: (ctx: MutationCtx, args: Args, user: any) => Promise<any>
) => (ctx: MutationCtx, args: Args) => Promise<any>
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
