# Mission 7: Turso Adapter Implementation - Convex Agent Guide

**Date**: November 12, 2025  
**Mission**: Mission 7 - Read-Only Infrastructure MVP  
**Provider**: Turso (Database Provider)  
**Agent**: Convex Agent (Backend)  
**Priority**: High

---

## 🎯 Objective

Implement Turso adapter following the established adapter pattern. Turso is a database provider, so we'll sync databases to the universal `databases` table.

---

## ✅ Decisions Confirmed

1. **One dock per org**: Each Turso organization gets its own dock entry
2. **Groups**: Store group name in `fullApiData.group` (NOT a separate resource)
3. **Regions**: Store `regions` and `primaryRegion` in `fullApiData` (metadata, not separate resource)
4. **Status mapping**: Priority order - `archived` → `sleeping` → `blocked` (if `block_reads` or `block_writes`) → `active`

---

## 📋 API Structure

**Base URL**: `https://api.turso.tech/v1`

**Endpoints for read-only MVP:**
- `GET /organizations` - List all orgs (returns `slug` needed for other calls)
- `GET /organizations/{slug}/databases` - List databases for an org
- `GET /organizations/{slug}/groups` - List groups (optional, for metadata)

**Authentication**: Single API token (Bearer token in `Authorization` header)

**Reference JSON files:**
- `docks/turso/org/listOrgs.json`
- `docks/turso/database/listDatabases.json`
- `docks/turso/group/listGroups.json`
- `docks/turso/api-routes.md`

---

## 🔄 Field Mapping

**Turso Database → Universal `databases` table:**

| Universal Field | Turso Field | Mapping Logic |
|----------------|-------------|---------------|
| `providerResourceId` | `DbId` | `"68e35d20-1039-4ca3-878f-0583234d76eb"` |
| `name` | `Name` | `"better-auth-test"` |
| `engine` | `"turso"` | Hardcoded (Turso uses SQLite) |
| `version` | `version` | `"tech-preview"` |
| `status` | **Derived** | See status mapping below |
| `fullApiData` | **Entire object** | Store all Turso fields + group name |

**Status mapping function:**
```typescript
function mapTursoStatus(db: TursoDatabase): string {
  if (db.archived) return "archived"
  if (db.sleeping) return "sleeping"
  if (db.block_reads || db.block_writes) return "blocked"
  return "active"
}
```

**Full API Data includes:**
- All original Turso fields (`Name`, `DbId`, `Hostname`, `regions`, `primaryRegion`, `type`, `version`, `group`, `sleeping`, `archived`, `block_reads`, `block_writes`, etc.)
- Group name from `group` field
- Regions array and primary region

---

## 📝 Implementation Tasks

### Task 1: Create Turso Types

**File**: `convex/docks/adapters/turso/types.ts`

**Create interfaces from JSON files:**

```typescript
/**
 * Turso API Types
 * 
 * Generated from actual API responses in docks/turso/
 * 
 * @see docks/turso/org/listOrgs.json
 * @see docks/turso/database/listDatabases.json
 * @see docks/turso/group/listGroups.json
 */

/**
 * Turso Organization
 * @see docks/turso/org/listOrgs.json
 */
export interface TursoOrg {
  name: string  // "wpoperator"
  slug: string  // "wpoperator" - Used in API URLs
  type: "personal" | "team"
  plan_id: string  // "starter"
  overages: boolean
  blocked_reads: boolean
  blocked_writes: boolean
  plan_timeline: string
  memory: number
  payment_failing_since: {
    Time: string
    Valid: boolean
  }
  platform: string
  platform_id: string
  platform_access_token: string
  delinquent: boolean
}

/**
 * Turso Database
 * @see docks/turso/database/listDatabases.json
 */
export interface TursoDatabase {
  Name: string  // "better-auth-test"
  DbId: string  // "68e35d20-1039-4ca3-878f-0583234d76eb"
  Hostname: string  // "better-auth-test-wpoperator.aws-us-east-1.turso.io"
  is_schema: boolean
  block_reads: boolean
  block_writes: boolean
  allow_attach: boolean
  delete_protection: boolean
  regions: string[]  // ["aws-us-east-1"]
  primaryRegion: string  // "aws-us-east-1"
  type: "logical"
  hostname: string  // Same as Hostname
  version: string  // "tech-preview"
  group: string  // "stackdock" - Group name (store in fullApiData)
  sleeping: boolean
  archived: boolean
  schema: string | null
  parent: string | null
}

/**
 * Turso Group (optional, for metadata)
 * @see docks/turso/group/listGroups.json
 */
export interface TursoGroup {
  archived: boolean
  delete_protection: boolean
  locations: string[]  // ["aws-us-east-1"]
  name: string  // "default", "stackdock", "test"
  primary: string  // "aws-us-east-1"
  status: {
    locations: Array<{
      name: string
      status: "up" | "down"
    }>
  }
  uuid: string
  version: string
}
```

**Reference**: `convex/docks/adapters/vercel/types.ts` for pattern

---

### Task 2: Create Turso API Client

**File**: `convex/docks/adapters/turso/api.ts`

**Create API client class:**

```typescript
/**
 * Turso API Client
 * 
 * Handles all HTTP requests to Turso API
 * 
 * @see docks/turso/ for API response examples
 */

import type {
  TursoOrg,
  TursoDatabase,
  TursoGroup,
} from "./types"

export class TursoAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://api.turso.tech/v1") {
    this.apiKey = apiKey.trim() // Remove any whitespace
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Turso API
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
        `Turso API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /organizations endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/organizations`
      console.log(`[Turso] Validating credentials against: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Turso] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Turso] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Turso] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Turso API error (${response.status}): ${errorText}`
        )
      }

      return true
    } catch (error) {
      console.error(`[Turso] Validation error:`, error)
      return false
    }
  }

  /**
   * List all organizations
   * Returns array of orgs with slugs
   * 
   * @see docks/turso/org/listOrgs.json
   */
  async listOrgs(): Promise<TursoOrg[]> {
    const response = await this.request<TursoOrg[]>("/organizations")
    // Response is array directly (not wrapped)
    return Array.isArray(response) ? response : []
  }

  /**
   * List databases for an organization
   * Requires org slug from listOrgs()
   * 
   * @param orgSlug - Organization slug (e.g., "wpoperator")
   * @see docks/turso/database/listDatabases.json
   */
  async listDatabases(orgSlug: string): Promise<TursoDatabase[]> {
    const response = await this.request<{ databases: TursoDatabase[] }>(
      `/organizations/${orgSlug}/databases`
    )
    // Response is { databases: [...] } - extract databases array
    return response.databases || []
  }

  /**
   * List groups for an organization (optional, for metadata)
   * 
   * @param orgSlug - Organization slug
   * @see docks/turso/group/listGroups.json
   */
  async listGroups(orgSlug: string): Promise<TursoGroup[]> {
    const response = await this.request<{ groups: TursoGroup[] }>(
      `/organizations/${orgSlug}/groups`
    )
    // Response is { groups: [...] } - extract groups array
    return response.groups || []
  }
}
```

**Reference**: `convex/docks/adapters/vercel/api.ts` for pattern

---

### Task 3: Create Turso Adapter

**File**: `convex/docks/adapters/turso/adapter.ts`

**Create adapter implementation:**

```typescript
/**
 * Turso Dock Adapter
 * 
 * Translates Turso API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /organizations → listOrgs() (for org slug)
 * - GET /organizations/{slug}/databases → syncDatabases()
 * 
 * @see docks/turso/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { TursoAPI } from "./api"
import type { TursoDatabase } from "./types"

/**
 * Map Turso database status to universal status
 * 
 * Priority order:
 * 1. archived → "archived"
 * 2. sleeping → "sleeping"
 * 3. block_reads || block_writes → "blocked"
 * 4. else → "active"
 */
function mapTursoStatus(db: TursoDatabase): string {
  if (db.archived) return "archived"
  if (db.sleeping) return "sleeping"
  if (db.block_reads || db.block_writes) return "blocked"
  return "active"
}

export const tursoAdapter: DockAdapter = {
  provider: "turso",

  /**
   * Validate Turso API credentials
   */
  async validateCredentials(
    ctx: MutationCtx,
    dock: Doc<"docks">
  ): Promise<boolean> {
    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })

    const api = new TursoAPI(apiKey)
    return await api.validateCredentials()
  },

  /**
   * Sync Turso databases to universal `databases` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each database, upsert into `databases` table
   * 4. Map status using priority order
   * 5. Store all Turso fields in fullApiData
   */
  async syncDatabases(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: TursoDatabase[]
  ): Promise<void> {
    let databases: TursoDatabase[]

    if (preFetchedData) {
      // Use pre-fetched data from action
      databases = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new TursoAPI(apiKey)
      
      // Get org slug (for MVP, use first org)
      const orgs = await api.listOrgs()
      const orgSlug = orgs[0]?.slug
      if (!orgSlug) {
        throw new Error("No organizations found for Turso account")
      }

      databases = await api.listDatabases(orgSlug)
    }

    // Sync each database to universal table
    for (const db of databases) {
      const existing = await ctx.db
        .query("databases")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", db.DbId)
        )
        .first()

      const databaseData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "turso",
        providerResourceId: db.DbId,
        name: db.Name,
        engine: "turso", // Turso uses SQLite
        version: db.version,
        status: mapTursoStatus(db),
        fullApiData: {
          // Store all Turso fields
          ...db,
          // Explicitly include group name (for clarity)
          group: db.group,
          // Explicitly include regions (for clarity)
          regions: db.regions,
          primaryRegion: db.primaryRegion,
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, databaseData)
      } else {
        await ctx.db.insert("databases", databaseData)
      }
    }
  },
}
```

**Reference**: `convex/docks/adapters/vercel/adapter.ts` for pattern

---

### Task 4: Create Index File

**File**: `convex/docks/adapters/turso/index.ts`

```typescript
/**
 * Turso Adapter Export
 */
export { tursoAdapter } from "./adapter"
export { TursoAPI } from "./api"
export * from "./types"
```

---

### Task 5: Update Actions - syncDockResources

**File**: `convex/docks/actions.ts`

**Add Turso case in `syncDockResources` action:**

```typescript
// At top of file, add import:
import { TursoAPI } from "./adapters/turso/api"

// In syncDockResources action handler, add else if block:
else if (args.provider === "turso") {
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
}
```

**Reference**: See `convex/docks/actions.ts` lines 125-149 for Vercel pattern

---

### Task 6: Update Actions - validateCredentials

**File**: `convex/docks/actions.ts`

**Add Turso case in `validateCredentials` action:**

```typescript
// In validateCredentials action handler, add else if block:
else if (args.provider === "turso") {
  const api = new TursoAPI(args.apiKey)
  return await api.validateCredentials()
}
```

**Reference**: See `convex/docks/actions.ts` lines 23-48 for pattern

---

### Task 7: Register Adapter

**File**: `convex/docks/registry.ts`

**Add import:**
```typescript
import { tursoAdapter } from "./adapters/turso"
```

**Add to registry:**
```typescript
const adapterRegistry: Record<string, DockAdapter> = {
  gridpane: gridpaneAdapter,
  vercel: vercelAdapter,
  netlify: netlifyAdapter,
  cloudflare: cloudflareAdapter,
  turso: tursoAdapter,  // NEW
}
```

**Add to metadata:**
```typescript
const providerMetadata: Record<string, { displayName: string }> = {
  gridpane: { displayName: "GridPane" },
  vercel: { displayName: "Vercel" },
  netlify: { displayName: "Netlify" },
  cloudflare: { displayName: "Cloudflare" },
  turso: { displayName: "Turso" },  // NEW
}
```

---

## ✅ Testing Checklist

- [ ] Turso API client authenticates correctly
- [ ] `listOrgs()` returns orgs with slugs
- [ ] `listDatabases(orgSlug)` returns databases
- [ ] `validateCredentials()` works for valid/invalid tokens
- [ ] Adapter maps status correctly (archived → sleeping → blocked → active)
- [ ] Adapter stores group name in `fullApiData.group`
- [ ] Adapter stores regions in `fullApiData.regions` and `fullApiData.primaryRegion`
- [ ] Databases sync to universal `databases` table
- [ ] Provider appears in `listAvailableProviders` query
- [ ] No TypeScript errors
- [ ] Convex functions deploy successfully

---

## 📁 File Structure

```
convex/docks/adapters/turso/
├── types.ts          # Turso API types (from JSON files)
├── api.ts            # TursoAPI class (HTTP client)
├── adapter.ts        # tursoAdapter (maps to universal schema)
└── index.ts          # Exports
```

---

## 🔗 Reference Files

**Pattern References:**
- `convex/docks/adapters/vercel/types.ts` - Types pattern
- `convex/docks/adapters/vercel/api.ts` - API client pattern
- `convex/docks/adapters/vercel/adapter.ts` - Adapter pattern

**API Response Examples:**
- `docks/turso/org/listOrgs.json`
- `docks/turso/database/listDatabases.json`
- `docks/turso/group/listGroups.json`
- `docks/turso/api-routes.md`

---

## 📝 Notes

- **One dock per org**: Each Turso organization should have its own dock entry
- **Org slug**: For MVP, use first org from `listOrgs()`. Future: store org slug in dock metadata
- **Groups**: Not a separate resource - store group name in `fullApiData.group`
- **Regions**: Store in `fullApiData.regions` and `fullApiData.primaryRegion` (metadata)
- **Status**: Priority mapping (archived → sleeping → blocked → active)
- **Engine**: Hardcode as `"turso"` (Turso uses SQLite)

---

**Ready for implementation**: All decisions confirmed, pattern established, tasks clear.
