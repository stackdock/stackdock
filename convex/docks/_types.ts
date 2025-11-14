/**
 * Dock Adapter Interface
 * 
 * Every dock adapter must implement this interface to translate provider APIs
 * into StackDock's universal schema.
 * 
 * @see docs/guides/DOCK_ADAPTER_GUIDE.md for implementation guide
 * @see docs/architecture/ARCHITECTURE.md for architecture overview
 */

import type { MutationCtx } from "../_generated/server"
import type { Doc } from "../_generated/dataModel"

/**
 * Dock Adapter Interface
 * 
 * An adapter is a translator that converts a provider's API into StackDock's
 * universal schema. Each provider (GridPane, Vercel, AWS, etc.) implements
 * this interface.
 * 
 * **Key Principles**:
 * - Adapters are TRANSLATORS (provider API → universal schema)
 * - One adapter per provider
 * - Provider-specific data goes in `fullApiData` field
 * - Universal fields are standardized across all providers
 * 
 * @example
 * ```typescript
 * // convex/docks/adapters/gridpane.ts
 * export const gridpaneAdapter: DockAdapter = {
 *   provider: "gridpane",
 *   
 *   async validateCredentials(apiKey: string) {
 *     // Test API key by calling lightweight endpoint
 *     const response = await fetch('https://my.gridpane.com/oauth/api/v1/sites', {
 *       headers: { 'Authorization': `Bearer ${apiKey}` }
 *     })
 *     return response.ok
 *   },
 *   
 *   async syncWebServices(ctx, dock) {
 *     const apiKey = await decryptApiKey(dock.encryptedApiKey)
 *     const sites = await fetchGridPaneSites(apiKey)
 *     
 *     for (const site of sites) {
 *       await ctx.db.insert("webServices", {
 *         orgId: dock.orgId,
 *         dockId: dock._id,
 *         provider: "gridpane",
 *         providerResourceId: site.id.toString(),
 *         name: site.name,
 *         productionUrl: site.primary_domain,
 *         status: mapGridPaneStatus(site.status),
 *         fullApiData: site, // All GridPane-specific fields
 *       })
 *     }
 *   },
 * }
 * ```
 */
export interface DockAdapter {
  /**
   * Unique provider identifier
   * 
   * Examples: "gridpane", "vercel", "aws", "digitalocean"
   * Must match the `provider` field in the `docks` table
   */
  provider: string

  /**
   * Validate API credentials before saving
   * 
   * Called when creating or updating a dock. Should make a lightweight
   * API call to verify the credentials work.
   * 
   * @param apiKey - Plaintext API key to validate
   * @returns `true` if credentials are valid, `false` otherwise
   * @throws Error if validation fails unexpectedly (network error, etc.)
   * 
   * @example
   * ```typescript
   * async validateCredentials(apiKey: string) {
   *   try {
   *     const response = await fetch('https://api.provider.com/v1/account', {
   *       headers: { 'Authorization': `Bearer ${apiKey}` }
   *     })
   *     return response.ok // 200-299 = valid
   *   } catch {
   *     return false
   *   }
   * }
   * ```
   */
  validateCredentials(apiKey: string): Promise<boolean>

  /**
   * Sync web services (sites, deployments, apps) to universal `webServices` table
   * 
   * Called during dock sync. Should:
   * 1. Use pre-fetched data if provided, otherwise fetch from provider API
   * 2. Upsert into `webServices` table (check for existing via `by_dock_resource` index)
   * 3. Map provider fields to universal schema
   * 4. Store all provider-specific data in `fullApiData`
   * 
   * @param ctx - Convex mutation context (has database access)
   * @param dock - The dock document (contains encrypted API key)
   * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
   * 
   * @example
   * ```typescript
   * async syncWebServices(ctx: MutationCtx, dock: Doc<"docks">, preFetchedData?: ProviderSite[]) {
   *   let sites: ProviderSite[]
   *   
   *   if (preFetchedData) {
   *     sites = preFetchedData
   *   } else {
   *     const apiKey = await decryptApiKey(dock.encryptedApiKey)
   *     sites = await fetchProviderSites(apiKey)
   *   }
   *   
   *   for (const site of sites) {
   *     const existing = await ctx.db
   *       .query("webServices")
   *       .withIndex("by_dock_resource", (q) =>
   *         q.eq("dockId", dock._id).eq("providerResourceId", site.id.toString())
   *       )
   *       .first()
   *     
   *     if (existing) {
   *       await ctx.db.patch(existing._id, {
   *         name: site.name,
   *         productionUrl: site.url,
   *         status: mapStatus(site.status),
   *         fullApiData: site,
   *         updatedAt: Date.now(),
   *       })
   *     } else {
   *       await ctx.db.insert("webServices", {
   *         orgId: dock.orgId,
   *         dockId: dock._id,
   *         provider: this.provider,
   *         providerResourceId: site.id.toString(),
   *         name: site.name,
   *         productionUrl: site.url,
   *         status: mapStatus(site.status),
   *         fullApiData: site,
   *         updatedAt: Date.now(),
   *       })
   *     }
   *   }
   * }
   * ```
   */
  syncWebServices?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: any[]
  ): Promise<void>

  /**
   * Sync servers (IaaS instances) to universal `servers` table
   * 
   * Called during dock sync. Similar pattern to `syncWebServices`.
   * Maps provider servers (droplets, instances, VMs) to universal schema.
   * 
   * @param ctx - Convex mutation context
   * @param dock - The dock document
   * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
   */
  syncServers?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: any[]
  ): Promise<void>

  /**
   * Sync domains (DNS zones) to universal `domains` table
   * 
   * Called during dock sync. Maps provider domains to universal schema.
   * 
   * @param ctx - Convex mutation context
   * @param dock - The dock document
   * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
   */
  syncDomains?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: any[]
  ): Promise<void>

  /**
   * Sync databases to universal `databases` table
   * 
   * Called during dock sync. Maps provider databases to universal schema.
   * 
   * @param ctx - Convex mutation context
   * @param dock - The dock document
   * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
   */
  syncDatabases?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: any[]
  ): Promise<void>

  /**
   * Sync backup schedules to universal `backupSchedules` table
   * 
   * Called during dock sync. Should:
   * 1. Use pre-fetched data if provided, otherwise fetch from provider API
   * 2. Upsert into `backupSchedules` table
   * 3. Map provider fields to universal schema
   * 4. Store all provider-specific data in `fullApiData`
   * 
   * @param ctx - Convex mutation context (has database access)
   * @param dock - The dock document (contains encrypted API key)
   * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
   */
  syncBackupSchedules?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: any[]
  ): Promise<void>

  /**
   * Sync backup integrations to universal `backupIntegrations` table
   * 
   * Called during dock sync. Should:
   * 1. Use pre-fetched data if provided, otherwise fetch from provider API
   * 2. Upsert into `backupIntegrations` table
   * 3. Map provider fields to universal schema
   * 4. Store all provider-specific data in `fullApiData` (excluding sensitive tokens)
   * 
   * @param ctx - Convex mutation context (has database access)
   * @param dock - The dock document (contains encrypted API key)
   * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
   */
  syncBackupIntegrations?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: any[]
  ): Promise<void>

  /**
   * Sync deployments to universal `deployments` table
   * 
   * Called during dock sync. Should:
   * 1. Use pre-fetched data if provided, otherwise fetch from provider API
   * 2. Upsert into `deployments` table
   * 3. Map provider fields to universal schema
   * 4. Store all provider-specific data in `fullApiData`
   * 
   * @param ctx - Convex mutation context (has database access)
   * @param dock - The dock document (contains encrypted API key)
   * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
   */
  syncDeployments?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: any[]
  ): Promise<void>

  /**
   * Sync projects (repositories, code projects) to universal `projects` table
   * 
   * Called during dock sync. Should:
   * 1. Use pre-fetched data if provided, otherwise fetch from provider API
   * 2. Upsert into `projects` table
   * 3. Map provider fields to universal schema
   * 4. Store all provider-specific data in `fullApiData`
   * 
   * Note: Projects table structure differs from other universal tables:
   * - No `dockId` field (projects are org-level, not dock-specific)
   * - Projects identified by `githubRepo` field (not `providerResourceId`)
   * - Links to teams/clients (business entities)
   * 
   * @param ctx - Convex mutation context (has database access)
   * @param dock - The dock document (contains encrypted API key)
   * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
   */
  syncProjects?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: any[]
  ): Promise<void>

  /**
   * Sync block volumes to universal `blockVolumes` table
   * 
   * Called during dock sync. Should:
   * 1. Use pre-fetched data if provided, otherwise fetch from provider API
   * 2. Upsert into `blockVolumes` table
   * 3. Map provider fields to universal schema
   * 4. Store all provider-specific data in `fullApiData`
   * 
   * @param ctx - Convex mutation context (has database access)
   * @param dock - The dock document (contains encrypted API key)
   * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
   */
  syncBlockVolumes?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: any[]
  ): Promise<void>

  /**
   * Sync buckets (object storage) to universal `buckets` table
   * 
   * Called during dock sync. Should:
   * 1. Use pre-fetched data if provided, otherwise fetch from provider API
   * 2. Upsert into `buckets` table
   * 3. Map provider fields to universal schema
   * 4. Store all provider-specific data in `fullApiData`
   * 
   * @param ctx - Convex mutation context (has database access)
   * @param dock - The dock document (contains encrypted API key)
   * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
   */
  syncBuckets?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: any[]
  ): Promise<void>

  // ============================================================================
  // OPTIONAL: Mutation Operations (Future Feature)
  // ============================================================================
  // These methods allow adapters to perform actions on resources, not just sync.
  // Implementation is optional and depends on provider API capabilities.

  /**
   * Restart a server
   * 
   * @param ctx - Convex mutation context
   * @param serverId - The `_id` of the server in the `servers` table
   * @throws Error if restart fails
   */
  restartServer?(ctx: MutationCtx, serverId: string): Promise<void>

  /**
   * Deploy a site/web service
   * 
   * @param ctx - Convex mutation context
   * @param siteId - The `_id` of the web service in the `webServices` table
   * @throws Error if deployment fails
   */
  deploySite?(ctx: MutationCtx, siteId: string): Promise<void>

  /**
   * Clear cache for a site/web service
   * 
   * @param ctx - Convex mutation context
   * @param siteId - The `_id` of the web service in the `webServices` table
   * @throws Error if cache clear fails
   */
  clearCache?(ctx: MutationCtx, siteId: string): Promise<void>

  // ============================================================================
  // OPTIONAL: Provisioning Operations (Step 4 - Mission 2.5)
  // ============================================================================
  // These methods allow adapters to provision new resources, not just sync existing ones.
  // Implementation is optional and depends on provider API capabilities.
  // Used by StackDock core provisioning engine when provisioning via dock adapter.

  /**
   * Provision a new server
   * 
   * Called by StackDock core provisioning engine when provisioning via dock adapter.
   * Should create a new server instance via provider API and return provisioned resource metadata.
   * 
   * @param ctx - Convex mutation context
   * @param dock - The dock document (contains encrypted API key)
   * @param spec - Resource specification (configuration, region, size, etc.)
   * @returns Provisioned server metadata with providerResourceId
   * @throws Error if provisioning fails
   * 
   * @example
   * ```typescript
   * async provisionServer(ctx: MutationCtx, dock: Doc<"docks">, spec: ServerSpec) {
   *   const apiKey = await decryptApiKey(dock.encryptedApiKey)
   *   const server = await providerAPI.createServer({
   *     apiKey,
   *     name: spec.name,
   *     region: spec.region,
   *     size: spec.size,
   *   })
   *   return {
   *     providerResourceId: server.id.toString(),
   *     name: server.name,
   *     primaryIpAddress: server.ip,
   *     region: server.region,
   *     status: "running",
   *     fullApiData: server,
   *   }
   * }
   * ```
   */
  provisionServer?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    spec: {
      name: string
      region?: string
      size?: string
      [key: string]: any
    }
  ): Promise<{
    providerResourceId: string
    name: string
    primaryIpAddress?: string
    region?: string
    status: string
    fullApiData: any
  }>

  /**
   * Provision a new web service
   * 
   * Called by StackDock core provisioning engine when provisioning via dock adapter.
   * Should create a new web service (site, deployment, app) via provider API.
   * 
   * @param ctx - Convex mutation context
   * @param dock - The dock document
   * @param spec - Resource specification (name, domain, configuration, etc.)
   * @returns Provisioned web service metadata
   * @throws Error if provisioning fails
   */
  provisionWebService?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    spec: {
      name: string
      domain?: string
      environment?: string
      [key: string]: any
    }
  ): Promise<{
    providerResourceId: string
    name: string
    productionUrl?: string
    environment?: string
    status: string
    fullApiData: any
  }>

  /**
   * Provision a new database
   * 
   * Called by StackDock core provisioning engine when provisioning via dock adapter.
   * Should create a new database instance via provider API.
   * 
   * @param ctx - Convex mutation context
   * @param dock - The dock document
   * @param spec - Resource specification (name, engine, version, size, etc.)
   * @returns Provisioned database metadata
   * @throws Error if provisioning fails
   */
  provisionDatabase?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    spec: {
      name: string
      engine?: string
      version?: string
      [key: string]: any
    }
  ): Promise<{
    providerResourceId: string
    name: string
    engine?: string
    version?: string
    status: string
    fullApiData: any
  }>

  /**
   * Provision a new domain
   * 
   * Called by StackDock core provisioning engine when provisioning via dock adapter.
   * Should register or configure a new domain via provider API.
   * 
   * @param ctx - Convex mutation context
   * @param dock - The dock document
   * @param spec - Resource specification (domainName, configuration, etc.)
   * @returns Provisioned domain metadata
   * @throws Error if provisioning fails
   */
  provisionDomain?(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    spec: {
      domainName: string
      [key: string]: any
    }
  ): Promise<{
    providerResourceId: string
    domainName: string
    status: string
    fullApiData: any
  }>
}
