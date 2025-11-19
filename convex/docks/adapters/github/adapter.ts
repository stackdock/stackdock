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
import type { Doc } from "../../../_generated/dataModel"
import type { Repository } from "../../../lib/universalTypes"
import { GitHubAPI } from "./api"
import type { GitHubRepositoryWithDetails } from "./types"

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
   * Sync GitHub repositories to `repositories` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action - includes branches/issues/commits/pullRequests)
   * 2. For each repository, upsert into repositories table
   * 3. Store all repository data in fullApiData
   */
  async syncRepositories(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: GitHubRepositoryWithDetails[]
  ): Promise<void> {
    // preFetchedData should already include branches/issues/commits/pullRequests from action
    if (!preFetchedData || preFetchedData.length === 0) {
      console.log("[GitHub] No repositories to sync")
      return
    }

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
      
      // Find existing repository by providerResourceId (full_name)
      const existing = await ctx.db
        .query("repositories")
        .withIndex("by_dock_resource", (q) => 
          q.eq("dockId", dock._id).eq("providerResourceId", repo.full_name)
        )
        .first()

      const repositoryData : Omit<Repository, "_id" | "_creationTime"> = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "github",
        providerResourceId: repo.full_name,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || undefined,
        language: repo.language || undefined,
        private: repo.private || false,
        url: repo.html_url || undefined,
        defaultBranch: repo.default_branch || undefined,
        fullApiData: {
          repository: repo, // Complete repository object
          branches, // Type-safe
          issues, // Type-safe
          commits, // Commits array
          pullRequests, // Pull requests array
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        // Update existing repository
        await ctx.db.patch(existing._id, repositoryData)
        console.log(`[GitHub] Updated repository ${repo.full_name}`)
      } else {
        // Create new repository
        await ctx.db.insert("repositories", repositoryData)
        console.log(`[GitHub] Created repository ${repo.full_name}`)
      }
    }

    // Delete orphaned repositories (exist in DB but not in API response)
    // Only delete discovered resources (provisioningSource === undefined)
    const existingRepos = await ctx.db
      .query("repositories")
      .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
      .collect()

    for (const existingRepo of existingRepos) {
      if (!syncedRepoFullNames.has(existingRepo.providerResourceId)) {
        // Only delete if not provisioned via SST (discovered resources)
        if (!existingRepo.fullApiData?.provisioningSource) {
          await ctx.db.delete(existingRepo._id)
          console.log(`[GitHub] Deleted orphaned repository ${existingRepo.providerResourceId}`)
        }
      }
    }

    console.log(`[GitHub] Sync complete. Synced ${syncedRepoFullNames.size} repositories.`)
  },
}
