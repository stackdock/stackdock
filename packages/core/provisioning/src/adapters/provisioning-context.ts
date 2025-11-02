/**
 * StackDock-specific Provisioning Context
 * 
 * This file is NOT derived from SST.dev - it's a new StackDock component
 * that provides context for provisioning operations.
 */

/**
 * Provisioning Context
 * 
 * PURPOSE:
 * Provides context for provisioning operations (org isolation, RBAC, audit logging).
 * 
 * This is a NEW component for StackDock, not extracted from SST.
 */

// NOTE: Convex types will be available when this package is used in StackDock monorepo
// Type definition here - actual import path depends on monorepo structure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MutationCtx = any // Will be replaced with actual Convex type import

export interface ProvisioningContext {
  /**
   * Organization ID (for RBAC and resource isolation)
   */
  orgId: string

  /**
   * Dock ID (provider connection)
   */
  dockId: string

  /**
   * User ID (for audit logging)
   */
  userId: string

  /**
   * Convex mutation context
   */
  convexCtx: MutationCtx

  /**
   * RBAC context (permissions check)
   */
  rbacContext: {
    hasPermission: boolean
    permission: 'provisioning:full' | 'provisioning:read' | 'provisioning:none'
  }
}

/**
 * Create provisioning context from Convex context
 */
export function createProvisioningContext(
  ctx: MutationCtx,
  orgId: string,
  dockId: string,
  userId: string,
  hasPermission: boolean,
  permission: 'provisioning:full' | 'provisioning:read' | 'provisioning:none'
): ProvisioningContext {
  return {
    orgId,
    dockId,
    userId,
    convexCtx: ctx,
    rbacContext: {
      hasPermission,
      permission,
    },
  }
}
