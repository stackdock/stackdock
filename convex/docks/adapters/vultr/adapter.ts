/**
 * Vultr Dock Adapter
 * 
 * Translates Vultr API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /account → validateCredentials()
 * - GET /instances → syncServers()
 * 
 * @see https://docs.vultr.com/api/
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import type { Server, BlockVolume } from "../../../lib/universalTypes"
import { decryptApiKey } from "../../../lib/encryption"
import { VultrAPI } from "./api"
import type { VultrInstance, VultrBlock } from "./types"

/**
 * Map Vultr instance status to universal status
 * 
 * Uses power_status field (not status field)
 * Priority order:
 * 1. power_status === "running" → "running"
 * 2. power_status === "pending" || "resizing" → "pending"
 * 3. power_status === "stopped" || "suspended" → "stopped"
 * 4. else → use power_status as-is
 * 
 * @see docks/vultr/getInstances.json - power_status is "running" in example
 */
function mapVultrStatus(instance: VultrInstance): string {
  const statusMap: Record<string, string> = {
    running: "running",
    pending: "pending",
    resizing: "pending",
    stopped: "stopped",
    suspended: "stopped",
  }
  
  const powerStatus = instance.power_status?.toLowerCase()
  return statusMap[powerStatus] || powerStatus || "unknown"
}

export const vultrAdapter: DockAdapter = {
  provider: "vultr",

  /**
   * Validate Vultr API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new VultrAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("Vultr credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync Vultr instances to universal `servers` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each instance, upsert into `servers` table
   * 4. Map status using priority order
   * 5. Store all Vultr fields in fullApiData
   */
  async syncServers(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: VultrInstance[]
  ): Promise<void> {
    let instances: VultrInstance[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      instances = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new VultrAPI(apiKey)
      instances = await api.listInstances()
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each instance to universal table
    for (const instance of instances) {
      const providerResourceId = instance.id
      syncedResourceIds.add(providerResourceId)

      const existing = await ctx.db
        .query("servers")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const serverData : Omit<Server, "_id" | "_creationTime"> = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "vultr",
        providerResourceId,
        name: instance.label || instance.id,
        status: mapVultrStatus(instance),
        region: instance.region,
        primaryIpAddress: instance.main_ip,
        fullApiData: {
          // Store all Vultr fields
          instance: {
            // Include all fields from API response (plan/instanceType stored here)
            ...instance,
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
    const existingServers = await ctx.db
      .query("servers")
      .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
      .collect()

    for (const existing of existingServers) {
      if (
        !syncedResourceIds.has(existing.providerResourceId) &&
        existing.provisioningSource === undefined
      ) {
        console.log(`[Vultr] Deleting orphaned server: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },

  /**
   * Sync Vultr blocks to universal `blockVolumes` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each block, upsert into `blockVolumes` table
   * 4. Map Vultr fields to universal schema
   * 5. Store all Vultr fields in fullApiData
   */
  async syncBlockVolumes(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: VultrBlock[]
  ): Promise<void> {
    let blocks: VultrBlock[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      blocks = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new VultrAPI(apiKey)
      blocks = await api.listBlocks()
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each block to universal table
    for (const block of blocks) {
      const providerResourceId = block.id
      syncedResourceIds.add(providerResourceId)

      const existing = await ctx.db
        .query("blockVolumes")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const volumeData : Omit<BlockVolume, "_id" | "_creationTime"> = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "vultr",
        providerResourceId,
        name: block.label || block.id,
        sizeGb: block.size_gb,
        region: block.region,
        status: block.status || "active",
        attachedToInstance: block.attached_to_instance || undefined,
        attachedToInstanceLabel: block.attached_to_instance_label || undefined,
        mountId: block.mount_id || undefined,
        blockType: block.block_type || undefined,
        fullApiData: {
          // Store all Vultr fields
          block: {
            ...block,
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
        console.log(`[Vultr] Deleting orphaned block volume: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },
}
