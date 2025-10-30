# StackDock Architecture

> **The Vision**: StackDock is infrastructure's WordPress moment. A composable, open-source multi-cloud management platform where you own the code.

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [The Three Registries](#the-three-registries)
3. [Universal Table Architecture](#universal-table-architecture)
4. [Data Model](#data-model)
5. [Security Architecture](#security-architecture)
6. [RBAC System](#rbac-system)
7. [Dock Adapter Pattern](#dock-adapter-pattern)
8. [Tech Stack](#tech-stack)
9. [Monorepo Structure](#monorepo-structure)

---

## Core Philosophy

### The shadcn/ui Parallel

**shadcn/ui revolutionized UI development:**
```bash
npx shadcn add button
# → Copies button.tsx into YOUR codebase
# → You OWN the code, not a dependency
# → You can modify it
# → No vendor lock-in
```

**StackDock does the same for infrastructure:**
```bash
npx stackdock add gridpane
# → Copies GridPane dock adapter into YOUR codebase
# → You OWN the infrastructure adapter
# → You can modify it for your needs
# → You can publish your own version
# → No vendor lock-in
```

### Why This Doesn't Exist

| Tool | Limitation |
|------|------------|
| **Terraform** | Code-first, not a UI platform |
| **CloudQuery** | Read-only, no mutations |
| **AWS Console** | Vendor-locked, single provider |
| **Pulumi** | Developer tool, not operator interface |
| **Grafana** | Monitoring only, not management |

**StackDock fills the gap**: Universal control plane with true code ownership.

---

## The Three Registries

### 1. Docks Registry (Infrastructure Adapters)

**What it is**: A registry of provider adapters that translate APIs to universal schema.

**How it works**:
- Community publishes dock adapters
- You install via CLI: `npx stackdock add provider-name`
- Adapter code copied to your repo
- You can fork, modify, republish

**Examples**:
- `gridpane` dock → Translates GridPane API to `webServices` table
- `vercel` dock → Translates Vercel API to `webServices` table
- `digitalocean` dock → Translates DO API to `servers` table
- `cloudflare` dock → Translates Cloudflare API to `domains` table

### 2. UI Registry (Dashboard Components)

**What it is**: A registry of dashboard widgets (shadcn/ui model).

**How it works**:
- Community publishes widgets
- You install via CLI: `npx stackdock add widget-name`
- Component code copied to your repo
- Works with ANY provider (uses universal tables)

**Examples**:
- `server-health-widget` → Works with AWS, DigitalOcean, Vultr servers
- `deployment-timeline` → Works with Vercel, Netlify, Railway
- `domain-status-card` → Works with Cloudflare, Route53, Namecheap

### 3. The Platform (Orchestration Layer)

**What it is**: The core StackDock platform that provides:
- Universal data model (schema.ts)
- RBAC enforcement
- Encryption & security
- Audit logging
- Real-time sync
- Resource linking (polymorphic)

**This is the foundation that makes registries possible.**

---

## Universal Table Architecture

### The Problem: Provider-Specific Tables

❌ **WRONG APPROACH**:
```typescript
// This doesn't scale
gridPaneSites: defineTable({
  name: v.string(),
  phpVersion: v.string(),
  gridpaneSpecificField: v.string(),
  // ... 50 GridPane-specific fields
})

vercelDeployments: defineTable({
  name: v.string(),
  framework: v.string(),
  vercelSpecificField: v.string(),
  // ... 50 Vercel-specific fields
})
```

**Why this fails**:
- Dashboard needs different code for each provider
- Can't link resources across providers
- Doesn't scale (100 providers = 100 tables)
- Vendor lock-in (tied to specific APIs)

### The Solution: Universal Tables + Adapters

✅ **CORRECT APPROACH**:
```typescript
webServices: defineTable({
  // Universal fields (common to ALL providers)
  orgId: v.id("organizations"),
  dockId: v.id("docks"),
  provider: v.string(),              // "gridpane", "vercel", "railway"
  providerResourceId: v.string(),    // Provider's internal ID
  name: v.string(),                  // Universal: display name
  productionUrl: v.string(),         // Universal: URL
  status: v.string(),                // Universal: running/stopped/error
  gitRepo: v.optional(v.string()),   // Universal: git repository
  
  // Provider-specific data (catch-all)
  fullApiData: v.any(),              // ALL provider-specific fields
})
```

**Why this works**:
1. **Dashboard is provider-agnostic**: Queries `webServices`, shows name/url/status for ALL
2. **Cross-provider linking**: Projects can link GridPane site + Vercel deployment
3. **Scales infinitely**: 1000 providers = same table, just different `provider` field
4. **Extensible**: Access provider-specific fields via `fullApiData.phpVersion`

### Universal Table Types

| Table | Purpose | Providers |
|-------|---------|-----------|
| `servers` | IaaS compute | AWS EC2, DigitalOcean, Vultr, Hetzner, Linode |
| `webServices` | PaaS apps | Vercel, Netlify, Railway, Render, GridPane sites |
| `domains` | DNS management | Cloudflare, Route53, Namecheap |
| `databases` | Managed databases | AWS RDS, PlanetScale, Supabase, Neon |

---

## Data Model

### Layer Structure

```
Layer 1-3: Multi-Tenancy & Identity
  ├── organizations (top-level tenant)
  ├── users (synced from Clerk)
  ├── memberships (user ↔ org + role)
  ├── teams (internal groups)
  └── clients (external groups, for agencies)

Layer 4: Docks (Provider Connections)
  ├── docks (provider credentials, encrypted)
  └── dockPermissions (team/client access control)

Layer 5: Universal Resources
  ├── servers (IaaS compute)
  ├── webServices (PaaS apps)
  ├── domains (DNS zones)
  └── databases (managed DBs)

Layer 5b: Projects (Resource Grouping)
  ├── projects (logical grouping)
  └── projectResources (polymorphic links to resources)

Layer 7: RBAC
  ├── roles (permission sets)
  ├── teamMemberships (user ↔ team + role)
  └── clientMemberships (user ↔ client + role)

Layer 6: Operations (Future)
  ├── operationServices (shared services like backups)
  └── operationPermissions (team access)
```

### Key Relationships

```
Organization
  ├── has many Users (via memberships)
  ├── has many Teams
  ├── has many Clients
  ├── has many Docks
  ├── has many Projects
  └── has many Resources

Project
  ├── belongs to Organization
  ├── belongs to Team
  ├── belongs to Client
  └── links to Resources (polymorphic)

Resource (server/webService/domain)
  ├── belongs to Organization
  ├── belongs to Dock
  └── can be linked by Projects

Dock
  ├── belongs to Organization
  ├── has encrypted API key
  └── syncs Resources
```

### Polymorphic Resource Linking

**The Pattern**:
```typescript
projectResources: defineTable({
  projectId: v.id("projects"),
  
  // Polymorphic fields
  resourceTable: v.union(
    v.literal("servers"),
    v.literal("webServices"),
    v.literal("domains")
  ),
  resourceId: v.string(),  // ID in the resource table
  
  // Denormalized for performance
  denormalized_name: v.string(),
  denormalized_status: v.string(),
})
```

**Why this works**:
- One project can link to servers (AWS), webServices (Vercel), domains (Cloudflare)
- Resources can be from DIFFERENT docks/providers
- Dashboard shows unified view regardless of provider

**Example**:
```
Project: "Client A Website"
  ├── Server (DigitalOcean droplet)
  ├── WebService (Vercel deployment)
  └── Domain (Cloudflare zone)
```

---

## Security Architecture

### Threat Model

**Assets to Protect**:
1. API keys for docks (AWS, GridPane, Vercel) - **CROWN JEWELS**
2. User data (names, emails)
3. Resource metadata
4. Audit logs

**Attack Vectors**:
1. Compromised user account
2. SQL injection (N/A: using Convex)
3. XSS attacks
4. API key exposure
5. Insufficient RBAC (horizontal privilege escalation)

### Defense Layers

#### 1. Authentication (Clerk)
- JWT-based authentication
- MFA support
- Session management
- Webhook for user sync

#### 2. Encryption (AES-256-GCM)

**Implementation**:
```typescript
// convex/lib/encryption.ts
export async function encryptApiKey(plaintext: string): Promise<Uint8Array> {
  const iv = webcrypto.getRandomValues(new Uint8Array(12))
  const key = await webcrypto.subtle.importKey(
    'raw',
    Buffer.from(process.env.ENCRYPTION_MASTER_KEY!, 'hex'),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  
  const encrypted = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  )
  
  // Return: IV (12 bytes) + ciphertext
  return new Uint8Array([...iv, ...new Uint8Array(encrypted)])
}
```

**Key Storage**:
- Master key in environment variable (64-char hex)
- Rotate master key quarterly
- Support for multiple key versions (graceful rotation)

**Never Exposed**:
- API keys never sent to client
- Decryption only in Convex server functions
- No logging of decrypted values

#### 3. RBAC Enforcement

**Zero-Trust Model**: Every operation validates:
1. User is authenticated
2. User belongs to organization
3. User has required permission
4. Resource belongs to user's org (no cross-org access)

**Enforcement Points**:
- Convex middleware (global)
- Resource-level checks (fine-grained)
- Client-side guards (UI only, not security)

#### 4. Audit Logging

**What we log**:
- All mutations (create, update, delete)
- RBAC decisions (granted/denied with reason)
- Authentication events (login, logout, failed attempts)
- Dock syncs (success/failure)

**Schema**:
```typescript
auditLogs: defineTable({
  orgId: v.id("organizations"),
  userId: v.id("users"),
  action: v.string(),              // "dock.create", "project.update"
  resourceType: v.optional(v.string()),
  resourceId: v.optional(v.string()),
  metadata: v.any(),               // Action-specific data
  result: v.union(v.literal("success"), v.literal("error")),
  timestamp: v.number(),
})
```

#### 5. Network Security

- HTTPS only (enforced)
- CSP headers (prevent XSS)
- CORS properly configured
- Rate limiting on Convex mutations
- Webhook signature verification (Clerk)

---

## RBAC System

### Permission Model

**Permissions are hierarchical**:
- `none`: No access
- `read`: View only
- `full`: Read + write

**Resources**:
- `projects`: Create/edit/delete projects
- `resources`: Manage servers/sites/domains
- `docks`: Connect/disconnect providers
- `operations`: Backup/restore operations
- `settings`: Org/team/role management

**Example Role**:
```typescript
{
  name: "Developer",
  permissions: {
    projects: "full",    // Can create/edit projects
    resources: "read",   // Can view resources (read-only)
    docks: "none",       // Cannot access docks
    operations: "read",  // Can view operation logs
    settings: "none",    // Cannot change settings
  }
}
```

### RBAC Enforcement

#### Convex Middleware

```typescript
// convex/lib/rbac.ts
export function withRBAC(permission: string) {
  return (handler: any) => async (ctx: MutationCtx, args: any) => {
    const user = await getCurrentUser(ctx)
    const hasPermission = await checkPermission(
      ctx, 
      user._id, 
      args.orgId, 
      permission
    )
    
    if (!hasPermission) {
      // Log denial
      await auditLog(ctx, "rbac.deny", "error", { 
        permission, 
        userId: user._id 
      })
      throw new ConvexError(`Permission denied: ${permission}`)
    }
    
    // Log grant
    await auditLog(ctx, "rbac.grant", "success", { permission })
    
    return handler(ctx, args, user)
  }
}
```

#### Usage

```typescript
export const createDock = mutation({
  args: { orgId: v.id("organizations"), ... },
  handler: withRBAC("docks:full")(async (ctx, args, user) => {
    // User has been validated
    // Safe to proceed
    return await ctx.db.insert("docks", { ... })
  }),
})
```

### Multi-Tenant Isolation

**Every query filters by orgId**:
```typescript
export const listServers = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Verify user belongs to org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_org_user", q => 
        q.eq("orgId", args.orgId).eq("userId", user._id)
      )
      .first()
    
    if (!membership) throw new ConvexError("Not a member")
    
    // Only return org's servers
    return await ctx.db
      .query("servers")
      .withIndex("by_orgId", q => q.eq("orgId", args.orgId))
      .collect()
  },
})
```

### Team & Client Scoping

**Dock Permissions**:
```typescript
// Grant team access to specific dock
await ctx.db.insert("dockPermissions", {
  dockId: "dock_123",
  teamId: "team_456",
  clientId: undefined,  // Not for clients
})

// Query docks accessible to team
const permissions = await ctx.db
  .query("dockPermissions")
  .withIndex("by_teamId", q => q.eq("teamId", teamId))
  .collect()
```

**Client Portal**:
- Clients only see docks granted via `dockPermissions`
- Clients only see resources from those docks
- Read-only by default

---

## Dock Adapter Pattern

### The Interface

**Every dock adapter implements**:
```typescript
// convex/docks/_types.ts
export interface DockAdapter {
  provider: string
  
  // Validate credentials (called before saving)
  validateCredentials(apiKey: string): Promise<boolean>
  
  // Sync resources to universal tables
  syncWebServices(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>
  syncServers(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>
  syncDomains(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>
  
  // Future: Mutations (optional)
  restartServer?(ctx: MutationCtx, serverId: string): Promise<void>
  deploySite?(ctx: MutationCtx, siteId: string): Promise<void>
}
```

### Example: GridPane Adapter

```typescript
// convex/docks/adapters/gridpane.ts
export async function syncWebServices(ctx: MutationCtx, dock: Doc<"docks">) {
  // 1. Decrypt API key (server-side only)
  const apiKey = await decryptApiKey(dock.encryptedApiKey)
  
  // 2. Call provider API
  const response = await fetch('https://my.gridpane.com/oauth/api/v1/sites', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  const { data: sites } = await response.json()
  
  // 3. Translate to universal schema
  for (const site of sites) {
    const existing = await ctx.db
      .query("webServices")
      .withIndex("by_dockId", q => q.eq("dockId", dock._id))
      .filter(q => q.eq(q.field("providerResourceId"), site.id.toString()))
      .first()
    
    const serviceData = {
      orgId: dock.orgId,
      dockId: dock._id,
      
      // Universal fields
      provider: "gridpane",
      providerResourceId: site.id.toString(),
      name: site.name,
      productionUrl: site.primary_domain || site.name,
      status: site.status || "unknown",
      gitRepo: site.git_repo,
      
      // Provider-specific data
      fullApiData: site,  // phpVersion, backups, etc.
    }
    
    // 4. Upsert (update or insert)
    if (existing) {
      await ctx.db.patch(existing._id, serviceData)
    } else {
      await ctx.db.insert("webServices", serviceData)
    }
  }
}
```

### Translation Rules

| Provider Field | Universal Field | Notes |
|----------------|-----------------|-------|
| GridPane `site.name` | `name` | Direct mapping |
| GridPane `site.primary_domain` | `productionUrl` | GridPane-specific |
| Vercel `project.name` | `name` | Direct mapping |
| Vercel `${name}.vercel.app` | `productionUrl` | Computed |
| DO `droplet.name` | `name` | Direct mapping |
| DO `droplet.networks.v4[0].ip` | `ipAddress` | Nested field |

**The Adapter's Job**: Make provider API look like universal schema.

### Rate Limiting

**GridPane Example**:
- GET requests: 12/min per endpoint
- PUT requests: 2/min account-wide

**Implementation**:
```typescript
class GridPaneClient {
  private lastRequest: Record<string, number> = {}
  
  async fetch(endpoint: string) {
    const now = Date.now()
    const lastCall = this.lastRequest[endpoint] || 0
    const timeSinceLastCall = now - lastCall
    
    if (timeSinceLastCall < 5000) {  // 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000 - timeSinceLastCall))
    }
    
    this.lastRequest[endpoint] = Date.now()
    return fetch(`https://my.gridpane.com/oauth/api/v1${endpoint}`, ...)
  }
}
```

---

## Tech Stack

### Framework: TanStack Start

**Why TanStack Start**:
- Modern React framework (like Next.js but lighter)
- File-based routing
- Server Components
- TypeScript-first
- Flexibility (not opinionated like Next.js)

**Structure**:
```
apps/web/src/
├── routes/
│   ├── __root.tsx          # Root layout (providers)
│   ├── index.tsx           # Landing page
│   └── dashboard/
│       ├── _layout.tsx     # Dashboard layout (auth guard)
│       ├── index.tsx       # Dashboard home
│       ├── docks/
│       ├── projects/
│       └── infrastructure/
├── router.tsx              # Router setup
└── components/             # React components
```

### Database: Convex

**Why Convex**:
- Real-time subscriptions (live sync updates)
- TypeScript-first (generated types)
- Built-in auth integration
- Serverless (no infra management)
- Scheduler (for periodic sync jobs)

**Schema = Source of Truth**:
- `schema.ts` defines entire data model
- Types auto-generated
- Queries/mutations type-safe

### Auth: Clerk

**Why Clerk**:
- Organizations built-in (multi-tenancy)
- MFA support
- Webhooks for user sync
- Session management
- Enterprise-ready

**Integration**:
```typescript
// Clerk JWT → Convex identity
const identity = await ctx.auth.getUserIdentity()
// identity.subject = Clerk user ID
```

### State Management

**TanStack Query v5**:
- Server state caching
- Optimistic updates
- Background refetching
- Automatic cache invalidation

**XState v5**:
- Complex workflows (dock connection, sync flows)
- State machine visualization
- Predictable state transitions

### UI: shadcn/ui + Tailwind 4

**shadcn/ui**: Copy/paste components (ownership model)
**Tailwind 4**: Utility-first CSS (v4 has new features)

**Custom Registry** (future):
```bash
npx stackdock add server-health-widget
# Copies from StackDock registry, not shadcn
```

---

## Monorepo Structure

```
stackdock/
├── .cursorrules                  # AI assistant rules
├── package.json                  # Root package.json (npm workspaces)
├── package-lock.json             # npm lockfile
├── turbo.json                    # Turborepo config (optional)
│
├── apps/
│   ├── web/                      # Main TanStack Start app
│   │   ├── app/
│   │   │   ├── routes/           # File-based routing
│   │   │   ├── components/       # React components
│   │   │   └── lib/              # Client utilities
│   │   ├── public/               # Static assets
│   │   ├── package.json
│   │   └── app.config.ts         # TanStack Start config
│   │
│   └── docs/                     # Documentation site (future)
│       ├── pages/
│       └── package.json
│
├── packages/
│   ├── docks/                    # Dock adapter registry
│   │   ├── gridpane/
│   │   │   ├── adapter.ts
│   │   │   ├── api.ts
│   │   │   ├── README.md
│   │   │   └── package.json
│   │   ├── vercel/
│   │   ├── digitalocean/
│   │   └── registry.json         # Registry manifest
│   │
│   ├── ui/                       # UI component registry
│   │   ├── components/
│   │   │   ├── server-health-widget/
│   │   │   ├── deployment-timeline/
│   │   │   └── domain-status-card/
│   │   └── registry.json
│   │
│   └── shared/                   # Shared utilities
│       ├── types/                # Shared TypeScript types
│       ├── utils/                # Shared functions
│       └── package.json
│
├── convex/                       # Convex backend (shared across apps)
│   ├── schema.ts                 # Data model (source of truth)
│   ├── auth.config.ts            # Clerk integration
│   ├── lib/
│   │   ├── rbac.ts               # RBAC middleware
│   │   ├── encryption.ts         # Encryption functions
│   │   └── audit.ts              # Audit logging
│   ├── users.ts
│   ├── organizations.ts
│   ├── docks/
│   │   ├── mutations.ts
│   │   ├── queries.ts
│   │   ├── sync.ts               # Sync orchestration
│   │   └── adapters/             # Import from packages/docks
│   ├── resources/
│   │   ├── servers.ts
│   │   ├── webServices.ts
│   │   └── domains.ts
│   └── projects/
│
├── docs/                         # Architecture & guides
│   ├── ARCHITECTURE.md           # This file
│   ├── CONTRIBUTING.md           # Development workflow
│   ├── DOCK_ADAPTER_GUIDE.md     # How to build adapters
│   ├── REGISTRY_GUIDE.md         # How to publish to registry
│   ├── SECURITY.md               # Security patterns
│   ├── RBAC.md                   # RBAC documentation
│   └── adapters/
│       ├── gridpane.md
│       ├── vercel.md
│       └── template.md           # Adapter template
│
└── scripts/
    ├── generate-encryption-key.js
    └── setup-dev.sh
```

### Workspace Management

**Root package.json (excerpt)**:
```json
{
  "name": "stackdock",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspace=apps/web",
    "dev:convex": "npx convex dev",
    "build": "npm run build --workspaces",
    "lint": "npm run lint --workspaces",
    "type-check": "npm run type-check --workspaces",
    "test": "npm run test --workspaces",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
  },
  "packageManager": "npm@10.0.0"
}
```

**Workspace installs** are handled via `npm install <pkg> --workspace apps/web` (or another workspace path), keeping the repo on npm end-to-end.

---

## Next Steps

1. **Read CONTRIBUTING.md**: Development workflow
2. **Read DOCK_ADAPTER_GUIDE.md**: Build your first adapter
3. **Read SECURITY.md**: Security patterns
4. **Read RBAC.md**: Permission system details

---

**Remember**: This is infrastructure's WordPress moment. Every decision matters.
