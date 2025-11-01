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
    lastSyncStatus: v.union(
      v.literal("pending"),
      v.literal("syncing"),
      v.literal("success"),
      v.literal("error")
    ),
    lastSyncAt: v.optional(v.number()),
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

  // == LAYER 5: PROJECTS & RESOURCES ==

  projects: defineTable({
    orgId: v.id("organizations"),
    teamId: v.id("teams"),
    clientId: v.id("clients"),
    name: v.string(), // "Client A Website"
    linearId: v.optional(v.string()),
    githubRepo: v.optional(v.string()), // Repository URL only, not branch
    // Note: Branch information is not stored here as it's deployment-specific
    // and should be tracked in the linked webServices resources
  })
    .index("by_orgId", ["orgId"])
    .index("by_teamId", ["teamId"])
    .index("by_clientId", ["clientId"]),

  // Master Fleet List: Servers (IaaS)
  servers: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(), // "vultr", "aws"
    providerResourceId: v.string(),
    name: v.string(),
    ipAddress: v.string(),
    status: v.string(),
    fullApiData: v.any(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"]),

  // *** NEW TABLE ***
  // Master Fleet List: Web Services (PaaS)
  // Note: Git branch info is provider-specific and should be stored in fullApiData,
  // not as a universal field. Different providers handle branches differently.
  webServices: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(), // "vercel", "netlify", "railway"
    providerResourceId: v.string(),
    name: v.string(),
    productionUrl: v.string(),
    gitRepo: v.optional(v.string()), // Repository URL only, not branch
    status: v.string(),
    fullApiData: v.any(), // Provider-specific data (e.g., branch, environment, etc.)
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"]),

  // Master Fleet List: Domains
  domains: defineTable({
    orgId: v.id("organizations"),
    dockId: v.id("docks"),
    provider: v.string(),
    domainName: v.string(),
    expiresAt: v.optional(v.number()),
    status: v.string(),
    fullApiData: v.any(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_dockId", ["dockId"]),
  
  // ... (other resource tables like `databases`) ...

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
      v.literal("databases") // Added this one too
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
});
