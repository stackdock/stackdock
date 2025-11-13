# Mission 7: Vultr Adapter - Convex Agent Prompt

**Date**: November 12, 2025  
**Mission**: Mission 7 - Read-Only Infrastructure MVP  
**Provider**: Vultr (IaaS Provider)  
**Agent**: Convex Agent (Backend)  
**Priority**: High

---

## 🎯 Task

Implement Vultr adapter following the GridPane adapter pattern. Vultr is an IaaS provider - instances map to universal `servers` table.

**Focus**: **Instances only** - Just sync instances to `servers` table. No databases, webServices, or domains for now.

**Note**: This is the first IaaS provider - establishes pattern for DigitalOcean, AWS, GCP, Azure. All IaaS providers will focus on instances → servers mapping.

---

## 📋 API Structure

**Base URL**: `https://api.vultr.com/v2`

**Endpoints for read-only MVP:**
1. `GET /account` - Validate credentials, get account info
2. `GET /instances` - List all instances (servers)

**Authentication**: Single API key (Bearer token in `Authorization` header)

**Flow**:
1. Validate credentials → `GET /account`
2. List instances → `GET /instances`

**Reference**: 
- `docks/vultr/api-routes.md` for API documentation
- `docks/vultr/getInstances.json` ✅ (real API response - use this for types)

---

## 🔄 Field Mapping

### Vultr Instance → Universal `servers` table

| Universal Field | Vultr Field | Mapping Logic |
|----------------|------------|---------------|
| `providerResourceId` | `instance.id` | Unique identifier |
| `name` | `instance.label` or `instance.id` | Instance label or ID |
| `status` | **Derived** | See status mapping below |
| `region` | `instance.region` | Region code |
| `instanceType` | `instance.plan` | Plan ID |
| `ipAddress` | `instance.main_ip` | Primary IP address |
| `fullApiData` | **Entire object** | Store complete instance data |

**Status mapping function:**
```typescript
function mapVultrStatus(instance: VultrInstance): string {
  // Vultr power_status values: "running", "stopped", "pending", "resizing", "suspended"
  // Map to universal status: running, stopped, pending, error
  const statusMap: Record<string, string> = {
    running: "running",
    stopped: "stopped",
    pending: "pending",
    resizing: "pending",
    suspended: "stopped",
  }
  return statusMap[instance.power_status?.toLowerCase()] || instance.power_status?.toLowerCase() || "unknown"
}
```

---

## 📝 Implementation Tasks

### Task 1: Create Vultr Types

**File**: `convex/docks/adapters/vultr/types.ts`

**Create interfaces:**

```typescript
/**
 * Vultr API Types
 * 
 * Generated from Vultr API v2 documentation
 * 
 * @see https://docs.vultr.com/api/
 * @see docks/vultr/api-routes.md
 */

/**
 * Vultr Instance (Server)
 * Maps to universal `servers` table
 * 
 * @see docks/vultr/getInstances.json for actual API response
 */
export interface VultrInstance {
  id: string // Instance ID (UUID)
  os: string // OS name (e.g., "Ubuntu 24.04 LTS x64")
  ram: number // RAM in MB
  disk: number // Disk in GB
  main_ip: string // Primary IP address
  vcpu_count: number // CPU count
  region: string // Region code (e.g., "mia")
  plan: string // Plan ID (e.g., "vc2-1c-1gb")
  date_created: string // ISO 8601 timestamp
  status: string // Instance status (e.g., "active")
  allowed_bandwidth: number // Bandwidth in GB
  netmask_v4: string // IPv4 netmask
  gateway_v4: string // IPv4 gateway
  power_status: string // "running", "stopped", "pending", "resizing", "suspended"
  server_status: string // "ok", "locked", "installing", etc.
  v6_network: string // IPv6 network (empty string if not set)
  v6_main_ip: string // IPv6 main IP (empty string if not set)
  v6_network_size: number // IPv6 network size
  label: string // Instance label/name
  hostname: string // Hostname
  internal_ip: string // Internal IP (empty string if not set)
  vpcs: string[] // VPC IDs array
  kvm: string // KVM URL
  tag: string // Single tag (empty string if not set)
  tags: string[] // Tags array
  os_id: number // OS ID
  app_id: number // App ID (0 if not set)
  image_id: string // Image ID (empty string if not set)
  snapshot_id: string // Snapshot ID (empty string if not set)
  firewall_group_id: string // Firewall group ID (empty string if not set)
  vpc_only: boolean // VPC only flag
  features: string[] // Features array
  user_scheme: string // User scheme (e.g., "limited")
}

/**
 * Vultr Account
 * Used for credential validation
 */
export interface VultrAccount {
  account: {
    balance: number
    pending_charges: number
    last_payment_date: string | null
    last_payment_amount: number | null
  }
  name: string
  email: string
  acls: string[]
}
```

**Reference**: `convex/docks/adapters/gridpane/types.ts` for pattern

---

### Task 2: Create Vultr API Client

**File**: `convex/docks/adapters/vultr/api.ts`

**Create API client class:**

```typescript
/**
 * Vultr API Client
 * 
 * Handles all HTTP requests to Vultr API v2
 * 
 * @see https://docs.vultr.com/api/
 * @see docks/vultr/api-routes.md
 */

import type { VultrInstance, VultrAccount } from "./types"

export class VultrAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://api.vultr.com/v2") {
    this.apiKey = apiKey.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Vultr API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(
        `Vultr API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /account endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/account`
      console.log(`[Vultr] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Vultr] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Vultr] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Vultr] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Vultr API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Vultr] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Vultr] Validation error:`, error)
      if (error instanceof Error) {
        throw new Error(
          `Failed to validate Vultr credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all instances
   * Returns array of instances (servers)
   * 
   * @see docks/vultr/getInstances.json for actual API response
   */
  async listInstances(): Promise<VultrInstance[]> {
    const response = await this.request<{
      instances: VultrInstance[]
      meta: {
        total: number
        links: {
          next: string
          prev: string
        }
      }
    }>("/instances")
    // Response format: { instances: [...], meta: {...} }
    return response.instances || []
  }

  /**
   * Get account information
   * Used for credential validation
   */
  async getAccount(): Promise<VultrAccount> {
    return await this.request<VultrAccount>("/account")
  }
}
```

**Reference**: `convex/docks/adapters/gridpane/api.ts` for pattern

---

### Task 3: Create Vultr Adapter

**File**: `convex/docks/adapters/vultr/adapter.ts`

**Create adapter implementation:**

```typescript
/**
 * Vultr Dock Adapter
 * 
 * Translates Vultr API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /account → validateCredentials()
 * - GET /instances → syncServers()
 * 
 * @see https://docs.vultr.com/api/
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { VultrAPI } from "./api"
import type { VultrInstance } from "./types"

/**
 * Map Vultr instance status to universal status
 * 
 * Uses power_status field (not status field)
 * Priority order:
 * 1. power_status === "running" → "running"
 * 2. power_status === "pending" || "resizing" → "pending"
 * 3. power_status === "stopped" || "suspended" → "stopped"
 * 4. else → use power_status as-is
 * 
 * @see docks/vultr/getInstances.json - power_status is "running" in example
 */
function mapVultrStatus(instance: VultrInstance): string {
  const statusMap: Record<string, string> = {
    running: "running",
    pending: "pending",
    resizing: "pending",
    stopped: "stopped",
    suspended: "stopped",
  }
  
  const powerStatus = instance.power_status?.toLowerCase()
  return statusMap[powerStatus] || powerStatus || "unknown"
}

export const vultrAdapter: DockAdapter = {
  provider: "vultr",

  /**
   * Validate Vultr API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new VultrAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("Vultr credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync Vultr instances to universal `servers` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each instance, upsert into `servers` table
   * 4. Map status using priority order
   * 5. Store all Vultr fields in fullApiData
   */
  async syncServers(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: VultrInstance[]
  ): Promise<void> {
    let instances: VultrInstance[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      instances = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new VultrAPI(apiKey)
      instances = await api.listInstances()
    }

    // Sync each instance to universal table
    for (const instance of instances) {
      const providerResourceId = instance.id

      const existing = await ctx.db
        .query("servers")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const serverData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "vultr",
        providerResourceId,
        name: instance.label || instance.id,
        status: mapVultrStatus(instance),
        region: instance.region,
        instanceType: instance.plan,
        ipAddress: instance.main_ip,
        fullApiData: {
          // Store all Vultr fields
          instance: {
            // Include all fields from API response
            ...instance,
          },
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, serverData)
      } else {
        await ctx.db.insert("servers", serverData)
      }
    }
  },
}
```

**Reference**: `convex/docks/adapters/gridpane/adapter.ts` for pattern

---

### Task 4: Create Index File

**File**: `convex/docks/adapters/vultr/index.ts`

```typescript
/**
 * Vultr Adapter Export
 */
export { vultrAdapter } from "./adapter"
export { VultrAPI } from "./api"
export * from "./types"
```

---

### Task 5: Update Actions - syncDockResources

**File**: `convex/docks/actions.ts`

**Add Vultr case in `syncDockResources` action:**

```typescript
// At top of file, add import:
import { VultrAPI } from "./adapters/vultr/api"

// In syncDockResources action handler, add else if block:
else if (args.provider === "vultr") {
  const api = new VultrAPI(args.apiKey)

  if (args.resourceTypes.includes("servers")) {
    console.log(`[Dock Action] Fetching instances for ${args.provider}`)
    const instances = await api.listInstances()
    servers = instances
  }

  // Vultr doesn't support databases, webServices, or domains
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
}
```

**Reference**: See `convex/docks/actions.ts` for existing provider patterns

---

### Task 6: Update Actions - validateCredentials

**File**: `convex/docks/actions.ts`

**Add Vultr case in `validateCredentials` action:**

```typescript
// In validateCredentials action handler, add else if block:
else if (args.provider === "vultr") {
  const api = new VultrAPI(args.apiKey)
  return await api.validateCredentials()
}
```

**Reference**: See `convex/docks/actions.ts` lines 24-48 for pattern

---

### Task 7: Register Adapter

**File**: `convex/docks/registry.ts`

**Add import:**
```typescript
import { vultrAdapter } from "./adapters/vultr"
```

**Add to registry:**
```typescript
const adapterRegistry: Record<string, DockAdapter> = {
  gridpane: gridpaneAdapter,
  vercel: vercelAdapter,
  netlify: netlifyAdapter,
  cloudflare: cloudflareAdapter,
  turso: tursoAdapter,
  neon: neonAdapter,
  convex: convexAdapter,
  planetscale: planetscaleAdapter,
  vultr: vultrAdapter,  // NEW
}
```

**Add to metadata:**
```typescript
const providerMetadata: Record<string, { displayName: string }> = {
  gridpane: { displayName: "GridPane" },
  vercel: { displayName: "Vercel" },
  netlify: { displayName: "Netlify" },
  cloudflare: { displayName: "Cloudflare" },
  turso: { displayName: "Turso" },
  neon: { displayName: "Neon" },
  convex: { displayName: "Convex" },
  planetscale: { displayName: "PlanetScale" },
  vultr: { displayName: "Vultr" },  // NEW
}
```

---

## ✅ Testing Checklist

- [ ] Vultr API client authenticates correctly
- [ ] `listInstances()` returns instances
- [ ] `validateCredentials()` works for valid/invalid tokens
- [ ] Adapter maps status correctly (active → running, stopped → stopped, etc.)
- [ ] Adapter stores instance data in `fullApiData`
- [ ] Servers sync to universal `servers` table
- [ ] Provider appears in `listAvailableProviders` query
- [ ] No TypeScript errors
- [ ] Convex functions deploy successfully

---

## 📁 File Structure

```
convex/docks/adapters/vultr/
├── types.ts          # Vultr API types
├── api.ts            # VultrAPI class (HTTP client)
├── adapter.ts        # vultrAdapter (maps to universal schema)
└── index.ts          # Exports

docks/vultr/
└── api-routes.md     # API documentation
```

---

## 🔗 Reference Files

**Pattern References:**
- `convex/docks/adapters/gridpane/types.ts` - Types pattern (servers)
- `convex/docks/adapters/gridpane/api.ts` - API client pattern
- `convex/docks/adapters/gridpane/adapter.ts` - Adapter pattern (servers)

**API Response Examples:**
- `docks/vultr/getInstances.json` ✅ (real API response)

**API Documentation:**
- `docks/vultr/api-routes.md`
- https://docs.vultr.com/api/

---

## 📝 Notes

- **One dock per account**: Each Vultr account should have its own dock entry
- **Instances → Servers**: Vultr instances map to universal `servers` table
- **Status**: Uses `power_status` field (not `status` field) - "running" → "running", "stopped" → "stopped"
- **Simple Auth**: Single API key, Bearer token format
- **First IaaS**: Establishes pattern for DigitalOcean, AWS, GCP, Azure
- **Response Format**: `{ instances: [...], meta: {...} }` - extract `instances` array

---

**Ready for implementation**: Pattern established, API documented, tasks clear. Follow GridPane adapter pattern (servers mapping).
