/**
 * Linode Dock Adapter
 * 
 * Translates Linode API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /account → validateCredentials()
 * - GET /linode/instances → syncServers()
 * 
 * @see https://www.linode.com/api/v4
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { LinodeAPI } from "./api"
import type { LinodeInstance, LinodeBucket } from "./types"

/**
 * Map Linode instance status to universal status
 * 
 * Uses status field directly (most values map 1:1)
 * Priority order:
 * 1. status === "running" → "running"
 * 2. status === "stopped" || "offline" → "stopped"
 * 3. status === "booting" || "rebooting" || "provisioning" || etc. → "pending"
 * 4. else → use status as-is
 * 
 * @see docks/linode/getLinodes.json - status is "running" in example
 */
function mapLinodeStatus(linode: LinodeInstance): string {
  const statusMap: Record<string, string> = {
    running: "running",
    stopped: "stopped",
    offline: "stopped",
    booting: "pending",
    rebooting: "pending",
    shutting_down: "pending",
    provisioning: "pending",
    deleting: "pending",
    migrating: "pending",
    rebuilding: "pending",
    cloning: "pending",
    restoring: "pending",
  }
  
  const status = linode.status?.toLowerCase()
  return statusMap[status] || status || "unknown"
}

/**
 * Extract first public IPv4 address from linode ipv4 array
 */
function getPublicIp(linode: LinodeInstance): string {
  return linode.ipv4?.[0] || ""
}

export const linodeAdapter: DockAdapter = {
  provider: "linode",

  /**
   * Validate Linode API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new LinodeAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("Linode credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync Linode instances to universal `servers` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each linode, upsert into `servers` table
   * 4. Map status using priority order
   * 5. Store all Linode fields in fullApiData
   */
  async syncServers(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: LinodeInstance[]
  ): Promise<void> {
    let linodes: LinodeInstance[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      linodes = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new LinodeAPI(apiKey)
      linodes = await api.listLinodes()
    }

    // Sync each linode to universal table
    for (const linode of linodes) {
      // Convert linode.id (number) to string for providerResourceId
      const providerResourceId = linode.id.toString()

      const existing = await ctx.db
        .query("servers")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const serverData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "linode",
        providerResourceId,
        name: linode.label,
        status: mapLinodeStatus(linode),
        region: linode.region,
        primaryIpAddress: getPublicIp(linode),
        fullApiData: {
          // Store all Linode fields
          linode: {
            // Include all fields from API response (type/instanceType stored here)
            ...linode,
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

  /**
   * Sync Linode buckets to universal `buckets` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each bucket, upsert into `buckets` table
   * 4. Map Linode fields to universal schema
   * 5. Store all Linode fields in fullApiData
   */
  async syncBuckets(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: LinodeBucket[]
  ): Promise<void> {
    let buckets: LinodeBucket[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      buckets = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new LinodeAPI(apiKey)
      buckets = await api.listBuckets()
    }

    // Sync each bucket to universal table
    for (const bucket of buckets) {
      // Use bucket.label as providerResourceId (Linode uses label as unique identifier)
      const providerResourceId = bucket.label

      const existing = await ctx.db
        .query("buckets")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const bucketData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "linode",
        providerResourceId,
        name: bucket.label,
        region: bucket.region,
        cluster: bucket.cluster || undefined,
        hostname: bucket.hostname || undefined,
        s3Endpoint: bucket.s3_endpoint || undefined,
        sizeBytes: bucket.size || undefined,
        objectCount: bucket.objects || undefined,
        status: "active", // Linode buckets don't have explicit status
        fullApiData: {
          // Store all Linode fields
          bucket: {
            ...bucket,
          },
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, bucketData)
      } else {
        await ctx.db.insert("buckets", bucketData)
      }
    }
  },
}
