/**
 * Dock Actions
 * 
 * Actions for external HTTP requests (Convex mutations can't use fetch)
 */

import { v } from "convex/values"
import { action, internalAction } from "../_generated/server"
import { getAdapter } from "./registry"
import { GridPaneAPI } from "./adapters/gridpane/api"
import { VercelAPI } from "./adapters/vercel/api"
import { NetlifyAPI } from "./adapters/netlify/api"
import { CloudflareAPI } from "./adapters/cloudflare/api"
import { TursoAPI } from "./adapters/turso/api"
import { NeonAPI } from "./adapters/neon/api"
import { ConvexAPI } from "./adapters/convex/api"
import { PlanetScaleAPI } from "./adapters/planetscale/api"
import { VultrAPI } from "./adapters/vultr/api"
import { DigitalOceanAPI } from "./adapters/digitalocean/api"
import { LinodeAPI } from "./adapters/linode/api"
import { GitHubAPI } from "./adapters/github/api"
import { HetznerAPI } from "./adapters/hetzner/api"
import { CoolifyAPI } from "./adapters/coolify/api"
import { BetterStackAPI } from "./adapters/betterstack/api"
import { SentryAPI } from "./adapters/sentry/api"
import { decryptApiKey } from "../lib/encryption"
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
    // Logging silenced except for Sentry
    
    const adapter = getAdapter(args.provider)
    if (!adapter) {
      throw new Error(`No adapter found for provider: ${args.provider}`)
    }

    try {
      const isValid = await adapter.validateCredentials(args.apiKey)
      return { valid: isValid }
    } catch (error) {
      // Error logging silenced except for Sentry
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
    isAutoSync: v.optional(v.boolean()), // Flag for auto-sync vs manual
  },
  handler: async (ctx, args) => {
    // Logging silenced except for Sentry
    
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
    let repositories: any[] = [] // GitHub repositories (code)
    let blockVolumes: any[] = [] // Block storage volumes (Vultr blocks, DO volumes)
    let buckets: any[] = [] // Object storage buckets (Linode buckets)
    let monitors: any[] = [] // Uptime monitors (Better Stack, etc.)
    let issues: any[] = [] // Error issues (Sentry calls them "issues", we use "alerts" in UI)

    try {
      // GridPane-specific: Use GridPaneAPI directly
      if (args.provider === "gridpane") {
        const api = new GridPaneAPI(args.apiKey)

        // Sync requested resource types
        if (args.resourceTypes.includes("servers")) {
          servers = await api.getServers()
        }

        if (args.resourceTypes.includes("webServices")) {
          webServices = await api.getSites()
        }

        if (args.resourceTypes.includes("domains")) {
          domains = await api.getDomains()
        }

        // GridPane doesn't have databases endpoint yet
        if (args.resourceTypes.includes("databases")) {
          databases = []
        }

        // Always fetch backups for GridPane (not in resourceTypes, but always sync)
        backupSchedules = await api.getAllBackupSchedules()
        backupIntegrations = await api.getBackupIntegrations()
      } else if (args.provider === "vercel") {
        // Vercel-specific: Use VercelAPI directly
        const api = new VercelAPI(args.apiKey)

        // Vercel only supports webServices (projects)
        if (args.resourceTypes.includes("webServices")) {
          webServices = await api.getProjects()
        }

        // Vercel doesn't support servers, domains, or databases via this API
        if (args.resourceTypes.includes("servers")) {
          servers = []
        }

        if (args.resourceTypes.includes("domains")) {
          domains = []
        }

        if (args.resourceTypes.includes("databases")) {
          databases = []
        }
      } else if (args.provider === "netlify") {
        // Netlify-specific: Use NetlifyAPI directly
        const api = new NetlifyAPI(args.apiKey)

        // Netlify only supports webServices (sites)
        if (args.resourceTypes.includes("webServices")) {
          webServices = await api.getSites()
        }

        // Netlify doesn't support servers, domains, or databases via this API
        if (args.resourceTypes.includes("servers")) {
          servers = []
        }

        if (args.resourceTypes.includes("domains")) {
          domains = []
        }

        if (args.resourceTypes.includes("databases")) {
          databases = []
        }
      } else if (args.provider === "cloudflare") {
        // Cloudflare-specific: Use CloudflareAPI directly
        const api = new CloudflareAPI(args.apiKey)

        // Get zones first (to extract account ID)
        let accountId: string | undefined
        if (args.resourceTypes.includes("domains")) {
          domains = await api.getZones()

          // Extract account ID from first zone
          if (domains.length > 0 && domains[0].account?.id) {
            accountId = domains[0].account.id
          }

          // Fetch DNS records for each zone (must be done in action, not mutation)
          for (const zone of domains) {
            try {
              const records = await api.getDNSRecords(zone.id)
              // Attach DNS records to zone object (will be passed to adapter)
              ;(zone as any).dnsRecords = records
            } catch (error) {
              ;(zone as any).dnsRecords = [] // Empty array if fetch fails
            }
          }
        }

        // Get Pages (requires account ID)
        if (args.resourceTypes.includes("webServices") && accountId) {
          const pages = await api.getPages(accountId)
          // Mark as pages type for adapter to distinguish
          webServices.push(...pages.map((p: any) => ({ ...p, _type: "pages" })))
        }

        // Get Workers (requires account ID)
        if (args.resourceTypes.includes("webServices") && accountId) {
          const workers = await api.getWorkers(accountId)
          // Mark as workers type for adapter to distinguish
          webServices.push(...workers.map((w: any) => ({ ...w, _type: "workers" })))
        }

        // Cloudflare doesn't support servers or databases via this API
        if (args.resourceTypes.includes("servers")) {
          servers = []
        }

        if (args.resourceTypes.includes("databases")) {
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
          databases = await api.listDatabases(orgSlug)
        }

        // Turso doesn't support servers, webServices, or domains
        if (args.resourceTypes.includes("servers")) {
          servers = []
        }
        if (args.resourceTypes.includes("webServices")) {
          webServices = []
        }
        if (args.resourceTypes.includes("domains")) {
          domains = []
        }
      } else if (args.provider === "neon") {
        // Neon-specific: Use NeonAPI directly
        const api = new NeonAPI(args.apiKey)

        // Neon requires fetching projects first
        const projects = await api.listProjects()
        
        if (projects.length === 0) {
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
            databases = allDatabases
          }

          // Always fetch snapshots for Neon (similar to GridPane backups)
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
          servers = []
        }
        if (args.resourceTypes.includes("webServices")) {
          webServices = []
        }
        if (args.resourceTypes.includes("domains")) {
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
          databases = []
          deployments = []
        } else {
          // Step 3: For each project, get deployments
          if (args.resourceTypes.includes("databases")) {
            databases = projects
          }

          // Always fetch deployments for Convex
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
      } else if (args.provider === "planetscale") {
        // PlanetScale-specific: Use PlanetScaleAPI directly
        const api = new PlanetScaleAPI(args.apiKey)

        // PlanetScale requires fetching orgs first to get names
        const orgs = await api.listOrganizations()
        
        if (orgs.length === 0) {
          console.log(`[Dock Action] No organizations found for PlanetScale account`)
          databases = []
        } else {
          // For each organization, get databases
          const allDatabases: Array<{
            organization: any
            database: any
          }> = []

          for (const org of orgs) {
            const orgDatabases = await api.listDatabases(org.name)
            for (const db of orgDatabases) {
              allDatabases.push({ organization: org, database: db })
            }
          }

          if (args.resourceTypes.includes("databases")) {
            console.log(`[Dock Action] Fetching databases for ${args.provider} (${allDatabases.length} databases found)`)
            databases = allDatabases
          }
        }

        // PlanetScale doesn't support servers, webServices, or domains
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
      } else if (args.provider === "vultr") {
        // Vultr-specific: Use VultrAPI directly
        const api = new VultrAPI(args.apiKey)

        if (args.resourceTypes.includes("servers")) {
          console.log(`[Dock Action] Fetching instances for ${args.provider}`)
          const instances = await api.listInstances()
          servers = instances
        }

        if (args.resourceTypes.includes("blockVolumes")) {
          console.log(`[Dock Action] Fetching blocks for ${args.provider}`)
          const blocks = await api.listBlocks()
          blockVolumes = blocks
        }

        // Vultr doesn't support databases, webServices, domains, or buckets
        if (args.resourceTypes.includes("databases")) {
          console.log(`[Dock Action] Databases not supported for ${args.provider}`)
          databases = []
        }
        if (args.resourceTypes.includes("webServices")) {
          console.log(`[Dock Action] Web services not supported for ${args.provider}`)
          webServices = []
        }
        if (args.resourceTypes.includes("domains")) {
          console.log(`[Dock Action] Domains not supported for ${args.provider}`)
          domains = []
        }
        if (args.resourceTypes.includes("buckets")) {
          console.log(`[Dock Action] Buckets not supported for ${args.provider}`)
          buckets = []
        }
      } else if (args.provider === "digitalocean") {
        // DigitalOcean-specific: Use DigitalOceanAPI directly
        const api = new DigitalOceanAPI(args.apiKey)

        if (args.resourceTypes.includes("servers")) {
          console.log(`[Dock Action] Fetching droplets for ${args.provider}`)
          const droplets = await api.listDroplets()
          servers = droplets
        }

        if (args.resourceTypes.includes("blockVolumes")) {
          console.log(`[Dock Action] Fetching volumes for ${args.provider}`)
          const volumes = await api.listVolumes()
          blockVolumes = volumes
        }

        // DigitalOcean doesn't support databases, webServices, domains, or buckets
        if (args.resourceTypes.includes("databases")) {
          console.log(`[Dock Action] Databases not supported for ${args.provider}`)
          databases = []
        }
        if (args.resourceTypes.includes("webServices")) {
          console.log(`[Dock Action] Web services not supported for ${args.provider}`)
          webServices = []
        }
        if (args.resourceTypes.includes("domains")) {
          console.log(`[Dock Action] Domains not supported for ${args.provider}`)
          domains = []
        }
        if (args.resourceTypes.includes("buckets")) {
          console.log(`[Dock Action] Buckets not supported for ${args.provider}`)
          buckets = []
        }
      } else if (args.provider === "linode") {
        // Linode-specific: Use LinodeAPI directly
        const api = new LinodeAPI(args.apiKey)

        if (args.resourceTypes.includes("servers")) {
          console.log(`[Dock Action] Fetching linodes for ${args.provider}`)
          const linodes = await api.listLinodes()
          servers = linodes
        }

        if (args.resourceTypes.includes("buckets")) {
          console.log(`[Dock Action] Fetching buckets for ${args.provider}`)
          const linodeBuckets = await api.listBuckets()
          buckets = linodeBuckets
          console.log(`[Dock Action] Linode API returned ${buckets.length} buckets`)
        }

        // Linode doesn't support databases, webServices, domains, or blockVolumes
        if (args.resourceTypes.includes("databases")) {
          console.log(`[Dock Action] Databases not supported for ${args.provider}`)
          databases = []
        }
        if (args.resourceTypes.includes("webServices")) {
          console.log(`[Dock Action] Web services not supported for ${args.provider}`)
          webServices = []
        }
        if (args.resourceTypes.includes("domains")) {
          console.log(`[Dock Action] Domains not supported for ${args.provider}`)
          domains = []
        }
        if (args.resourceTypes.includes("blockVolumes")) {
          console.log(`[Dock Action] Block volumes not supported for ${args.provider}`)
          blockVolumes = []
        }
      } else if (args.provider === "github") {
        // GitHub-specific: Use GitHubAPI directly
        const api = new GitHubAPI(args.apiKey)

        // GitHub repository sync: Fetch repos with details to populate fullApiData
        if (args.resourceTypes.includes("repositories")) {
          console.log(`[Dock Action] Fetching GitHub repositories with details...`)
          const repos = await api.listRepositories()
          
          // Fetch details for each repository (branches, issues, commits, pullRequests)
          const reposWithDetails = await Promise.all(
            repos.map(async (repo) => {
              const [owner, repoName] = repo.full_name.split("/")
              const [branches, issues, commits, pullRequests] = await Promise.all([
                api.listBranches(owner, repoName).catch(() => []),
                api.listIssues(owner, repoName).catch(() => []),
                api.listCommits(owner, repoName, { limit: 10, page: 1 }).catch(() => []),
                api.listPullRequests(owner, repoName).catch(() => []),
              ])
              
              return {
                ...repo,
                branches,
                issues,
                commits,
                pullRequests,
              }
            })
          )
          
          repositories = reposWithDetails
          console.log(`[Dock Action] Fetched ${repositories.length} GitHub repositories with details`)
        }

        // GitHub doesn't support other resource types
        if (args.resourceTypes.includes("servers")) {
          servers = []
        }
        if (args.resourceTypes.includes("webServices")) {
          webServices = []
        }
        if (args.resourceTypes.includes("domains")) {
          domains = []
        }
        if (args.resourceTypes.includes("databases")) {
          databases = []
        }
      } else if (args.provider === "hetzner") {
        // Hetzner-specific: Use HetznerAPI directly
        const api = new HetznerAPI(args.apiKey)

        if (args.resourceTypes.includes("servers")) {
          console.log(`[Dock Action] Fetching servers for ${args.provider}`)
          const hetznerServers = await api.listServers()
          servers = hetznerServers
        }

        // Hetzner doesn't support databases, webServices, domains, blockVolumes, or buckets
        if (args.resourceTypes.includes("databases")) {
          console.log(`[Dock Action] Databases not supported for ${args.provider}`)
          databases = []
        }
        if (args.resourceTypes.includes("webServices")) {
          console.log(`[Dock Action] Web services not supported for ${args.provider}`)
          webServices = []
        }
        if (args.resourceTypes.includes("domains")) {
          console.log(`[Dock Action] Domains not supported for ${args.provider}`)
          domains = []
        }
        if (args.resourceTypes.includes("blockVolumes")) {
          console.log(`[Dock Action] Block volumes not supported for ${args.provider}`)
          blockVolumes = []
        }
        if (args.resourceTypes.includes("buckets")) {
          console.log(`[Dock Action] Buckets not supported for ${args.provider}`)
          buckets = []
        }
      } else if (args.provider === "coolify") {
        // Coolify-specific: Use CoolifyAPI directly
        const api = new CoolifyAPI(args.apiKey)

        if (args.resourceTypes.includes("servers")) {
          console.log(`[Dock Action] Fetching servers for ${args.provider}`)
          servers = await api.listServers()
        }

        // Always fetch services if webServices OR databases are requested
        // (databases are nested in services)
        if (args.resourceTypes.includes("webServices") || args.resourceTypes.includes("databases")) {
          console.log(`[Dock Action] Fetching services for ${args.provider}`)
          const services = await api.listServices()

          if (args.resourceTypes.includes("webServices")) {
            webServices = services
          }

          // Extract databases from services if requested
          if (args.resourceTypes.includes("databases")) {
            // Flatten databases from all services
            databases = services.flatMap(service =>
              service.databases.map(db => ({
                ...db,
                service_uuid: service.uuid,
                service_name: service.name,
              }))
            )
          }
        }

        // Coolify doesn't have separate domains endpoint
        if (args.resourceTypes.includes("domains")) {
          console.log(`[Dock Action] Domains not supported for ${args.provider}`)
          domains = []
        }
        if (args.resourceTypes.includes("blockVolumes")) {
          console.log(`[Dock Action] Block volumes not supported for ${args.provider}`)
          blockVolumes = []
        }
        if (args.resourceTypes.includes("buckets")) {
          console.log(`[Dock Action] Buckets not supported for ${args.provider}`)
          buckets = []
        }
      } else if (args.provider === "better-stack") {
        // Better Stack-specific: Use BetterStackAPI directly
        const api = new BetterStackAPI(args.apiKey)

        if (args.resourceTypes.includes("monitors")) {
          console.log(`[Dock Action] Fetching monitors for ${args.provider}`)
          monitors = await api.listMonitors()
        }

        // Better Stack only supports monitors
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
        if (args.resourceTypes.includes("databases")) {
          console.log(`[Dock Action] Databases not supported for ${args.provider}`)
          databases = []
        }
      } else if (args.provider === "sentry") {
        // Sentry-specific: Use SentryAPI directly
        const api = new SentryAPI(args.apiKey)

        if (args.resourceTypes.includes("issues")) {
          // Sentry logging only
          console.log(`[Dock Action] [Sentry] Fetching issues`)
          const projectsWithIssues = await api.listAllIssues()
          console.log(`[Dock Action] [Sentry] Fetched ${projectsWithIssues.length} projects with issues`)
          // Log total issues count
          const totalIssues = projectsWithIssues.reduce((sum, p) => sum + (p.issues?.length || 0), 0)
          console.log(`[Dock Action] [Sentry] Total issues across all projects: ${totalIssues}`)
          // Flatten to array of { project, issues } objects
          // Note: Sentry API uses "issues" terminology, we store them in "issues" table
          issues = projectsWithIssues
        }

        // Sentry only supports issues
        if (args.resourceTypes.includes("servers")) {
          servers = []
        }
        if (args.resourceTypes.includes("webServices")) {
          webServices = []
        }
        if (args.resourceTypes.includes("domains")) {
          domains = []
        }
        if (args.resourceTypes.includes("databases")) {
          databases = []
        }
        if (args.resourceTypes.includes("monitors")) {
          monitors = []
        }
      } else {
        // For other providers, use adapter pattern
        // TODO: Implement adapter pattern for other providers
        throw new Error(`Provider ${args.provider} sync not yet implemented in action`)
      }

      if (args.provider === "sentry") {
        console.log(`[Dock Action] [Sentry] Sync complete: ${issues.length} issues`)
      }

      // Note: Rate limit headers are captured by individual API clients
      // They will be updated via updateRateLimitInfo mutation when we update API clients
      // For MVP, we'll add rate limit header capture incrementally

      // Call internal mutation to sync using adapter methods
      // CRITICAL: Always pass arrays (even empty ones) so deletion logic can run
      // If we pass undefined, the adapter method won't be called and orphaned resources won't be deleted
      const fetchedData = {
        servers: args.resourceTypes.includes("servers") ? servers : undefined,
        webServices: args.resourceTypes.includes("webServices") ? webServices : undefined,
        domains: args.resourceTypes.includes("domains") ? domains : undefined,
        databases: args.resourceTypes.includes("databases") ? databases : undefined,
        deployments: args.resourceTypes.includes("deployments") ? deployments : undefined,
        backupSchedules: backupSchedules.length > 0 ? backupSchedules : undefined,
        backupIntegrations: backupIntegrations.length > 0 ? backupIntegrations : undefined,
        repositories: args.resourceTypes.includes("repositories") ? repositories : undefined,
        blockVolumes: args.resourceTypes.includes("blockVolumes") ? blockVolumes : undefined,
        buckets: args.resourceTypes.includes("buckets") ? buckets : undefined,
        monitors: args.resourceTypes.includes("monitors") ? monitors : undefined,
        issues: args.resourceTypes.includes("issues") ? issues : undefined,
      }
      
      // Sentry logging only
      if (args.provider === "sentry") {
        console.log(`[Dock Action] [Sentry] 📤 Calling syncDockResourcesMutation`)
        console.log(`[Dock Action] [Sentry]   - issues: ${fetchedData.issues === undefined ? "undefined" : `array(${fetchedData.issues.length})`}`)
      }
      
      await ctx.runMutation(internal.docks.mutations.syncDockResourcesMutation, {
        dockId: args.dockId,
        provider: args.provider,
        fetchedData,
      })

      return { success: true }
    } catch (error) {
      // Error logging silenced except for Sentry
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      
      // Mark sync as failed via internal mutation
      try {
        await ctx.runMutation(internal.docks.mutations.updateSyncStatus, {
          dockId: args.dockId,
          status: "error",
          syncInProgress: false,
          error: errorMessage,
        })
      } catch (statusError) {
        // If updating status fails, log but don't throw (original error is more important)
        // Error logging silenced except for Sentry
      }
      
      throw new Error(`Failed to sync dock resources: ${errorMessage}`)
    }
  },
})

/**
 * Fetch more commits for a GitHub repository on-demand (public action)
 * Used for pagination - fetches commits incrementally to avoid document size limits
 * 
 * Flow:
 * 1. Frontend calls this action with dockId, owner, repo, page
 * 2. Action calls internal query to get dock and verify permissions
 * 3. Action decrypts API key
 * 4. Action fetches commits from GitHub API
 * 5. Action returns commits array directly to frontend
 */
export const fetchMoreCommits = action({
  args: {
    dockId: v.id("docks"),
    owner: v.string(),
    repo: v.string(),
    page: v.number(), // Page number (1-indexed, page 2 = commits 11-20, etc.)
    perPage: v.optional(v.number()), // Commits per page (default: 10)
  },
  handler: async (ctx, args) => {
    // Logging silenced except for Sentry
    
    // Get dock and verify permissions via internal query
    const dock = await ctx.runQuery(internal.docks.queries.getDockForAction, {
      dockId: args.dockId,
    })
    
    if (!dock) {
      throw new Error("Dock not found")
    }
    
    if (!dock.hasPermission) {
      throw new Error("Permission denied: You don't have access to this dock")
    }
    
    if (dock.provider !== "github") {
      throw new Error("This action is only available for GitHub docks")
    }
    
    // Decrypt API key (actions can use decryptApiKey, but without audit logging)
    const apiKey = await decryptApiKey(dock.encryptedApiKey)
    
    // Fetch commits
    const perPage = args.perPage || 10
    const api = new GitHubAPI(apiKey)
    
    // GitHub API uses per_page and page parameters
    // Page 1 = commits 0-9, page 2 = commits 10-19, etc.
    const commits = await api.listCommits(args.owner, args.repo, {
      limit: perPage,
      page: args.page,
    })
    
    return commits
  },
})
