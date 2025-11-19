/**
 * PlanetScale Dock Adapter
 * 
 * Translates PlanetScale API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /organizations → listOrganizations() (for org name)
 * - GET /organizations/{name}/databases → syncDatabases()
 * 
 * @see docks/planetscale/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import type { Database } from "../../../lib/universalTypes"
import { decryptApiKey } from "../../../lib/encryption"
import { PlanetScaleAPI } from "./api"
import type { PlanetScaleOrganization, PlanetScaleDatabase } from "./types"

/**
 * Map PlanetScale database status to universal status
 * 
 * Priority order:
 * 1. database.state === "deleted" || "archived" → "archived"
 * 2. database.state === "suspended" → "blocked"
 * 3. else → "active"
 */
function mapPlanetScaleStatus(db: PlanetScaleDatabase): string {
  if (db.state === "deleted" || db.state === "archived") {
    return "archived"
  }
  if (db.state === "suspended") {
    return "blocked"
  }
  return "active"
}

export const planetscaleAdapter: DockAdapter = {
  provider: "planetscale",

  /**
   * Validate PlanetScale API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new PlanetScaleAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      // Log error for debugging but return false for invalid credentials
      console.error("PlanetScale credential validation failed:", error)
      // Re-throw to get more detail in the mutation
      throw error
    }
  },

  /**
   * Sync PlanetScale databases to universal `databases` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each organization → database, upsert into `databases` table
   * 4. Map status using priority order
   * 5. Store all PlanetScale fields in fullApiData
   */
  async syncDatabases(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: Array<{
      organization: PlanetScaleOrganization
      database: PlanetScaleDatabase
    }>
  ): Promise<void> {
    let databases: Array<{
      organization: PlanetScaleOrganization
      database: PlanetScaleDatabase
    }>

    if (preFetchedData) {
      // Use pre-fetched data from action
      databases = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new PlanetScaleAPI(apiKey)

      // Get all organizations
      const orgs = await api.listOrganizations()
      if (orgs.length === 0) {
        console.log("[PlanetScale] No organizations found")
        return
      }

      // For each organization, get databases
      databases = []
      for (const org of orgs) {
        const orgDatabases = await api.listDatabases(org.name)
        for (const db of orgDatabases) {
          databases.push({ organization: org, database: db })
        }
      }
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each database to universal table
    for (const { organization, database: db } of databases) {
      // Use database.name or database.id as providerResourceId
      const providerResourceId = db.name || db.id
      syncedResourceIds.add(providerResourceId)

      const existing = await ctx.db
        .query("databases")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const databaseData : Omit<Database, "_id" | "_creationTime"> = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "planetscale",
        providerResourceId,
        name: db.name,
        engine: db.kind || "mysql", // "postgresql" or "mysql" from API
        version: db.region?.slug || "latest",
        status: mapPlanetScaleStatus(db),
        fullApiData: {
          // Store all PlanetScale fields
          organization: {
            id: organization.id,
            name: organization.name,
            type: organization.type,
            plan: organization.plan,
            database_count: organization.database_count,
            created_at: organization.created_at,
            updated_at: organization.updated_at,
          },
          region: {
            id: db.region.id,
            slug: db.region.slug,
            display_name: db.region.display_name,
            provider: db.region.provider,
            location: db.region.location,
            current_default: db.region.current_default,
          },
          database: {
            // Store all database fields
            ...db,
          },
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
        console.log(`[PlanetScale] Deleting orphaned database: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },
}
