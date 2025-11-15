/**
 * Hetzner Dock Adapter
 * 
 * Translates Hetzner Cloud API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /servers → validateCredentials() and syncServers()
 * 
 * @see https://docs.hetzner.cloud/
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { HetznerAPI } from "./api"
import type { HetznerServer } from "./types"

/**
 * Map Hetzner server status to universal status
 * 
 * Hetzner statuses: "running", "starting", "stopping", "off", "rebooting", "migrating", "rebuilding", "deleting"
 * Universal statuses: "running", "stopped", "pending", "error"
 */
function mapHetznerStatus(server: HetznerServer): string {
  const statusMap: Record<string, string> = {
    running: "running",
    starting: "pending",
    stopping: "pending",
    off: "stopped",
    rebooting: "pending",
    migrating: "pending",
    rebuilding: "pending",
    deleting: "pending",
  }
  
  const status = server.status?.toLowerCase()
  return statusMap[status] || status || "unknown"
}

export const hetznerAdapter: DockAdapter = {
  provider: "hetzner",

  /**
   * Validate Hetzner API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new HetznerAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("Hetzner credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync Hetzner servers to universal `servers` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each server, upsert into `servers` table
   * 4. Map status using status mapping
   * 5. Extract region from datacenter.location.name
   * 6. Extract primary IP from public_net.ipv4.ip
   * 7. Store all Hetzner fields in fullApiData
   */
  async syncServers(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: HetznerServer[]
  ): Promise<void> {
    let servers: HetznerServer[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      servers = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new HetznerAPI(apiKey)
      servers = await api.listServers()
    }

    // Sync each server to universal table
    for (const server of servers) {
      const providerResourceId = server.id.toString()

      const existing = await ctx.db
        .query("servers")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      // Extract region from datacenter.location.name
      const region = server.datacenter?.location?.name || "unknown"
      
      // Extract primary IP from public_net.ipv4.ip
      const primaryIpAddress = server.public_net?.ipv4?.ip || undefined

      const serverData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "hetzner",
        providerResourceId,
        name: server.name,
        status: mapHetznerStatus(server),
        region,
        primaryIpAddress,
        fullApiData: {
          // Store all Hetzner fields
          server: {
            ...server,
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
