/**
 * File Storage Utilities for Convex
 * 
 * Provides helpers for uploading and managing files using Convex file storage.
 * Use this for user-uploaded configuration files, backups, attachments, etc.
 * 
 * Features:
 * - Type-safe file upload/download
 * - Automatic metadata tracking
 * - Integration with RBAC
 * - Support for configuration files and backups
 * 
 * @see https://docs.convex.dev/file-storage
 */

import { v } from "convex/values"
import { mutation } from "../_generated/server"
import { getCurrentUser, checkPermission } from "../lib/rbac"
import { ConvexError } from "convex/values"

/**
 * Generate an upload URL for client-side file uploads
 * 
 * This allows the client to upload files directly to Convex storage
 * without sending the file through the mutation.
 * 
 * @example
 * ```typescript
 * const uploadUrl = await convex.mutation(api.lib.storage.generateUploadUrl)
 * const response = await fetch(uploadUrl, {
 *   method: "POST",
 *   headers: { "Content-Type": file.type },
 *   body: file,
 * })
 * const { storageId } = await response.json()
 * ```
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Verify user is authenticated
    await getCurrentUser(ctx)
    
    // Generate upload URL
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Upload a file to Convex storage
 * 
 * Stores the file and creates a metadata record in the fileUploads table.
 * 
 * @param storageId - The storage ID returned from ctx.storage.store()
 * @param filename - Original filename
 * @param contentType - MIME type of the file
 * @param size - File size in bytes
 * @param category - File category: "config", "backup", "attachment"
 * 
 * @example
 * ```typescript
 * // In your frontend:
 * const file = input.files[0]
 * const storageId = await convex.mutation(api.storage.upload, {
 *   file: await file.arrayBuffer(),
 *   filename: file.name,
 *   contentType: file.type,
 *   size: file.size,
 *   category: "config"
 * })
 * ```
 */
export const uploadFile = mutation({
  args: {
    storageId: v.string(), // Storage ID from ctx.storage.store()
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
    category: v.union(
      v.literal("config"),
      v.literal("backup"),
      v.literal("attachment")
    ),
    projectId: v.optional(v.id("projects")),
    dockId: v.optional(v.id("docks")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized")
    }
    
    // Check permission based on category
    const permission = args.category === "config" || args.category === "backup"
      ? "operations:full"
      : "projects:full"
    
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      membership.orgId,
      permission
    )
    if (!hasPermission) {
      throw new ConvexError(`Permission denied: ${permission} required`)
    }
    
    // Validate file relationships
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId)
      if (!project || project.orgId !== membership.orgId) {
        throw new ConvexError("Invalid project")
      }
    }
    
    if (args.dockId) {
      const dock = await ctx.db.get(args.dockId)
      if (!dock || dock.orgId !== membership.orgId) {
        throw new ConvexError("Invalid dock")
      }
    }
    
    // Create file metadata record
    const fileId = await ctx.db.insert("fileUploads", {
      orgId: membership.orgId,
      uploadedBy: user._id,
      storageId: args.storageId,
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      category: args.category,
      ...(args.projectId ? { projectId: args.projectId } : {}),
      ...(args.dockId ? { dockId: args.dockId } : {}),
      uploadedAt: Date.now(),
    })
    
    return fileId
  },
})

/**
 * Delete a file
 */
export const deleteFile = mutation({
  args: {
    fileId: v.id("fileUploads"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    const file = await ctx.db.get(args.fileId)
    if (!file) {
      throw new ConvexError("File not found")
    }
    
    // Verify user belongs to file's org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", file.orgId).eq("userId", user._id)
      )
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized to delete this file")
    }
    
    // Check permission
    const permission = file.category === "config" || file.category === "backup"
      ? "operations:full"
      : "projects:full"
    
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      file.orgId,
      permission
    )
    if (!hasPermission) {
      throw new ConvexError(`Permission denied: ${permission} required`)
    }
    
    // Delete from storage
    await ctx.storage.delete(file.storageId)
    
    // Delete metadata
    await ctx.db.delete(args.fileId)
    
    return { success: true }
  },
})
