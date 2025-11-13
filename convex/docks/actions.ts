/**
 * Dock Actions
 * 
 * Actions for external HTTP requests (Convex mutations can't use fetch)
 */

import { v } from "convex/values"
import { internalAction } from "../_generated/server"
import { getAdapter } from "./registry"
import { GridPaneAPI } from "./adapters/gridpane/api"
import { VercelAPI } from "./adapters/vercel/api"
import { NetlifyAPI } from "./adapters/netlify/api"
import { CloudflareAPI } from "./adapters/cloudflare/api"
import { TursoAPI } from "./adapters/turso/api"
import { NeonAPI } from "./adapters/neon/api"
import { ConvexAPI } from "./adapters/convex/api"
import { internal } from "../_generated/api"
import type { Id } from "../_generated/dataModel"

/**
 * Validate API credentials for a provider
 * 
 * This is an internal action because it needs to make external HTTP requests,
 * which mutations cannot do. It's called from mutations, not from the client.
 */
export const validateCredentials = internalAction({
  args: {
    provider: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`[Dock Action] Validating credentials for provider: ${args.provider}`)
    
    const adapter = getAdapter(args.provider)
    if (!adapter) {
      throw new Error(`No adapter found for provider: ${args.provider}`)
    }

    try {
      console.log(`[Dock Action] Calling adapter.validateCredentials`)
      const isValid = await adapter.validateCredentials(args.apiKey)
      console.log(`[Dock Action] Validation result: ${isValid}`)
      return { valid: isValid }
    } catch (error) {
      console.error(`[Dock Action] Validation error:`, error)
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      throw new Error(`Failed to validate credentials: ${errorMessage}`)
    }
  },
})

/**
 * Sync dock resources from provider API
 * 
 * This action handles all external HTTP requests (fetch) required for syncing.
 * The mutation will call this action, receive the data, and insert it into the database.
 * 
 * Flow:
 * 1. Mutation decrypts API key (for audit logging)
 * 2. Mutation calls this action with decrypted key
 * 3. Action makes API calls (fetch allowed in actions)
 * 4. Action returns raw provider data
 * 5. Mutation transforms and inserts data into universal tables
 * 
 * @param dockId - Dock ID (for logging/debugging)
 * @param provider - Provider name (e.g., "gridpane")
 * @param apiKey - Decrypted API key (passed from mutation)
 * @param resourceTypes - Array of resource types to sync (e.g., ["servers", "webServices", "domains"])
 */
export const syncDockResources = internalAction({
  args: {
    dockId: v.id("docks"),
    provider: v.string(),
    apiKey: v.string(), // Decrypted API key (passed from mutation)
    resourceTypes: v.array(v.string()), // ["servers", "webServices", "domains", "databases"]
  },
  handler: async (ctx, args) => {
    console.log(`[Dock Action] Syncing resources for dock ${args.dockId}, provider: ${args.provider}`)
    
    const adapter = getAdapter(args.provider)
    if (!adapter) {
      throw new Error(`No adapter found for provider: ${args.provider}`)
    }

    // Import GridPaneAPI directly (or use adapter pattern)
    // For GridPane, we'll use the API class directly
    let servers: any[] = []
    let webServices: any[] = []
    let domains: any[] = []
    let databases: any[] = []
    let backupSchedules: any[] = []
    let backupIntegrations: any[] = []
    let deployments: any[] = []

    try {
      // GridPane-specific: Use GridPaneAPI directly
      if (args.provider === "gridpane") {
        const api = new GridPaneAPI(args.apiKey)

        // Sync requested resource types
        if (args.resourceTypes.includes("servers")) {
          console.log(`[Dock Action] Fetching servers for ${args.provider}`)
          servers = await api.getServers()
        }

        if (args.resourceTypes.includes("webServices")) {
          console.log(`[Dock Action] Fetching sites for ${args.provider}`)
          webServices = await api.getSites()
        }

        if (args.resourceTypes.includes("domains")) {
          console.log(`[Dock Action] Fetching domains for ${args.provider}`)
          domains = await api.getDomains()
        }

        // GridPane doesn't have databases endpoint yet
        if (args.resourceTypes.includes("databases")) {
          console.log(`[Dock Action] Databases not supported for ${args.provider}`)
          databases = []
        }

        // Always fetch backups for GridPane (not in resourceTypes, but always sync)
        console.log(`[Dock Action] Fetching backup schedules for ${args.provider}`)
        backupSchedules = await api.getAllBackupSchedules()

        console.log(`[Dock Action] Fetching backup integrations for ${args.provider}`)
        backupIntegrations = await api.getBackupIntegrations()
      } else if (args.provider === "vercel") {
        // Vercel-specific: Use VercelAPI directly
        const api = new VercelAPI(args.apiKey)

        // Vercel only supports webServices (projects)
        if (args.resourceTypes.includes("webServices")) {
          console.log(`[Dock Action] Fetching projects for ${args.provider}`)
          webServices = await api.getProjects()
        }

        // Vercel doesn't support servers, domains, or databases via this API
        if (args.resourceTypes.includes("servers")) {
          console.log(`[Dock Action] Servers not supported for ${args.provider}`)
          servers = []
        }

        if (args.resourceTypes.includes("domains")) {
          console.log(`[Dock Action] Domains not supported for ${args.provider} (use separate domains API)`)
          domains = []
        }

        if (args.resourceTypes.includes("databases")) {
          console.log(`[Dock Action] Databases not supported for ${args.provider}`)
          databases = []
        }
      } else if (args.provider === "netlify") {
        // Netlify-specific: Use NetlifyAPI directly
        const api = new NetlifyAPI(args.apiKey)

        // Netlify only supports webServices (sites)
        if (args.resourceTypes.includes("webServices")) {
          console.log(`[Dock Action] Fetching sites for ${args.provider}`)
          webServices = await api.getSites()
        }

        // Netlify doesn't support servers, domains, or databases via this API
        if (args.resourceTypes.includes("servers")) {
          console.log(`[Dock Action] Servers not supported for ${args.provider}`)
          servers = []
        }

        if (args.resourceTypes.includes("domains")) {
          console.log(`[Dock Action] Domains not supported for ${args.provider} (use separate domains API)`)
          domains = []
        }

        if (args.resourceTypes.includes("databases")) {
          console.log(`[Dock Action] Databases not supported for ${args.provider}`)
          databases = []
        }
      } else if (args.provider === "cloudflare") {
        // Cloudflare-specific: Use CloudflareAPI directly
        const api = new CloudflareAPI(args.apiKey)

        // Get zones first (to extract account ID)
        let accountId: string | undefined
        if (args.resourceTypes.includes("domains")) {
          console.log(`[Dock Action] Fetching zones for ${args.provider}`)
          domains = await api.getZones()

          // Extract account ID from first zone
          if (domains.length > 0 && domains[0].account?.id) {
            accountId = domains[0].account.id
            console.log(`[Dock Action] Extracted account ID: ${accountId}`)
          }

          // Fetch DNS records for each zone (must be done in action, not mutation)
          console.log(`[Dock Action] Fetching DNS records for ${domains.length} zones`)
          for (const zone of domains) {
            try {
              const records = await api.getDNSRecords(zone.id)
              // Attach DNS records to zone object (will be passed to adapter)
              ;(zone as any).dnsRecords = records
              console.log(`[Dock Action] Fetched ${records.length} DNS records for zone ${zone.id} (${zone.name})`)
            } catch (error) {
              console.error(`[Dock Action] Failed to fetch DNS records for zone ${zone.id} (${zone.name}):`, error)
              ;(zone as any).dnsRecords = [] // Empty array if fetch fails
            }
          }
        }

        // Get Pages (requires account ID)
        if (args.resourceTypes.includes("webServices") && accountId) {
          console.log(`[Dock Action] Fetching Pages for ${args.provider}`)
          const pages = await api.getPages(accountId)
          // Mark as pages type for adapter to distinguish
          webServices.push(...pages.map((p: any) => ({ ...p, _type: "pages" })))
        }

        // Get Workers (requires account ID)
        if (args.resourceTypes.includes("webServices") && accountId) {
          console.log(`[Dock Action] Fetching Workers for ${args.provider}`)
          const workers = await api.getWorkers(accountId)
          // Mark as workers type for adapter to distinguish
          webServices.push(...workers.map((w: any) => ({ ...w, _type: "workers" })))
        }

        // Cloudflare doesn't support servers or databases via this API
        if (args.resourceTypes.includes("servers")) {
          console.log(`[Dock Action] Servers not supported for ${args.provider}`)
          servers = []
        }

        if (args.resourceTypes.includes("databases")) {
          console.log(`[Dock Action] Databases not supported for ${args.provider}`)
          databases = []
        }
      } else if (args.provider === "turso") {
        // Turso-specific: Use TursoAPI directly
        const api = new TursoAPI(args.apiKey)

        // Turso requires fetching orgs first to get slugs
        const orgs = await api.listOrgs()
        
        // For MVP: Use first org (one dock = one org)
        // Future: Store org slug in dock metadata
        const orgSlug = orgs[0]?.slug
        if (!orgSlug) {
          throw new Error("No organizations found for Turso account")
        }

        if (args.resourceTypes.includes("databases")) {
          console.log(`[Dock Action] Fetching databases for ${args.provider} (org: ${orgSlug})`)
          databases = await api.listDatabases(orgSlug)
        }

        // Turso doesn't support servers, webServices, or domains
        if (args.resourceTypes.includes("servers")) {
          console.log(`[Dock Action] Servers not supported for ${args.provider}`)
          servers = []
        }
        if (args.resourceTypes.includes("webServices")) {
          console.log(`[Dock Action] Web services not supported for ${args.provider}`)
          webServices = []
        }
        if (args.resourceTypes.includes("domains")) {
          console.log(`[Dock Action] Domains not supported for ${args.provider}`)
          domains = []
        }
      } else if (args.provider === "neon") {
        // Neon-specific: Use NeonAPI directly
        const api = new NeonAPI(args.apiKey)

        // Neon requires fetching projects first
        const projects = await api.listProjects()
        
        if (projects.length === 0) {
          console.log(`[Dock Action] No projects found for Neon account`)
          databases = []
          backupSchedules = []
        } else {
          // For each project, get branches, then databases
          const allDatabases: Array<{
            project: any
            branch: any
            database: any
          }> = []

          for (const project of projects) {
            const branches = await api.listBranches(project.id)
            for (const branch of branches) {
              const branchDatabases = await api.listDatabases(project.id, branch.id)
              for (const database of branchDatabases) {
                allDatabases.push({ project, branch, database })
              }
            }
          }

          if (args.resourceTypes.includes("databases")) {
            console.log(`[Dock Action] Fetching databases for ${args.provider} (${allDatabases.length} databases found)`)
            databases = allDatabases
          }

          // Always fetch snapshots for Neon (similar to GridPane backups)
          console.log(`[Dock Action] Fetching snapshots for ${args.provider}`)
          const allSnapshots: Array<{
            project: any
            branch: any
            snapshot: any
          }> = []
          
          for (const project of projects) {
            // Snapshots are at project level, not branch level
            const projectSnapshots = await api.listSnapshots(project.id)
            
            // Find the branch for each snapshot using source_branch_id
            for (const snapshot of projectSnapshots) {
              // Find the branch that matches this snapshot's source_branch_id
              const branches = await api.listBranches(project.id)
              const branch = branches.find((b: any) => b.id === snapshot.source_branch_id)
              
              if (branch) {
                allSnapshots.push({ project, branch, snapshot })
              } else {
                // If branch not found, still include snapshot (branch might be deleted)
                allSnapshots.push({ project, branch: null, snapshot })
              }
            }
          }
          
          backupSchedules = allSnapshots
        }

        // Neon doesn't support servers, webServices, or domains
        if (args.resourceTypes.includes("servers")) {
          console.log(`[Dock Action] Servers not supported for ${args.provider}`)
          servers = []
        }
        if (args.resourceTypes.includes("webServices")) {
          console.log(`[Dock Action] Web services not supported for ${args.provider}`)
          webServices = []
        }
        if (args.resourceTypes.includes("domains")) {
          console.log(`[Dock Action] Domains not supported for ${args.provider}`)
          domains = []
        }
      } else if (args.provider === "convex") {
        // Convex-specific: Use ConvexAPI directly
        const api = new ConvexAPI(args.apiKey)

        // Convex requires 3-step flow: Token → Projects → Deployments
        // Step 1: Get token details to extract teamId
        const tokenDetails = await api.getTokenDetails()
        const teamId = tokenDetails.teamId

        // Step 2: List projects for teamId
        const projects = await api.listProjects(teamId)

        if (projects.length === 0) {
          console.log(`[Dock Action] No projects found for Convex account`)
          databases = []
          deployments = []
        } else {
          // Step 3: For each project, get deployments
          if (args.resourceTypes.includes("databases")) {
            console.log(`[Dock Action] Fetching databases (projects) for ${args.provider} (${projects.length} projects found)`)
            databases = projects
          }

          // Always fetch deployments for Convex
          console.log(`[Dock Action] Fetching deployments for ${args.provider}`)
          const allDeployments: any[] = []
          
          for (const project of projects) {
            const projectDeployments = await api.listDeployments(project.id)
            allDeployments.push(...projectDeployments)
          }
          
          deployments = allDeployments
        }

        // Convex doesn't support servers, webServices, or domains
        if (args.resourceTypes.includes("servers")) {
          console.log(`[Dock Action] Servers not supported for ${args.provider}`)
          servers = []
        }
        if (args.resourceTypes.includes("webServices")) {
          console.log(`[Dock Action] Web services not supported for ${args.provider}`)
          webServices = []
        }
        if (args.resourceTypes.includes("domains")) {
          console.log(`[Dock Action] Domains not supported for ${args.provider}`)
          domains = []
        }
      } else {
        // For other providers, use adapter pattern
        // TODO: Implement adapter pattern for other providers
        throw new Error(`Provider ${args.provider} sync not yet implemented in action`)
      }

      console.log(`[Dock Action] Sync complete: ${servers.length} servers, ${webServices.length} webServices, ${domains.length} domains, ${databases.length} databases, ${deployments.length} deployments, ${backupSchedules.length} backup schedules, ${backupIntegrations.length} backup integrations`)

      // Call internal mutation to sync using adapter methods
      await ctx.runMutation(internal.docks.mutations.syncDockResourcesMutation, {
        dockId: args.dockId,
        provider: args.provider,
        fetchedData: {
          servers: servers.length > 0 ? servers : undefined,
          webServices: webServices.length > 0 ? webServices : undefined,
          domains: domains.length > 0 ? domains : undefined,
          databases: databases.length > 0 ? databases : undefined,
          deployments: deployments.length > 0 ? deployments : undefined,
          backupSchedules: backupSchedules.length > 0 ? backupSchedules : undefined,
          backupIntegrations: backupIntegrations.length > 0 ? backupIntegrations : undefined,
        },
      })

      return { success: true }
    } catch (error) {
      console.error(`[Dock Action] Sync error for dock ${args.dockId}:`, error)
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      
      // Mark sync as failed via internal mutation
      try {
        await ctx.runMutation(internal.docks.mutations.updateSyncStatus as any, {
          dockId: args.dockId,
          status: "error",
          error: errorMessage,
        })
      } catch (statusError) {
        // If updating status fails, log but don't throw (original error is more important)
        console.error(`[Dock Action] Failed to update sync status:`, statusError)
      }
      
      throw new Error(`Failed to sync dock resources: ${errorMessage}`)
    }
  },
})
