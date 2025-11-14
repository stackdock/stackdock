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
 * 
 * @see https://docs.github.com/en/rest?apiVersion=2022-11-28
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc, Id } from "../../../_generated/dataModel"
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
      return
    }

    // Get team/client IDs once
    const teamId = await getOrCreateDefaultTeam(ctx, dock.orgId)
    const clientId = await getOrCreateDefaultClient(ctx, dock.orgId)

    for (const repo of preFetchedData) {
      // Type-safe access to branches/issues/commits
      const branches = repo.branches || []
      const issues = repo.issues || []
      const commits = (repo as any).commits || []
      
      // Find existing project by GitHub repo
      const existing = await ctx.db
        .query("projects")
        .withIndex("by_githubRepo", (q) => 
          q.eq("orgId", dock.orgId).eq("githubRepo", repo.full_name)
        )
        .first()

      const projectData = {
        orgId: dock.orgId,
        teamId,
        clientId,
        name: repo.name,
        githubRepo: repo.full_name,
        fullApiData: {
          repository: repo, // Complete repository object
          branches, // Type-safe
          issues, // Type-safe
          commits, // Commits array
        },
      }

      if (existing) {
        await ctx.db.patch(existing._id, projectData)
      } else {
        await ctx.db.insert("projects", projectData)
      }
    }
  },
}
