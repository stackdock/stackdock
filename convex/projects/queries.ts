/**
 * Project Queries
 * 
 * Fetch projects and linked resources for the current user's organization
 */

import { v } from "convex/values"
import { query } from "../_generated/server"
import { getCurrentUser, checkPermission } from "../lib/rbac"
import { ConvexError } from "convex/values"

/**
 * List all projects for the current user's organization
 */
export const listProjects = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return []
    }
    
    // Check projects:read permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      membership.orgId,
      "projects:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: projects:read required")
    }
    
    // Fetch all projects for this org
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return projects
  },
})

/**
 * Get a single project by ID
 */
export const getProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get project
    const project = await ctx.db.get(args.projectId)
    if (!project) {
      return null
    }
    
    // Verify user belongs to project's org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", project.orgId).eq("userId", user._id)
      )
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized to view this project")
    }
    
    // Check projects:read permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      project.orgId,
      "projects:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: projects:read required")
    }
    
    return project
  },
})

/**
 * Get a single project by slug
 */
export const getProjectBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized")
    }
    
    // Check projects:read permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      membership.orgId,
      "projects:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: projects:read required")
    }
    
    // Find project by slug in user's org
    const project = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) =>
        q.eq("orgId", membership.orgId).eq("slug", args.slug)
      )
      .first()
    
    if (!project) {
      return null
    }
    
    return project
  },
})

/**
 * Get project by GitHub repository
 * 
 * Finds a project by its GitHub repo identifier (format: "owner/repo-name")
 */
export const getByGitHubRepo = query({
  args: {
    githubRepo: v.string(), // Format: "owner/repo-name"
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized")
    }
    
    // Check projects:read permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      membership.orgId,
      "projects:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: projects:read required")
    }
    
    // Find project by GitHub repo in user's org
    const project = await ctx.db
      .query("projects")
      .withIndex("by_githubRepo", (q) =>
        q.eq("orgId", membership.orgId).eq("githubRepo", args.githubRepo)
      )
      .first()
    
    return project || null
  },
})

/**
 * Get all resources linked to a project
 */
export const getProjectResources = query({
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
      throw new ConvexError("Not authorized to view this project")
    }
    
    // Check projects:read permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      project.orgId,
      "projects:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: projects:read required")
    }
    
    // Get linked resources
    const links = await ctx.db
      .query("projectResources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    
    // Fetch actual resources
    const resources = await Promise.all(
      links.map(async (link) => {
        let resource = null
        switch (link.resourceTable) {
          case "servers":
            resource = await ctx.db.get(link.resourceId as any)
            break
          case "webServices":
            resource = await ctx.db.get(link.resourceId as any)
            break
          case "domains":
            resource = await ctx.db.get(link.resourceId as any)
            break
          case "databases":
            resource = await ctx.db.get(link.resourceId as any)
            break
        }
        return {
          link,
          resource,
          resourceTable: link.resourceTable,
        }
      })
    )
    
    return resources.filter((r) => r.resource !== null)
  },
})

/**
 * List projects with pagination
 * 
 * Use this for organizations with many projects (>100) to improve performance.
 */
export const listProjectsPaginated = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Get user's org from memberships
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return {
        page: [],
        isDone: true,
        continueCursor: undefined,
      }
    }
    
    // Check projects:read permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      membership.orgId,
      "projects:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: projects:read required")
    }
    
    // Fetch projects with pagination
    const result = await ctx.db
      .query("projects")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .paginate(args.paginationOpts)
    
    return result
  },
})
