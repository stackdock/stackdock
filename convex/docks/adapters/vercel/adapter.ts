/**
 * Vercel Dock Adapter
 * 
 * Translates Vercel API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /v9/projects → syncWebServices()
 * - GET /v2/user → validateCredentials()
 * 
 * @see docks/vercel/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { VercelAPI } from "./api"
import type { VercelProject } from "./types"

/**
 * Map Vercel deployment readyState to universal status
 */
function mapVercelStatus(readyState: string): string {
  const statusMap: Record<string, string> = {
    READY: "running",
    BUILDING: "pending",
    ERROR: "error",
    QUEUED: "pending",
    CANCELED: "stopped",
  }
  return statusMap[readyState] || readyState.toLowerCase()
}

/**
 * Get production URL from Vercel project
 * Prefers targets.production.url, falls back to latestDeployments[0].url
 */
function getProductionUrl(project: any): string | undefined {
  // Try targets.production first
  if (project.targets?.production?.url) {
    const url = project.targets.production.url
    return url.startsWith("http") ? url : `https://${url}`
  }
  
  // Fall back to latest deployment
  if (project.latestDeployments?.[0]?.url) {
    const url = project.latestDeployments[0].url
    return url.startsWith("http") ? url : `https://${url}`
  }
  
  return undefined
}

/**
 * Get git repository from Vercel project link
 * Format: "org/repo" (e.g., "robsdevcraft/vapr-ballistics")
 */
function getGitRepo(project: any): string | undefined {
  if (!project.link) return undefined
  const { org, repo } = project.link
  if (org && repo) {
    return `${org}/${repo}`
  }
  return undefined
}

/**
 * Get environment from Vercel project
 * For projects, always "production" (preview deployments handled separately if needed)
 */
function getEnvironment(project: any): string {
  return project.targets?.production?.target || "production"
}

/**
 * Get status from Vercel project
 * Uses production deployment readyState
 */
function getStatus(project: any): string {
  // Try production deployment first
  if (project.targets?.production?.readyState) {
    return mapVercelStatus(project.targets.production.readyState)
  }
  
  // Fall back to latest deployment
  if (project.latestDeployments?.[0]?.readyState) {
    return mapVercelStatus(project.latestDeployments[0].readyState)
  }
  
  // Default to pending if no deployment info
  return "pending"
}

/**
 * Vercel Dock Adapter
 * 
 * Implements DockAdapter interface for Vercel provider
 */
export const vercelAdapter: DockAdapter = {
  provider: "vercel",

  /**
   * Validate Vercel API credentials
   * Uses lightweight GET /v2/user endpoint
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new VercelAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      // Log error for debugging but return false for invalid credentials
      console.error("Vercel credential validation failed:", error)
      // Re-throw to get more detail in the mutation
      throw error
    }
  },

  /**
   * Sync Vercel projects to universal webServices table
   * GET /v9/projects
   * 
   * IMPORTANT: Vercel "projects" are provider resources, NOT StackDock projects.
   * They sync to webServices table. Users will link them to StackDock projects manually.
   */
  async syncWebServices(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: VercelProject[]
  ): Promise<void> {
    let projects: VercelProject[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      projects = preFetchedData
    } else {
      // Fetch data directly (for direct mutation calls or testing)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new VercelAPI(apiKey)
      projects = await api.getProjects()
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    for (const project of projects) {
      // Track this project as synced
      syncedResourceIds.add(project.id)

      // Check if project already exists
      const existing = await ctx.db
        .query("webServices")
        .withIndex("by_dock_resource", (q) =>
          q
            .eq("dockId", dock._id)
            .eq("providerResourceId", project.id)
        )
        .first()

      const universalWebService = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "vercel",
        providerResourceId: project.id,
        name: project.name,
        productionUrl: getProductionUrl(project),
        environment: getEnvironment(project),
        gitRepo: getGitRepo(project),
        status: getStatus(project),
        fullApiData: project, // Store all Vercel-specific fields
        updatedAt: Date.now(),
      }

      if (existing) {
        // Update existing web service
        await ctx.db.patch(existing._id, universalWebService)
      } else {
        // Insert new web service
        await ctx.db.insert("webServices", universalWebService)
      }
    }

    // Delete orphaned resources (exist in DB but not in API response)
    // Only delete discovered resources (provisioningSource === undefined)
    const existingWebServices = await ctx.db
      .query("webServices")
      .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
      .collect()

    for (const existing of existingWebServices) {
      if (
        !syncedResourceIds.has(existing.providerResourceId) &&
        existing.provisioningSource === undefined
      ) {
        console.log(`[Vercel] Deleting orphaned web service: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },
}
