/**
 * Convex Dock Adapter
 * 
 * Translates Convex API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /token → getTokenDetails() (get teamId)
 * - GET /projects?teamId={teamId} → syncDatabases()
 * - GET /deployments?projectId={projectId} → syncDeployments()
 * 
 * @see docks/convex/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import type { Database, Deployment } from "../../../lib/universalTypes"
import { decryptApiKey } from "../../../lib/encryption"
import { ConvexAPI } from "./api"
import type { ConvexProject, ConvexDeployment } from "./types"

export const convexAdapter: DockAdapter = {
  provider: "convex",

  /**
   * Validate Convex API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new ConvexAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      // Log error for debugging but return false for invalid credentials
      console.error("Convex credential validation failed:", error)
      // Re-throw to get more detail in the mutation
      throw error
    }
  },

  /**
   * Sync Convex projects to universal `databases` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each project, upsert into `databases` table
   * 4. Map status (always "active" for projects)
   * 5. Store all Convex fields in fullApiData
   */
  async syncDatabases(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: ConvexProject[]
  ): Promise<void> {
    let projects: ConvexProject[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      projects = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new ConvexAPI(apiKey)

      // Get token details to get teamId
      const tokenDetails = await api.getTokenDetails()
      projects = await api.listProjects(tokenDetails.teamId)
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each project to universal databases table
    for (const project of projects) {
      // Convert project.id (number) to string for providerResourceId
      const providerResourceId = String(project.id)
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
        provider: "convex",
        providerResourceId,
        name: project.name,
        engine: "convex", // Convex uses its own database engine
        version: "latest", // Convex manages versions internally
        status: "active", // Projects are always active
        fullApiData: {
          // Store all Convex project fields
          id: project.id,
          name: project.name,
          slug: project.slug,
          teamId: project.teamId,
          createTime: project.createTime,
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
        console.log(`[Convex] Deleting orphaned database: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },

  /**
   * Sync Convex deployments to universal `deployments` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each deployment, upsert into `deployments` table
   * 4. Map status (always "active" for deployments)
   * 5. Store all Convex fields in fullApiData
   */
  async syncDeployments(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: ConvexDeployment[]
  ): Promise<void> {
    let deployments: ConvexDeployment[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      deployments = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new ConvexAPI(apiKey)

      // Get token details to get teamId
      const tokenDetails = await api.getTokenDetails()
      const projects = await api.listProjects(tokenDetails.teamId)

      // Fetch deployments for all projects
      deployments = []
      for (const project of projects) {
        const projectDeployments = await api.listDeployments(project.id)
        deployments.push(...projectDeployments)
      }
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each deployment to universal deployments table
    for (const deployment of deployments) {
      // Use deployment.name as providerResourceId
      const providerResourceId = deployment.name
      syncedResourceIds.add(providerResourceId)

      const existing = await ctx.db
        .query("deployments")
        .withIndex("by_dock_deployment", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const deploymentData : Omit<Deployment, "_id" | "_creationTime"> = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "convex",
        providerResourceId,
        projectId: deployment.projectId,
        name: deployment.name,
        deploymentType: deployment.deploymentType,
        status: "active", // Deployments are always active
        createdAt: deployment.createTime,
        fullApiData: {
          // Store all Convex deployment fields
          name: deployment.name,
          createTime: deployment.createTime,
          deploymentType: deployment.deploymentType,
          projectId: deployment.projectId,
          previewIdentifier: deployment.previewIdentifier,
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, deploymentData)
      } else {
        await ctx.db.insert("deployments", deploymentData)
      }
    }

    // Delete orphaned resources (exist in DB but not in API response)
    // Deployments are always discovered resources (no provisioningSource field)
    const existingDeployments = await ctx.db
      .query("deployments")
      .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
      .collect()

    for (const existing of existingDeployments) {
      if (!syncedResourceIds.has(existing.providerResourceId)) {
        console.log(`[Convex] Deleting orphaned deployment: ${existing.name} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },
}
