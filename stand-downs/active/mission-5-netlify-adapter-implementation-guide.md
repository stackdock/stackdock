# Netlify Adapter Implementation Guide

> **Location**: `stand-downs/active/mission-5-netlify-adapter-implementation-guide.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/active/mission-5-netlify-adapter-implementation-guide.md`  
> **Last Updated**: January 11, 2025  
> **Status**: Ready for Implementation  
> **Agent**: `backend-convex`  
> **Estimated Time**: 0.5 days

---

## Critical Clarification: Netlify Sites vs StackDock Projects

**IMPORTANT**: These are TWO DIFFERENT concepts:

1. **Netlify Sites** = Provider resources (web applications) → Sync to `webServices` table
2. **StackDock Projects** = Logical groupings → `projects` table (user-created, NOT synced)

**The adapter should:**
- ✅ Sync Netlify sites to `webServices` table
- ❌ NOT create StackDock `projects` automatically
- ❌ NOT create `projectResources` links automatically
- ✅ Users will link Netlify webServices to StackDock projects manually later

---

## API Response Analysis

**Source**: `docks/netlify/site/listSites.json`

### Response Structure
```json
[
  {
    "id": "fc7cd4a9-6639-4a6a-907b-844526a43b87",
    "site_id": "fc7cd4a9-6639-4a6a-907b-844526a43b87",
    "name": "stackdock-docs",
    "url": "http://stackdock-docs.netlify.app",
    "ssl_url": "https://stackdock-docs.netlify.app",
    "default_domain": "stackdock-docs.netlify.app",
    "state": "current",
    "lifecycle_state": "active",
    "build_settings": {
      "repo_path": "stackdock/docs",
      "repo_url": "https://github.com/stackdock/docs"
    }
  }
]
```

**Key Observations:**
- Returns array directly (not wrapped in object)
- Sites have both `id` and `site_id` (same value, use `id`)
- Has both `url` (HTTP) and `ssl_url` (HTTPS) - prefer `ssl_url`
- `lifecycle_state` = "active", "inactive", "suspended", "deleted"
- `state` = "current" (indicates active deployment)
- Git repo in `build_settings.repo_path` (already formatted as "org/repo")

---

## Field Mapping: Netlify Site → Universal `webServices`

### Direct Mappings

| Universal Field | Netlify Source | Example | Notes |
|----------------|---------------|---------|-------|
| `providerResourceId` | `site.id` | `"fc7cd4a9-6639-4a6a-907b-844526a43b87"` | Use `id` (not `site_id`) |
| `name` | `site.name` | `"stackdock-docs"` | Site name |
| `productionUrl` | `site.ssl_url` (prefer) or `site.url` | `"https://stackdock-docs.netlify.app"` | Prefer HTTPS |
| `environment` | Always `"production"` | `"production"` | Sites are production deployments |
| `gitRepo` | `build_settings.repo_path` | `"stackdock/docs"` | Already formatted |
| `status` | `lifecycle_state` (primary) or `state` | `"active"` → `"running"` | See status mapping |
| `fullApiData` | `site` (entire object) | `{ ... }` | Store all Netlify-specific fields |

### Status Mapping Function

```typescript
function mapNetlifyStatus(lifecycleState: string, state?: string): string {
  // Primary: lifecycle_state
  const lifecycleMap: Record<string, string> = {
    active: "running",
    inactive: "stopped",
    suspended: "stopped",
    deleted: "stopped",
  }
  
  if (lifecycleState && lifecycleMap[lifecycleState]) {
    return lifecycleMap[lifecycleState]
  }
  
  // Fallback: state field
  if (state === "current") {
    return "running"
  }
  
  return lifecycleState?.toLowerCase() || "pending"
}
```

### Edge Cases

1. **No SSL URL**: If `ssl_url` missing, use `url` and convert to HTTPS
2. **No Git Repo Path**: If `build_settings.repo_path` missing, extract from `repo_url` or set to `undefined`
3. **No Status**: If both `lifecycle_state` and `state` missing, default to `"pending"`
4. **URL Formatting**: Ensure `productionUrl` has `https://` protocol

---

## Implementation Files

### File 1: `convex/docks/adapters/netlify/types.ts`

```typescript
/**
 * Netlify API Types
 * 
 * Generated from actual API responses in docks/netlify/
 * 
 * @see docks/netlify/site/listSites.json
 */

/**
 * Netlify Site
 * @see docks/netlify/site/listSites.json
 */
export interface NetlifySite {
  id: string  // "fc7cd4a9-6639-4a6a-907b-844526a43b87"
  site_id: string  // Same as id
  plan: string  // "nf_team_dev"
  premium: boolean
  claimed: boolean
  name: string  // "stackdock-docs"
  custom_domain: string | null
  url: string  // "http://stackdock-docs.netlify.app"
  ssl_url: string  // "https://stackdock-docs.netlify.app"
  default_domain: string  // "stackdock-docs.netlify.app"
  state: string  // "current"
  lifecycle_state: "active" | "inactive" | "suspended" | "deleted" | string
  created_at: string  // ISO 8601 timestamp
  updated_at: string  // ISO 8601 timestamp
  build_settings: {
    repo_url?: string  // "https://github.com/stackdock/docs"
    repo_path?: string  // "stackdock/docs"
    repo_branch?: string  // "main"
    provider?: string  // "github"
    [key: string]: any
  }
  [key: string]: any  // All other fields
}

/**
 * Netlify User (for validateCredentials)
 * Netlify API: GET /api/v1/user
 */
export interface NetlifyUser {
  id: string
  email: string
  full_name: string
  [key: string]: any
}
```

---

### File 2: `convex/docks/adapters/netlify/api.ts`

```typescript
/**
 * Netlify API Client
 * 
 * Handles all HTTP requests to Netlify API
 * 
 * @see docks/netlify/ for API response examples
 */

import type {
  NetlifySite,
  NetlifyUser,
} from "./types"

export class NetlifyAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://api.netlify.com") {
    this.apiKey = apiKey.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Netlify API
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
        `Netlify API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /api/v1/user endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/v1/user`
      console.log(`[Netlify] Validating credentials against: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Netlify] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Netlify] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Netlify] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Netlify API error (${response.status}): ${errorText}`
        )
      }

      console.log(`[Netlify] Credentials validated successfully`)
      return true
    } catch (error) {
      console.error(`[Netlify] Validation error:`, error)
      if (error instanceof Error) {
        throw new Error(
          `Failed to validate Netlify credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * Get all sites
   * GET /api/v1/sites
   * 
   * Returns array of sites directly (not wrapped in object)
   */
  async getSites(): Promise<NetlifySite[]> {
    return await this.request<NetlifySite[]>("/api/v1/sites")
  }

  /**
   * Get single site by ID
   * GET /api/v1/sites/{id}
   */
  async getSite(siteId: string): Promise<NetlifySite> {
    return await this.request<NetlifySite>(`/api/v1/sites/${siteId}`)
  }
}
```

---

### File 3: `convex/docks/adapters/netlify/adapter.ts`

```typescript
/**
 * Netlify Dock Adapter
 * 
 * Translates Netlify API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /api/v1/sites → syncWebServices()
 * - GET /api/v1/user → validateCredentials()
 * 
 * @see docks/netlify/ for API response examples
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { NetlifyAPI } from "./api"
import type { NetlifySite } from "./types"

/**
 * Map Netlify lifecycle_state to universal status
 */
function mapNetlifyStatus(lifecycleState: string, state?: string): string {
  // Primary: lifecycle_state
  const lifecycleMap: Record<string, string> = {
    active: "running",
    inactive: "stopped",
    suspended: "stopped",
    deleted: "stopped",
  }
  
  if (lifecycleState && lifecycleMap[lifecycleState]) {
    return lifecycleMap[lifecycleState]
  }
  
  // Fallback: state field
  if (state === "current") {
    return "running"
  }
  
  return lifecycleState?.toLowerCase() || "pending"
}

/**
 * Get production URL from Netlify site
 * Prefers ssl_url (HTTPS), falls back to url (add https:// if needed)
 */
function getProductionUrl(site: NetlifySite): string | undefined {
  // Prefer SSL URL (HTTPS)
  if (site.ssl_url) {
    return site.ssl_url
  }
  
  // Fall back to HTTP URL, convert to HTTPS
  if (site.url) {
    return site.url.startsWith("https") ? site.url : site.url.replace("http://", "https://")
  }
  
  // Try default_domain
  if (site.default_domain) {
    return `https://${site.default_domain}`
  }
  
  return undefined
}

/**
 * Get git repository from Netlify site build_settings
 * Format: "org/repo" (e.g., "stackdock/docs")
 */
function getGitRepo(site: NetlifySite): string | undefined {
  if (!site.build_settings) return undefined
  
  // Prefer repo_path (already in "org/repo" format)
  if (site.build_settings.repo_path) {
    return site.build_settings.repo_path
  }
  
  // Extract from repo_url if available
  if (site.build_settings.repo_url) {
    const url = site.build_settings.repo_url
    // Extract from "https://github.com/stackdock/docs" → "stackdock/docs"
    const match = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/)
    if (match) {
      return `${match[1]}/${match[2]}`
    }
  }
  
  return undefined
}

/**
 * Get environment from Netlify site
 * Sites are always production deployments
 */
function getEnvironment(site: NetlifySite): string {
  return "production"
}

/**
 * Get status from Netlify site
 * Uses lifecycle_state primarily, falls back to state
 */
function getStatus(site: NetlifySite): string {
  return mapNetlifyStatus(site.lifecycle_state || "", site.state)
}

/**
 * Netlify Dock Adapter
 * 
 * Implements DockAdapter interface for Netlify provider
 */
export const netlifyAdapter: DockAdapter = {
  provider: "netlify",

  /**
   * Validate Netlify API credentials
   * Uses lightweight GET /api/v1/user endpoint
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new NetlifyAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("Netlify credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync Netlify sites to universal webServices table
   * GET /api/v1/sites
   * 
   * IMPORTANT: Netlify "sites" are provider resources, NOT StackDock projects.
   * They sync to webServices table. Users will link them to StackDock projects manually.
   */
  async syncWebServices(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: NetlifySite[]
  ): Promise<void> {
    let sites: NetlifySite[]
    
    if (preFetchedData) {
      // Use pre-fetched data from action
      sites = preFetchedData
    } else {
      // Fetch data directly (for direct mutation calls or testing)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new NetlifyAPI(apiKey)
      sites = await api.getSites()
    }

    for (const site of sites) {
      // Check if site already exists
      const existing = await ctx.db
        .query("webServices")
        .withIndex("by_dock_resource", (q) =>
          q
            .eq("dockId", dock._id)
            .eq("providerResourceId", site.id)
        )
        .first()

      const universalWebService = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "netlify",
        providerResourceId: site.id,
        name: site.name,
        productionUrl: getProductionUrl(site),
        environment: getEnvironment(site),
        gitRepo: getGitRepo(site),
        status: getStatus(site),
        fullApiData: site, // Store all Netlify-specific fields
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

**File**: `convex/docks/adapters/netlify/index.ts`

```typescript
/**
 * Netlify Adapter Export
 */
export { netlifyAdapter } from "./adapter"
export { NetlifyAPI } from "./api"
export * from "./types"
```

---

### File 5: Register Adapter

**File**: `convex/docks/registry.ts`

**Add import** (after Vercel import):
```typescript
import { netlifyAdapter } from "./adapters/netlify"
```

**Add to registry** (after vercel):
```typescript
const adapterRegistry: Record<string, DockAdapter> = {
  gridpane: gridpaneAdapter,
  vercel: vercelAdapter,
  netlify: netlifyAdapter,  // Add this line
  // Add more adapters here:
  // digitalocean: digitaloceanAdapter,
}
```

**Add to metadata** (after vercel):
```typescript
const providerMetadata: Record<string, { displayName: string }> = {
  gridpane: { displayName: "GridPane" },
  vercel: { displayName: "Vercel" },
  netlify: { displayName: "Netlify" },  // Add this line
  // Add more as adapters are added:
  // digitalocean: { displayName: "DigitalOcean" },
}
```

---

### File 6: Update Action to Fetch Netlify Sites

**File**: `convex/docks/actions.ts`

**Add import** (after Vercel import):
```typescript
import { NetlifyAPI } from "./adapters/netlify/api"
```

**Add Netlify case** (after Vercel case, around line 138):
```typescript
} else if (args.provider === "netlify") {
  // Netlify-specific: Use NetlifyAPI directly
  const api = new NetlifyAPI(args.apiKey)

  // Netlify only supports webServices (sites)
  if (args.resourceTypes.includes("webServices")) {
    console.log(`[Dock Action] Fetching sites for ${args.provider}`)
    webServices = await api.getSites()
  }

  // Netlify doesn't support servers, domains, or databases via this API
  if (args.resourceTypes.includes("servers")) {
    console.log(`[Dock Action] Servers not supported for ${args.provider}`)
    servers = []
  }

  if (args.resourceTypes.includes("domains")) {
    console.log(`[Dock Action] Domains not supported for ${args.provider} (use separate domains API)`)
    domains = []
  }

  if (args.resourceTypes.includes("databases")) {
    console.log(`[Dock Action] Databases not supported for ${args.provider}`)
    databases = []
  }
}
```

---

### File 7: `convex/docks/adapters/netlify/README.md`

```markdown
# Netlify Dock Adapter

> **Provider**: Netlify  
> **Type**: PaaS (Web Services)  
> **API Docs**: https://docs.netlify.com/api/get-started/

## Overview

Netlify adapter syncs Netlify sites (web applications) to StackDock's universal `webServices` table.

**Important**: Netlify "sites" are provider resources, NOT StackDock projects. They sync to `webServices`. Users link them to StackDock projects manually via `projectResources` table.

## Endpoints Used

- `GET /api/v1/user` - Validate credentials
- `GET /api/v1/sites` - List all sites

## Field Mappings

| Universal Field | Netlify Source | Example |
|----------------|---------------|---------|
| `providerResourceId` | `site.id` | `"fc7cd4a9-6639-4a6a-907b-844526a43b87"` |
| `name` | `site.name` | `"stackdock-docs"` |
| `productionUrl` | `site.ssl_url` (prefer) | `"https://stackdock-docs.netlify.app"` |
| `environment` | Always `"production"` | `"production"` |
| `gitRepo` | `build_settings.repo_path` | `"stackdock/docs"` |
| `status` | `lifecycle_state` | `"active"` → `"running"` |

## Status Mapping

- `active` → `running`
- `inactive` → `stopped`
- `suspended` → `stopped`
- `deleted` → `stopped`
- `current` (state) → `running` (fallback)

## API Rate Limits

- 1000 requests per hour per access token
- See: https://docs.netlify.com/api/get-started/#rate-limits

## Authentication

Bearer token in `Authorization` header:
```
Authorization: Bearer {apiKey}
```

## Example Usage

```typescript
import { netlifyAdapter } from "./adapters/netlify/adapter"

// Validate credentials
const isValid = await netlifyAdapter.validateCredentials(apiKey)

// Sync web services
await netlifyAdapter.syncWebServices(ctx, dock)
```

## API Response Examples

See `docks/netlify/` directory for actual API response examples:
- `docks/netlify/site/listSites.json`
```

---

## Testing Checklist

After implementation, verify:

- [ ] `validateCredentials()` works with valid API key
- [ ] `validateCredentials()` returns false for invalid API key
- [ ] `syncWebServices()` fetches sites from Netlify API
- [ ] Sites sync to `webServices` table correctly
- [ ] `providerResourceId` uses site ID
- [ ] `productionUrl` prefers `ssl_url` (HTTPS)
- [ ] Status mapping works (`active` → `running`, etc.)
- [ ] `gitRepo` format is `"org/repo"` (e.g., `"stackdock/docs"`)
- [ ] `fullApiData` contains entire site object
- [ ] Existing sites update (not duplicate)
- [ ] Data displays in UI tables
- [ ] Provider badge shows "netlify"
- [ ] Netlify appears in provider dropdown

---

## Reference Implementation

**Vercel Adapter**: `convex/docks/adapters/vercel/` (follow this pattern exactly)

**Key Patterns to Follow**:
- API client structure (`api.ts`)
- Type definitions (`types.ts`)
- Adapter implementation (`adapter.ts`)
- Error handling
- Upsert pattern (check existing, update or insert)
- Pre-fetched data support

---

## Common Pitfalls to Avoid

1. **Don't confuse Netlify sites with StackDock projects**
   - Netlify sites → `webServices` table
   - StackDock projects → `projects` table (user-created)

2. **Use site ID, not site_id**
   - `providerResourceId` = `site.id`
   - Both exist but `id` is preferred

3. **Prefer SSL URL**
   - Use `ssl_url` if available (HTTPS)
   - Fall back to `url` and convert to HTTPS

4. **Git repo extraction**
   - Prefer `build_settings.repo_path` (already formatted)
   - Extract from `repo_url` if needed

5. **Status mapping**
   - Primary: `lifecycle_state`
   - Fallback: `state` field

---

## Next Steps After Implementation

1. Test with real Netlify API key
2. Verify data displays in UI tables
3. Document any edge cases found
4. Move to next provider (DigitalOcean or Cloudflare)

---

**Remember**: Follow Vercel pattern exactly. The universal schema should work for GridPane, Vercel, and Netlify without changes.
