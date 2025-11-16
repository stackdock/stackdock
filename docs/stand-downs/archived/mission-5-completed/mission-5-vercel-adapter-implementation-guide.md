# Vercel Adapter Implementation Guide

> **Location**: `stand-downs/active/mission-5-vercel-adapter-implementation-guide.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/active/mission-5-vercel-adapter-implementation-guide.md`  
> **Last Updated**: January 11, 2025  
> **Status**: Ready for Implementation  
> **Agent**: `backend-convex`  
> **Estimated Time**: 0.5 days

---

## Critical Clarification: Vercel Projects vs StackDock Projects

**IMPORTANT**: These are TWO DIFFERENT concepts:

1. **Vercel Projects** = Provider resources (web applications) → Sync to `webServices` table
2. **StackDock Projects** = Logical groupings → `projects` table (user-created, NOT synced)

**The adapter should:**
- ✅ Sync Vercel projects to `webServices` table
- ❌ NOT create StackDock `projects` automatically
- ❌ NOT create `projectResources` links automatically
- ✅ Users will link Vercel webServices to StackDock projects manually later

---

## API Response Analysis

**Source**: `docks/vercel/projects/retrievealistofprojects.json`

### Response Structure
```json
{
  "projects": [
    {
      "id": "prj_8kpgj4jqKA28AHdtuidFVW7lij1U",
      "name": "vapr-ballistics-js-client",
      "createdAt": 1762015219297,
      "updatedAt": 1762015295267,
      "framework": "nextjs",
      "link": {
        "type": "github",
        "repo": "vapr-ballistics",
        "org": "robsdevcraft",
        "productionBranch": "main"
      },
      "targets": {
        "production": {
          "id": "dpl_5rHTuBraeiW5wTRyKN99uotLzzyY",
          "url": "vapr-ballistics-js-client-qxjujfn7z-vaos.vercel.app",
          "readyState": "READY",
          "target": "production",
          "alias": ["vapr-ballistics-js-client.vercel.app", ...],
          "createdAt": 1762015221392,
          "readyAt": 1762015295004
        }
      },
      "latestDeployments": [...]
    }
  ],
  "pagination": { "count": 2, "next": null, "prev": 1762015295267 }
}
```

---

## Field Mapping: Vercel Project → Universal `webServices`

### Direct Mappings

| Universal Field | Vercel Source | Example | Notes |
|----------------|---------------|---------|-------|
| `providerResourceId` | `project.id` | `"prj_8kpgj4jqKA28AHdtuidFVW7lij1U"` | Use project ID, not deployment ID |
| `name` | `project.name` | `"vapr-ballistics-js-client"` | Project name |
| `productionUrl` | `targets.production.url` | `"vapr-ballistics-js-client-qxjujfn7z-vaos.vercel.app"` | Add `https://` prefix |
| `environment` | `targets.production.target` | `"production"` | Always "production" for projects |
| `gitRepo` | `link.org + "/" + link.repo` | `"robsdevcraft/vapr-ballistics"` | Combine org + repo |
| `status` | `targets.production.readyState` | `"READY"` → `"running"` | See status mapping below |
| `fullApiData` | `project` (entire object) | `{ ... }` | Store all Vercel-specific fields |

### Status Mapping Function

```typescript
function mapVercelStatus(readyState: string): string {
  const statusMap: Record<string, string> = {
    READY: "running",
    BUILDING: "pending",
    ERROR: "error",
    QUEUED: "pending",
    CANCELED: "stopped",
  }
  return statusMap[readyState] || readyState.toLowerCase()
}
```

### Edge Cases

1. **No Production Deployment**: If `targets.production` doesn't exist, use `latestDeployments[0]` or set status to `"pending"`
2. **No URL**: If `targets.production.url` is missing, set `productionUrl` to `undefined`
3. **No Git Link**: If `link` is missing, set `gitRepo` to `undefined`
4. **Multiple Aliases**: Use first alias from `targets.production.alias[0]` for custom domain (if extracting domains)

---

## Implementation Files

### File 1: `convex/docks/adapters/vercel/types.ts`

```typescript
/**
 * Vercel API Types
 * 
 * Generated from actual API responses in docks/vercel/
 * 
 * @see docks/vercel/projects/retrievealistofprojects.json
 */

/**
 * Vercel Projects Response
 */
export interface VercelProjectsResponse {
  projects: VercelProject[]
  pagination: {
    count: number
    next: number | null
    prev: number | null
  }
}

/**
 * Vercel Project
 * @see docks/vercel/projects/retrievealistofprojects.json
 */
export interface VercelProject {
  id: string  // "prj_8kpgj4jqKA28AHdtuidFVW7lij1U"
  name: string  // "vapr-ballistics-js-client"
  accountId: string
  createdAt: number  // Unix timestamp in milliseconds
  updatedAt: number
  framework: string | null  // "nextjs", "react", etc.
  nodeVersion: string | null  // "22.x"
  live: boolean
  link: {
    type: "github" | "gitlab" | "bitbucket"
    repo: string  // "vapr-ballistics"
    org: string  // "robsdevcraft"
    repoId: number
    productionBranch: string  // "main"
    createdAt: number
    updatedAt: number
  } | null
  targets: {
    production?: VercelDeployment
    preview?: VercelDeployment
  }
  latestDeployments: VercelDeployment[]
  [key: string]: any  // All other fields
}

/**
 * Vercel Deployment
 */
export interface VercelDeployment {
  id: string  // "dpl_5rHTuBraeiW5wTRyKN99uotLzzyY"
  url: string  // "vapr-ballistics-js-client-qxjujfn7z-vaos.vercel.app"
  readyState: "READY" | "BUILDING" | "ERROR" | "QUEUED" | "CANCELED"
  readySubstate?: string  // "PROMOTED", etc.
  target: "production" | "preview" | null
  alias: string[]  // Array of domain aliases
  aliasAssigned: number | null  // Unix timestamp
  aliasError: string | null
  createdAt: number
  buildingAt: number | null
  readyAt: number | null
  plan: "hobby" | "pro" | "enterprise"
  type: "LAMBDAS" | "STATIC"
  createdIn: string  // Region: "sfo1", "iad1", etc.
  [key: string]: any  // All other fields
}

/**
 * Vercel User (for validateCredentials)
 */
export interface VercelUser {
  user: {
    id: string
    username: string
    email: string
    name: string
  }
}
```

---

### File 2: `convex/docks/adapters/vercel/api.ts`

```typescript
/**
 * Vercel API Client
 * 
 * Handles all HTTP requests to Vercel API
 * 
 * @see docks/vercel/ for API response examples
 */

import type {
  VercelProjectsResponse,
  VercelProject,
  VercelUser,
} from "./types"

export class VercelAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://api.vercel.com") {
    this.apiKey = apiKey.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Vercel API
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
        `Vercel API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /v2/user endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/v2/user`
      console.log(`[Vercel] Validating credentials against: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Vercel] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Vercel] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Vercel] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Vercel API error (${response.status}): ${errorText}`
        )
      }

      console.log(`[Vercel] Credentials validated successfully`)
      return true
    } catch (error) {
      console.error(`[Vercel] Validation error:`, error)
      if (error instanceof Error) {
        throw new Error(
          `Failed to validate Vercel credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * Get all projects
   * GET /v9/projects
   * 
   * Note: Vercel API uses pagination. For MVP, fetch first page only.
   * Can add pagination support later if needed.
   */
  async getProjects(): Promise<VercelProject[]> {
    const response = await this.request<VercelProjectsResponse>(
      "/v9/projects"
    )
    return response.projects
  }

  /**
   * Get single project by ID
   * GET /v9/projects/{id}
   */
  async getProject(projectId: string): Promise<VercelProject> {
    return await this.request<VercelProject>(`/v9/projects/${projectId}`)
  }
}
```

---

### File 3: `convex/docks/adapters/vercel/adapter.ts`

```typescript
/**
 * Vercel Dock Adapter
 * 
 * Translates Vercel API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /v9/projects → syncWebServices()
 * - GET /v2/user → validateCredentials()
 * 
 * @see docks/vercel/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { VercelAPI } from "./api"

/**
 * Map Vercel deployment readyState to universal status
 */
function mapVercelStatus(readyState: string): string {
  const statusMap: Record<string, string> = {
    READY: "running",
    BUILDING: "pending",
    ERROR: "error",
    QUEUED: "pending",
    CANCELED: "stopped",
  }
  return statusMap[readyState] || readyState.toLowerCase()
}

/**
 * Get production URL from Vercel project
 * Prefers targets.production.url, falls back to latestDeployments[0].url
 */
function getProductionUrl(project: any): string | undefined {
  // Try targets.production first
  if (project.targets?.production?.url) {
    const url = project.targets.production.url
    return url.startsWith("http") ? url : `https://${url}`
  }
  
  // Fall back to latest deployment
  if (project.latestDeployments?.[0]?.url) {
    const url = project.latestDeployments[0].url
    return url.startsWith("http") ? url : `https://${url}`
  }
  
  return undefined
}

/**
 * Get git repository from Vercel project link
 * Format: "org/repo" (e.g., "robsdevcraft/vapr-ballistics")
 */
function getGitRepo(project: any): string | undefined {
  if (!project.link) return undefined
  const { org, repo } = project.link
  if (org && repo) {
    return `${org}/${repo}`
  }
  return undefined
}

/**
 * Get environment from Vercel project
 * For projects, always "production" (preview deployments handled separately if needed)
 */
function getEnvironment(project: any): string {
  return project.targets?.production?.target || "production"
}

/**
 * Get status from Vercel project
 * Uses production deployment readyState
 */
function getStatus(project: any): string {
  // Try production deployment first
  if (project.targets?.production?.readyState) {
    return mapVercelStatus(project.targets.production.readyState)
  }
  
  // Fall back to latest deployment
  if (project.latestDeployments?.[0]?.readyState) {
    return mapVercelStatus(project.latestDeployments[0].readyState)
  }
  
  // Default to pending if no deployment info
  return "pending"
}

/**
 * Vercel Dock Adapter
 * 
 * Implements DockAdapter interface for Vercel provider
 */
export const vercelAdapter: DockAdapter = {
  provider: "vercel",

  /**
   * Validate Vercel API credentials
   * Uses lightweight GET /v2/user endpoint
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new VercelAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("Vercel credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync Vercel projects to universal webServices table
   * GET /v9/projects
   * 
   * IMPORTANT: Vercel "projects" are provider resources, NOT StackDock projects.
   * They sync to webServices table. Users will link them to StackDock projects manually.
   */
  async syncWebServices(
    ctx: MutationCtx,
    dock: Doc<"docks">
  ): Promise<void> {
    // Decrypt API key with audit logging
    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })
    const api = new VercelAPI(apiKey)

    const projects = await api.getProjects()

    for (const project of projects) {
      // Check if project already exists
      const existing = await ctx.db
        .query("webServices")
        .withIndex("by_dock_resource", (q) =>
          q
            .eq("dockId", dock._id)
            .eq("providerResourceId", project.id)
        )
        .first()

      const universalWebService = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "vercel",
        providerResourceId: project.id,
        name: project.name,
        productionUrl: getProductionUrl(project),
        environment: getEnvironment(project),
        gitRepo: getGitRepo(project),
        status: getStatus(project),
        fullApiData: project, // Store all Vercel-specific fields
        updatedAt: Date.now(),
      }

      if (existing) {
        // Update existing web service
        await ctx.db.patch(existing._id, universalWebService)
      } else {
        // Insert new web service
        await ctx.db.insert("webServices", universalWebService)
      }
    }
  },
}
```

---

### File 4: Create Index Export

**File**: `convex/docks/adapters/vercel/index.ts`

```typescript
/**
 * Vercel Adapter Export
 */
export { vercelAdapter } from "./adapter"
export { VercelAPI } from "./api"
export * from "./types"
```

---

### File 5: Register Adapter

**File**: `convex/docks/registry.ts`

```typescript
import { gridpaneAdapter } from "./adapters/gridpane"
import { vercelAdapter } from "./adapters/vercel"  // Add import

const adapterRegistry: Record<string, DockAdapter> = {
  gridpane: gridpaneAdapter,
  vercel: vercelAdapter,  // Add this line
  // Add more adapters here:
  // digitalocean: digitaloceanAdapter,
}
```

---

### File 6: `convex/docks/adapters/vercel/README.md`

```markdown
# Vercel Dock Adapter

> **Provider**: Vercel  
> **Type**: PaaS (Web Services)  
> **API Docs**: https://vercel.com/docs/rest-api

## Overview

Vercel adapter syncs Vercel projects (web applications) to StackDock's universal `webServices` table.

**Important**: Vercel "projects" are provider resources, NOT StackDock projects. They sync to `webServices`. Users link them to StackDock projects manually via `projectResources` table.

## Endpoints Used

- `GET /v2/user` - Validate credentials
- `GET /v9/projects` - List all projects

## Field Mappings

| Universal Field | Vercel Source | Example |
|----------------|---------------|---------|
| `providerResourceId` | `project.id` | `"prj_8kpgj4jqKA28AHdtuidFVW7lij1U"` |
| `name` | `project.name` | `"vapr-ballistics-js-client"` |
| `productionUrl` | `targets.production.url` | `"https://vapr-ballistics-js-client-qxjujfn7z-vaos.vercel.app"` |
| `environment` | `targets.production.target` | `"production"` |
| `gitRepo` | `link.org + "/" + link.repo` | `"robsdevcraft/vapr-ballistics"` |
| `status` | `targets.production.readyState` | `"READY"` → `"running"` |

## Status Mapping

- `READY` → `running`
- `BUILDING` → `pending`
- `ERROR` → `error`
- `QUEUED` → `pending`
- `CANCELED` → `stopped`

## API Rate Limits

- 100 requests per 10 seconds per team
- See: https://vercel.com/docs/rest-api#rate-limits

## Authentication

Bearer token in `Authorization` header:
```
Authorization: Bearer {apiKey}
```

## Example Usage

```typescript
import { vercelAdapter } from "./adapters/vercel/adapter"

// Validate credentials
const isValid = await vercelAdapter.validateCredentials(apiKey)

// Sync web services
await vercelAdapter.syncWebServices(ctx, dock)
```

## API Response Examples

See `docks/vercel/` directory for actual API response examples:
- `docks/vercel/projects/retrievealistofprojects.json`
- `docks/vercel/deployments/listdeployments.json`
- `docks/vercel/domains/listalldomains.json`
```

---

## Testing Checklist

After implementation, verify:

- [ ] `validateCredentials()` works with valid API key
- [ ] `validateCredentials()` returns false for invalid API key
- [ ] `syncWebServices()` fetches projects from Vercel API
- [ ] Projects sync to `webServices` table correctly
- [ ] `providerResourceId` uses project ID (not deployment ID)
- [ ] `productionUrl` has `https://` prefix
- [ ] `status` mapping works (`READY` → `running`, etc.)
- [ ] `gitRepo` format is `"org/repo"` (e.g., `"robsdevcraft/vapr-ballistics"`)
- [ ] `fullApiData` contains entire project object
- [ ] Existing projects update (not duplicate)
- [ ] Data displays in UI tables
- [ ] Provider badge shows "vercel"

---

## Reference Implementation

**GridPane Adapter**: `convex/docks/adapters/gridpane/`

**Key Patterns to Follow**:
- API client structure (`api.ts`)
- Type definitions (`types.ts`)
- Adapter implementation (`adapter.ts`)
- Error handling
- Upsert pattern (check existing, update or insert)

---

## Common Pitfalls to Avoid

1. **Don't confuse Vercel projects with StackDock projects**
   - Vercel projects → `webServices` table
   - StackDock projects → `projects` table (user-created)

2. **Use project ID, not deployment ID**
   - `providerResourceId` = `project.id` (e.g., `"prj_..."`)
   - NOT `deployment.id` (e.g., `"dpl_..."`)

3. **Handle missing production deployment**
   - Check `targets.production` exists
   - Fall back to `latestDeployments[0]` if needed

4. **URL formatting**
   - Vercel URLs don't include `https://`
   - Add prefix: `url.startsWith("http") ? url : `https://${url}``

5. **Git repo format**
   - Combine `link.org + "/" + link.repo`
   - Handle null `link` gracefully

---

## Next Steps After Implementation

1. Test with real Vercel API key
2. Verify data displays in UI tables
3. Document any edge cases found
4. Move to Netlify adapter (similar pattern)

---

**Remember**: Follow GridPane pattern exactly. The universal schema should work for both GridPane and Vercel without changes.
