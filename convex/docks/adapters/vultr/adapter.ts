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
import { decryptApiKey } from "../../../lib/encryption"
import { VultrAPI } from "./api"
import type { VultrInstance } from "./types"

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

    // Sync each instance to universal table
    for (const instance of instances) {
      const providerResourceId = instance.id

      const existing = await ctx.db
        .query("servers")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const serverData = {
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
  },
}
