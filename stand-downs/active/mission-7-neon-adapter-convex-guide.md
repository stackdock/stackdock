# Mission 7: Neon Adapter Implementation - Convex Agent Guide

**Date**: November 12, 2025  
**Mission**: Mission 7 - Read-Only Infrastructure MVP  
**Provider**: Neon (Database Provider)  
**Agent**: Convex Agent (Backend)  
**Priority**: High

---

## 🎯 Objective

Implement Neon adapter following the established adapter pattern. Neon is a serverless PostgreSQL provider, so we'll sync projects and their databases to the universal `databases` table.

---

## ✅ Decisions Confirmed

1. **One dock per account**: Each Neon account gets its own dock entry
2. **Projects**: Neon organizes databases into projects. Each project can have multiple branches.
3. **Branches**: Store branch info in `fullApiData.branch` (NOT a separate resource)
4. **Databases**: Each branch has a default database. Sync all databases from all branches.
5. **Snapshots**: Neon snapshots map to `backupSchedules` table (similar to GridPane backups)
6. **Status mapping**: Map Neon project/branch status to universal status
7. **Engine**: Hardcode as `"postgresql"` (Neon uses PostgreSQL)

---

## 📋 API Structure

**Base URL**: `https://console.neon.tech/api/v2`

**Endpoints for read-only MVP:**
- `GET /projects` - List all projects (also used for credential validation)
- `GET /projects/{projectId}/branches` - List branches for a project
- `GET /projects/{projectId}/branches/{branchId}/databases` - List databases for a branch
- `GET /projects/{projectId}/branches/{branchId}/snapshots` - List snapshots for a branch

**Authentication**: Single API token (Bearer token in `Authorization` header)

**Reference JSON files:**
- `docks/neon/project/listProjects.json` ✅ (real API response)
- `docks/neon/branch/listBranches.json` ✅ (real API response)
- `docks/neon/snapshot/listSnapshots.json` ✅ (real API response)
- `docks/neon/api-routes.md`

---

## 🔄 Field Mapping

**Neon Database → Universal `databases` table:**

| Universal Field | Neon Field | Mapping Logic |
|----------------|-----------|---------------|
| `providerResourceId` | `database.id` or `database.name` | Unique identifier |
| `name` | `database.name` | Database name |
| `engine` | `"postgresql"` | Hardcoded (Neon uses PostgreSQL) |
| `version` | `branch.pg_version` or project default | PostgreSQL version |
| `status` | **Derived** | See status mapping below |
| `fullApiData` | **Entire objects** | Store project, branch, and database data |

**Status mapping function:**
```typescript
function mapNeonStatus(project: NeonProject, branch: NeonBranch, database: NeonDatabase): string {
  // Check project status
  if (project.status === "deleted") return "archived"
  if (project.status === "suspended") return "blocked"
  
  // Check branch status
  if (branch.status === "deleted") return "archived"
  if (branch.status === "suspended") return "blocked"
  
  // Default to active
  return "active"
}
```

**Full API Data includes:**
- Project data (`id`, `name`, `region_id`, `created_at`, `updated_at`, `status`)
- Branch data (`id`, `name`, `project_id`, `created_at`, `updated_at`, `status`, `pg_version`)
- Database data (`id`, `name`, `branch_id`, `created_at`, `updated_at`)

---

## 📝 Implementation Tasks

### Task 1: Create Neon Types

**File**: `convex/docks/adapters/neon/types.ts`

**Create interfaces from actual JSON files:**

```typescript
/**
 * Neon API Types
 * 
 * Generated from actual API responses in docks/neon/
 * 
 * @see docks/neon/project/listProjects.json
 * @see docks/neon/branch/listBranches.json
 */

/**
 * Neon Project
 * @see docks/neon/project/listProjects.json
 */
export interface NeonProject {
  id: string // "broad-field-27690464"
  platform_id: string // "aws"
  region_id: string // "aws-us-east-1"
  name: string // "Test Projects"
  provisioner: string // "k8s-neonvm"
  default_endpoint_settings: {
    autoscaling_limit_min_cu: number
    autoscaling_limit_max_cu: number
    suspend_timeout_seconds: number
  }
  settings: {
    allowed_ips: {
      ips: string[]
      protected_branches_only: boolean
    }
    enable_logical_replication: boolean
    maintenance_window: {
      weekdays: number[]
      start_time: string
      end_time: string
    }
    block_public_connections: boolean
    block_vpc_connections: boolean
    hipaa: boolean
  }
  pg_version: number // 16
  proxy_host: string // "us-east-1.aws.neon.tech"
  branch_logical_size_limit: number
  branch_logical_size_limit_bytes: number
  store_passwords: boolean
  active_time: number
  cpu_used_sec: number
  creation_source: string // "console"
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
  synthetic_storage_size: number
  quota_reset_at: string // ISO 8601
  owner_id: string // "org-spring-sound-71035136"
  compute_last_active_at: string // ISO 8601
  org_id: string // "org-spring-sound-71035136"
  history_retention_seconds: number
}

/**
 * Neon Branch
 * @see docks/neon/branch/listBranches.json
 */
export interface NeonBranch {
  id: string // "br-red-king-a4if1nyh"
  project_id: string // "broad-field-27690464"
  name: string // "main"
  current_state: string // "archived" | "active" | etc.
  state_changed_at: string // ISO 8601
  logical_size: number
  creation_source: string // "console"
  primary: boolean
  default: boolean
  protected: boolean
  cpu_used_sec: number
  compute_time_seconds: number
  active_time_seconds: number
  written_data_bytes: number
  data_transfer_bytes: number
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
  init_source: string // "parent-data"
}

/**
 * Neon Database
 * Note: Need to verify actual API response structure
 * Expected endpoint: GET /projects/{projectId}/branches/{branchId}/databases
 */
export interface NeonDatabase {
  id: string
  name: string
  branch_id: string
  created_at: string
  updated_at: string
  // Add other fields from actual API response
}

/**
 * Neon Snapshot
 * @see docks/neon/snapshot/listSnapshots.json
 */
export interface NeonSnapshot {
  id: string // "snap-curly-art-a4oxpt34"
  name: string // "main at 2025-11-13 03:15:45 UTC (manual)"
  source_branch_id: string // "br-red-king-a4if1nyh"
  created_at: string // ISO 8601
  manual: boolean // true for manual snapshots
}
```

**Reference**: 
- `convex/docks/adapters/turso/types.ts` for pattern
- `docks/neon/project/listProjects.json` for actual API response
- `docks/neon/branch/listBranches.json` for actual API response
- `docks/neon/snapshot/listSnapshots.json` for actual API response

---

### Task 2: Create Neon API Client

**File**: `convex/docks/adapters/neon/api.ts`

**Create API client class:**

```typescript
/**
 * Neon API Client
 * 
 * Handles all HTTP requests to Neon API
 * 
 * @see docks/neon/ for API response examples
 */

import type {
  NeonProject,
  NeonBranch,
  NeonDatabase,
} from "./types"

export class NeonAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://console.neon.tech/api/v2") {
    this.apiKey = apiKey.trim() // Remove any whitespace
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Neon API
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
        `Neon API error (${response.status}): ${errorText}`
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
      console.log(`[Neon] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Neon] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Neon] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Neon] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Neon API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Neon] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Neon] Validation error:`, error)
      if (error instanceof Error) {
        // Re-throw with more context for debugging
        throw new Error(
          `Failed to validate Neon credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all projects
   * Returns array of projects
   * 
   * @see docks/neon/project/listProjects.json
   */
  async listProjects(): Promise<NeonProject[]> {
    const response = await this.request<{ projects: NeonProject[] }>("/projects")
    // Response might be { projects: [...] } or array directly
    if (Array.isArray(response)) {
      return response
    }
    return response.projects || []
  }

  /**
   * List branches for a project
   * 
   * @param projectId - Project ID
   * @see docks/neon/branch/listBranches.json
   */
  async listBranches(projectId: string): Promise<NeonBranch[]> {
    const response = await this.request<{ branches: NeonBranch[] }>(
      `/projects/${projectId}/branches`
    )
    // Response might be { branches: [...] } or array directly
    if (Array.isArray(response)) {
      return response
    }
    return response.branches || []
  }

  /**
   * List databases for a branch
   * 
   * @param projectId - Project ID
   * @param branchId - Branch ID
   */
  async listDatabases(projectId: string, branchId: string): Promise<NeonDatabase[]> {
    const response = await this.request<{ databases: NeonDatabase[] }>(
      `/projects/${projectId}/branches/${branchId}/databases`
    )
    // Response might be { databases: [...] } or array directly
    if (Array.isArray(response)) {
      return response
    }
    return response.databases || []
  }

  /**
   * List snapshots for a branch
   * 
   * @param projectId - Project ID
   * @param branchId - Branch ID
   * @see docks/neon/snapshot/listSnapshots.json
   */
  async listSnapshots(projectId: string, branchId: string): Promise<NeonSnapshot[]> {
    const response = await this.request<{ snapshots: NeonSnapshot[] }>(
      `/projects/${projectId}/branches/${branchId}/snapshots`
    )
    // Response is { snapshots: [...] }
    if (Array.isArray(response)) {
      return response
    }
    return response.snapshots || []
  }
}
```

**Reference**: 
- `convex/docks/adapters/turso/api.ts` for pattern
- Add `listSnapshots()` method for fetching snapshots

---

### Task 3: Create Neon Adapter

**File**: `convex/docks/adapters/neon/adapter.ts`

**Create adapter implementation:**

```typescript
/**
 * Neon Dock Adapter
 * 
 * Translates Neon API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /projects → listProjects()
 * - GET /projects/{id}/branches → listBranches()
 * - GET /projects/{id}/branches/{id}/databases → syncDatabases()
 * 
 * @see docks/neon/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { NeonAPI } from "./api"
import type { NeonProject, NeonBranch, NeonDatabase, NeonSnapshot } from "./types"

/**
 * Map Neon database status to universal status
 * 
 * Priority order:
 * 1. branch.current_state === "archived" → "archived"
 * 2. branch.current_state === "suspended" → "blocked"
 * 3. else → "active"
 */
function mapNeonStatus(
  project: NeonProject,
  branch: NeonBranch,
  database: NeonDatabase
): string {
  if (branch.current_state === "archived") {
    return "archived"
  }
  if (branch.current_state === "suspended") {
    return "blocked"
  }
  return "active"
}

export const neonAdapter: DockAdapter = {
  provider: "neon",

  /**
   * Validate Neon API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new NeonAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      // Log error for debugging but return false for invalid credentials
      console.error("Neon credential validation failed:", error)
      // Re-throw to get more detail in the mutation
      throw error
    }
  },

  /**
   * Sync Neon databases to universal `databases` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each project → branch → database, upsert into `databases` table
   * 4. Map status using priority order
   * 5. Store all Neon fields in fullApiData
   */
  async syncDatabases(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: Array<{
      project: NeonProject
      branch: NeonBranch
      database: NeonDatabase
    }>
  ): Promise<void> {
    let databases: Array<{
      project: NeonProject
      branch: NeonBranch
      database: NeonDatabase
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

      const api = new NeonAPI(apiKey)

      // Get all projects
      const projects = await api.listProjects()
      if (projects.length === 0) {
        console.log("[Neon] No projects found")
        return
      }

      // For each project, get branches, then databases
      databases = []
      for (const project of projects) {
        const branches = await api.listBranches(project.id)
        for (const branch of branches) {
          const branchDatabases = await api.listDatabases(project.id, branch.id)
          for (const database of branchDatabases) {
            databases.push({ project, branch, database })
          }
        }
      }
    }

    // Sync each database to universal table
    for (const { project, branch, database } of databases) {
      // Use database.id or create composite ID: project-branch-database
      const providerResourceId = database.id || `${project.id}-${branch.id}-${database.name}`

      const existing = await ctx.db
        .query("databases")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const databaseData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "neon",
        providerResourceId,
        name: database.name,
        engine: "postgresql", // Neon uses PostgreSQL
        version: branch.pg_version || "unknown",
        status: mapNeonStatus(project, branch, database),
        fullApiData: {
          // Store all Neon fields
          project: {
            id: project.id,
            name: project.name,
            region_id: project.region_id,
            created_at: project.created_at,
            updated_at: project.updated_at,
            status: project.status,
          },
          branch: {
            id: branch.id,
            name: branch.name,
            project_id: branch.project_id,
            created_at: branch.created_at,
            updated_at: branch.updated_at,
            status: branch.status,
            pg_version: branch.pg_version,
          },
          database: {
            id: database.id,
            name: database.name,
            branch_id: database.branch_id,
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

  /**
   * Sync Neon snapshots to universal `backupSchedules` table
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each snapshot, upsert into `backupSchedules` table
   * 4. Map Neon snapshot fields to universal schema
   * 5. Store all Neon fields in fullApiData
   */
  async syncBackupSchedules(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: Array<{
      project: NeonProject
      branch: NeonBranch
      snapshot: NeonSnapshot
    }>
  ): Promise<void> {
    let snapshots: Array<{
      project: NeonProject
      branch: NeonBranch
      snapshot: NeonSnapshot
    }>

    if (preFetchedData) {
      // Use pre-fetched data from action
      snapshots = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new NeonAPI(apiKey)

      // Get all projects → branches → snapshots
      const projects = await api.listProjects()
      snapshots = []
      
      for (const project of projects) {
        const branches = await api.listBranches(project.id)
        for (const branch of branches) {
          const branchSnapshots = await api.listSnapshots(project.id, branch.id)
          for (const snapshot of branchSnapshots) {
            snapshots.push({ project, branch, snapshot })
          }
        }
      }
    }

    // Sync each snapshot to universal table
    for (const { project, branch, snapshot } of snapshots) {
      // Use snapshot.id as providerResourceId
      const existing = await ctx.db
        .query("backupSchedules")
        .withIndex("by_dock_schedule", (q) =>
          q.eq("dockId", dock._id).eq("scheduleId", parseInt(snapshot.id.replace(/\D/g, "")) || 0)
        )
        .first()

      // Map Neon snapshot to universal backupSchedules schema
      // Note: backupSchedules has GridPane-specific fields, so we'll adapt them
      const backupData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "neon",
        providerResourceId: snapshot.id,
        siteId: 0, // Neon doesn't have sites, use 0 as placeholder
        siteUrl: `${project.name}/${branch.name}`, // Project/Branch identifier
        scheduleId: parseInt(snapshot.id.replace(/\D/g, "")) || 0, // Extract numbers from ID
        type: "remote" as const, // Neon snapshots are remote backups
        frequency: "manual" as any, // Snapshots are manual, not scheduled
        hour: "00",
        minute: "00",
        time: "00:00",
        dayOfWeek: undefined, // Manual snapshots don't have schedule
        serviceId: undefined, // No integration ID for Neon snapshots
        serviceName: "neon-snapshot",
        enabled: true, // Snapshots are always enabled once created
        remoteBackupsEnabled: true,
        fullApiData: {
          project: {
            id: project.id,
            name: project.name,
            region_id: project.region_id,
          },
          branch: {
            id: branch.id,
            name: branch.name,
            project_id: branch.project_id,
            current_state: branch.current_state,
          },
          snapshot: {
            id: snapshot.id,
            name: snapshot.name,
            source_branch_id: snapshot.source_branch_id,
            created_at: snapshot.created_at,
            manual: snapshot.manual,
          },
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, backupData)
      } else {
        await ctx.db.insert("backupSchedules", backupData)
      }
    }
  },
}
```

**Reference**: `convex/docks/adapters/turso/adapter.ts` for pattern

---

### Task 4: Create Index File

**File**: `convex/docks/adapters/neon/index.ts`

```typescript
/**
 * Neon Adapter Export
 */
export { neonAdapter } from "./adapter"
export { NeonAPI } from "./api"
export * from "./types"
```

---

### Task 5: Update Actions - syncDockResources

**File**: `convex/docks/actions.ts`

**Add Neon case in `syncDockResources` action:**

```typescript
// At top of file, add import:
import { NeonAPI } from "./adapters/neon/api"

// In syncDockResources action handler, add else if block:
else if (args.provider === "neon") {
  const api = new NeonAPI(args.apiKey)

  // Neon requires fetching projects first
  const projects = await api.listProjects()
  
  if (projects.length === 0) {
    console.log(`[Dock Action] No projects found for Neon account`)
    databases = []
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
      console.log(`[Dock Action] Fetching databases for ${args.provider} (${allDatabases.length} databases found)`)
      databases = allDatabases
    }

    // Always fetch snapshots for Neon (similar to GridPane backups)
    console.log(`[Dock Action] Fetching snapshots for ${args.provider}`)
    const allSnapshots: Array<{
      project: any
      branch: any
      snapshot: any
    }> = []
    
    for (const project of projects) {
      const branches = await api.listBranches(project.id)
      for (const branch of branches) {
        const branchSnapshots = await api.listSnapshots(project.id, branch.id)
        for (const snapshot of branchSnapshots) {
          allSnapshots.push({ project, branch, snapshot })
        }
      }
    }
    
    backupSchedules = allSnapshots
  }

  // Neon doesn't support servers, webServices, or domains
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

**Reference**: See `convex/docks/actions.ts` lines 233-264 for Turso pattern

---

### Task 6: Update Actions - validateCredentials

**File**: `convex/docks/actions.ts`

**Add Neon case in `validateCredentials` action:**

```typescript
// In validateCredentials action handler, add else if block:
else if (args.provider === "neon") {
  const api = new NeonAPI(args.apiKey)
  return await api.validateCredentials()
}
```

**Reference**: See `convex/docks/actions.ts` lines 24-48 for pattern

---

### Task 7: Register Adapter

**File**: `convex/docks/registry.ts`

**Add import:**
```typescript
import { neonAdapter } from "./adapters/neon"
```

**Add to registry:**
```typescript
const adapterRegistry: Record<string, DockAdapter> = {
  gridpane: gridpaneAdapter,
  vercel: vercelAdapter,
  netlify: netlifyAdapter,
  cloudflare: cloudflareAdapter,
  turso: tursoAdapter,
  neon: neonAdapter,  // NEW
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
  neon: { displayName: "Neon" },  // NEW
}
```

---

## ✅ Testing Checklist

- [ ] Neon API client authenticates correctly
- [ ] `listProjects()` returns projects
- [ ] `listBranches(projectId)` returns branches
- [ ] `listDatabases(projectId, branchId)` returns databases
- [ ] `validateCredentials()` works for valid/invalid tokens
- [ ] Adapter maps status correctly (deleted → suspended → active)
- [ ] Adapter stores project, branch, and database data in `fullApiData`
- [ ] Databases sync to universal `databases` table
- [ ] Snapshots sync to universal `backupSchedules` table
- [ ] Snapshot mapping handles GridPane-specific fields (siteId, scheduleId, etc.)
- [ ] Provider appears in `listAvailableProviders` query
- [ ] No TypeScript errors
- [ ] Convex functions deploy successfully

---

## 📁 File Structure

```
convex/docks/adapters/neon/
├── types.ts          # Neon API types (from JSON files)
├── api.ts            # NeonAPI class (HTTP client)
├── adapter.ts        # neonAdapter (maps to universal schema)
└── index.ts          # Exports

docks/neon/
├── api-routes.md
├── project/
│   └── listProjects.json (to be created)
└── branch/
    └── listBranches.json (to be created)
```

---

## 🔗 Reference Files

**Pattern References:**
- `convex/docks/adapters/turso/types.ts` - Types pattern
- `convex/docks/adapters/turso/api.ts` - API client pattern
- `convex/docks/adapters/turso/adapter.ts` - Adapter pattern

**API Response Examples:**
- `docks/neon/project/listProjects.json` ✅
- `docks/neon/branch/listBranches.json` ✅
- `docks/neon/snapshot/listSnapshots.json` ✅
- `docks/neon/api-routes.md`

---

## 📝 Notes

- **One dock per account**: Each Neon account should have its own dock entry
- **Projects → Branches → Databases**: Neon's hierarchy (project contains branches, branches contain databases)
- **Status**: Priority mapping (deleted → suspended → active)
- **Engine**: Hardcode as `"postgresql"` (Neon uses PostgreSQL)
- **Version**: Use `branch.pg_version` if available, otherwise "unknown"

---

## ⚠️ Note: Database Endpoint

The database endpoint structure needs to be verified:
- `GET /projects/{projectId}/branches/{branchId}/databases`

Once we have the actual response, update `NeonDatabase` interface in `types.ts`.

---

**Ready for implementation**: Pattern established, tasks clear. API response examples available for projects, branches, and snapshots. Database endpoint needs verification.
