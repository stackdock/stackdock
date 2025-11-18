/**
 * Firecrawl Health Monitoring Adapter
 * 
 * Uses Firecrawl to scrape provider status pages and monitor health.
 * This allows users to stay within StackDock instead of visiting multiple
 * provider status pages.
 * 
 * Key Features:
 * - Scrapes provider status/health pages
 * - Consolidates health status from all providers
 * - Detects incidents and outages
 * - Cyclical health checks
 * - Notifies users of provider issues
 * 
 * @see https://docs.firecrawl.dev/
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { FirecrawlAPI } from "./api"
import { getProviderStatusPageUrl, PROVIDER_STATUS_PAGES } from "../../../lib/firecrawl"
import type { FirecrawlHealthCheck } from "./types"

/**
 * Map Firecrawl health status to universal monitor status
 */
function mapFirecrawlStatus(status: string): string {
  const statusMap: Record<string, string> = {
    "operational": "up",
    "degraded": "degraded",
    "down": "down",
    "unknown": "unknown",
  }
  return statusMap[status] || "unknown"
}

export const firecrawlAdapter: DockAdapter = {
  provider: "firecrawl",

  /**
   * Validate Firecrawl API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new FirecrawlAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("Firecrawl credential validation failed:", error)
      return false
    }
  },

  /**
   * Sync provider health monitors
   * 
   * This adapter creates health monitors for all configured provider status pages.
   * It scrapes status pages using Firecrawl and stores the health status.
   * 
   * Flow:
   * 1. Get all available provider status page URLs
   * 2. Use Firecrawl to scrape each status page
   * 3. Extract health status and incidents
   * 4. Upsert into `monitors` table
   * 5. Users can view consolidated health status in StackDock
   */
  async syncMonitors(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: FirecrawlHealthCheck[]
  ): Promise<void> {
    let healthChecks: FirecrawlHealthCheck[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      healthChecks = preFetchedData
    } else {
      // Fetch data directly (fallback)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new FirecrawlAPI(apiKey)
      
      // Get list of all providers that have status pages configured
      const providers = Object.keys(PROVIDER_STATUS_PAGES)
      
      // Check health of all provider status pages
      healthChecks = await api.checkAllProviderHealthPages(providers)
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each health check to universal monitors table
    for (const healthCheck of healthChecks) {
      // Use URL as unique identifier
      const providerResourceId = healthCheck.url
      syncedResourceIds.add(providerResourceId)

      const existing = await ctx.db
        .query("monitors")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      // Extract provider name from URL
      const providerName = Object.entries(PROVIDER_STATUS_PAGES).find(
        ([_, url]) => url === healthCheck.url
      )?.[0] || "unknown"

      const monitorData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "firecrawl",
        providerResourceId,
        name: `${providerName.charAt(0).toUpperCase() + providerName.slice(1)} Health Status`,
        url: healthCheck.url,
        monitorType: "health-page",
        status: mapFirecrawlStatus(healthCheck.status),
        lastCheckedAt: healthCheck.lastCheckedAt,
        checkFrequency: 300, // 5 minutes default
        fullApiData: {
          healthCheck: {
            ...healthCheck,
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

    // Delete orphaned resources
    const existingMonitors = await ctx.db
      .query("monitors")
      .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
      .collect()

    for (const existing of existingMonitors) {
      // Only delete monitors created by this adapter
      if (existing.provider === "firecrawl" && !syncedResourceIds.has(existing.providerResourceId)) {
        console.log(`[Firecrawl] Deleting orphaned monitor: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },
}
