/**
 * Better Stack Better Uptime Dock Adapter
 * 
 * Translates Better Stack Better Uptime API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /monitors → validateCredentials() and syncMonitors()
 * - GET /monitor-groups → syncMonitors() (for group names)
 * 
 * @see https://betterstack.com/docs/uptime/api/
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { BetterStackAPI } from "./api"
import type { BetterStackMonitor, BetterStackMonitorGroup } from "./types"

/**
 * Map Better Stack monitor status to universal status
 * 
 * Better Stack uses: "up", "down", "paused"
 * Universal schema uses: "up", "down", "paused"
 * (Direct mapping, no transformation needed)
 */
function mapBetterStackStatus(status: string): string {
  // Better Stack statuses are already compatible
  return status.toLowerCase()
}

/**
 * Convert ISO 8601 timestamp to Unix timestamp (milliseconds)
 */
function isoToTimestamp(iso: string): number {
  return new Date(iso).getTime()
}

export const betterStackAdapter: DockAdapter = {
  provider: "better-stack",

  /**
   * Validate Better Stack API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new BetterStackAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("Better Stack credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync Better Stack monitors to universal `monitors` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. Fetch monitor groups for group names
   * 4. For each monitor, upsert into `monitors` table
   * 5. Map status (direct mapping)
   * 6. Store all Better Stack fields in fullApiData
   */
  async syncMonitors(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: BetterStackMonitor[]
  ): Promise<void> {
    let monitors: BetterStackMonitor[]
    let monitorGroups: BetterStackMonitorGroup[] = []

    if (preFetchedData) {
      // Use pre-fetched data from action
      monitors = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new BetterStackAPI(apiKey)
      monitors = await api.listMonitors()
      monitorGroups = await api.listMonitorGroups()
    }

    // If we have pre-fetched data, we need to fetch groups separately
    // (Groups are usually fetched in action, but for fallback we fetch here)
    if (preFetchedData) {
      try {
        const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
          dockId: dock._id,
          orgId: dock.orgId,
        })
        const api = new BetterStackAPI(apiKey)
        monitorGroups = await api.listMonitorGroups()
      } catch (error) {
        console.error("[Better Stack] Failed to fetch monitor groups:", error)
        // Continue without group names - monitors will still sync
      }
    }

    // Create a map of group IDs to group names for quick lookup
    const groupMap = new Map<number, string>()
    for (const group of monitorGroups) {
      groupMap.set(parseInt(group.id), group.attributes.name)
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each monitor to universal table
    for (const monitor of monitors) {
      const providerResourceId = monitor.id
      syncedResourceIds.add(providerResourceId)

      const existing = await ctx.db
        .query("monitors")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const attrs = monitor.attributes
      const groupName = groupMap.get(attrs.monitor_group_id) || undefined

      const monitorData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "better-stack",
        providerResourceId,
        name: attrs.pronounceable_name || attrs.url,
        url: attrs.url,
        monitorType: attrs.monitor_type,
        status: mapBetterStackStatus(attrs.status),
        lastCheckedAt: attrs.last_checked_at ? isoToTimestamp(attrs.last_checked_at) : undefined,
        checkFrequency: attrs.check_frequency,
        monitorGroupId: attrs.monitor_group_id.toString(),
        monitorGroupName: groupName,
        fullApiData: {
          // Store all Better Stack fields
          monitor: {
            ...monitor,
          },
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, monitorData)
      } else {
        await ctx.db.insert("monitors", monitorData)
      }
    }

    // Delete orphaned resources (exist in DB but not in API response)
    // Only delete discovered resources (no provisioningSource field for monitors)
    const existingMonitors = await ctx.db
      .query("monitors")
      .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
      .collect()

    for (const existing of existingMonitors) {
      if (!syncedResourceIds.has(existing.providerResourceId)) {
        console.log(`[Better Stack] Deleting orphaned monitor: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },
}
