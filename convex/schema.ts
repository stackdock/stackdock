import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // == LAYER 1, 3: ORGS, USERS, CLIENTS, TEAMS ==

  organizations: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
  }),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    defaultOrgId: v.optional(v.id("organizations")),
  }).index("by_clerkId", ["clerkId"]),

  memberships: defineTable({
    orgId: v.id("organizations"),
    userId: v.id("users"),
    orgRole: v.string(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_userId", ["userId"])
    .index("by_org_user", ["orgId", "userId"]),

  teams: defineTable({
    orgId: v.id("organizations"),
    name: v.string(), // "Dev Team Alpha"
  }).index("by_orgId", ["orgId"]),

  clients: defineTable({
    orgId: v.id("organizations"),
    name: v.string(), // "Client A Inc."
  }).index("by_orgId", ["orgId"]),

  // == LAYER 7: ROLES & PERMISSIONS ==

  roles: defineTable({
    orgId: v.id("organizations"),
    name: v.string(), // "Admin", "Developer", "Support", "Client"
    permissions: v.object({
      projects: v.union(v.literal("full"), v.literal("read"), v.literal("none")),
      resources: v.union(v.literal("full"), v.literal("read"), v.literal("none")),
      docks: v.union(v.literal("full"), v.literal("read"), v.literal("none")),
      operations: v.union(v.literal("full"), v.literal("read"), v.literal("none")),
      settings: v.union(v.literal("full"), v.literal("read"), v.literal("none")),
      provisioning: v.optional(v.union(v.literal("full"), v.literal("read"), v.literal("none"))),
      monitoring: v.optional(v.union(v.literal("full"), v.literal("read"), v.literal("none"))),
    }),
  }).index("by_orgId", ["orgId"]),

  teamMemberships: defineTable({
    orgId: v.id("organizations"),
    teamId: v.id("teams"),
    userId: v.id("users"),
    roleId: v.id("roles"),
  })
    .index("by_teamId", ["teamId"])
    .index("by_userId", ["userId"])
    .index("by_team_user", ["teamId", "userId"]),

  clientMemberships: defineTable({
    orgId: v.id("organizations"),
    clientId: v.id("clients"),
    userId: v.id("users"),
    roleId: v.id("roles"),
  })
    .index("by_clientId", ["clientId"])
    .index("by_userId", ["userId"]),

  // == LAYER 4: DOCKS & PERMISSIONS ==

  docks: defineTable({
    orgId: v.id("organizations"),
    name: v.string(), // "Client A - Vultr"
    provider: v.string(), // "vultr", "aws", "vercel"
    encryptedApiKey: v.bytes(),
    provisioningCredentials: v.optional(v.bytes()), // Encrypted provisioning credentials (AWS keys, Cloudflare tokens, etc.)
    accountId: v.optional(v.string()), // Provider account ID (Cloudflare, AWS, etc.)
    providerMetadata: v.optional(v.any()), // Provider-specific metadata
    lastSyncStatus: v.union(
      v.literal("pending"),
      v.literal("syncing"),
      v.literal("success"),
      v.literal("error")
    ),
    lastSyncAt: v.optional(v.number()),
    lastSyncError: v.optional(v.string()), // Error message for failed syncs
    syncInProgress: v.optional(v.boolean()), // Prevent concurrent syncs
    updatedAt: v.optional(v.number()), // Track modification time
    // Rate limit tracking (MVP - can be removed post-production)
    rateLimitInfo: v.optional(v.object({
      // Last seen rate limit headers (for debugging/annotation)
      lastHeaders: v.optional(v.any()), // Raw headers object
      lastSeenAt: v.optional(v.number()), // Timestamp
      // Extracted rate limit values
      limit: v.optional(v.number()), // X-RateLimit-Limit
      remaining: v.optional(v.number()), // X-RateLimit-Remaining
      reset: v.optional(v.number()), // X-RateLimit-Reset (timestamp)
      retryAfter: v.optional(v.number()), // Retry-After (seconds)
      // Provider-specific headers (annotated for removal)
      providerSpecific: v.optional(v.any()), // Store all rate limit headers
      // Rate limit violations
      violations: v.optional(v.array(v.object({
        timestamp: v.number(),
        statusCode: v.number(), // 429
        endpoint: v.string(),
        retryAfter: v.optional(v.number()),
        headers: v.any(),
      }))),
    })),
    // Sync configuration
    syncConfig: v.optional(v.object({
      enabled: v.boolean(), // Enable/disable auto-sync (default: true)
      intervalSeconds: v.number(), // Sync interval (default: 60 seconds, minimum: 60)
      lastSyncAttempt: v.optional(v.number()), // Last sync attempt timestamp
      consecutiveFailures: v.optional(v.number()), // Track failures for backoff
      backoffUntil: v.optional(v.number()), // Don't sync until this timestamp
    })),
  }).index("by_orgId", ["orgId"]),

  dockPermissions: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    teamId: v.optional(v.id("teams")),
    clientId: v.optional(v.id("clients")),
  })
    .index("by_dockId", ["dockId"])
    .index("by_teamId", ["teamId"])
    .index("by_clientId", ["clientId"]),

  // Rate limit logs (optional, for detailed tracking - MVP annotation)
  rateLimitLogs: defineTable({
    dockId: v.id("docks"),
    orgId: v.id("organizations"),
    provider: v.string(),
    endpoint: v.string(), // API endpoint called
    method: v.string(), // GET, POST, etc.
    timestamp: v.number(),
    headers: v.any(), // All rate limit headers captured
    extracted: v.object({
      limit: v.optional(v.number()),
      remaining: v.optional(v.number()),
      reset: v.optional(v.number()),
      retryAfter: v.optional(v.number()),
    }),
    // MVP annotation: Mark for removal post-production
    _mvpTracking: v.literal(true), // Explicit marker for cleanup
  })
    .index("by_dockId", ["dockId"])
    .index("by_provider", ["provider"])
    .index("by_timestamp", ["timestamp"]),

  // == LAYER 5: PROJECTS & RESOURCES ==

  projects: defineTable({
    orgId: v.id("organizations"),
    teamId: v.id("teams"),
    clientId: v.optional(v.id("clients")), // Made optional
    name: v.string(), // "Client A Website"
    slug: v.string(), // URL-friendly version of name (lowercase, hyphenated)
    linearId: v.optional(v.string()),
    githubRepo: v.optional(v.string()), // Format: "owner/repo-name"
    fullApiData: v.optional(v.any()), // Stores GitHub repo data, branches, issues, etc.
  })
    .index("by_orgId", ["orgId"])
    .index("by_teamId", ["teamId"])
    .index("by_clientId", ["clientId"])
    .index("by_githubRepo", ["orgId", "githubRepo"]) // For efficient GitHub repo lookups
    .index("by_slug", ["orgId", "slug"]), // For URL lookups

  // Master Fleet List: Servers (IaaS)
  servers: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(), // "vultr", "aws"
    providerResourceId: v.string(),
    name: v.string(),
    primaryIpAddress: v.optional(v.string()), // Main IP for display (all IPs in fullApiData)
    region: v.optional(v.string()), // "us-east-1", "nyc1", etc.
    status: v.string(),
    fullApiData: v.any(),
    updatedAt: v.optional(v.number()), // Track modification time
    // Provisioning metadata
    provisioningSource: v.optional(v.union(v.literal("sst"), v.literal("api"), v.literal("manual"))),
    sstResourceId: v.optional(v.string()), // SST resource identifier (e.g., "MyServer")
    sstStackName: v.optional(v.string()), // SST stack name (e.g., "production", "staging")
    provisioningState: v.optional(v.union(v.literal("provisioning"), v.literal("provisioned"), v.literal("failed"), v.literal("deprovisioning"))),
    provisionedAt: v.optional(v.number()), // Timestamp when resource was provisioned
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"])
    .index("by_dock_resource", ["dockId", "providerResourceId"]) // Prevent duplicate syncs
    .index("by_provisioning_source", ["provisioningSource", "orgId"])
    .index("by_sst_resource", ["sstStackName", "sstResourceId"]),

  // *** NEW TABLE ***
  // Master Fleet List: Web Services (PaaS)
  webServices: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(), // "vercel", "netlify", "railway", "gridpane"
    providerResourceId: v.string(),
    name: v.string(),
    productionUrl: v.optional(v.string()), // Some services might not have URLs yet
    environment: v.optional(v.string()), // "production", "staging", "development"
    gitRepo: v.optional(v.string()),
    status: v.string(),
    fullApiData: v.any(),
    updatedAt: v.optional(v.number()), // Track modification time
    // Provisioning metadata
    provisioningSource: v.optional(v.union(v.literal("sst"), v.literal("api"), v.literal("manual"))),
    sstResourceId: v.optional(v.string()), // SST resource identifier (e.g., "MyBucket")
    sstStackName: v.optional(v.string()), // SST stack name (e.g., "production", "staging")
    provisioningState: v.optional(v.union(v.literal("provisioning"), v.literal("provisioned"), v.literal("failed"), v.literal("deprovisioning"))),
    provisionedAt: v.optional(v.number()), // Timestamp when resource was provisioned
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"])
    .index("by_dock_resource", ["dockId", "providerResourceId"]) // Prevent duplicate syncs
    .index("by_provisioning_source", ["provisioningSource", "orgId"])
    .index("by_sst_resource", ["sstStackName", "sstResourceId"]),

  // Master Fleet List: Domains
  domains: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(),
    providerResourceId: v.string(),
    domainName: v.string(),
    expiresAt: v.optional(v.number()),
    status: v.string(),
    fullApiData: v.any(),
    updatedAt: v.optional(v.number()), // Track modification time
    // Provisioning metadata
    provisioningSource: v.optional(v.union(v.literal("sst"), v.literal("api"), v.literal("manual"))),
    sstResourceId: v.optional(v.string()), // SST resource identifier (e.g., "MyDomain")
    sstStackName: v.optional(v.string()), // SST stack name (e.g., "production", "staging")
    provisioningState: v.optional(v.union(v.literal("provisioning"), v.literal("provisioned"), v.literal("failed"), v.literal("deprovisioning"))),
    provisionedAt: v.optional(v.number()), // Timestamp when resource was provisioned
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"])
    .index("by_dock_resource", ["dockId", "providerResourceId"]) // Prevent duplicate syncs
    .index("by_provisioning_source", ["provisioningSource", "orgId"])
    .index("by_sst_resource", ["sstStackName", "sstResourceId"]),

  // Master Fleet List: Databases
  databases: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(), // "aws-rds", "digitalocean-db", "planetscale", etc.
    providerResourceId: v.string(),
    name: v.string(),
    engine: v.optional(v.string()), // "mysql", "postgresql", "mongodb", etc.
    version: v.optional(v.string()),
    status: v.string(),
    fullApiData: v.any(),
    updatedAt: v.optional(v.number()), // Track modification time
    // Provisioning metadata
    provisioningSource: v.optional(v.union(v.literal("sst"), v.literal("api"), v.literal("manual"))),
    sstResourceId: v.optional(v.string()), // SST resource identifier (e.g., "MyDatabase")
    sstStackName: v.optional(v.string()), // SST stack name (e.g., "production", "staging")
    provisioningState: v.optional(v.union(v.literal("provisioning"), v.literal("provisioned"), v.literal("failed"), v.literal("deprovisioning"))),
    provisionedAt: v.optional(v.number()), // Timestamp when resource was provisioned
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"])
    .index("by_dock_resource", ["dockId", "providerResourceId"]) // Prevent duplicate syncs
    .index("by_provisioning_source", ["provisioningSource", "orgId"])
    .index("by_sst_resource", ["sstStackName", "sstResourceId"]),

  // Master Fleet List: Block Volumes (Block Storage)
  blockVolumes: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(), // "vultr", "digitalocean"
    providerResourceId: v.string(), // Vultr block ID or DO volume ID
    name: v.string(), // Vultr label or DO name
    sizeGb: v.number(), // Size in GB
    region: v.string(), // Provider region code
    status: v.string(), // "active", "attached", "detached", etc.
    attachedToInstance: v.optional(v.string()), // Instance/server ID it's attached to
    attachedToInstanceLabel: v.optional(v.string()), // Instance/server name
    mountId: v.optional(v.string()), // Vultr mount_id
    blockType: v.optional(v.string()), // Vultr block_type (e.g., "high_perf")
    filesystemType: v.optional(v.string()), // DO filesystem_type (e.g., "ext4")
    fullApiData: v.any(),
    updatedAt: v.optional(v.number()), // Track modification time
    // Provisioning metadata
    provisioningSource: v.optional(v.union(v.literal("sst"), v.literal("api"), v.literal("manual"))),
    sstResourceId: v.optional(v.string()),
    sstStackName: v.optional(v.string()),
    provisioningState: v.optional(v.union(v.literal("provisioning"), v.literal("provisioned"), v.literal("failed"), v.literal("deprovisioning"))),
    provisionedAt: v.optional(v.number()),
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"])
    .index("by_dock_resource", ["dockId", "providerResourceId"]) // Prevent duplicate syncs
    .index("by_provisioning_source", ["provisioningSource", "orgId"])
    .index("by_sst_resource", ["sstStackName", "sstResourceId"]),

  // Master Fleet List: Buckets (Object Storage)
  buckets: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(), // "linode", "digitalocean", "aws", etc.
    providerResourceId: v.string(), // Bucket identifier (Linode label, DO name, etc.)
    name: v.string(), // Bucket name
    region: v.string(), // Provider region code
    cluster: v.optional(v.string()), // Linode cluster (e.g., "us-sea-1")
    hostname: v.optional(v.string()), // Bucket hostname
    s3Endpoint: v.optional(v.string()), // S3-compatible endpoint
    sizeBytes: v.optional(v.number()), // Total size in bytes
    objectCount: v.optional(v.number()), // Number of objects
    status: v.string(), // "active", etc.
    fullApiData: v.any(),
    updatedAt: v.optional(v.number()), // Track modification time
    // Provisioning metadata
    provisioningSource: v.optional(v.union(v.literal("sst"), v.literal("api"), v.literal("manual"))),
    sstResourceId: v.optional(v.string()),
    sstStackName: v.optional(v.string()),
    provisioningState: v.optional(v.union(v.literal("provisioning"), v.literal("provisioned"), v.literal("failed"), v.literal("deprovisioning"))),
    provisionedAt: v.optional(v.number()),
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"])
    .index("by_dock_resource", ["dockId", "providerResourceId"]) // Prevent duplicate syncs
    .index("by_provisioning_source", ["provisioningSource", "orgId"])
    .index("by_sst_resource", ["sstStackName", "sstResourceId"]),

  // Master Fleet List: Monitors (Uptime Monitoring)
  monitors: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(), // "better-stack", "pingdom", "statuscake", etc.
    providerResourceId: v.string(), // Monitor ID from provider
    name: v.string(), // Monitor name (pronounceable_name or URL)
    url: v.optional(v.string()), // URL being monitored
    monitorType: v.optional(v.string()), // "status", "ping", "keyword", etc.
    status: v.string(), // "up", "down", "paused", etc.
    lastCheckedAt: v.optional(v.number()), // Last check timestamp
    checkFrequency: v.optional(v.number()), // Check frequency in seconds
    monitorGroupId: v.optional(v.string()), // Group ID from provider
    monitorGroupName: v.optional(v.string()), // Group name for display
    fullApiData: v.any(), // All provider-specific data
    updatedAt: v.optional(v.number()), // Track modification time
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"])
    .index("by_dock_resource", ["dockId", "providerResourceId"]) // Prevent duplicate syncs
    .index("by_status", ["orgId", "status"]), // For filtering by status

  // Master Fleet List: Issues (Errors/Exceptions/Alerts)
  // Note: Sentry calls them "issues", but StackDock calls them "alerts" in user-facing contexts
  // to avoid confusion with GitHub issues, bug trackers, etc. Internally, we use "issues" table
  // for backward compatibility and semantic clarity (these are error tracking issues).
  issues: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(), // "sentry", "rollbar", "bugsnag", etc.
    providerResourceId: v.string(), // Issue ID from provider (Sentry calls it "issue ID")
    title: v.string(), // Issue title/name
    status: v.string(), // "open", "resolved", "ignored", etc.
    severity: v.string(), // "low", "medium", "high", "critical"
    project: v.string(), // Provider project name (Sentry project, not StackDock project)
    projectSlug: v.optional(v.string()), // Provider project slug
    organizationSlug: v.optional(v.string()), // Provider organization slug
    count: v.optional(v.number()), // Number of occurrences
    userCount: v.optional(v.number()), // Number of affected users
    firstSeen: v.optional(v.number()), // First seen timestamp
    lastSeen: v.optional(v.number()), // Last seen timestamp
    fullApiData: v.any(), // All provider-specific data
    updatedAt: v.optional(v.number()), // Track modification time
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"])
    .index("by_dock_resource", ["dockId", "providerResourceId"]) // Prevent duplicate syncs
    .index("by_status", ["orgId", "status"]) // For filtering by status
    .index("by_severity", ["orgId", "severity"]), // For filtering by severity

  // Master Fleet List: Repositories (Code)
  repositories: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(), // "github", "gitlab", "bitbucket", etc.
    providerResourceId: v.string(), // Repository full name (e.g., "owner/repo-name")
    name: v.string(), // Repository name
    fullName: v.string(), // Full repository name (e.g., "owner/repo-name")
    description: v.optional(v.string()), // Repository description
    language: v.optional(v.string()), // Primary language
    private: v.boolean(), // Is private repository
    url: v.optional(v.string()), // Repository URL
    defaultBranch: v.optional(v.string()), // Default branch name
    fullApiData: v.any(), // All provider-specific data (branches, issues, commits, pullRequests, etc.)
    updatedAt: v.optional(v.number()), // Track modification time
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"])
    .index("by_dock_resource", ["dockId", "providerResourceId"]) // Prevent duplicate syncs
    .index("by_provider", ["orgId", "provider"]), // For filtering by provider

  // Master Fleet List: Deployments
  deployments: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(), // "convex", etc.
    providerResourceId: v.string(), // Deployment name/ID (provider-specific)
    projectId: v.optional(v.number()), // Convex project ID
    name: v.string(), // Deployment name
    deploymentType: v.string(), // "dev", "prod", "preview"
    status: v.string(), // "active", "inactive", "error"
    createdAt: v.optional(v.number()), // Creation timestamp
    fullApiData: v.any(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"])
    .index("by_dock_deployment", ["dockId", "providerResourceId"]) // Prevent duplicate syncs
    .index("by_projectId", ["projectId"]),

  // Master Fleet List: Backup Schedules
  backupSchedules: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(), // "gridpane", etc.
    providerResourceId: v.string(), // Site ID or schedule ID (provider-specific)
    siteId: v.number(), // GridPane site ID
    siteUrl: v.string(),
    scheduleId: v.number(), // GridPane schedule ID
    type: v.union(v.literal("local"), v.literal("remote")),
    frequency: v.string(), // "daily", "weekly", "hourly"
    hour: v.string(),
    minute: v.string(),
    time: v.string(), // Formatted "HH:mm"
    dayOfWeek: v.optional(v.number()), // 0-6 for weekly, null otherwise
    serviceId: v.optional(v.number()), // Integration ID for remote backups
    serviceName: v.optional(v.string()), // e.g., "aws-s3"
    enabled: v.boolean(),
    remoteBackupsEnabled: v.boolean(),
    fullApiData: v.any(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"])
    .index("by_dock_schedule", ["dockId", "scheduleId"]) // Prevent duplicate syncs
    .index("by_siteId", ["siteId"]),

  // Master Fleet List: Backup Integrations
  backupIntegrations: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(), // "gridpane", etc.
    providerResourceId: v.string(), // Integration ID (provider-specific)
    integrationId: v.number(), // GridPane integration ID
    integratedService: v.string(), // "aws-s3", etc.
    integrationName: v.string(),
    region: v.optional(v.string()),
    fullApiData: v.any(), // Note: Don't store tokens/secrets here - they're sensitive
    updatedAt: v.optional(v.number()),
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"])
    .index("by_dock_integration", ["dockId", "integrationId"]) // Prevent duplicate syncs
    .index("by_integrationId", ["integrationId"]),

  // *** UPDATED TABLE ***
  // The "Glue" Table (Layer 5 Linking)
  projectResources: defineTable({
    orgId: v.id("organizations"),
    projectId: v.id("projects"),
    // This is the polymorphic part
    resourceTable: v.union(
      v.literal("servers"),
      v.literal("domains"),
      v.literal("webServices"),
      v.literal("databases"),
      v.literal("blockVolumes"),
      v.literal("buckets")
    ),
    // This is the correct polymorphic link
    resourceId: v.string(), // The `_id` of the document in its table
    // Denormalized data for fast project dashboard loads
    denormalized_name: v.string(),
    denormalized_status: v.string(),
  })
    .index("by_project", ["projectId"])
    .index("by_resource", ["resourceTable", "resourceId"]),

  // == LAYER 6: OPERATIONS & SERVICES ==

  operationServices: defineTable({
    orgId: v.id("organizations"),
    type: v.union(v.literal("backup_s3"), v.literal("networking_cloudflare")),
    name: v.string(), // "Main Agency Backup Bucket"
    encryptedConfig: v.bytes(),
  }).index("by_orgId", ["orgId"]),

  operationPermissions: defineTable({
    orgId: v.id("organizations"),
    serviceId: v.id("operationServices"),
    teamId: v.id("teams"),
  })
    .index("by_serviceId", ["serviceId"])
    .index("by_teamId", ["teamId"]),

  // == LAYER 8: AUDIT LOGGING ==

  auditLogs: defineTable({
    orgId: v.id("organizations"),
    userId: v.id("users"),
    action: v.string(), // "dock.create", "rbac.deny", "dock.sync", etc.
    resourceType: v.optional(v.string()), // "docks", "servers", "webServices", etc.
    resourceId: v.optional(v.string()), // ID of the resource acted upon
    metadata: v.optional(v.any()), // Action-specific data
    result: v.union(v.literal("success"), v.literal("error")),
    errorMessage: v.optional(v.string()),
    timestamp: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_org", ["orgId", "timestamp"])
    .index("by_user", ["userId", "timestamp"])
    .index("by_resource", ["resourceType", "resourceId"]),

  // == LAYER 9: BILLING & MONETIZATION (Autumn Integration) ==
  // Note: These tables provide the foundation for Autumn integration
  // Currently scaffolded for future implementation

  // Subscription management (links to Autumn)
  subscriptions: defineTable({
    orgId: v.id("organizations"),
    autumnCustomerId: v.optional(v.string()), // Autumn customer ID
    autumnSubscriptionId: v.optional(v.string()), // Autumn subscription ID
    planId: v.string(), // References plans table or Autumn plan ID
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("incomplete")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    trialEnd: v.optional(v.number()),
    metadata: v.optional(v.any()), // Additional subscription metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_autumn_customer", ["autumnCustomerId"])
    .index("by_status", ["status"]),

  // Billing customers (links organizations to payment provider)
  customers: defineTable({
    orgId: v.id("organizations"),
    autumnCustomerId: v.string(), // Autumn customer ID
    stripeCustomerId: v.optional(v.string()), // Stripe customer ID (if using Stripe)
    email: v.string(),
    name: v.optional(v.string()),
    paymentMethod: v.optional(v.object({
      type: v.string(), // "card", "bank_account", etc.
      last4: v.optional(v.string()),
      brand: v.optional(v.string()),
    })),
    billingAddress: v.optional(v.object({
      line1: v.optional(v.string()),
      line2: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      country: v.optional(v.string()),
    })),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_autumn_customer", ["autumnCustomerId"])
    .index("by_stripe_customer", ["stripeCustomerId"]),

  // Pricing plans and feature definitions
  plans: defineTable({
    name: v.string(), // "Free", "Pro", "Enterprise"
    displayName: v.string(), // "Professional Plan"
    description: v.optional(v.string()),
    autumnPlanId: v.optional(v.string()), // Autumn plan ID
    stripePriceId: v.optional(v.string()), // Stripe price ID
    amount: v.number(), // Price in cents
    currency: v.string(), // "usd", "eur", etc.
    interval: v.union(v.literal("month"), v.literal("year"), v.literal("one_time")),
    features: v.object({
      // Feature flags and limits
      maxDocks: v.number(),
      maxProjects: v.number(),
      maxTeamMembers: v.number(),
      multiCloudSupport: v.boolean(),
      advancedMonitoring: v.boolean(),
      apiAccess: v.boolean(),
      prioritySupport: v.boolean(),
      customIntegrations: v.boolean(),
      // Usage limits
      maxApiCallsPerMonth: v.optional(v.number()),
      maxStorageGB: v.optional(v.number()),
    }),
    isActive: v.boolean(),
    sortOrder: v.number(), // For display ordering
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_sort_order", ["sortOrder"]),

  // Usage tracking and metering
  usageRecords: defineTable({
    orgId: v.id("organizations"),
    subscriptionId: v.id("subscriptions"),
    metricType: v.string(), // "api_calls", "docks", "projects", "storage", etc.
    quantity: v.number(),
    timestamp: v.number(),
    metadata: v.optional(v.any()), // Additional context (dock ID, project ID, etc.)
  })
    .index("by_org", ["orgId", "timestamp"])
    .index("by_subscription", ["subscriptionId", "timestamp"])
    .index("by_metric", ["metricType", "timestamp"]),

  // Invoice records
  invoices: defineTable({
    orgId: v.id("organizations"),
    customerId: v.id("customers"),
    subscriptionId: v.optional(v.id("subscriptions")),
    autumnInvoiceId: v.optional(v.string()), // Autumn invoice ID
    stripeInvoiceId: v.optional(v.string()), // Stripe invoice ID
    number: v.string(), // Invoice number
    status: v.union(
      v.literal("draft"),
      v.literal("open"),
      v.literal("paid"),
      v.literal("void"),
      v.literal("uncollectible")
    ),
    amount: v.number(), // Total amount in cents
    currency: v.string(),
    amountPaid: v.number(),
    amountDue: v.number(),
    periodStart: v.number(),
    periodEnd: v.number(),
    dueDate: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    hostedInvoiceUrl: v.optional(v.string()), // URL to view invoice
    invoicePdf: v.optional(v.string()), // URL to PDF
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId", "createdAt"])
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"])
    .index("by_autumn_invoice", ["autumnInvoiceId"])
    .index("by_stripe_invoice", ["stripeInvoiceId"]),
});
