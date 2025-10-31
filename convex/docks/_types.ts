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
   * 1. Decrypt API key using `decryptApiKey(dock.encryptedApiKey)`
   * 2. Fetch resources from provider API
   * 3. Upsert into `webServices` table (check for existing via `by_dock_resource` index)
   * 4. Map provider fields to universal schema
   * 5. Store all provider-specific data in `fullApiData`
   * 
   * @param ctx - Convex mutation context (has database access)
   * @param dock - The dock document (contains encrypted API key)
   * 
   * @example
   * ```typescript
   * async syncWebServices(ctx: MutationCtx, dock: Doc<"docks">) {
   *   const apiKey = await decryptApiKey(dock.encryptedApiKey)
   *   const sites = await fetchProviderSites(apiKey)
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
  syncWebServices?(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>

  /**
   * Sync servers (IaaS instances) to universal `servers` table
   * 
   * Called during dock sync. Similar pattern to `syncWebServices`.
   * Maps provider servers (droplets, instances, VMs) to universal schema.
   * 
   * @param ctx - Convex mutation context
   * @param dock - The dock document
   */
  syncServers?(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>

  /**
   * Sync domains (DNS zones) to universal `domains` table
   * 
   * Called during dock sync. Maps provider domains to universal schema.
   * 
   * @param ctx - Convex mutation context
   * @param dock - The dock document
   */
  syncDomains?(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>

  /**
   * Sync databases to universal `databases` table
   * 
   * Called during dock sync. Maps provider databases to universal schema.
   * 
   * @param ctx - Convex mutation context
   * @param dock - The dock document
   */
  syncDatabases?(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>

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
}

