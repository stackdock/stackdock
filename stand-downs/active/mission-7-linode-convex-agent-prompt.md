# Mission 7: Linode Adapter - Convex Agent Prompt

**Date**: November 12, 2025  
**Mission**: Mission 7 - Read-Only Infrastructure MVP  
**Provider**: Linode (IaaS Provider)  
**Agent**: Convex Agent (Backend)  
**Priority**: High

---

## 🎯 Task

Implement Linode adapter following the Vultr/DigitalOcean adapter pattern. Linode is an IaaS provider - linodes (instances) map to universal `servers` table.

**Focus**: **Linodes only** - Just sync linodes to `servers` table. No databases, webServices, or domains for now.

**Note**: Follows Vultr/DigitalOcean pattern - third simple auth IaaS provider, maintains consistency before moving to AWS/GCP/Azure.

---

## 📋 API Structure

**Base URL**: `https://api.linode.com/v4`

**Endpoints for read-only MVP:**
1. `GET /account` - Validate credentials, get account info
2. `GET /linode/instances` - List all linodes (servers)

**Authentication**: Single API token (Bearer token in `Authorization` header)

**Flow**:
1. Validate credentials → `GET /account`
2. List linodes → `GET /linode/instances`

**Reference**: 
- `docks/linode/api-routes.md` for API documentation
- `docks/linode/getLinodes.json` ✅ (real API response - use this for types)

---

## 🔄 Field Mapping

### Linode Instance → Universal `servers` table

| Universal Field | Linode Field | Mapping Logic |
|----------------|-------------|---------------|
| `providerResourceId` | `linode.id.toString()` | Unique identifier (convert number to string) |
| `name` | `linode.label` | Linode label/name |
| `status` | **Direct** | `linode.status` (already matches: "running", "stopped", etc.) |
| `region` | `linode.region` | Region code (e.g., "us-central") |
| `instanceType` | `linode.type` | Type slug (e.g., "g6-nanode-1") |
| `ipAddress` | `linode.ipv4[0]` | First IPv4 address from array |
| `fullApiData` | **Entire object** | Store complete linode data |

**Status mapping function:**
```typescript
function mapLinodeStatus(linode: LinodeInstance): string {
  // Linode status values: "running", "stopped", "offline", "booting", "rebooting", "shutting_down", "provisioning", "deleting", "migrating", "rebuilding", "cloning", "restoring"
  // Most map directly to universal status
  const statusMap: Record<string, string> = {
    running: "running",
    stopped: "stopped",
    offline: "stopped",
    booting: "pending",
    rebooting: "pending",
    shutting_down: "pending",
    provisioning: "pending",
    deleting: "pending",
    migrating: "pending",
    rebuilding: "pending",
    cloning: "pending",
    restoring: "pending",
  }
  return statusMap[linode.status?.toLowerCase()] || linode.status?.toLowerCase() || "unknown"
}
```

**IP Address extraction:**
```typescript
// Get first IPv4 address from array
const publicIp = linode.ipv4?.[0] || ""
```

---

## 📝 Implementation Tasks

### Task 1: Create Linode Types

**File**: `convex/docks/adapters/linode/types.ts`

**Create interfaces:**

```typescript
/**
 * Linode API Types
 * 
 * Generated from Linode API v4 documentation
 * 
 * @see https://www.linode.com/api/v4
 * @see docks/linode/api-routes.md
 * @see docks/linode/getLinodes.json for actual API response
 */

/**
 * Linode Instance (Server)
 * Maps to universal `servers` table
 * 
 * @see docks/linode/getLinodes.json for actual API response
 */
export interface LinodeInstance {
  id: number // Linode ID (number, convert to string)
  label: string // Linode label/name
  group: string // Group (empty string if not set)
  status: string // "running", "stopped", "offline", "booting", etc.
  created: string // ISO 8601 timestamp
  updated: string // ISO 8601 timestamp
  type: string // Type slug (e.g., "g6-nanode-1")
  ipv4: string[] // Array of IPv4 addresses
  ipv6: string | null // IPv6 address (CIDR format)
  image: string // Image slug (e.g., "linode/ubuntu24.04")
  region: string // Region code (e.g., "us-central")
  site_type: string // Site type (e.g., "core")
  specs: {
    disk: number // Disk in MB
    memory: number // Memory in MB
    vcpus: number // CPU count
    gpus: number // GPU count
    transfer: number // Transfer quota in GB
    accelerated_devices: number // Accelerated devices count
  }
  alerts: {
    cpu: number // CPU alert threshold (%)
    network_in: number // Network in alert threshold (MB/s)
    network_out: number // Network out alert threshold (MB/s)
    transfer_quota: number // Transfer quota alert threshold (%)
    io: number // IO alert threshold (IOPS)
  }
  backups: {
    enabled: boolean // Backups enabled
    available: boolean // Backups available
    schedule: {
      day: string // Backup day
      window: string // Backup window
    }
    last_successful: string | null // Last successful backup timestamp
  }
  hypervisor: string // Hypervisor type (e.g., "kvm")
  watchdog_enabled: boolean // Watchdog enabled
  tags: string[] // Tags array
  host_uuid: string // Host UUID
  has_user_data: boolean // Has user data
  placement_group: any | null // Placement group
  disk_encryption: string // Disk encryption status (e.g., "enabled")
  lke_cluster_id: number | null // LKE cluster ID
  capabilities: string[] // Capabilities array
}

/**
 * Linode Account
 * Used for credential validation
 */
export interface LinodeAccount {
  email: string
  username: string
  first_name: string
  last_name: string
  company: string | null
  address_1: string
  address_2: string | null
  city: string
  state: string | null
  zip: string
  country: string
  phone: string | null
  tax_id: string | null
  balance: number
  balance_uninvoiced: number
  active_since: string
  capabilities: string[]
  euuid: string
}
```

**Reference**: `convex/docks/adapters/digitalocean/types.ts` for pattern

---

### Task 2: Create Linode API Client

**File**: `convex/docks/adapters/linode/api.ts`

**Create API client class:**

```typescript
/**
 * Linode API Client
 * 
 * Handles all HTTP requests to Linode API v4
 * 
 * @see https://www.linode.com/api/v4
 * @see docks/linode/api-routes.md
 */

import type { LinodeInstance, LinodeAccount } from "./types"

export class LinodeAPI {
  private baseUrl: string
  private apiToken: string

  constructor(apiToken: string, baseUrl: string = "https://api.linode.com/v4") {
    this.apiToken = apiToken.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Linode API
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
        `Linode API error (${response.status}): ${errorText}`
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
      console.log(`[Linode] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Linode] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Linode] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Linode] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Linode API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Linode] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Linode] Validation error:`, error)
      if (error instanceof Error) {
        throw new Error(
          `Failed to validate Linode credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all linodes
   * Returns array of linodes (servers)
   * 
   * @see docks/linode/getLinodes.json for actual API response
   */
  async listLinodes(): Promise<LinodeInstance[]> {
    const response = await this.request<{
      data: LinodeInstance[]
      page: number
      pages: number
      results: number
    }>("/linode/instances")
    // Response format: { data: [...], page: number, pages: number, results: number }
    return response.data || []
  }

  /**
   * Get account information
   * Used for credential validation
   */
  async getAccount(): Promise<LinodeAccount> {
    return await this.request<LinodeAccount>("/account")
  }
}
```

**Reference**: `convex/docks/adapters/digitalocean/api.ts` for pattern

---

### Task 3: Create Linode Adapter

**File**: `convex/docks/adapters/linode/adapter.ts`

**Create adapter implementation:**

```typescript
/**
 * Linode Dock Adapter
 * 
 * Translates Linode API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /account → validateCredentials()
 * - GET /linode/instances → syncServers()
 * 
 * @see https://www.linode.com/api/v4
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { LinodeAPI } from "./api"
import type { LinodeInstance } from "./types"

/**
 * Map Linode instance status to universal status
 * 
 * Uses status field directly (most values map 1:1)
 * Priority order:
 * 1. status === "running" → "running"
 * 2. status === "stopped" || "offline" → "stopped"
 * 3. status === "booting" || "rebooting" || "provisioning" || etc. → "pending"
 * 4. else → use status as-is
 * 
 * @see docks/linode/getLinodes.json - status is "running" in example
 */
function mapLinodeStatus(linode: LinodeInstance): string {
  const statusMap: Record<string, string> = {
    running: "running",
    stopped: "stopped",
    offline: "stopped",
    booting: "pending",
    rebooting: "pending",
    shutting_down: "pending",
    provisioning: "pending",
    deleting: "pending",
    migrating: "pending",
    rebuilding: "pending",
    cloning: "pending",
    restoring: "pending",
  }
  
  const status = linode.status?.toLowerCase()
  return statusMap[status] || status || "unknown"
}

/**
 * Extract first public IPv4 address from linode ipv4 array
 */
function getPublicIp(linode: LinodeInstance): string {
  return linode.ipv4?.[0] || ""
}

export const linodeAdapter: DockAdapter = {
  provider: "linode",

  /**
   * Validate Linode API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new LinodeAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("Linode credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync Linode instances to universal `servers` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each linode, upsert into `servers` table
   * 4. Map status using priority order
   * 5. Store all Linode fields in fullApiData
   */
  async syncServers(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: LinodeInstance[]
  ): Promise<void> {
    let linodes: LinodeInstance[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      linodes = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new LinodeAPI(apiKey)
      linodes = await api.listLinodes()
    }

    // Sync each linode to universal table
    for (const linode of linodes) {
      // Convert linode.id (number) to string for providerResourceId
      const providerResourceId = linode.id.toString()

      const existing = await ctx.db
        .query("servers")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const serverData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "linode",
        providerResourceId,
        name: linode.label,
        status: mapLinodeStatus(linode),
        region: linode.region,
        instanceType: linode.type,
        ipAddress: getPublicIp(linode),
        fullApiData: {
          // Store all Linode fields
          linode: {
            // Include all fields from API response
            ...linode,
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

**Reference**: `convex/docks/adapters/digitalocean/adapter.ts` for pattern

---

### Task 4: Create Index File

**File**: `convex/docks/adapters/linode/index.ts`

```typescript
/**
 * Linode Adapter Export
 */
export { linodeAdapter } from "./adapter"
export { LinodeAPI } from "./api"
export * from "./types"
```

---

### Task 5: Update Actions - syncDockResources

**File**: `convex/docks/actions.ts`

**Add Linode case in `syncDockResources` action:**

```typescript
// At top of file, add import:
import { LinodeAPI } from "./adapters/linode/api"

// In syncDockResources action handler, add else if block:
else if (args.provider === "linode") {
  const api = new LinodeAPI(args.apiKey)

  if (args.resourceTypes.includes("servers")) {
    console.log(`[Dock Action] Fetching linodes for ${args.provider}`)
    const linodes = await api.listLinodes()
    servers = linodes
  }

  // Linode doesn't support databases, webServices, or domains
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

**Add Linode case in `validateCredentials` action:**

```typescript
// In validateCredentials action handler, add else if block:
else if (args.provider === "linode") {
  const api = new LinodeAPI(args.apiKey)
  return await api.validateCredentials()
}
```

**Reference**: See `convex/docks/actions.ts` lines 24-48 for pattern

---

### Task 7: Register Adapter

**File**: `convex/docks/registry.ts`

**Add import:**
```typescript
import { linodeAdapter } from "./adapters/linode"
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
  digitalocean: digitaloceanAdapter,
  linode: linodeAdapter,  // NEW
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
  digitalocean: { displayName: "DigitalOcean" },
  linode: { displayName: "Linode" },  // NEW
}
```

---

## ✅ Testing Checklist

- [ ] Linode API client authenticates correctly
- [ ] `listLinodes()` returns linodes
- [ ] `validateCredentials()` works for valid/invalid tokens
- [ ] Adapter maps status correctly (running → running, stopped → stopped, etc.)
- [ ] Adapter extracts first IPv4 from ipv4 array
- [ ] Adapter converts linode.id (number) to string for providerResourceId
- [ ] Adapter stores linode data in `fullApiData`
- [ ] Linodes sync to universal `servers` table
- [ ] Provider appears in `listAvailableProviders` query
- [ ] No TypeScript errors
- [ ] Convex functions deploy successfully

---

## 📁 File Structure

```
convex/docks/adapters/linode/
├── types.ts          # Linode API types
├── api.ts            # LinodeAPI class (HTTP client)
├── adapter.ts        # linodeAdapter (maps to universal schema)
└── index.ts          # Exports

docks/linode/
├── api-routes.md     # API documentation
└── getLinodes.json   # Real API response ✅
```

---

## 🔗 Reference Files

**Pattern References:**
- `convex/docks/adapters/vultr/types.ts` - Types pattern (servers)
- `convex/docks/adapters/vultr/api.ts` - API client pattern
- `convex/docks/adapters/vultr/adapter.ts` - Adapter pattern (servers)
- `convex/docks/adapters/digitalocean/adapter.ts` - Similar pattern

**API Response Examples:**
- `docks/linode/getLinodes.json` ✅ (real API response)

**API Documentation:**
- `docks/linode/api-routes.md`
- https://www.linode.com/api/v4

---

## 📝 Notes

- **One dock per account**: Each Linode account should have its own dock entry
- **Linodes → Servers**: Linode instances map to universal `servers` table
- **Status**: Uses `status` field directly (most values map 1:1) - "running" → "running", "stopped" → "stopped"
- **IP Address**: Extract first element from `ipv4` array (array of strings)
- **ID Conversion**: `linode.id` is a number, convert to string for `providerResourceId`
- **Simple Auth**: Single API token, Bearer token format
- **Response Format**: `{ data: [...], page: number, pages: number, results: number }` - extract `data` array
- **API Version**: Uses v4 (not v2 like DigitalOcean)

---

**Ready for implementation**: Pattern established, API documented, tasks clear. Follow Vultr/DigitalOcean adapter pattern exactly (servers mapping).
