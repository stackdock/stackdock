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
import type {
  GridPaneServer,
  GridPaneSite,
  GridPaneDomain,
  GridPaneBackupSchedule,
  GridPaneBackupIntegration,
} from "./types"

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
  async syncServers(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: GridPaneServer[]
  ): Promise<void> {
    let servers: GridPaneServer[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      servers = preFetchedData
    } else {
      // Fetch data directly (for direct mutation calls or testing)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new GridPaneAPI(apiKey)
      servers = await api.getServers()
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    for (const server of servers) {
      const providerResourceId = server.id.toString()
      syncedResourceIds.add(providerResourceId)

      // Check if server already exists
      const existing = await ctx.db
        .query("servers")
        .withIndex("by_dock_resource", (q) =>
          q
            .eq("dockId", dock._id)
            .eq("providerResourceId", providerResourceId)
        )
        .first()

      const universalServer = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "gridpane",
        providerResourceId,
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

    // Delete orphaned resources (exist in DB but not in API response)
    // Only delete discovered resources (provisioningSource === undefined)
    const existingServers = await ctx.db
      .query("servers")
      .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
      .collect()

    for (const existing of existingServers) {
      if (
        !syncedResourceIds.has(existing.providerResourceId) &&
        existing.provisioningSource === undefined
      ) {
        console.log(`[GridPane] Deleting orphaned server: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },

  /**
   * Sync GridPane sites to universal webServices table
   * GET /oauth/api/v1/site
   */
  async syncWebServices(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: GridPaneSite[]
  ): Promise<void> {
    let sites: GridPaneSite[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      sites = preFetchedData
    } else {
      // Fetch data directly (for direct mutation calls or testing)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new GridPaneAPI(apiKey)
      sites = await api.getSites()
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    for (const site of sites) {
      const providerResourceId = site.id.toString()
      syncedResourceIds.add(providerResourceId)

      // Check if site already exists
      const existing = await ctx.db
        .query("webServices")
        .withIndex("by_dock_resource", (q) =>
          q
            .eq("dockId", dock._id)
            .eq("providerResourceId", providerResourceId)
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
        providerResourceId,
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
        console.log(`[GridPane] Deleting orphaned web service: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },

  /**
   * Sync GridPane domains to universal domains table
   * GET /oauth/api/v1/domain
   */
  async syncDomains(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: GridPaneDomain[]
  ): Promise<void> {
    let domains: GridPaneDomain[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      domains = preFetchedData
    } else {
      // Fetch data directly (for direct mutation calls or testing)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new GridPaneAPI(apiKey)
      domains = await api.getDomains()
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    for (const domain of domains) {
      const providerResourceId = domain.id.toString()
      syncedResourceIds.add(providerResourceId)

      // Check if domain already exists
      const existing = await ctx.db
        .query("domains")
        .withIndex("by_dock_resource", (q) =>
          q
            .eq("dockId", dock._id)
            .eq("providerResourceId", providerResourceId)
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
        providerResourceId,
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

    // Delete orphaned resources (exist in DB but not in API response)
    // Only delete discovered resources (provisioningSource === undefined)
    const existingDomains = await ctx.db
      .query("domains")
      .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
      .collect()

    for (const existing of existingDomains) {
      if (
        !syncedResourceIds.has(existing.providerResourceId) &&
        existing.provisioningSource === undefined
      ) {
        console.log(`[GridPane] Deleting orphaned domain: ${existing.domainName} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },

  /**
   * Sync GridPane backup schedules to universal backupSchedules table
   * GET /oauth/api/v1/backups/schedules
   */
  async syncBackupSchedules(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: GridPaneBackupSchedule[]
  ): Promise<void> {
    let schedules: GridPaneBackupSchedule[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      schedules = preFetchedData
    } else {
      // Fetch from API
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new GridPaneAPI(apiKey)
      schedules = await api.getAllBackupSchedules()
    }

    // Sync each schedule
    for (const schedule of schedules) {
      // Check if schedule already exists
      const existing = await ctx.db
        .query("backupSchedules")
        .withIndex("by_dock_schedule", (q) =>
          q.eq("dockId", dock._id).eq("scheduleId", schedule.site_id)
        )
        .first()

      // Map GridPane schedule to universal schema
      const universalSchedule = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "gridpane",
        providerResourceId: schedule.site_id.toString(),
        siteId: schedule.site_id,
        siteUrl: schedule.site_url,
        scheduleId: schedule.site_id, // Using site_id as schedule ID
        type: schedule.remote_backups_enabled ? ("remote" as const) : ("local" as const),
        frequency: schedule.frequency,
        hour: schedule.time?.split(":")[0] || "00",
        minute: schedule.time?.split(":")[1] || "00",
        time: schedule.time || "00:00",
        dayOfWeek: schedule.day_of_week ?? undefined, // Convert null to undefined
        serviceId: schedule.integration_id ?? undefined, // Convert null/undefined to undefined
        enabled: schedule.enabled,
        remoteBackupsEnabled: schedule.remote_backups_enabled,
        fullApiData: schedule,
        updatedAt: Date.now(),
      }

      if (existing) {
        // Patch only updatable fields (exclude required fields that can't change)
        await ctx.db.patch(existing._id, {
          siteUrl: universalSchedule.siteUrl,
          type: universalSchedule.type,
          frequency: universalSchedule.frequency,
          hour: universalSchedule.hour,
          minute: universalSchedule.minute,
          time: universalSchedule.time,
          dayOfWeek: universalSchedule.dayOfWeek,
          serviceId: universalSchedule.serviceId,
          enabled: universalSchedule.enabled,
          remoteBackupsEnabled: universalSchedule.remoteBackupsEnabled,
          fullApiData: universalSchedule.fullApiData,
          updatedAt: universalSchedule.updatedAt,
        })
      } else {
        await ctx.db.insert("backupSchedules", universalSchedule)
      }
    }
  },

  /**
   * Sync GridPane backup integrations to universal backupIntegrations table
   * GET /oauth/api/v1/backups/integrations
   */
  async syncBackupIntegrations(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: GridPaneBackupIntegration[]
  ): Promise<void> {
    let integrations: GridPaneBackupIntegration[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      integrations = preFetchedData
    } else {
      // Fetch from API
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new GridPaneAPI(apiKey)
      integrations = await api.getBackupIntegrations()
    }

    // Sync each integration
    for (const integration of integrations) {
      // Check if integration already exists
      const existing = await ctx.db
        .query("backupIntegrations")
        .withIndex("by_dock_integration", (q) =>
          q.eq("dockId", dock._id).eq("integrationId", integration.id)
        )
        .first()

      // Map GridPane integration to universal schema
      // Note: Don't store tokens/secrets in fullApiData - they're sensitive
      const { token, secret_token, ...safeData } = integration
      const universalIntegration = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "gridpane",
        providerResourceId: integration.id.toString(),
        integrationId: integration.id,
        integratedService: integration.integrated_service,
        integrationName: integration.integration_name,
        region: integration.region,
        fullApiData: safeData, // Exclude tokens/secrets
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, universalIntegration)
      } else {
        await ctx.db.insert("backupIntegrations", universalIntegration)
      }
    }
  },
}
