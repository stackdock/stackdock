/**
 * Netlify Dock Adapter
 * 
 * Translates Netlify API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /api/v1/sites → syncWebServices()
 * - GET /api/v1/user → validateCredentials()
 * 
 * @see docks/netlify/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { NetlifyAPI } from "./api"
import type { NetlifySite } from "./types"

/**
 * Map Netlify lifecycle_state to universal status
 */
function mapNetlifyStatus(lifecycleState: string | null, state?: string): string {
  if (lifecycleState) {
    const lifecycleMap: Record<string, string> = {
      active: "running",
      inactive: "stopped",
      suspended: "stopped",
      deleted: "stopped",
    }
    return lifecycleMap[lifecycleState.toLowerCase()] || lifecycleState.toLowerCase()
  }
  
  // Fall back to state field if lifecycle_state is missing
  if (state === "current") {
    return "running"
  }
  
  return "pending"
}

/**
 * Get production URL from Netlify site
 * Prefers ssl_url (HTTPS), falls back to url (convert to HTTPS)
 */
function getProductionUrl(site: NetlifySite): string | undefined {
  // Prefer ssl_url (already HTTPS)
  if (site.ssl_url) {
    return site.ssl_url
  }
  
  // Fall back to url and convert to HTTPS
  if (site.url) {
    return site.url.startsWith("http") 
      ? site.url.replace(/^http:/, "https:")
      : `https://${site.url}`
  }
  
  return undefined
}

/**
 * Get git repository from Netlify site build_settings
 * Format: "org/repo" (e.g., "stackdock/docs")
 */
function getGitRepo(site: NetlifySite): string | undefined {
  if (!site.build_settings) return undefined
  
  // Prefer repo_path (already formatted as "org/repo")
  if (site.build_settings.repo_path) {
    return site.build_settings.repo_path
  }
  
  // Extract from repo_url if available
  if (site.build_settings.repo_url) {
    const url = site.build_settings.repo_url
    // Extract from GitHub/GitLab/Bitbucket URLs
    // e.g., "https://github.com/stackdock/docs" → "stackdock/docs"
    const match = url.match(/(?:github|gitlab|bitbucket)\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/)
    if (match) {
      return `${match[1]}/${match[2]}`
    }
  }
  
  return undefined
}

/**
 * Get environment from Netlify site
 * For sites, always "production" (branch/preview deployments handled separately if needed)
 */
function getEnvironment(site: NetlifySite): string {
  return "production"
}

/**
 * Get status from Netlify site
 * Uses lifecycle_state, falls back to state field
 */
function getStatus(site: NetlifySite): string {
  return mapNetlifyStatus(site.lifecycle_state, site.state)
}

/**
 * Netlify Dock Adapter
 * 
 * Implements DockAdapter interface for Netlify provider
 */
export const netlifyAdapter: DockAdapter = {
  provider: "netlify",

  /**
   * Validate Netlify API credentials
   * Uses lightweight GET /api/v1/user endpoint
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new NetlifyAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      // Log error for debugging but return false for invalid credentials
      console.error("Netlify credential validation failed:", error)
      // Re-throw to get more detail in the mutation
      throw error
    }
  },

  /**
   * Sync Netlify sites to universal webServices table
   * GET /api/v1/sites
   * 
   * IMPORTANT: Netlify "sites" are provider resources, NOT StackDock projects.
   * They sync to webServices table. Users will link them to StackDock projects manually.
   */
  async syncWebServices(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: NetlifySite[]
  ): Promise<void> {
    let sites: NetlifySite[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      sites = preFetchedData
    } else {
      // Fetch data directly (for direct mutation calls or testing)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new NetlifyAPI(apiKey)
      sites = await api.getSites()
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    for (const site of sites) {
      // Track this site as synced
      syncedResourceIds.add(site.id)

      // Check if site already exists
      const existing = await ctx.db
        .query("webServices")
        .withIndex("by_dock_resource", (q) =>
          q
            .eq("dockId", dock._id)
            .eq("providerResourceId", site.id)
        )
        .first()

      const universalWebService = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "netlify",
        providerResourceId: site.id, // Use id, not site_id
        name: site.name,
        productionUrl: getProductionUrl(site),
        environment: getEnvironment(site),
        gitRepo: getGitRepo(site),
        status: getStatus(site),
        fullApiData: site, // Store all Netlify-specific fields
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
        console.log(`[Netlify] Deleting orphaned web service: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },
}
