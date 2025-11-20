/**
 * Project Mutations
 * 
 * Create projects and link resources to projects
 */

import { v } from "convex/values"
import { mutation, internalMutation } from "../_generated/server"
import { getCurrentUser, checkPermission } from "../lib/rbac"
import { ConvexError } from "convex/values"
import { generateSlug } from "../lib/slug"

/**
 * Create a new project
 * 
 * Requires "projects:full" permission.
 */
export const createProject = mutation({
  args: {
    orgId: v.id("organizations"),
    teamId: v.id("teams"),
    clientId: v.optional(v.id("clients")), // Made optional
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

    // Generate slug from name
    const slug = generateSlug(args.name)
    
    // Check if slug already exists in this org (handle duplicates)
    let finalSlug = slug
    let counter = 1
    while (true) {
      const existing = await ctx.db
        .query("projects")
        .withIndex("by_slug", (q) => q.eq("orgId", args.orgId).eq("slug", finalSlug))
        .first()
      
      if (!existing) {
        break
      }
      
      finalSlug = `${slug}-${counter}`
      counter++
    }

    // Create project
    const projectId = await ctx.db.insert("projects", {
      orgId: args.orgId,
      teamId: args.teamId,
      name: args.name,
      slug: finalSlug,
      ...(args.clientId ? { clientId: args.clientId } : {}),
      ...(args.linearId ? { linearId: args.linearId } : {}),
      ...(args.githubRepo ? { githubRepo: args.githubRepo } : {}),
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
        if (server && "name" in server && "status" in server) {
          denormalizedName = server.name
          denormalizedStatus = server.status
        }
        break
      }
      case "webServices": {
        const webService = await ctx.db.get(args.resourceId as any)
        if (webService && "name" in webService && "status" in webService) {
          denormalizedName = webService.name
          denormalizedStatus = webService.status
        }
        break
      }
      case "domains": {
        const domain = await ctx.db.get(args.resourceId as any)
        if (domain && "domainName" in domain && "status" in domain) {
          denormalizedName = domain.domainName
          denormalizedStatus = domain.status
        }
        break
      }
      case "databases": {
        const database = await ctx.db.get(args.resourceId as any)
        if (database && "name" in database && "status" in database) {
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
 * Update an existing project
 * 
 * Requires "projects:full" permission.
 */
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    clientId: v.optional(v.id("clients")),
    linearId: v.optional(v.string()),
    githubRepo: v.optional(v.string()),
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
        "Permission denied: Only organization owners can update projects"
      )
    }

    // Build update object (only include provided fields)
    const updates: any = {}
    if (args.name !== undefined) {
      updates.name = args.name
      // Regenerate slug when name changes
      const newSlug = generateSlug(args.name)
      // Check if slug already exists (excluding current project)
      let finalSlug = newSlug
      let counter = 1
      while (true) {
        const existing = await ctx.db
          .query("projects")
          .withIndex("by_slug", (q) => q.eq("orgId", project.orgId).eq("slug", finalSlug))
          .first()
        
        if (!existing || existing._id === args.projectId) {
          break
        }
        
        finalSlug = `${newSlug}-${counter}`
        counter++
      }
      updates.slug = finalSlug
    }
    if (args.teamId !== undefined) updates.teamId = args.teamId
    if (args.clientId !== undefined) updates.clientId = args.clientId
    if (args.linearId !== undefined) updates.linearId = args.linearId
    if (args.githubRepo !== undefined) updates.githubRepo = args.githubRepo

    // Update project
    await ctx.db.patch(args.projectId, updates)

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

/**
 * Wipe all projects from the database
 * 
 * TEMPORARY: Used to clear automatically created projects from GitHub sync.
 * Internal mutation only.
 */
export const wipeAllProjects = internalMutation({
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect()
    
    console.log(`[Wipe Projects] Found ${projects.length} projects to delete`)
    
    for (const project of projects) {
      await ctx.db.delete(project._id)
      console.log(`[Wipe Projects] Deleted project: ${project.name} (${project._id})`)
    }
    
    console.log(`[Wipe Projects] ✅ Deleted ${projects.length} projects`)
    return { deleted: projects.length }
  },
})

/**
 * Migration: Add slugs to existing projects that don't have them
 * 
 * Internal mutation only. Run once to migrate existing projects.
 * Migration completed - all projects now have slugs.
 */
export const addSlugsToExistingProjects = internalMutation({
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect()
    
    let updated = 0
    let skipped = 0
    
    for (const project of projects) {
      // Skip if already has slug
      if ((project as any).slug) {
        skipped++
        continue
      }
      
      // Generate slug from name
      const slug = generateSlug(project.name)
      
      // Check if slug already exists in this org (handle duplicates)
      let finalSlug = slug
      let counter = 1
      while (true) {
        const existing = await ctx.db
          .query("projects")
          .withIndex("by_slug", (q) => q.eq("orgId", project.orgId).eq("slug", finalSlug))
          .first()
        
        if (!existing || existing._id === project._id) {
          break
        }
        
        finalSlug = `${slug}-${counter}`
        counter++
      }
      
      // Update project with slug
      await ctx.db.patch(project._id, { slug: finalSlug })
      updated++
      console.log(`[Migration] Added slug "${finalSlug}" to project "${project.name}"`)
    }
    
    console.log(`[Migration] ✅ Updated ${updated} projects, skipped ${skipped} (already had slugs)`)
    return { updated, skipped }
  },
})
