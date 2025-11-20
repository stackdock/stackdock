/**
 * Cloudflare Dock Adapter
 * 
 * Translates Cloudflare API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /zones → syncDomains()
 * - GET /zones/{zone_id}/dns_records → Stored in domains.fullApiData.dnsRecords
 * - GET /accounts/{account_id}/pages/projects → syncWebServices() (Pages)
 * - GET /accounts/{account_id}/workers/scripts → syncWebServices() (Workers)
 * - GET /user/tokens/verify → validateCredentials()
 * 
 * @see docks/cloudflare/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { CloudflareAPI } from "./api"
import type {
  CloudflareZone,
  CloudflarePage,
  CloudflareWorker,
} from "./types"

/**
 * Map Cloudflare zone status to universal status
 */
function mapCloudflareZoneStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "active",
    pending: "pending",
    initializing: "pending",
    moved: "active", // Zone moved to another account, still active
    deleted: "stopped",
    read_only: "active", // Read-only mode, still active
  }
  return statusMap[status] || status.toLowerCase()
}

/**
 * Map Cloudflare Pages deployment status to universal status
 */
function mapCloudflarePagesStatus(
  deployment?: CloudflarePage["canonical_deployment"]
): string {
  if (!deployment) return "pending"

  const stageStatus = deployment.latest_stage?.status
  if (stageStatus === "success") return "running"
  if (stageStatus === "failure") return "error"
  if (stageStatus === "idle") return "pending"

  return "pending"
}

/**
 * Get production URL from Cloudflare Page
 */
function getPagesProductionUrl(page: CloudflarePage): string | undefined {
  // Prefer canonical deployment URL (production)
  if (page.canonical_deployment?.url) {
    return page.canonical_deployment.url
  }

  // Fall back to first custom domain
  if (page.domains?.[0]) {
    const domain = page.domains[0]
    return domain.startsWith("http") ? domain : `https://${domain}`
  }

  // Fall back to subdomain
  if (page.subdomain) {
    return `https://${page.subdomain}`
  }

  return undefined
}

/**
 * Get git repo from Cloudflare Page source
 */
function getPagesGitRepo(page: CloudflarePage): string | undefined {
  if (!page.source?.config) return undefined

  const { owner, repo_name } = page.source.config
  if (owner && repo_name) {
    return `${owner}/${repo_name}`
  }

  return undefined
}

/**
 * Convert ISO 8601 string to Unix timestamp
 */
function isoToTimestamp(iso: string): number {
  return new Date(iso).getTime()
}

/**
 * Cloudflare Dock Adapter
 * 
 * Implements DockAdapter interface for Cloudflare provider
 */
export const cloudflareAdapter: DockAdapter = {
  provider: "cloudflare",

  /**
   * Validate Cloudflare API credentials
   * Uses lightweight GET /user/tokens/verify endpoint
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new CloudflareAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      // Log error for debugging but return false for invalid credentials
      console.error("Cloudflare credential validation failed:", error)
      // Re-throw to get more detail in the mutation
      throw error
    }
  },

  /**
   * Sync Cloudflare zones to universal domains table
   * GET /zones
   * 
   * Also fetches and stores DNS records for each zone in fullApiData.dnsRecords
   */
  async syncDomains(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: CloudflareZone[]
  ): Promise<void> {
    let zones: CloudflareZone[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      zones = preFetchedData
    } else {
      // Fetch data directly (for direct mutation calls or testing)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new CloudflareAPI(apiKey)
      zones = await api.getZones()
    }

    // Extract account ID from first zone (if not already stored)
    if (zones.length > 0 && zones[0]?.account?.id && !dock.accountId) {
      await ctx.db.patch(dock._id, {
        accountId: zones[0].account.id,
        updatedAt: Date.now(),
      })
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each zone to domains table
    // DNS records are already fetched in the action and attached to zone objects
    for (const zone of zones) {
      const providerResourceId = zone.id
      syncedResourceIds.add(providerResourceId)

      const existing = await ctx.db
        .query("domains")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      // Get DNS records from zone object (pre-fetched in action)
      // If not present (e.g., direct adapter call), use empty array
      const dnsRecords = (zone as any).dnsRecords || []

      const domainData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "cloudflare",
        providerResourceId,
        domainName: zone.name,
        status: mapCloudflareZoneStatus(zone.status),
        // DNS zones don't expire (domain registrations do) - omit expiresAt
        fullApiData: {
          ...zone,
          dnsRecords: dnsRecords, // Include DNS records in fullApiData
        },
        updatedAt: isoToTimestamp(zone.modified_on),
      }

      if (existing) {
        await ctx.db.patch(existing._id, domainData)
      } else {
        await ctx.db.insert("domains", domainData)
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
        console.log(`[Cloudflare] Deleting orphaned domain: ${existing.domainName} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },

  /**
   * Sync Cloudflare Pages and Workers to universal webServices table
   * 
   * This method handles both Pages and Workers. The action will pass them
   * separately with type markers, or we can determine type from structure.
   */
  async syncWebServices(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: any[]
  ): Promise<void> {
    // If no pre-fetched data, we need account ID
    if (!preFetchedData || preFetchedData.length === 0) {
      if (!dock.accountId) {
        throw new Error("Account ID required for Cloudflare Pages/Workers sync")
      }

      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new CloudflareAPI(apiKey, dock.accountId)

      // Fetch both Pages and Workers
      const [pages, workers] = await Promise.all([
        api.getPages(dock.accountId),
        api.getWorkers(dock.accountId),
      ])

      // Sync Pages
      await syncPages(ctx, dock, pages)

      // Sync Workers
      await syncWorkers(ctx, dock, workers)

      return
    }

    // Split Pages and Workers based on _type marker (added by action)
    // or fall back to structure detection
    const pages: CloudflarePage[] = []
    const workers: CloudflareWorker[] = []

    for (const item of preFetchedData) {
      if (item._type === "pages" || item.domains || item.canonical_deployment) {
        // It's a Page - filter out _type marker
        const { _type, ...page } = item
        pages.push(page as CloudflarePage)
      } else if (item._type === "workers" || (item.subdomain && !item.domains)) {
        // It's a Worker - filter out _type marker
        const { _type, ...worker } = item
        workers.push(worker as CloudflareWorker)
      }
    }

    // Sync Pages if any
    if (pages.length > 0) {
      await syncPages(ctx, dock, pages)
    }

    // Sync Workers if any
    if (workers.length > 0) {
      await syncWorkers(ctx, dock, workers)
    }
  },
}

/**
 * Helper function for syncing Pages
 */
async function syncPages(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  pages: CloudflarePage[]
): Promise<void> {
  // Track synced resource IDs for orphan detection
  const syncedResourceIds = new Set<string>()

  for (const page of pages) {
    const providerResourceId = page.id
    syncedResourceIds.add(providerResourceId)

    const existing = await ctx.db
      .query("webServices")
      .withIndex("by_dock_resource", (q) =>
        q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
      )
      .first()

    const productionUrl = getPagesProductionUrl(page)
    const gitRepo = getPagesGitRepo(page)
    const webServiceData = {
      orgId: dock.orgId,
      dockId: dock._id,
      provider: "cloudflare",
      providerResourceId,
      name: page.name,
      ...(productionUrl ? { productionUrl } : {}),
      environment: page.production_branch || "production",
      ...(gitRepo ? { gitRepo } : {}),
      status: mapCloudflarePagesStatus(page.canonical_deployment),
      fullApiData: {
        type: "pages",
        ...page,
      },
      updatedAt: isoToTimestamp(page.created_on),
    }

    if (existing) {
      await ctx.db.patch(existing._id, webServiceData)
    } else {
      await ctx.db.insert("webServices", webServiceData)
    }
  }

  // Delete orphaned Pages (exist in DB but not in API response)
  // Only delete discovered resources (provisioningSource === undefined)
  const existingWebServices = await ctx.db
    .query("webServices")
    .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
    .collect()

  for (const existing of existingWebServices) {
    // Only delete Cloudflare Pages (check fullApiData.type === "pages")
    if (
      existing.provider === "cloudflare" &&
      existing.fullApiData?.type === "pages" &&
      !syncedResourceIds.has(existing.providerResourceId) &&
      existing.provisioningSource === undefined
    ) {
      console.log(`[Cloudflare] Deleting orphaned Page: ${existing.name} (${existing.providerResourceId})`)
      await ctx.db.delete(existing._id)
    }
  }
}

/**
 * Helper function for syncing Workers
 */
async function syncWorkers(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  workers: CloudflareWorker[]
): Promise<void> {
  // Track synced resource IDs for orphan detection
  const syncedResourceIds = new Set<string>()

  for (const worker of workers) {
    // Cloudflare Workers API structure (based on actual API response analysis):
    // The API response has inconsistent structure:
    // - Sometimes 'id' is hash, sometimes it's name
    // - 'tag' field contains deployment ID hash when present
    // - 'name' field may be missing
    //
    // From error analysis: actual response has:
    // - 'id' = "cloudflare-workers-next-template" (name string)
    // - 'tag' = "620112e7b94345d0a16e8c5bdb539067" (hash, in fullApiData)
    // - 'name' = missing
    //
    // Strategy: Use 'tag' as providerResourceId (unique), use 'name' or 'id' as display name
    const workerTag = (worker as any).tag
    const workerId = workerTag || worker.id // Use tag (hash) if available, otherwise id
    const workerName = worker.name || worker.id // Use name if available, otherwise id

    if (!workerId || !workerName) {
      console.error("[Cloudflare] Invalid worker data - missing id/name:", {
        id: worker.id,
        name: worker.name,
        tag: workerTag,
        fullWorker: worker,
      })
      continue
    }

    syncedResourceIds.add(workerId)

    const existing = await ctx.db
      .query("webServices")
      .withIndex("by_dock_resource", (q) =>
        q.eq("dockId", dock._id).eq("providerResourceId", workerId)
      )
      .first()

    // Workers subdomain format: {name}.workers.dev
    const productionUrl = worker.subdomain?.enabled
      ? `https://${workerName}.workers.dev`
      : undefined

    const webServiceData = {
      orgId: dock.orgId,
      dockId: dock._id,
      provider: "cloudflare",
      providerResourceId: workerId,
      name: workerName,
      ...(productionUrl ? { productionUrl } : {}),
      environment: "production", // Workers are always production
      status: "running", // Workers are always running if deployed
      fullApiData: {
        type: "workers",
        ...worker,
      },
      updatedAt: isoToTimestamp(worker.created_on || worker.updated_on || new Date().toISOString()),
    }

    if (existing) {
      await ctx.db.patch(existing._id, webServiceData)
    } else {
      await ctx.db.insert("webServices", webServiceData)
    }
  }

  // Delete orphaned Workers (exist in DB but not in API response)
  // Only delete discovered resources (provisioningSource === undefined)
  const existingWebServices = await ctx.db
    .query("webServices")
    .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
    .collect()

  for (const existing of existingWebServices) {
    // Only delete Cloudflare Workers (check fullApiData.type === "workers")
    if (
      existing.provider === "cloudflare" &&
      existing.fullApiData?.type === "workers" &&
      !syncedResourceIds.has(existing.providerResourceId) &&
      existing.provisioningSource === undefined
    ) {
      console.log(`[Cloudflare] Deleting orphaned Worker: ${existing.name} (${existing.providerResourceId})`)
      await ctx.db.delete(existing._id)
    }
  }
}
