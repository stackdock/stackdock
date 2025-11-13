# Mission 7: DigitalOcean Adapter - Convex Agent Prompt

**Date**: November 12, 2025  
**Mission**: Mission 7 - Read-Only Infrastructure MVP  
**Provider**: DigitalOcean (IaaS Provider)  
**Agent**: Convex Agent (Backend)  
**Priority**: High

---

## 🎯 Task

Implement DigitalOcean adapter following the Vultr adapter pattern. DigitalOcean is an IaaS provider - droplets map to universal `servers` table.

**Focus**: **Droplets only** - Just sync droplets to `servers` table. No databases, webServices, or domains for now.

**Note**: Follows Vultr pattern - second IaaS provider, establishes consistency for AWS, GCP, Azure.

---

## 📋 API Structure

**Base URL**: `https://api.digitalocean.com/v2`

**Endpoints for read-only MVP:**
1. `GET /account` - Validate credentials, get account info
2. `GET /droplets` - List all droplets (servers)

**Authentication**: Single API token (Bearer token in `Authorization` header)

**Flow**:
1. Validate credentials → `GET /account`
2. List droplets → `GET /droplets`

**Reference**: 
- `docks/digitalocean/api-routes.md` for API documentation
- `docks/digitalocean/getDroplets.json` ✅ (real API response - use this for types)

---

## 🔄 Field Mapping

### DigitalOcean Droplet → Universal `servers` table

| Universal Field | DigitalOcean Field | Mapping Logic |
|----------------|-------------------|---------------|
| `providerResourceId` | `droplet.id.toString()` | Unique identifier (convert number to string) |
| `name` | `droplet.name` | Droplet name |
| `status` | **Derived** | See status mapping below |
| `region` | `droplet.region.slug` | Region slug (e.g., "atl1") |
| `instanceType` | `droplet.size.slug` | Size slug (e.g., "s-1vcpu-1gb-amd") |
| `ipAddress` | `droplet.networks.v4[0].ip_address` | First public IPv4 address |
| `fullApiData` | **Entire object** | Store complete droplet data |

**Status mapping function:**
```typescript
function mapDigitalOceanStatus(droplet: DigitalOceanDroplet): string {
  // DigitalOcean status values: "active", "off", "archive", "new"
  // Map to universal status: running, stopped, pending, archived
  const statusMap: Record<string, string> = {
    active: "running",
    off: "stopped",
    archive: "archived",
    new: "pending",
  }
  return statusMap[droplet.status?.toLowerCase()] || droplet.status?.toLowerCase() || "unknown"
}
```

**IP Address extraction:**
```typescript
// Get first public IPv4 address
const publicIp = droplet.networks.v4.find(net => net.type === "public")?.ip_address || ""
```

---

## 📝 Implementation Tasks

### Task 1: Create DigitalOcean Types

**File**: `convex/docks/adapters/digitalocean/types.ts`

**Create interfaces:**

```typescript
/**
 * DigitalOcean API Types
 * 
 * Generated from DigitalOcean API v2 documentation
 * 
 * @see https://docs.digitalocean.com/reference/api/api-reference/
 * @see docks/digitalocean/api-routes.md
 * @see docks/digitalocean/getDroplets.json for actual API response
 */

/**
 * DigitalOcean Droplet (Server)
 * Maps to universal `servers` table
 * 
 * @see docks/digitalocean/getDroplets.json for actual API response
 */
export interface DigitalOceanDroplet {
  id: number // Droplet ID (number, not string)
  name: string // Droplet name
  memory: number // RAM in MB
  vcpus: number // CPU count
  disk: number // Disk in GB
  disk_info: Array<{
    type: string
    size: {
      amount: number
      unit: string
    }
  }>
  locked: boolean // Locked flag
  status: string // "active", "off", "archive", "new"
  kernel: any | null // Kernel info
  created_at: string // ISO 8601 timestamp
  features: string[] // Features array (e.g., ["monitoring", "droplet_agent"])
  backup_ids: number[] // Backup IDs
  next_backup_window: any | null // Next backup window
  snapshot_ids: number[] // Snapshot IDs
  image: {
    id: number
    name: string
    distribution: string
    slug: string
    public: boolean
    regions: string[]
    created_at: string
    min_disk_size: number
    type: string
    size_gigabytes: number
    description: string
    tags: string[]
    status: string
  }
  volume_ids: string[] // Volume IDs
  size: {
    slug: string // Size slug (e.g., "s-1vcpu-1gb-amd")
    memory: number
    vcpus: number
    disk: number
    transfer: number
    price_monthly: number
    price_hourly: number
    regions: string[]
    available: boolean
    description: string
    networking_throughput: number
    disk_info: Array<{
      type: string
      size: {
        amount: number
        unit: string
      }
    }>
  }
  size_slug: string // Size slug (duplicate of size.slug)
  networks: {
    v4: Array<{
      ip_address: string
      netmask: string
      gateway: string
      type: "public" | "private"
    }>
    v6: Array<{
      ip_address: string
      netmask: number
      gateway: string
      type: "public" | "private"
    }>
  }
  region: {
    name: string // Region name (e.g., "Atlanta 1")
    slug: string // Region slug (e.g., "atl1")
    features: string[]
    available: boolean
    sizes: string[] // Available sizes
  }
  tags: string[] // Tags array
  vpc_uuid: string // VPC UUID
}

/**
 * DigitalOcean Account
 * Used for credential validation
 */
export interface DigitalOceanAccount {
  account: {
    droplet_limit: number
    floating_ip_limit: number
    volume_limit: number
    email: string
    uuid: string
    email_verified: boolean
    status: string
    status_message: string
  }
}
```

**Reference**: `convex/docks/adapters/vultr/types.ts` for pattern

---

### Task 2: Create DigitalOcean API Client

**File**: `convex/docks/adapters/digitalocean/api.ts`

**Create API client class:**

```typescript
/**
 * DigitalOcean API Client
 * 
 * Handles all HTTP requests to DigitalOcean API v2
 * 
 * @see https://docs.digitalocean.com/reference/api/api-reference/
 * @see docks/digitalocean/api-routes.md
 */

import type { DigitalOceanDroplet, DigitalOceanAccount } from "./types"

export class DigitalOceanAPI {
  private baseUrl: string
  private apiToken: string

  constructor(apiToken: string, baseUrl: string = "https://api.digitalocean.com/v2") {
    this.apiToken = apiToken.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to DigitalOcean API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(
        `DigitalOcean API error (${response.status}): ${errorText}`
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
      console.log(`[DigitalOcean] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[DigitalOcean] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[DigitalOcean] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[DigitalOcean] API error (${response.status}): ${errorText}`)
        throw new Error(
          `DigitalOcean API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[DigitalOcean] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[DigitalOcean] Validation error:`, error)
      if (error instanceof Error) {
        throw new Error(
          `Failed to validate DigitalOcean credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all droplets
   * Returns array of droplets (servers)
   * 
   * @see docks/digitalocean/getDroplets.json for actual API response
   */
  async listDroplets(): Promise<DigitalOceanDroplet[]> {
    const response = await this.request<{
      droplets: DigitalOceanDroplet[]
      links: Record<string, any>
      meta: {
        total: number
      }
    }>("/droplets")
    // Response format: { droplets: [...], links: {}, meta: { total: number } }
    return response.droplets || []
  }

  /**
   * Get account information
   * Used for credential validation
   */
  async getAccount(): Promise<DigitalOceanAccount> {
    return await this.request<DigitalOceanAccount>("/account")
  }
}
```

**Reference**: `convex/docks/adapters/vultr/api.ts` for pattern

---

### Task 3: Create DigitalOcean Adapter

**File**: `convex/docks/adapters/digitalocean/adapter.ts`

**Create adapter implementation:**

```typescript
/**
 * DigitalOcean Dock Adapter
 * 
 * Translates DigitalOcean API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /account → validateCredentials()
 * - GET /droplets → syncServers()
 * 
 * @see https://docs.digitalocean.com/reference/api/api-reference/
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { DigitalOceanAPI } from "./api"
import type { DigitalOceanDroplet } from "./types"

/**
 * Map DigitalOcean droplet status to universal status
 * 
 * Uses status field
 * Priority order:
 * 1. status === "active" → "running"
 * 2. status === "off" → "stopped"
 * 3. status === "archive" → "archived"
 * 4. status === "new" → "pending"
 * 5. else → use status as-is
 * 
 * @see docks/digitalocean/getDroplets.json - status is "active" in example
 */
function mapDigitalOceanStatus(droplet: DigitalOceanDroplet): string {
  const statusMap: Record<string, string> = {
    active: "running",
    off: "stopped",
    archive: "archived",
    new: "pending",
  }
  
  const status = droplet.status?.toLowerCase()
  return statusMap[status] || status || "unknown"
}

/**
 * Extract public IPv4 address from droplet networks
 */
function getPublicIp(droplet: DigitalOceanDroplet): string {
  const publicNetwork = droplet.networks.v4.find(net => net.type === "public")
  return publicNetwork?.ip_address || ""
}

export const digitaloceanAdapter: DockAdapter = {
  provider: "digitalocean",

  /**
   * Validate DigitalOcean API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new DigitalOceanAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("DigitalOcean credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync DigitalOcean droplets to universal `servers` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each droplet, upsert into `servers` table
   * 4. Map status using priority order
   * 5. Store all DigitalOcean fields in fullApiData
   */
  async syncServers(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: DigitalOceanDroplet[]
  ): Promise<void> {
    let droplets: DigitalOceanDroplet[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      droplets = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new DigitalOceanAPI(apiKey)
      droplets = await api.listDroplets()
    }

    // Sync each droplet to universal table
    for (const droplet of droplets) {
      // Convert droplet.id (number) to string for providerResourceId
      const providerResourceId = droplet.id.toString()

      const existing = await ctx.db
        .query("servers")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const serverData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "digitalocean",
        providerResourceId,
        name: droplet.name,
        status: mapDigitalOceanStatus(droplet),
        region: droplet.region.slug,
        instanceType: droplet.size.slug || droplet.size_slug,
        ipAddress: getPublicIp(droplet),
        fullApiData: {
          // Store all DigitalOcean fields
          droplet: {
            // Include all fields from API response
            ...droplet,
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

**Reference**: `convex/docks/adapters/vultr/adapter.ts` for pattern

---

### Task 4: Create Index File

**File**: `convex/docks/adapters/digitalocean/index.ts`

```typescript
/**
 * DigitalOcean Adapter Export
 */
export { digitaloceanAdapter } from "./adapter"
export { DigitalOceanAPI } from "./api"
export * from "./types"
```

---

### Task 5: Update Actions - syncDockResources

**File**: `convex/docks/actions.ts`

**Add DigitalOcean case in `syncDockResources` action:**

```typescript
// At top of file, add import:
import { DigitalOceanAPI } from "./adapters/digitalocean/api"

// In syncDockResources action handler, add else if block:
else if (args.provider === "digitalocean") {
  const api = new DigitalOceanAPI(args.apiKey)

  if (args.resourceTypes.includes("servers")) {
    console.log(`[Dock Action] Fetching droplets for ${args.provider}`)
    const droplets = await api.listDroplets()
    servers = droplets
  }

  // DigitalOcean doesn't support databases, webServices, or domains
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

**Add DigitalOcean case in `validateCredentials` action:**

```typescript
// In validateCredentials action handler, add else if block:
else if (args.provider === "digitalocean") {
  const api = new DigitalOceanAPI(args.apiKey)
  return await api.validateCredentials()
}
```

**Reference**: See `convex/docks/actions.ts` lines 24-48 for pattern

---

### Task 7: Register Adapter

**File**: `convex/docks/registry.ts`

**Add import:**
```typescript
import { digitaloceanAdapter } from "./adapters/digitalocean"
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
  vultr: vultrAdapter,
  digitalocean: digitaloceanAdapter,  // NEW
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
  vultr: { displayName: "Vultr" },
  digitalocean: { displayName: "DigitalOcean" },  // NEW
}
```

---

## ✅ Testing Checklist

- [ ] DigitalOcean API client authenticates correctly
- [ ] `listDroplets()` returns droplets
- [ ] `validateCredentials()` works for valid/invalid tokens
- [ ] Adapter maps status correctly (active → running, off → stopped, etc.)
- [ ] Adapter extracts public IP from networks.v4 array
- [ ] Adapter converts droplet.id (number) to string for providerResourceId
- [ ] Adapter stores droplet data in `fullApiData`
- [ ] Droplets sync to universal `servers` table
- [ ] Provider appears in `listAvailableProviders` query
- [ ] No TypeScript errors
- [ ] Convex functions deploy successfully

---

## 📁 File Structure

```
convex/docks/adapters/digitalocean/
├── types.ts          # DigitalOcean API types
├── api.ts            # DigitalOceanAPI class (HTTP client)
├── adapter.ts        # digitaloceanAdapter (maps to universal schema)
└── index.ts          # Exports

docks/digitalocean/
├── api-routes.md     # API documentation
└── getDroplets.json  # Real API response ✅
```

---

## 🔗 Reference Files

**Pattern References:**
- `convex/docks/adapters/vultr/types.ts` - Types pattern (servers)
- `convex/docks/adapters/vultr/api.ts` - API client pattern
- `convex/docks/adapters/vultr/adapter.ts` - Adapter pattern (servers)

**API Response Examples:**
- `docks/digitalocean/getDroplets.json` ✅ (real API response)

**API Documentation:**
- `docks/digitalocean/api-routes.md`
- https://docs.digitalocean.com/reference/api/api-reference/

---

## 📝 Notes

- **One dock per account**: Each DigitalOcean account should have its own dock entry
- **Droplets → Servers**: DigitalOcean droplets map to universal `servers` table
- **Status**: Uses `status` field (not `power_status` like Vultr) - "active" → "running", "off" → "stopped"
- **IP Address**: Extract from `networks.v4` array, find first `type === "public"`
- **ID Conversion**: `droplet.id` is a number, convert to string for `providerResourceId`
- **Simple Auth**: Single API token, Bearer token format
- **Response Format**: `{ droplets: [...], links: {}, meta: { total: number } }` - extract `droplets` array

---

**Ready for implementation**: Pattern established, API documented, tasks clear. Follow Vultr adapter pattern exactly (servers mapping).
