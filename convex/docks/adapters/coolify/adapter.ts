/**
 * Coolify Dock Adapter
 * 
 * Translates Coolify API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /health → validateCredentials()
 * - GET /servers → syncServers()
 * - GET /services → syncWebServices() and syncDatabases()
 * 
 * @see https://coolify.io/docs/api
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { CoolifyAPI } from "./api"
import type { CoolifyServer, CoolifyService, CoolifyDatabase } from "./types"

/**
 * Map Coolify server status to universal status
 * 
 * Uses is_reachable and is_usable flags
 * Priority order:
 * 1. is_reachable && is_usable → "running"
 * 2. !is_reachable → "stopped"
 * 3. is_reachable && !is_usable → "pending"
 */
function mapCoolifyServerStatus(isReachable: boolean, isUsable: boolean): string {
  if (isReachable && isUsable) return "running"
  if (!isReachable) return "stopped"
  return "pending" // If reachable but not usable
}

/**
 * Map Coolify service status to universal status
 * 
 * Status examples: "running:healthy", "running (healthy)", "stopped", "building", "deploying", "error", "failed"
 */
function mapCoolifyServiceStatus(status: string): string {
  const statusLower = status.toLowerCase()
  if (statusLower.includes("running")) return "running"
  if (statusLower.includes("stopped")) return "stopped"
  if (statusLower.includes("building") || statusLower.includes("deploying")) return "pending"
  if (statusLower.includes("error") || statusLower.includes("failed")) return "error"
  return "unknown"
}

export const coolifyAdapter: DockAdapter = {
  provider: "coolify",

  /**
   * Validate Coolify API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new CoolifyAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("Coolify credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync Coolify servers to universal `servers` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each server, upsert into `servers` table
   * 4. Map status using is_reachable and is_usable flags
   * 5. Store all Coolify fields in fullApiData
   */
  async syncServers(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: CoolifyServer[]
  ): Promise<void> {
    let servers: CoolifyServer[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      servers = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new CoolifyAPI(apiKey)
      servers = await api.listServers()
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each server to universal table
    for (const server of servers) {
      const providerResourceId = server.uuid
      syncedResourceIds.add(providerResourceId)

      const existing = await ctx.db
        .query("servers")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const serverData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "coolify",
        providerResourceId,
        name: server.name,
        primaryIpAddress: server.ip,
        status: mapCoolifyServerStatus(server.is_reachable, server.is_usable),
        fullApiData: {
          port: server.port,
          user: server.user,
          description: server.description,
          is_coolify_host: server.is_coolify_host,
          proxy: server.proxy,
          settings: server.settings,
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, serverData)
      } else {
        await ctx.db.insert("servers", serverData)
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
        console.log(`[Coolify] Deleting orphaned server: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },

  /**
   * Sync Coolify services to universal `webServices` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each service, upsert into `webServices` table
   * 4. Use first application's FQDN as production URL
   * 5. Map status using status mapping
   * 6. Store all Coolify fields in fullApiData (including nested applications and databases)
   */
  async syncWebServices(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: CoolifyService[]
  ): Promise<void> {
    let services: CoolifyService[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      services = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new CoolifyAPI(apiKey)
      services = await api.listServices()
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each service to universal table
    for (const service of services) {
      const providerResourceId = service.uuid
      syncedResourceIds.add(providerResourceId)

      const existing = await ctx.db
        .query("webServices")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      // Use first application's FQDN as production URL
      const productionUrl = service.applications[0]?.fqdn || undefined

      const webServiceData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "coolify",
        providerResourceId,
        name: service.name,
        productionUrl,
        environment: service.environment_id?.toString() || "production",
        status: mapCoolifyServiceStatus(service.status),
        fullApiData: {
          service_type: service.service_type,
          server_id: service.server_id,
          server_status: service.server_status,
          destination_type: service.destination_type,
          destination_id: service.destination_id,
          config_hash: service.config_hash,
          applications: service.applications,
          databases: service.databases,
          server: service.server,
          created_at: service.created_at,
          updated_at: service.updated_at,
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, webServiceData)
      } else {
        await ctx.db.insert("webServices", webServiceData)
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
        console.log(`[Coolify] Deleting orphaned web service: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },

  /**
   * Sync Coolify databases to universal `databases` table
   * 
   * Databases are extracted from services (nested in service.databases[])
   * Pre-fetched data is already extracted databases (from action)
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (already extracted from services)
   * 2. Otherwise, fetch services and extract databases
   * 3. For each database, upsert into `databases` table
   * 4. Extract engine and version from image (e.g., "mariadb:11" → engine: "mariadb", version: "11")
   * 5. Map status using status mapping
   * 6. Store all Coolify fields in fullApiData
   */
  async syncDatabases(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: Array<CoolifyDatabase & { service_uuid?: string; service_name?: string }>
  ): Promise<void> {
    // Pre-fetched data is already extracted databases (from action)
    // If not provided, fetch services and extract databases
    let databases: Array<CoolifyDatabase & { service_uuid?: string; service_name?: string }>

    if (preFetchedData) {
      databases = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new CoolifyAPI(apiKey)
      const services = await api.listServices()

      // Extract all databases from all services
      databases = services.flatMap(service =>
        service.databases.map(db => ({
          ...db,
          service_uuid: service.uuid,
          service_name: service.name,
        }))
      )
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each database to universal table
    for (const db of databases) {
      const providerResourceId = db.uuid
      syncedResourceIds.add(providerResourceId)

      const existing = await ctx.db
        .query("databases")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      // Extract engine and version from image
      // "mariadb:11" → engine: "mariadb", version: "11"
      // "postgres:15" → engine: "postgres", version: "15"
      const imageParts = db.image.split(":")
      const engine = imageParts[0] || "unknown"
      const version = imageParts.length > 1 ? imageParts[1] : undefined

      const databaseData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "coolify",
        providerResourceId,
        name: db.name,
        engine,
        version,
        status: mapCoolifyServiceStatus(db.status),
        fullApiData: {
          service_id: db.service_id,
          image: db.image,
          ports: db.ports,
          is_public: db.is_public,
          public_port: db.public_port,
          last_online_at: db.last_online_at,
          service_uuid: db.service_uuid,
          service_name: db.service_name,
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, databaseData)
      } else {
        await ctx.db.insert("databases", databaseData)
      }
    }

    // Delete orphaned resources (exist in DB but not in API response)
    // Only delete discovered resources (provisioningSource === undefined)
    const existingDatabases = await ctx.db
      .query("databases")
      .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
      .collect()

    for (const existing of existingDatabases) {
      if (
        !syncedResourceIds.has(existing.providerResourceId) &&
        existing.provisioningSource === undefined
      ) {
        console.log(`[Coolify] Deleting orphaned database: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },
}
