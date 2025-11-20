/**
 * DigitalOcean Dock Adapter
 * 
 * Translates DigitalOcean API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /account → validateCredentials()
 * - GET /droplets → syncServers()
 * 
 * @see https://docs.digitalocean.com/reference/api/api-reference/
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { DigitalOceanAPI } from "./api"
import type { DigitalOceanDroplet, DigitalOceanVolume } from "./types"

/**
 * Map DigitalOcean droplet status to universal status
 * 
 * Uses status field
 * Priority order:
 * 1. status === "active" → "running"
 * 2. status === "off" → "stopped"
 * 3. status === "archive" → "archived"
 * 4. status === "new" → "pending"
 * 5. else → use status as-is
 * 
 * @see docks/digitalocean/getDroplets.json - status is "active" in example
 */
function mapDigitalOceanStatus(droplet: DigitalOceanDroplet): string {
  const statusMap: Record<string, string> = {
    active: "running",
    off: "stopped",
    archive: "archived",
    new: "pending",
  }
  
  const status = droplet.status?.toLowerCase()
  return statusMap[status] || status || "unknown"
}

/**
 * Extract public IPv4 address from droplet networks
 */
function getPublicIp(droplet: DigitalOceanDroplet): string {
  const publicNetwork = droplet.networks.v4.find(net => net.type === "public")
  return publicNetwork?.ip_address || ""
}

export const digitaloceanAdapter: DockAdapter = {
  provider: "digitalocean",

  /**
   * Validate DigitalOcean API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new DigitalOceanAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("DigitalOcean credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync DigitalOcean droplets to universal `servers` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each droplet, upsert into `servers` table
   * 4. Map status using priority order
   * 5. Store all DigitalOcean fields in fullApiData
   */
  async syncServers(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: DigitalOceanDroplet[]
  ): Promise<void> {
    let droplets: DigitalOceanDroplet[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      droplets = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new DigitalOceanAPI(apiKey)
      droplets = await api.listDroplets()
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each droplet to universal table
    for (const droplet of droplets) {
      // Convert droplet.id (number) to string for providerResourceId
      const providerResourceId = droplet.id.toString()
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
        provider: "digitalocean",
        providerResourceId,
        name: droplet.name,
        status: mapDigitalOceanStatus(droplet),
        region: droplet.region.slug,
        primaryIpAddress: getPublicIp(droplet),
        fullApiData: {
          // Store all DigitalOcean fields
          droplet: {
            // Include all fields from API response (size/instanceType stored here)
            ...droplet,
          },
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
    // Never delete provisioned resources (provisioningSource === "sst" | "api" | "manual")
    const existingServers = await ctx.db
      .query("servers")
      .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
      .collect()

    for (const existing of existingServers) {
      if (
        !syncedResourceIds.has(existing.providerResourceId) &&
        existing.provisioningSource === undefined // Only delete discovered resources
      ) {
        console.log(`[DigitalOcean] Deleting orphaned server: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },

  /**
   * Sync DigitalOcean volumes to universal `blockVolumes` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each volume, upsert into `blockVolumes` table
   * 4. Map DO fields to universal schema
   * 5. Store all DO fields in fullApiData
   */
  async syncBlockVolumes(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: DigitalOceanVolume[]
  ): Promise<void> {
    let volumes: DigitalOceanVolume[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      volumes = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new DigitalOceanAPI(apiKey)
      volumes = await api.listVolumes()
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each volume to universal table
    for (const volume of volumes) {
      const providerResourceId = volume.id
      syncedResourceIds.add(providerResourceId)

      const existing = await ctx.db
        .query("blockVolumes")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const attachedToInstance = volume.droplet_ids.length > 0 && volume.droplet_ids[0] ? volume.droplet_ids[0].toString() : undefined
      const volumeData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "digitalocean",
        providerResourceId,
        name: volume.name,
        sizeGb: volume.size_gigabytes,
        region: volume.region.slug || volume.region.name,
        status: "active", // DO volumes don't have explicit status
        ...(attachedToInstance ? { attachedToInstance } : {}),
        ...(volume.filesystem_type ? { filesystemType: volume.filesystem_type } : {}),
        fullApiData: {
          // Store all DigitalOcean fields
          volume: {
            ...volume,
          },
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, volumeData)
      } else {
        await ctx.db.insert("blockVolumes", volumeData)
      }
    }

    // Delete orphaned resources (exist in DB but not in API response)
    // Only delete discovered resources (provisioningSource === undefined)
    const existingVolumes = await ctx.db
      .query("blockVolumes")
      .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
      .collect()

    for (const existing of existingVolumes) {
      if (
        !syncedResourceIds.has(existing.providerResourceId) &&
        existing.provisioningSource === undefined
      ) {
        console.log(`[DigitalOcean] Deleting orphaned block volume: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },
}
