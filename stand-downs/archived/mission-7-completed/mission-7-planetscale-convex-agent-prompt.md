# Mission 7: PlanetScale Adapter - Convex Agent Prompt

**Date**: November 12, 2025  
**Mission**: Mission 7 - Read-Only Infrastructure MVP  
**Provider**: PlanetScale (Database Provider)  
**Agent**: Convex Agent (Backend)  
**Priority**: High

---

## 🎯 Task

Implement PlanetScale adapter following the Turso adapter pattern. PlanetScale is a MySQL-compatible database provider.

**Note**: This is a bonus database provider - easy endpoints, similar to Turso.

---

## 📋 API Structure

**Base URL**: `https://api.planetscale.com/v1`

**Endpoints for read-only MVP:**
1. `GET /organizations` - List all organizations (also used for credential validation)
2. `GET /organizations/{organization}/databases` - List databases for an organization

**Authentication**: Service token format (REQUIRED)
- Format: `Authorization: <SERVICE_TOKEN_ID>:<SERVICE_TOKEN>`
- **Both token ID and token are required** - combine with colon: `TOKEN_ID:TOKEN`
- No "Bearer" prefix
- Example: `YOUR_TOKEN_ID:pscale_tkn_YOUR_SERVICE_TOKEN_HERE`

**Flow**:
1. Validate credentials → `GET /organizations` (get organization slug/name)
2. For each organization → `GET /organizations/{organization}/databases`

**Reference JSON files:**
- `docks/planetscale/listOrganizations.json` ✅ (real API response)
- `docks/planetscale/listDatabases.json` ✅ (real API response)

---

## 🔄 Field Mapping

### PlanetScale Database → Universal `databases` table

| Universal Field | PlanetScale Field | Mapping Logic |
|----------------|------------------|---------------|
| `providerResourceId` | `database.name` or `database.id` | Unique identifier |
| `name` | `database.name` | Database name |
| `engine` | `database.kind` | `"postgresql"` or `"mysql"` (from API) |
| `version` | `database.region.slug` or `"latest"` | Region slug or "latest" |
| `status` | **Derived** | See status mapping below |
| `fullApiData` | **Entire objects** | Store organization + database data |

**Status mapping function:**
```typescript
function mapPlanetScaleStatus(database: PlanetScaleDatabase): string {
  // Check database state
  if (database.state === "deleted" || database.state === "archived") return "archived"
  if (database.state === "suspended") return "blocked"
  // Default to active
  return "active"
}
```

---

## 📝 Implementation Tasks

### Task 1: Create PlanetScale Types

**File**: `convex/docks/adapters/planetscale/types.ts`

**Create interfaces from JSON files:**

```typescript
/**
 * PlanetScale API Types
 * 
 * Generated from actual API responses in docks/planetscale/
 * 
 * @see docks/planetscale/listOrganizations.json
 * @see docks/planetscale/listDatabases.json
 */

/**
 * PlanetScale Organization
 * @see docks/planetscale/listOrganizations.json
 */
export interface PlanetScaleOrganization {
  id: string // "ul8umvvqyk0j"
  type: "Organization"
  name: string // "support-wpoperator"
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
  billing_email: string
  database_count: number
  plan: string // "scaler_pro"
  // Add other fields from actual API response
}

/**
 * PlanetScale Database
 * @see docks/planetscale/listDatabases.json
 */
export interface PlanetScaleDatabase {
  id: string // "wzul1qu5i9wa"
  type: "Database"
  name: string // "stackdock-test"
  state: string // "ready", "deleted", "suspended", etc.
  kind: string // "postgresql" or "mysql"
  ready: boolean
  region: {
    id: string
    type: "Region"
    provider: string // "AWS"
    enabled: boolean
    slug: string // "us-east"
    display_name: string // "AWS us-east-1"
    location: string // "N. Virginia"
    current_default: boolean
    public_ip_addresses: string[]
  }
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
  plan: string // "scaler_pro"
  branches_count: number
  default_branch: string // "main"
  // Add other fields from actual API response
}
```

**Reference**: `convex/docks/adapters/turso/types.ts` for pattern

---

### Task 2: Create PlanetScale API Client

**File**: `convex/docks/adapters/planetscale/api.ts`

**Create API client class:**

```typescript
/**
 * PlanetScale API Client
 * 
 * Handles all HTTP requests to PlanetScale API
 * 
 * @see docks/planetscale/ for API response examples
 */

import type {
  PlanetScaleOrganization,
  PlanetScaleDatabase,
} from "./types"

export class PlanetScaleAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://api.planetscale.com/v1") {
    this.apiKey = apiKey.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to PlanetScale API
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
        `PlanetScale API error (${response.status}): ${errorText}`
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
      console.log(`[PlanetScale] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[PlanetScale] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[PlanetScale] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[PlanetScale] API error (${response.status}): ${errorText}`)
        throw new Error(
          `PlanetScale API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[PlanetScale] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[PlanetScale] Validation error:`, error)
      if (error instanceof Error) {
        throw new Error(
          `Failed to validate PlanetScale credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all organizations
   * Returns array of organizations
   * 
   * @see docks/planetscale/listOrganizations.json
   */
  async listOrganizations(): Promise<PlanetScaleOrganization[]> {
    const response = await this.request<{
      type: "list"
      data: PlanetScaleOrganization[]
      current_page: number
      next_page: number | null
    }>("/organizations")
    // Response is wrapped: { type: "list", data: [...] }
    return response.data || []
  }

  /**
   * List databases for an organization
   * Requires organization name from listOrganizations()
   * 
   * @param organizationName - Organization name (e.g., "support-wpoperator")
   * @see docks/planetscale/listDatabases.json
   */
  async listDatabases(organizationName: string): Promise<PlanetScaleDatabase[]> {
    const response = await this.request<{
      type: "list"
      data: PlanetScaleDatabase[]
      current_page: number
      next_page: number | null
    }>(
      `/organizations/${organizationName}/databases`
    )
    // Response is wrapped: { type: "list", data: [...] }
    return response.data || []
  }
}
```

**Reference**: `convex/docks/adapters/turso/api.ts` for pattern

---

### Task 3: Create PlanetScale Adapter

**File**: `convex/docks/adapters/planetscale/adapter.ts`

**Create adapter implementation:**

```typescript
/**
 * PlanetScale Dock Adapter
 * 
 * Translates PlanetScale API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /organizations → listOrganizations() (for org slug)
 * - GET /organizations/{slug}/databases → syncDatabases()
 * 
 * @see docks/planetscale/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { PlanetScaleAPI } from "./api"
import type { PlanetScaleDatabase } from "./types"

/**
 * Map PlanetScale database status to universal status
 * 
 * Priority order:
 * 1. database.state === "deleted" || "archived" → "archived"
 * 2. database.state === "suspended" → "blocked"
 * 3. else → "active"
 */
function mapPlanetScaleStatus(db: PlanetScaleDatabase): string {
  if (db.state === "deleted" || db.state === "archived") {
    return "archived"
  }
  if (db.state === "suspended") {
    return "blocked"
  }
  return "active"
}

export const planetscaleAdapter: DockAdapter = {
  provider: "planetscale",

  /**
   * Validate PlanetScale API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new PlanetScaleAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("PlanetScale credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync PlanetScale databases to universal `databases` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each organization → database, upsert into `databases` table
   * 4. Map status using priority order
   * 5. Store all PlanetScale fields in fullApiData
   */
  async syncDatabases(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: Array<{
      organization: PlanetScaleOrganization
      database: PlanetScaleDatabase
    }>
  ): Promise<void> {
    let databases: Array<{
      organization: PlanetScaleOrganization
      database: PlanetScaleDatabase
    }>

    if (preFetchedData) {
      // Use pre-fetched data from action
      databases = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new PlanetScaleAPI(apiKey)

      // Get all organizations
      const orgs = await api.listOrganizations()
      if (orgs.length === 0) {
        console.log("[PlanetScale] No organizations found")
        return
      }

      // For each organization, get databases
      databases = []
      for (const org of orgs) {
        const orgDatabases = await api.listDatabases(org.name)
        for (const db of orgDatabases) {
          databases.push({ organization: org, database: db })
        }
      }
    }

    // Sync each database to universal table
    for (const { organization, database: db } of databases) {
      // Use database.name or database.id as providerResourceId
      const providerResourceId = db.name || db.id

      const existing = await ctx.db
        .query("databases")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const databaseData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "planetscale",
        providerResourceId,
        name: db.name,
        engine: db.kind || "mysql", // "postgresql" or "mysql" from API
        version: db.region?.slug || "latest",
        status: mapPlanetScaleStatus(db),
        fullApiData: {
          // Store all PlanetScale fields
          organization: {
            id: organization.id,
            name: organization.name,
            type: organization.type,
            plan: organization.plan,
            database_count: organization.database_count,
          },
          region: {
            id: db.region.id,
            slug: db.region.slug,
            display_name: db.region.display_name,
            provider: db.region.provider,
            location: db.region.location,
          },
          database: {
            id: db.id,
            name: db.name,
            state: db.state,
            kind: db.kind,
            ready: db.ready,
            plan: db.plan,
            branches_count: db.branches_count,
            default_branch: db.default_branch,
            // Include all other fields from API response
            ...db,
          },
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

**Reference**: `convex/docks/adapters/turso/adapter.ts` for pattern

---

### Task 4: Create Index File

**File**: `convex/docks/adapters/planetscale/index.ts`

```typescript
/**
 * PlanetScale Adapter Export
 */
export { planetscaleAdapter } from "./adapter"
export { PlanetScaleAPI } from "./api"
export * from "./types"
```

---

### Task 5: Update Actions - syncDockResources

**File**: `convex/docks/actions.ts`

**Add PlanetScale case in `syncDockResources` action:**

```typescript
// At top of file, add import:
import { PlanetScaleAPI } from "./adapters/planetscale/api"

// In syncDockResources action handler, add else if block:
else if (args.provider === "planetscale") {
  const api = new PlanetScaleAPI(args.apiKey)

  // PlanetScale requires fetching orgs first to get slugs
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
}
```

**Reference**: See `convex/docks/actions.ts` lines 234-264 for Turso pattern

---

### Task 6: Update Actions - validateCredentials

**File**: `convex/docks/actions.ts`

**Add PlanetScale case in `validateCredentials` action:**

```typescript
// In validateCredentials action handler, add else if block:
else if (args.provider === "planetscale") {
  const api = new PlanetScaleAPI(args.apiKey)
  return await api.validateCredentials()
}
```

**Reference**: See `convex/docks/actions.ts` lines 24-48 for pattern

---

### Task 7: Register Adapter

**File**: `convex/docks/registry.ts`

**Add import:**
```typescript
import { planetscaleAdapter } from "./adapters/planetscale"
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
  planetscale: planetscaleAdapter,  // NEW
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
  planetscale: { displayName: "PlanetScale" },  // NEW
}
```

---

## ✅ Testing Checklist

- [ ] PlanetScale API client authenticates correctly
- [ ] `listOrganizations()` returns orgs with slugs
- [ ] `listDatabases(orgSlug)` returns databases
- [ ] `validateCredentials()` works for valid/invalid tokens
- [ ] Adapter maps status correctly (deleted/archived → suspended → active)
- [ ] Adapter stores organization and database data in `fullApiData`
- [ ] Databases sync to universal `databases` table
- [ ] Provider appears in `listAvailableProviders` query
- [ ] No TypeScript errors
- [ ] Convex functions deploy successfully

---

## 📁 File Structure

```
convex/docks/adapters/planetscale/
├── types.ts          # PlanetScale API types (from JSON files)
├── api.ts            # PlanetScaleAPI class (HTTP client)
├── adapter.ts        # planetscaleAdapter (maps to universal schema)
└── index.ts          # Exports

docks/planetscale/
├── api-routes.md
├── listOrganizations.json ✅
└── listDatabases.json ✅
```

---

## 🔗 Reference Files

**Pattern References:**
- `convex/docks/adapters/turso/types.ts` - Types pattern
- `convex/docks/adapters/turso/api.ts` - API client pattern
- `convex/docks/adapters/turso/adapter.ts` - Adapter pattern

**API Response Examples:**
- `docks/planetscale/listOrganizations.json` ✅
- `docks/planetscale/listDatabases.json` ✅
- `docks/planetscale/api-routes.md`

---

## 📝 Notes

- **One dock per account**: Each PlanetScale account should have its own dock entry
- **Organizations → Databases**: PlanetScale's hierarchy (org contains databases)
- **Status**: Priority mapping (deleted/archived → suspended → active)
- **Engine**: Use `database.kind` from API (`"postgresql"` or `"mysql"`)
- **Version**: Use `region.slug` or `"latest"` (PlanetScale manages database versions)
- **API Response Format**: Both endpoints return paginated format `{ type: "list", data: [...] }`

---

**Ready for implementation**: Pattern established, API responses available, tasks clear. Follow Turso pattern exactly.
