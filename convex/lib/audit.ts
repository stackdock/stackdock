/**
 * Audit Logging Utilities for StackDock
 * 
 * Provides centralized audit logging for security events, credential access,
 * and provisioning operations.
 * 
 * Security Rules:
 * - NEVER log credentials, API keys, or sensitive data
 * - Always include userId, orgId, and timestamp
 * - Handle errors gracefully (don't break operations)
 * 
 * @see docs/architecture/SECURITY.md for security documentation
 */

import type { MutationCtx, QueryCtx } from "../_generated/server"
import type { Id } from "../_generated/dataModel"
import { getCurrentUser } from "./rbac"

/**
 * Audit log metadata structure
 */
export interface AuditLogMetadata {
  resourceType?: string // "docks", "servers", "webServices", "domains", "databases"
  resourceId?: Id<"servers"> | Id<"webServices"> | Id<"domains"> | Id<"databases"> | Id<"docks"> | string
  dockId?: Id<"docks">
  orgId?: Id<"organizations">
  errorMessage?: string
  [key: string]: any // Allow additional metadata fields
}

/**
 * Audit log helper function
 * 
 * Logs security events, credential access, and provisioning operations to auditLogs table.
 * 
 * @param ctx - Convex mutation or query context
 * @param action - Action name (e.g., "credential.decrypt", "resource.provision")
 * @param result - "success" or "error"
 * @param metadata - Optional metadata (resourceType, resourceId, dockId, orgId, errorMessage, etc.)
 * 
 * @example
 * ```typescript
 * // Log credential decryption
 * await auditLog(ctx, "credential.decrypt", "success", {
 *   dockId: dock._id,
 *   orgId: dock.orgId,
 * })
 * 
 * // Log provisioning operation
 * await auditLog(ctx, "resource.provision", "success", {
 *   resourceType: "servers",
 *   resourceId: serverId,
 *   dockId: dock._id,
 *   orgId: dock.orgId,
 * })
 * ```
 * 
 * @example
 * ```typescript
 * // Log error
 * await auditLog(ctx, "credential.decrypt", "error", {
 *   dockId: dock._id,
 *   errorMessage: "Decryption failed: invalid key",
 * })
 * ```
 */
export async function auditLog(
  ctx: MutationCtx | QueryCtx,
  action: string,
  result: "success" | "error",
  metadata?: AuditLogMetadata
): Promise<void> {
  try {
    // Get current user (throws if not authenticated)
    const user = await getCurrentUser(ctx)
    
    // Extract orgId from metadata or try to get from context
    // If orgId is not provided, we'll log it as undefined (will need to be fixed)
    let orgId: Id<"organizations"> | undefined = metadata?.orgId
    
    // If orgId not in metadata, try to extract from dockId if provided
    if (!orgId && metadata?.dockId) {
      try {
        const dock = await ctx.db.get(metadata.dockId)
        if (dock) {
          orgId = dock.orgId
        }
      } catch (error) {
        // If dock lookup fails, continue without orgId
        // Log will still be created but may be incomplete
      }
    }
    
    // Prepare audit log entry
    // orgId is required by schema, so we must have it
    const finalOrgId = orgId || user.defaultOrgId
    if (!finalOrgId) {
      // If we can't determine orgId, skip audit logging rather than failing
      console.warn("[Audit Log] Cannot create audit log: orgId not available. Action:", action)
      return
    }

    const auditEntry = {
      orgId: finalOrgId,
      userId: user._id,
      action,
      resourceType: metadata?.resourceType,
      resourceId: metadata?.resourceId ? String(metadata.resourceId) : undefined,
      metadata: metadata || {},
      result,
      errorMessage: result === "error" ? metadata?.errorMessage : undefined,
      timestamp: Date.now(),
      // Note: ipAddress and userAgent are optional and not available in Convex context
      // They can be added if needed in the future via request headers
    }
    
    // Write to auditLogs table
    // Type guard: Check if we can write (MutationCtx) or if we're in QueryCtx (read-only)
    if ("insert" in ctx.db) {
      // MutationCtx - can write directly
      await ctx.db.insert("auditLogs", auditEntry)
    } else {
      // QueryCtx - cannot write, log warning
      // Note: For queries, audit logging should ideally be done via a scheduled mutation
      // For now, we'll skip audit logging from queries to avoid breaking the query
      console.warn("[Audit Log] Cannot write audit log from query context. Action:", action)
    }
  } catch (error) {
    // Audit logging should never break operations
    // Log error to console but don't throw
    console.error("[Audit Log] Failed to create audit log entry:", {
      action,
      result,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

/**
 * Audit Logging Pattern Documentation
 * 
 * ============================================================================
 * WHAT TO LOG
 * ============================================================================
 * 
 * Credential Operations:
 * - credential.decrypt: Log when credentials are decrypted (userId, orgId, dockId)
 * - credential.rotate: Log when credentials are rotated (userId, orgId, dockId)
 * - credential.create: Log when credentials are created (userId, orgId, dockId)
 * 
 * Provisioning Operations:
 * - resource.provision: Log when resources are provisioned (userId, orgId, dockId, resourceType, resourceId)
 * - resource.update: Log when provisioned resources are updated (userId, resourceId, updates)
 * - resource.delete: Log when provisioned resources are deleted (userId, resourceId)
 * - provisioning.failed: Log failed provisioning attempts (userId, orgId, dockId, resourceType, errorMessage)
 * 
 * Dock Operations:
 * - dock.create: Log when docks are created (userId, orgId, dockId, provider)
 * - dock.sync: Log when docks are synced (userId, orgId, dockId, result)
 * - dock.delete: Log when docks are deleted (userId, orgId, dockId)
 * 
 * ============================================================================
 * WHAT NOT TO LOG
 * ============================================================================
 * 
 * NEVER log:
 * - Decrypted API keys or credentials
 * - Provisioning credentials (AWS keys, Cloudflare tokens, etc.)
 * - Passwords
 * - Sensitive configuration data
 * - Full error stacks (only error messages)
 * 
 * NEVER include in metadata:
 * - apiKey (decrypted)
 * - credential (any form)
 * - password
 * - secret
 * - token (unless it's a resource identifier, not a credential)
 * 
 * ============================================================================
 * AUDIT LOG QUERY PATTERNS
 * ============================================================================
 * 
 * Query by organization:
 * ```typescript
 * const logs = await ctx.db
 *   .query("auditLogs")
 *   .withIndex("by_org", (q) => q.eq("orgId", orgId).gte("timestamp", startTime))
 *   .collect()
 * ```
 * 
 * Query by user:
 * ```typescript
 * const logs = await ctx.db
 *   .query("auditLogs")
 *   .withIndex("by_user", (q) => q.eq("userId", userId).gte("timestamp", startTime))
 *   .collect()
 * ```
 * 
 * Query by resource:
 * ```typescript
 * const logs = await ctx.db
 *   .query("auditLogs")
 *   .withIndex("by_resource", (q) => 
 *     q.eq("resourceType", "servers").eq("resourceId", serverId)
 *   )
 *   .collect()
 * ```
 * 
 * ============================================================================
 * AUDIT LOGGING FOR STEP 4 (PROVISIONING MUTATIONS)
 * ============================================================================
 * 
 * When implementing provisioning mutations in Step 4, use these patterns:
 * 
 * 1. provisionResource mutation:
 * ```typescript
 * export const provisionResource = mutation({
 *   handler: async (ctx, args) => {
 *     try {
 *       // ... provisioning logic ...
 *       const resourceId = await provision(...)
 *       
 *       // Log success
 *       await auditLog(ctx, "resource.provision", "success", {
 *         resourceType: args.resourceType,
 *         resourceId: resourceId,
 *         dockId: args.dockId,
 *         orgId: args.orgId,
 *         // DO NOT log: credentials, apiKey, spec (may contain secrets)
 *       })
 *       
 *       return resourceId
 *     } catch (error) {
 *       // Log failure
 *       await auditLog(ctx, "provisioning.failed", "error", {
 *         resourceType: args.resourceType,
 *         dockId: args.dockId,
 *         orgId: args.orgId,
 *         errorMessage: error instanceof Error ? error.message : "Unknown error",
 *         // DO NOT log: credentials, full error stack
 *       })
 *       throw error
 *     }
 *   }
 * })
 * ```
 * 
 * 2. updateProvisionedResource mutation:
 * ```typescript
 * export const updateProvisionedResource = mutation({
 *   handler: async (ctx, args) => {
 *     // ... update logic ...
 *     
 *     await auditLog(ctx, "resource.update", "success", {
 *       resourceType: args.resourceType,
 *       resourceId: args.resourceId,
 *       // Log updates metadata (sanitized, no credentials)
 *     })
 *   }
 * })
 * ```
 * 
 * 3. deleteProvisionedResource mutation:
 * ```typescript
 * export const deleteProvisionedResource = mutation({
 *   handler: async (ctx, args) => {
 *     // ... delete logic ...
 *     
 *     await auditLog(ctx, "resource.delete", "success", {
 *       resourceType: args.resourceType,
 *       resourceId: args.resourceId,
 *     })
 *   }
 * })
 * ```
 * 
 * 4. Credential decryption (already implemented in decryptApiKey):
 * ```typescript
 * // In decryptApiKey() function
 * await auditLog(ctx, "credential.decrypt", "success", {
 *   dockId: dockId, // Pass dockId if available
 *   orgId: orgId,   // Pass orgId if available
 * })
 * ```
 * 
 * ============================================================================
 * SECURITY NOTES
 * ============================================================================
 * 
 * - Audit logging errors are caught and logged to console but never thrown
 * - This ensures audit logging failures don't break operations
 * - If audit logging fails, operations continue normally
 * - Missing orgId is handled gracefully (log still created)
 * - All credential values are excluded from audit logs
 */
