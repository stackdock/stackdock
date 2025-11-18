/**
 * File Storage Query Functions
 * 
 * Queries for retrieving file metadata and download URLs.
 */

import { v } from "convex/values"
import { query } from "../_generated/server"
import { getCurrentUser } from "../lib/rbac"
import { ConvexError } from "convex/values"

/**
 * Get file metadata
 */
export const getFile = query({
  args: {
    fileId: v.id("fileUploads"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    const file = await ctx.db.get(args.fileId)
    if (!file) {
      return null
    }
    
    // Verify user belongs to file's org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", file.orgId).eq("userId", user._id)
      )
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized to view this file")
    }
    
    return file
  },
})

/**
 * Get file download URL
 * 
 * Returns a short-lived URL for downloading the file.
 */
export const getFileUrl = query({
  args: {
    fileId: v.id("fileUploads"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    const file = await ctx.db.get(args.fileId)
    if (!file) {
      return null
    }
    
    // Verify user belongs to file's org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", file.orgId).eq("userId", user._id)
      )
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized to access this file")
    }
    
    // Get download URL from storage
    const url = await ctx.storage.getUrl(file.storageId)
    
    return url
  },
})

/**
 * List files for a project
 */
export const listProjectFiles = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get project
    const project = await ctx.db.get(args.projectId)
    if (!project) {
      return []
    }
    
    // Verify user belongs to project's org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", project.orgId).eq("userId", user._id)
      )
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized to view project files")
    }
    
    // Get all files for this project
    const files = await ctx.db
      .query("fileUploads")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    
    return files
  },
})

/**
 * List files for the current user's organization
 */
export const listOrgFiles = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("config"),
        v.literal("backup"),
        v.literal("attachment")
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return []
    }
    
    // Get all files for this org
    let files = await ctx.db
      .query("fileUploads")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    // Filter by category if provided
    if (args.category) {
      files = files.filter((f) => f.category === args.category)
    }
    
    return files
  },
})
