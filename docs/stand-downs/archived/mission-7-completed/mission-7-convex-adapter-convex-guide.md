# Mission 7: Convex Adapter Implementation - Convex Agent Guide

**Date**: November 12, 2025  
**Mission**: Mission 7 - Read-Only Infrastructure MVP  
**Provider**: Convex (Database Provider)  
**Agent**: Convex Agent (Backend)  
**Priority**: High

---

## 🎯 Objective

Implement Convex adapter following the established adapter pattern. Convex is a backend-as-a-service platform, so we'll sync projects and their databases to the universal `databases` table.

---

## ✅ Decisions Confirmed

1. **One dock per account**: Each Convex account gets its own dock entry
2. **Projects**: Convex organizes databases into projects. Each project has a default database.
3. **Databases**: Each project has a database. Sync all databases from all projects.
4. **Status mapping**: Map Convex project status to universal status
5. **Engine**: Hardcode as `"convex"` (Convex uses its own database engine)

---

## 📋 API Structure

**Base URL**: `https://cloud.convex.dev/api/v1`

**Endpoints for read-only MVP:**
- `GET /projects` - List all projects (also used for credential validation)
- `GET /projects/{projectId}/databases` - List databases for a project (or similar endpoint)

**Authentication**: Single API token (Bearer token in `Authorization` header)

**Reference JSON files:**
- `docks/convex/project/listProjects.json` (to be created from actual API response)
- `docks/convex/api-routes.md`

---

## 🔄 Field Mapping

**Convex Database → Universal `databases` table:**

| Universal Field | Convex Field | Mapping Logic |
|----------------|-------------|---------------|
| `providerResourceId` | `database.id` or `project.id` | Unique identifier |
| `name` | `database.name` or `project.name` | Database/project name |
| `engine` | `"convex"` | Hardcoded (Convex uses its own engine) |
| `version` | `project.version` or `"latest"` | Convex version |
| `status` | **Derived** | See status mapping below |
| `fullApiData` | **Entire objects** | Store project and database data |

**Status mapping function:**
```typescript
function mapConvexStatus(project: ConvexProject, database?: ConvexDatabase): string {
  // Check project status
  if (project.status === "deleted" || project.status === "archived") return "archived"
  if (project.status === "suspended") return "blocked"
  
  // Default to active
  return "active"
}
```

**Full API Data includes:**
- Project data (`id`, `name`, `created_at`, `updated_at`, `status`, etc.)
- Database data (if separate endpoint exists)

---

## 📝 Implementation Tasks

### Task 1: Create Convex Types

**File**: `convex/docks/adapters/convex/types.ts`

**Create interfaces from JSON files:**

```typescript
/**
 * Convex API Types
 * 
 * Generated from actual API responses in docks/convex/
 * 
 * @see docks/convex/project/listProjects.json
 */

/**
 * Convex Project
 * @see docks/convex/project/listProjects.json
 */
export interface ConvexProject {
  id: string
  name: string
  created_at: string
  updated_at: string
  status?: string // "active" | "deleted" | "archived" | "suspended"
  // Add other fields from actual API response
}

/**
 * Convex Database
 * Note: May be nested in project or separate endpoint
 */
export interface ConvexDatabase {
  id: string
  name: string
  project_id: string
  created_at: string
  updated_at: string
  // Add other fields from actual API response
}
```

**Reference**: `convex/docks/adapters/turso/types.ts` for pattern

---

### Task 2: Create Convex API Client

**File**: `convex/docks/adapters/convex/api.ts`

**Create API client class:**

```typescript
/**
 * Convex API Client
 * 
 * Handles all HTTP requests to Convex API
 * 
 * @see docks/convex/ for API response examples
 */

import type {
  ConvexProject,
  ConvexDatabase,
} from "./types"

export class ConvexAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://cloud.convex.dev/api/v1") {
    this.apiKey = apiKey.trim() // Remove any whitespace
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Convex API
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
        `Convex API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /projects endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/projects`
      console.log(`[Convex] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Convex] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Convex] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Convex] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Convex API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Convex] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Convex] Validation error:`, error)
      if (error instanceof Error) {
        // Re-throw with more context for debugging
        throw new Error(
          `Failed to validate Convex credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all projects
   * Returns array of projects
   * 
   * @see docks/convex/project/listProjects.json
   */
  async listProjects(): Promise<ConvexProject[]> {
    const response = await this.request<{ projects: ConvexProject[] }>("/projects")
    // Response might be { projects: [...] } or array directly
    if (Array.isArray(response)) {
      return response
    }
    return response.projects || []
  }

  /**
   * List databases for a project
   * 
   * @param projectId - Project ID
   * Note: Endpoint may vary - verify actual API structure
   */
  async listDatabases(projectId: string): Promise<ConvexDatabase[]> {
    // TODO: Verify actual endpoint structure
    // May be: /projects/{projectId}/databases
    // Or databases may be nested in project response
    const response = await this.request<{ databases: ConvexDatabase[] }>(
      `/projects/${projectId}/databases`
    )
    // Response might be { databases: [...] } or array directly
    if (Array.isArray(response)) {
      return response
    }
    return response.databases || []
  }
}
```

**Reference**: `convex/docks/adapters/turso/api.ts` for pattern

---

### Task 3: Create Convex Adapter

**File**: `convex/docks/adapters/convex/adapter.ts`

**Create adapter implementation:**

```typescript
/**
 * Convex Dock Adapter
 * 
 * Translates Convex API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /projects → listProjects()
 * - GET /projects/{id}/databases → syncDatabases()
 * 
 * @see docks/convex/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { ConvexAPI } from "./api"
import type { ConvexProject, ConvexDatabase } from "./types"

/**
 * Map Convex database status to universal status
 * 
 * Priority order:
 * 1. project.status === "deleted" || "archived" → "archived"
 * 2. project.status === "suspended" → "blocked"
 * 3. else → "active"
 */
function mapConvexStatus(
  project: ConvexProject,
  database?: ConvexDatabase
): string {
  if (project.status === "deleted" || project.status === "archived") {
    return "archived"
  }
  if (project.status === "suspended") {
    return "blocked"
  }
  return "active"
}

export const convexAdapter: DockAdapter = {
  provider: "convex",

  /**
   * Validate Convex API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new ConvexAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      // Log error for debugging but return false for invalid credentials
      console.error("Convex credential validation failed:", error)
      // Re-throw to get more detail in the mutation
      throw error
    }
  },

  /**
   * Sync Convex databases to universal `databases` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each project → database, upsert into `databases` table
   * 4. Map status using priority order
   * 5. Store all Convex fields in fullApiData
   */
  async syncDatabases(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: Array<{
      project: ConvexProject
      database: ConvexDatabase
    }>
  ): Promise<void> {
    let databases: Array<{
      project: ConvexProject
      database: ConvexDatabase
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

      const api = new ConvexAPI(apiKey)

      // Get all projects
      const projects = await api.listProjects()
      if (projects.length === 0) {
        console.log("[Convex] No projects found")
        return
      }

      // For each project, get databases
      databases = []
      for (const project of projects) {
        try {
          const projectDatabases = await api.listDatabases(project.id)
          // If databases endpoint exists, use it
          for (const database of projectDatabases) {
            databases.push({ project, database })
          }
        } catch (error) {
          // If databases endpoint doesn't exist, treat project as database
          console.log(`[Convex] No databases endpoint for project ${project.id}, treating project as database`)
          databases.push({
            project,
            database: {
              id: project.id,
              name: project.name,
              project_id: project.id,
              created_at: project.created_at,
              updated_at: project.updated_at,
            },
          })
        }
      }
    }

    // Sync each database to universal table
    for (const { project, database } of databases) {
      // Use database.id or project.id as providerResourceId
      const providerResourceId = database.id || project.id

      const existing = await ctx.db
        .query("databases")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const databaseData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "convex",
        providerResourceId,
        name: database.name || project.name,
        engine: "convex", // Convex uses its own database engine
        version: "latest", // Convex manages versions internally
        status: mapConvexStatus(project, database),
        fullApiData: {
          // Store all Convex fields
          project: {
            id: project.id,
            name: project.name,
            created_at: project.created_at,
            updated_at: project.updated_at,
            status: project.status,
          },
          database: {
            id: database.id,
            name: database.name,
            project_id: database.project_id,
            created_at: database.created_at,
            updated_at: database.updated_at,
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

**File**: `convex/docks/adapters/convex/index.ts`

```typescript
/**
 * Convex Adapter Export
 */
export { convexAdapter } from "./adapter"
export { ConvexAPI } from "./api"
export * from "./types"
```

---

### Task 5: Update Actions - syncDockResources

**File**: `convex/docks/actions.ts`

**Add Convex case in `syncDockResources` action:**

```typescript
// At top of file, add import:
import { ConvexAPI } from "./adapters/convex/api"

// In syncDockResources action handler, add else if block:
else if (args.provider === "convex") {
  const api = new ConvexAPI(args.apiKey)

  // Convex requires fetching projects first
  const projects = await api.listProjects()
  
  if (projects.length === 0) {
    console.log(`[Dock Action] No projects found for Convex account`)
    databases = []
  } else {
    // For each project, get databases
    const allDatabases: Array<{
      project: any
      database: any
    }> = []

    for (const project of projects) {
      try {
        const projectDatabases = await api.listDatabases(project.id)
        // If databases endpoint exists, use it
        for (const database of projectDatabases) {
          allDatabases.push({ project, database })
        }
      } catch (error) {
        // If databases endpoint doesn't exist, treat project as database
        console.log(`[Dock Action] No databases endpoint for project ${project.id}, treating project as database`)
        allDatabases.push({
          project,
          database: {
            id: project.id,
            name: project.name,
            project_id: project.id,
            created_at: project.created_at,
            updated_at: project.updated_at,
          },
        })
      }
    }

    if (args.resourceTypes.includes("databases")) {
      console.log(`[Dock Action] Fetching databases for ${args.provider} (${allDatabases.length} databases found)`)
      databases = allDatabases
    }
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
}
```

**Reference**: See `convex/docks/actions.ts` lines 266-319 for Neon pattern

---

### Task 6: Update Actions - validateCredentials

**File**: `convex/docks/actions.ts`

**Add Convex case in `validateCredentials` action:**

```typescript
// In validateCredentials action handler, add else if block:
else if (args.provider === "convex") {
  const api = new ConvexAPI(args.apiKey)
  return await api.validateCredentials()
}
```

**Reference**: See `convex/docks/actions.ts` lines 24-48 for pattern

---

### Task 7: Register Adapter

**File**: `convex/docks/registry.ts`

**Add import:**
```typescript
import { convexAdapter } from "./adapters/convex"
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
  convex: convexAdapter,  // NEW
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
  convex: { displayName: "Convex" },  // NEW
}
```

---

## ✅ Testing Checklist

- [ ] Convex API client authenticates correctly
- [ ] `listProjects()` returns projects
- [ ] `listDatabases(projectId)` returns databases (or handles missing endpoint)
- [ ] `validateCredentials()` works for valid/invalid tokens
- [ ] Adapter maps status correctly (deleted/archived → suspended → active)
- [ ] Adapter stores project and database data in `fullApiData`
- [ ] Databases sync to universal `databases` table
- [ ] Provider appears in `listAvailableProviders` query
- [ ] No TypeScript errors
- [ ] Convex functions deploy successfully

---

## 📁 File Structure

```
convex/docks/adapters/convex/
├── types.ts          # Convex API types (from JSON files)
├── api.ts            # ConvexAPI class (HTTP client)
├── adapter.ts        # convexAdapter (maps to universal schema)
└── index.ts          # Exports

docks/convex/
├── api-routes.md
└── project/
    └── listProjects.json (to be created from actual API response)
```

---

## 🔗 Reference Files

**Pattern References:**
- `convex/docks/adapters/turso/types.ts` - Types pattern
- `convex/docks/adapters/turso/api.ts` - API client pattern
- `convex/docks/adapters/turso/adapter.ts` - Adapter pattern

**API Response Examples:**
- `docks/convex/project/listProjects.json` (to be created)
- `docks/convex/api-routes.md`

---

## 📝 Notes

- **One dock per account**: Each Convex account should have its own dock entry
- **Projects → Databases**: Convex's hierarchy (project contains database)
- **Status**: Priority mapping (deleted/archived → suspended → active)
- **Engine**: Hardcode as `"convex"` (Convex uses its own database engine)
- **Version**: Use `"latest"` (Convex manages versions internally)
- **Database endpoint**: May not exist - if so, treat project as database

---

## ⚠️ Important: API Response Examples Needed

Before implementing, we need actual API response examples:

1. **Create `docks/convex/project/listProjects.json`** - Example response from `GET /projects`
2. **Verify database endpoint** - Confirm if `GET /projects/{projectId}/databases` exists, or if databases are nested in project response

Once we have these, update the TypeScript interfaces in `types.ts` to match the actual API responses.

---

**Ready for implementation**: Pattern established, tasks clear. Need API response examples to finalize types.
