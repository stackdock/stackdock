/**
 * GridPane Dock Adapter
 * 
 * Translates GridPane API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /oauth/api/v1/server → syncServers()
 * - GET /oauth/api/v1/site → syncWebServices()
 * - GET /oauth/api/v1/domain → syncDomains()
 * - GET /oauth/api/v1/user → validateCredentials()
 * 
 * @see docks/gridpane/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { GridPaneAPI } from "./api"

/**
 * Map GridPane server status to universal status
 */
function mapServerStatus(gpStatus: string): string {
  const statusMap: Record<string, string> = {
    active: "running",
    inactive: "stopped",
    building: "pending",
    error: "error",
  }
  return statusMap[gpStatus.toLowerCase()] || gpStatus.toLowerCase()
}

/**
 * Map GridPane site status to universal status
 */
function mapSiteStatus(gpSite: any): string {
  // GridPane sites don't have explicit status, derive from ssl_status and resolved_at
  if (gpSite.ssl_status === "succeed" && gpSite.resolved_at) {
    return "running"
  }
  if (gpSite.ssl_status === "failed") {
    return "error"
  }
  return "pending"
}

/**
 * Map GridPane domain status to universal status
 */
function mapDomainStatus(gpDomain: any): string {
  if (gpDomain.ssl_status === "succeed" && gpDomain.resolved_at) {
    return "active"
  }
  if (gpDomain.ssl_status === "failed") {
    return "error"
  }
  return "pending"
}

/**
 * GridPane Dock Adapter
 * 
 * Implements DockAdapter interface for GridPane provider
 */
export const gridpaneAdapter: DockAdapter = {
  provider: "gridpane",

  /**
   * Validate GridPane API credentials
   * Uses lightweight GET /user endpoint
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new GridPaneAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      // Log error for debugging but return false for invalid credentials
      console.error("GridPane credential validation failed:", error)
      // Re-throw to get more detail in the mutation
      throw error
    }
  },

  /**
   * Sync GridPane servers to universal servers table
   * GET /oauth/api/v1/server
   */
  async syncServers(ctx: MutationCtx, dock: Doc<"docks">): Promise<void> {
    // Decrypt API key with audit logging
    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })
    const api = new GridPaneAPI(apiKey)

    const servers = await api.getServers()

    for (const server of servers) {
      // Check if server already exists
      const existing = await ctx.db
        .query("servers")
        .withIndex("by_dock_resource", (q) =>
          q
            .eq("dockId", dock._id)
            .eq("providerResourceId", server.id.toString())
        )
        .first()

      const universalServer = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "gridpane",
        providerResourceId: server.id.toString(),
        name: server.label,
        primaryIpAddress: server.ip || undefined,
        region: server.region || undefined,
        status: mapServerStatus(server.status),
        fullApiData: server, // Store all GridPane-specific fields
        updatedAt: Date.now(),
      }

      if (existing) {
        // Update existing server
        await ctx.db.patch(existing._id, universalServer)
      } else {
        // Insert new server
        await ctx.db.insert("servers", universalServer)
      }
    }
  },

  /**
   * Sync GridPane sites to universal webServices table
   * GET /oauth/api/v1/site
   */
  async syncWebServices(
    ctx: MutationCtx,
    dock: Doc<"docks">
  ): Promise<void> {
    // Decrypt API key with audit logging
    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })
    const api = new GridPaneAPI(apiKey)

    const sites = await api.getSites()

    for (const site of sites) {
      // Check if site already exists
      const existing = await ctx.db
        .query("webServices")
        .withIndex("by_dock_resource", (q) =>
          q
            .eq("dockId", dock._id)
            .eq("providerResourceId", site.id.toString())
        )
        .first()

      // Determine environment from site type/URL
      let environment: string | undefined
      if (site.url.includes("staging.")) {
        environment = "staging"
      } else if (site.url.includes("canary.")) {
        environment = "development"
      } else {
        environment = "production"
      }

      const universalWebService = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "gridpane",
        providerResourceId: site.id.toString(),
        name: site.url,
        productionUrl: site.url.startsWith("http") ? site.url : `https://${site.url}`,
        environment,
        status: mapSiteStatus(site),
        fullApiData: site, // Store all GridPane-specific fields
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
  },

  /**
   * Sync GridPane domains to universal domains table
   * GET /oauth/api/v1/domain
   */
  async syncDomains(ctx: MutationCtx, dock: Doc<"docks">): Promise<void> {
    // Decrypt API key with audit logging
    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })
    const api = new GridPaneAPI(apiKey)

    const domains = await api.getDomains()

    for (const domain of domains) {
      // Check if domain already exists
      const existing = await ctx.db
        .query("domains")
        .withIndex("by_dock_resource", (q) =>
          q
            .eq("dockId", dock._id)
            .eq("providerResourceId", domain.id.toString())
        )
        .first()

      // Parse expiresAt from updated_at if available (GridPane doesn't provide expiry)
      const expiresAt = domain.updated_at
        ? new Date(domain.updated_at).getTime() + 365 * 24 * 60 * 60 * 1000 // Assume 1 year from update
        : undefined

      const universalDomain = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "gridpane",
        providerResourceId: domain.id.toString(),
        domainName: domain.url,
        expiresAt,
        status: mapDomainStatus(domain),
        fullApiData: domain, // Store all GridPane-specific fields
        updatedAt: Date.now(),
      }

      if (existing) {
        // Update existing domain
        await ctx.db.patch(existing._id, universalDomain)
      } else {
        // Insert new domain
        await ctx.db.insert("domains", universalDomain)
      }
    }
  },
}
