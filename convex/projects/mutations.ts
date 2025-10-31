/**
 * Project Mutations
 * 
 * Create projects and link resources to projects
 */

import { v } from "convex/values"
import { mutation } from "../_generated/server"
import { getCurrentUser, checkPermission } from "../lib/rbac"
import { ConvexError } from "convex/values"

/**
 * Create a new project
 * 
 * Requires "projects:full" permission.
 */
export const createProject = mutation({
  args: {
    orgId: v.id("organizations"),
    teamId: v.id("teams"),
    clientId: v.id("clients"),
    name: v.string(),
    linearId: v.optional(v.string()),
    githubRepo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Verify user belongs to org and has projects:full permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      args.orgId,
      "projects:full"
    )
    if (!hasPermission) {
      throw new ConvexError(
        "Permission denied: Only organization owners can create projects"
      )
    }

    // Create project
    const projectId = await ctx.db.insert("projects", {
      orgId: args.orgId,
      teamId: args.teamId,
      clientId: args.clientId,
      name: args.name,
      linearId: args.linearId,
      githubRepo: args.githubRepo,
    })

    return projectId
  },
})

/**
 * Link a resource to a project
 * 
 * Creates a polymorphic link in projectResources table.
 * Requires "projects:full" permission.
 */
export const linkResource = mutation({
  args: {
    projectId: v.id("projects"),
    resourceTable: v.union(
      v.literal("servers"),
      v.literal("webServices"),
      v.literal("domains"),
      v.literal("databases")
    ),
    resourceId: v.string(), // The _id of the resource
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get project to verify org
    const project = await ctx.db.get(args.projectId)
    if (!project) {
      throw new ConvexError("Project not found")
    }

    // Verify user belongs to org and has projects:full permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      project.orgId,
      "projects:full"
    )
    if (!hasPermission) {
      throw new ConvexError(
        "Permission denied: Only organization owners can link resources"
      )
    }

    // Get resource to denormalize name/status
    let denormalizedName = ""
    let denormalizedStatus = ""

    switch (args.resourceTable) {
      case "servers": {
        const server = await ctx.db.get(args.resourceId as any)
        if (server) {
          denormalizedName = server.name
          denormalizedStatus = server.status
        }
        break
      }
      case "webServices": {
        const webService = await ctx.db.get(args.resourceId as any)
        if (webService) {
          denormalizedName = webService.name
          denormalizedStatus = webService.status
        }
        break
      }
      case "domains": {
        const domain = await ctx.db.get(args.resourceId as any)
        if (domain) {
          denormalizedName = domain.domainName
          denormalizedStatus = domain.status
        }
        break
      }
      case "databases": {
        const database = await ctx.db.get(args.resourceId as any)
        if (database) {
          denormalizedName = database.name
          denormalizedStatus = database.status
        }
        break
      }
    }

    // Check if link already exists
    const existing = await ctx.db
      .query("projectResources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.and(
          q.eq(q.field("resourceTable"), args.resourceTable),
          q.eq(q.field("resourceId"), args.resourceId)
        )
      )
      .first()

    if (existing) {
      throw new ConvexError("Resource already linked to this project")
    }

    // Create link
    await ctx.db.insert("projectResources", {
      orgId: project.orgId,
      projectId: args.projectId,
      resourceTable: args.resourceTable,
      resourceId: args.resourceId,
      denormalized_name: denormalizedName,
      denormalized_status: denormalizedStatus,
    })

    return { success: true }
  },
})

/**
 * Unlink a resource from a project
 */
export const unlinkResource = mutation({
  args: {
    projectId: v.id("projects"),
    resourceTable: v.union(
      v.literal("servers"),
      v.literal("webServices"),
      v.literal("domains"),
      v.literal("databases")
    ),
    resourceId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get project to verify org
    const project = await ctx.db.get(args.projectId)
    if (!project) {
      throw new ConvexError("Project not found")
    }

    // Verify user belongs to org and has projects:full permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      project.orgId,
      "projects:full"
    )
    if (!hasPermission) {
      throw new ConvexError(
        "Permission denied: Only organization owners can unlink resources"
      )
    }

    // Find and delete link
    const link = await ctx.db
      .query("projectResources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.and(
          q.eq(q.field("resourceTable"), args.resourceTable),
          q.eq(q.field("resourceId"), args.resourceId)
        )
      )
      .first()

    if (link) {
      await ctx.db.delete(link._id)
    }

    return { success: true }
  },
})
