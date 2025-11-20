/**
 * Turso Dock Adapter
 * 
 * Translates Turso API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /organizations → listOrgs() (for org slug)
 * - GET /organizations/{slug}/databases → syncDatabases()
 * 
 * @see docks/turso/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { TursoAPI } from "./api"
import type { TursoDatabase } from "./types"

/**
 * Map Turso database status to universal status
 * 
 * Priority order:
 * 1. archived → "archived"
 * 2. sleeping → "sleeping"
 * 3. block_reads || block_writes → "blocked"
 * 4. else → "active"
 */
function mapTursoStatus(db: TursoDatabase): string {
  if (db.archived) return "archived"
  if (db.sleeping) return "sleeping"
  if (db.block_reads || db.block_writes) return "blocked"
  return "active"
}

export const tursoAdapter: DockAdapter = {
  provider: "turso",

  /**
   * Validate Turso API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new TursoAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      // Log error for debugging but return false for invalid credentials
      console.error("Turso credential validation failed:", error)
      // Re-throw to get more detail in the mutation
      throw error
    }
  },

  /**
   * Sync Turso databases to universal `databases` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each database, upsert into `databases` table
   * 4. Map status using priority order
   * 5. Store all Turso fields in fullApiData
   */
  async syncDatabases(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: TursoDatabase[]
  ): Promise<void> {
    let databases: TursoDatabase[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      databases = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new TursoAPI(apiKey)
      
      // Get org slug (for MVP, use first org)
      const orgs = await api.listOrgs()
      const orgSlug = orgs[0]?.slug
      if (!orgSlug) {
        throw new Error("No organizations found for Turso account")
      }

      databases = await api.listDatabases(orgSlug)
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each database to universal table
    for (const db of databases) {
      const providerResourceId = db.DbId
      syncedResourceIds.add(providerResourceId)

      const existing = await ctx.db
        .query("databases")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const databaseData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "turso",
        providerResourceId,
        name: db.Name,
        engine: "turso", // Turso uses SQLite
        version: db.version,
        status: mapTursoStatus(db),
        fullApiData: {
          // Store all Turso fields
          ...db,
          // Explicitly include group name (for clarity)
          group: db.group,
          // Explicitly include regions (for clarity)
          regions: db.regions,
          primaryRegion: db.primaryRegion,
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
        console.log(`[Turso] Deleting orphaned database: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },
}
