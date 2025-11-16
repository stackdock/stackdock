/**
 * Organization Migration Functions
 * 
 * Internal mutations to migrate existing data when schema changes
 */

import { internalMutation } from "../_generated/server"

/**
 * Migration: Add monitoring permission to existing Admin roles
 * 
 * This migration adds monitoring: "full" to all existing Admin roles
 * that don't have it (roles created before monitoring permission was added).
 * 
 * Run from CLI: npx convex run organizations/migrations:addMonitoringToAdminRoles
 */
export const addMonitoringToAdminRoles = internalMutation({
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect()
    
    let updated = 0
    let skipped = 0
    
    for (const role of roles) {
      // Only update Admin roles
      if (role.name !== "Admin") {
        skipped++
        continue
      }
      
      // Skip if already has monitoring permission
      if (role.permissions.monitoring !== undefined) {
        skipped++
        continue
      }
      
      // Add monitoring: "full" to Admin roles
      await ctx.db.patch(role._id, {
        permissions: {
          ...role.permissions,
          monitoring: "full" as const,
        },
      })
      
      updated++
      console.log(`[Migration] Added monitoring:full to Admin role in org ${role.orgId}`)
    }
    
    console.log(`[Migration] ✅ Updated ${updated} Admin roles, skipped ${skipped} (non-Admin or already had monitoring)`)
    return { updated, skipped }
  },
})

/**
 * Migration: Add provisioning and monitoring permissions to all existing roles
 * 
 * Adds both provisioning: "full" and monitoring: "full" to Admin roles,
 * and monitoring: "read" to other roles (if they have read access to other resources).
 * 
 * Run from CLI: npx convex run organizations/migrations:addNewPermissionsToRoles
 */
export const addNewPermissionsToRoles = internalMutation({
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect()
    
    let updated = 0
    let skipped = 0
    
    for (const role of roles) {
      const updates: {
        monitoring?: "full" | "read" | "none"
        provisioning?: "full" | "read" | "none"
      } = {}
      
      // Add monitoring permission
      if (role.permissions.monitoring === undefined) {
        // Admin gets full, others get read if they have read access elsewhere
        if (role.name === "Admin") {
          updates.monitoring = "full"
        } else if (
          role.permissions.resources === "read" ||
          role.permissions.resources === "full" ||
          role.permissions.projects === "read" ||
          role.permissions.projects === "full"
        ) {
          updates.monitoring = "read"
        } else {
          updates.monitoring = "none"
        }
      }
      
      // Add provisioning permission
      if (role.permissions.provisioning === undefined) {
        // Only Admin gets provisioning
        if (role.name === "Admin") {
          updates.provisioning = "full"
        } else {
          updates.provisioning = "none"
        }
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length === 0) {
        skipped++
        continue
      }
      
      await ctx.db.patch(role._id, {
        permissions: {
          ...role.permissions,
          ...updates,
        },
      })
      
      updated++
      console.log(`[Migration] Updated role "${role.name}" in org ${role.orgId} with new permissions`)
    }
    
    console.log(`[Migration] ✅ Updated ${updated} roles, skipped ${skipped} (already had permissions)`)
    return { updated, skipped }
  },
})
