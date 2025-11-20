/**
 * Neon Dock Adapter
 * 
 * Translates Neon API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /projects → listProjects()
 * - GET /projects/{id}/branches → listBranches()
 * - GET /projects/{id}/branches/{id}/databases → syncDatabases()
 * - GET /projects/{id}/branches/{id}/snapshots → syncBackupSchedules()
 * 
 * @see docks/neon/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { NeonAPI } from "./api"
import type { NeonProject, NeonBranch, NeonDatabase, NeonSnapshot } from "./types"

/**
 * Map Neon database status to universal status
 * 
 * Priority order:
 * 1. branch.current_state === "archived" → "archived"
 * 2. branch.current_state === "suspended" → "blocked"
 * 3. else → "active"
 */
function mapNeonStatus(
  _project: NeonProject,
  branch: NeonBranch,
  _database: NeonDatabase
): string {
  if (branch.current_state === "archived") {
    return "archived"
  }
  if (branch.current_state === "suspended") {
    return "blocked"
  }
  return "active"
}

export const neonAdapter: DockAdapter = {
  provider: "neon",

  /**
   * Validate Neon API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new NeonAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      // Log error for debugging but return false for invalid credentials
      console.error("Neon credential validation failed:", error)
      // Re-throw to get more detail in the mutation
      throw error
    }
  },

  /**
   * Sync Neon databases to universal `databases` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each project → branch → database, upsert into `databases` table
   * 4. Map status using priority order
   * 5. Store all Neon fields in fullApiData
   */
  async syncDatabases(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: Array<{
      project: NeonProject
      branch: NeonBranch
      database: NeonDatabase
    }>
  ): Promise<void> {
    let databases: Array<{
      project: NeonProject
      branch: NeonBranch
      database: NeonDatabase
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

      const api = new NeonAPI(apiKey)

      // Get all projects
      const projects = await api.listProjects()
      if (projects.length === 0) {
        console.log("[Neon] No projects found")
        return
      }

      // For each project, get branches, then databases
      databases = []
      for (const project of projects) {
        const branches = await api.listBranches(project.id)
        for (const branch of branches) {
          const branchDatabases = await api.listDatabases(project.id, branch.id)
          for (const database of branchDatabases) {
            databases.push({ project, branch, database })
          }
        }
      }
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each database to universal table
    for (const { project, branch, database } of databases) {
      // Use database.id or create composite ID: project-branch-database
      // Convert to string (API may return number, but schema requires string)
      const providerResourceId = database.id 
        ? String(database.id) 
        : `${project.id}-${branch.id}-${database.name}`
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
        provider: "neon",
        providerResourceId,
        name: database.name,
        engine: "postgresql", // Neon uses PostgreSQL
        version: project.pg_version?.toString() || "unknown", // Use project pg_version
        status: mapNeonStatus(project, branch, database),
        fullApiData: {
          // Store all Neon fields
          project: {
            id: project.id,
            name: project.name,
            region_id: project.region_id,
            created_at: project.created_at,
            updated_at: project.updated_at,
            pg_version: project.pg_version,
          },
          branch: {
            id: branch.id,
            name: branch.name,
            project_id: branch.project_id,
            created_at: branch.created_at,
            updated_at: branch.updated_at,
            current_state: branch.current_state,
          },
          database: {
            id: database.id,
            name: database.name,
            branch_id: database.branch_id,
            created_at: database.created_at,
            updated_at: database.updated_at,
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
        console.log(`[Neon] Deleting orphaned database: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },

  /**
   * Sync Neon snapshots to universal `backupSchedules` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each snapshot, upsert into `backupSchedules` table
   * 4. Map Neon snapshot fields to universal schema
   * 5. Store all Neon fields in fullApiData
   */
  async syncBackupSchedules(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: Array<{
      project: NeonProject
      branch: NeonBranch | null
      snapshot: NeonSnapshot
    }>
  ): Promise<void> {
    let snapshots: Array<{
      project: NeonProject
      branch: NeonBranch | null
      snapshot: NeonSnapshot
    }>

    if (preFetchedData) {
      // Use pre-fetched data from action
      snapshots = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new NeonAPI(apiKey)

      // Get all projects → snapshots (project level)
      const projects = await api.listProjects()
      snapshots = []
      
      for (const project of projects) {
        // Snapshots are at project level, not branch level
        const projectSnapshots = await api.listSnapshots(project.id)
        
        // Find the branch for each snapshot using source_branch_id
        for (const snapshot of projectSnapshots) {
          // Find the branch that matches this snapshot's source_branch_id
          const branches = await api.listBranches(project.id)
          const branch = branches.find((b) => b.id === snapshot.source_branch_id)
          
          if (branch) {
            snapshots.push({ project, branch, snapshot })
          } else {
            // If branch not found, still include snapshot (branch might be deleted)
            snapshots.push({ project, branch: null as any, snapshot })
          }
        }
      }
    }

    // Sync each snapshot to universal table
    for (const { project, branch, snapshot } of snapshots) {
      // Extract numeric ID from snapshot ID (e.g., "snap-curly-art-a4oxpt34" → extract numbers)
      // For scheduleId, use a hash of the snapshot ID to get a number
      const scheduleIdHash = snapshot.id.split("").reduce((acc, char) => {
        const code = char.charCodeAt(0)
        return ((acc << 5) - acc) + code
      }, 0)
      const scheduleId = Math.abs(scheduleIdHash) % 1000000 // Keep it reasonable

      const existing = await ctx.db
        .query("backupSchedules")
        .withIndex("by_dock_schedule", (q) =>
          q.eq("dockId", dock._id).eq("scheduleId", scheduleId)
        )
        .first()

      // Map Neon snapshot to universal backupSchedules schema
      // Note: backupSchedules has GridPane-specific fields, so we'll adapt them
      const backupData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "neon",
        providerResourceId: snapshot.id,
        siteId: 0, // Neon doesn't have sites, use 0 as placeholder
        siteUrl: branch ? `${project.name}/${branch.name}` : `${project.name}/unknown`, // Project/Branch identifier
        scheduleId: scheduleId,
        type: "remote" as const, // Neon snapshots are remote backups
        frequency: snapshot.manual ? "manual" : "scheduled", // Manual snapshots
        hour: "00",
        minute: "00",
        time: "00:00",
        // Manual snapshots don't have schedule - omit dayOfWeek and serviceId
        serviceName: "neon-snapshot",
        enabled: true, // Snapshots are always enabled once created
        remoteBackupsEnabled: true,
        status: "active", // Snapshots are active once created
        fullApiData: {
          project: {
            id: project.id,
            name: project.name,
            region_id: project.region_id,
          },
          branch: branch ? {
            id: branch.id,
            name: branch.name,
            project_id: branch.project_id,
            current_state: branch.current_state,
          } : null,
          snapshot: {
            id: snapshot.id,
            name: snapshot.name,
            source_branch_id: snapshot.source_branch_id,
            created_at: snapshot.created_at,
            manual: snapshot.manual,
          },
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        // Patch only updatable fields (exclude required fields that can't change)
        await ctx.db.patch(existing._id, {
          siteUrl: backupData.siteUrl,
          type: backupData.type,
          frequency: backupData.frequency,
          hour: backupData.hour,
          minute: backupData.minute,
          time: backupData.time,
          serviceName: backupData.serviceName,
          enabled: backupData.enabled,
          remoteBackupsEnabled: backupData.remoteBackupsEnabled,
          fullApiData: backupData.fullApiData,
          updatedAt: backupData.updatedAt,
        })
      } else {
        await ctx.db.insert("backupSchedules", backupData)
      }
    }
  },
}
