/**
 * GitHub Dock Adapter
 * 
 * Translates GitHub API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /user → validateCredentials()
 * - GET /user/repos → syncProjects()
 * - GET /repos/{owner}/{repo}/branches → syncProjects() (via action)
 * - GET /repos/{owner}/{repo}/issues → syncProjects() (via action)
 * - GET /repos/{owner}/{repo}/pulls → syncProjects() (via action)
 * - GET /repos/{owner}/{repo}/commits → syncProjects() (via action)
 * 
 * @see https://docs.github.com/en/rest?apiVersion=2022-11-28
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc, Id } from "../../../_generated/dataModel"
import { generateSlug } from "../../../lib/slug"
import { decryptApiKey } from "../../../lib/encryption"
import { GitHubAPI } from "./api"
import type { GitHubRepositoryWithDetails } from "./types"

/**
 * Get or create default team for GitHub sync
 * 
 * Projects table requires teamId, but GitHub repos don't map to teams.
 * This helper ensures we have a team to use.
 */
async function getOrCreateDefaultTeam(
  ctx: MutationCtx, 
  orgId: Id<"organizations">
): Promise<Id<"teams">> {
  // Try to find existing team first
  const existingTeam = await ctx.db
    .query("teams")
    .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
    .first()
  
  if (existingTeam) {
    return existingTeam._id
  }
  
  // Create default team with clear naming
  return await ctx.db.insert("teams", {
    orgId,
    name: "GitHub Sync - Default Team",
  })
}

/**
 * Get or create default client for GitHub sync
 * 
 * Projects table requires clientId, but GitHub repos don't map to clients.
 * This helper ensures we have a client to use.
 */
async function getOrCreateDefaultClient(
  ctx: MutationCtx, 
  orgId: Id<"organizations">
): Promise<Id<"clients">> {
  // Try to find existing client first
  const existingClient = await ctx.db
    .query("clients")
    .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
    .first()
  
  if (existingClient) {
    return existingClient._id
  }
  
  // Create default client with clear naming
  return await ctx.db.insert("clients", {
    orgId,
    name: "GitHub Sync - Default Client",
  })
}

export const githubAdapter: DockAdapter = {
  provider: "github",

  /**
   * Validate GitHub API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new GitHubAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("GitHub credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync GitHub repositories to universal `projects` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action - includes branches/issues)
   * 2. Otherwise, decrypt API key and fetch data (fallback, shouldn't happen)
   * 3. For each repository, upsert into `projects` table
   * 4. Store all GitHub fields in fullApiData
   * 
   * Note: Projects table structure differs from other universal tables:
   * - No `dockId` field (projects are org-level, not dock-specific)
   * - Projects identified by `githubRepo` field (not `providerResourceId`)
   * - Links to teams/clients (business entities)
   */
  async syncProjects(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: GitHubRepositoryWithDetails[]
  ): Promise<void> {
    // preFetchedData should already include branches/issues from action
    if (!preFetchedData || preFetchedData.length === 0) {
      console.log("[GitHub] No repositories to sync")
      // Still need to check for orphaned repos (repos deleted on GitHub)
      // If API returns empty, all existing repos for this org should be deleted
      const existingProjects = await ctx.db
        .query("projects")
        .withIndex("by_orgId", (q) => q.eq("orgId", dock.orgId))
        .collect()
      
      // Delete all projects that have githubRepo (they're from GitHub sync)
      for (const project of existingProjects) {
        if (project.githubRepo) {
          console.log(`[GitHub] Deleting orphaned project: ${project.githubRepo}`)
          await ctx.db.delete(project._id)
        }
      }
      return
    }

    // Get team/client IDs once
    const teamId = await getOrCreateDefaultTeam(ctx, dock.orgId)
    const clientId = await getOrCreateDefaultClient(ctx, dock.orgId)

    // Track which repos we've synced (for orphan detection)
    const syncedRepoFullNames = new Set<string>()

    for (const repo of preFetchedData) {
      // Type-safe access to branches/issues/commits/pullRequests
      const branches = repo.branches || []
      const issues = repo.issues || []
      const commits = (repo as any).commits || []
      const pullRequests = (repo as any).pullRequests || []
      
      // Track this repo as synced
      syncedRepoFullNames.add(repo.full_name)
      
      // Find existing project by GitHub repo
      const existing = await ctx.db
        .query("projects")
        .withIndex("by_githubRepo", (q) => 
          q.eq("orgId", dock.orgId).eq("githubRepo", repo.full_name)
        )
        .first()

      // Generate slug from repo name
      const slug = generateSlug(repo.name)
      
      // Check if slug already exists in this org (handle duplicates)
      let finalSlug = slug
      let counter = 1
      while (true) {
        const slugExists = await ctx.db
          .query("projects")
          .withIndex("by_slug", (q) => q.eq("orgId", dock.orgId).eq("slug", finalSlug))
          .first()
        
        // If no existing project with this slug, or it's the current project, use it
        if (!slugExists || (existing && slugExists._id === existing._id)) {
          break
        }
        
        finalSlug = `${slug}-${counter}`
        counter++
      }

      const projectData = {
        orgId: dock.orgId,
        teamId,
        clientId,
        name: repo.name,
        slug: finalSlug,
        githubRepo: repo.full_name,
        fullApiData: {
          repository: repo, // Complete repository object
          branches, // Type-safe
          issues, // Type-safe
          commits, // Commits array
          pullRequests, // Pull requests array
        },
      }

      if (existing) {
        await ctx.db.patch(existing._id, projectData)
      } else {
        await ctx.db.insert("projects", projectData)
      }
    }

    // Delete orphaned projects (repos that exist in DB but not in API response)
    // Only delete projects that have githubRepo (they're from GitHub sync)
    const existingProjects = await ctx.db
      .query("projects")
      .withIndex("by_orgId", (q) => q.eq("orgId", dock.orgId))
      .collect()

    for (const project of existingProjects) {
      // Only delete GitHub-synced projects (have githubRepo field)
      if (project.githubRepo && !syncedRepoFullNames.has(project.githubRepo)) {
        console.log(`[GitHub] Deleting orphaned project: ${project.githubRepo} (deleted on GitHub)`)
        await ctx.db.delete(project._id)
      }
    }
  },
}
