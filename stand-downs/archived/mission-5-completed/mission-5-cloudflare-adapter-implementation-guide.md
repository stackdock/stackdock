# Cloudflare Adapter Implementation Guide

> **Location**: `stand-downs/active/mission-5-cloudflare-adapter-implementation-guide.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/active/mission-5-cloudflare-adapter-implementation-guide.md`  
> **Last Updated**: January 11, 2025  
> **Status**: Ready for Implementation  
> **Agent**: `backend-convex`  
> **Estimated Time**: 1 day  
> **Priority**: HIGH

---

## Overview

Implement Cloudflare adapter following Vercel/Netlify pattern. Cloudflare is a multi-service provider offering:
- **DNS Zones** → `domains` table (first adapter to populate domains!)
- **Pages** → `webServices` table (similar to Vercel/Netlify)
- **Workers** → `webServices` table (serverless functions)
- **DNS Records** → Stored in `domains.fullApiData.dnsRecords`

**Goal**: Get comprehensive Cloudflare coverage syncing to multiple universal tables, validate universal schema across 3 resource types.

---

## Critical Clarification: Cloudflare Resources vs StackDock Projects

**IMPORTANT**: These are TWO DIFFERENT concepts:

1. **Cloudflare Zones/Pages/Workers** = Provider resources → Sync to universal tables
2. **StackDock Projects** = Logical groupings → `projects` table (user-created, NOT synced)

**The adapter should:**
- ✅ Sync Cloudflare zones to `domains` table
- ✅ Sync Cloudflare Pages to `webServices` table
- ✅ Sync Cloudflare Workers to `webServices` table
- ✅ Store DNS records in `domains.fullApiData.dnsRecords`
- ❌ NOT create StackDock `projects` automatically
- ❌ NOT create `projectResources` links automatically
- ✅ Users will link Cloudflare resources to StackDock projects manually later

---

## API Response Analysis

**Source Files**:
- `docks/cloudflare/zones/listZones.json` - DNS zones
- `docks/cloudflare/pages/getProjects.json` - Pages projects
- `docks/cloudflare/workers/getWorkersList.json` - Workers scripts
- `docks/cloudflare/dns/records/getDNSRecordsbyZoneID.json` - DNS records per zone

### Response Structures

**Zones** (`GET /zones`):
```json
{
  "result": [
    {
      "id": "99d49ad924b01325f6c8aea94c1923bf",
      "name": "apexoutdoorsman.com",
      "status": "active",
      "account": {
        "id": "3f639213140929b3a61a48de78cb9f6f",
        "name": "Robertmanderson37@gmail.com's Account"
      },
      "plan": { "name": "Free Website", "price": 0 },
      "created_on": "2020-11-16T15:34:49.286914Z",
      "modified_on": "2020-11-16T16:07:21.413505Z"
    }
  ]
}
```

**Pages** (`GET /accounts/{account_id}/pages/projects`):
```json
{
  "result": [
    {
      "id": "35829cc2-322a-4f5d-af33-6f4050add5e4",
      "name": "vapr-ballistics",
      "domains": ["vapr-ballistics.pages.dev", "vaprballistics.com"],
      "source": {
        "config": {
          "owner": "robsdevcraft",
          "repo_name": "vapr-ballistics",
          "production_branch": "main"
        }
      },
      "canonical_deployment": {
        "url": "https://163542b1.vapr-ballistics.pages.dev",
        "status": "success"
      }
    }
  ]
}
```

**Workers** (`GET /accounts/{account_id}/workers/scripts`):
```json
{
  "result": [
    {
      "id": "620112e7b94345d0a16e8c5bdb539067",
      "name": "cloudflare-workers-next-template",
      "subdomain": { "enabled": true },
      "created_on": "2025-11-11T05:51:14.373637Z"
    }
  ]
}
```

**DNS Records** (`GET /zones/{zone_id}/dns_records`):
```json
{
  "result": [
    {
      "id": "b0906a37b6a35540314a8f71d39aabab",
      "name": "deltaninemedia.com",
      "type": "A",
      "content": "5.161.51.86",
      "proxied": false,
      "ttl": 600
    }
  ]
}
```

---

## Implementation Steps

### Step 1: Update Schema (Add Account ID)

**File**: `convex/schema.ts`

**Add to `docks` table**:
```typescript
docks: defineTable({
  // ... existing fields ...
  accountId: v.optional(v.string()), // Provider account ID (Cloudflare, AWS, etc.)
  providerMetadata: v.optional(v.any()), // Provider-specific metadata
})
```

**Rationale**: Cloudflare Pages/Workers endpoints require account ID. Extract from zones response and store for future API calls.

---

### Step 2: Create Cloudflare Types

**File**: `convex/docks/adapters/cloudflare/types.ts`

**Types Needed**:
```typescript
// Zones Response
export interface CloudflareZonesResponse {
  result: CloudflareZone[]
  result_info: {
    page: number
    per_page: number
    total_pages: number
    count: number
    total_count: number
  }
  success: boolean
  errors: any[]
  messages: any[]
}

export interface CloudflareZone {
  id: string
  name: string
  status: "active" | "pending" | "initializing" | "moved" | "deleted" | "read_only"
  paused: boolean
  type: "full" | "partial"
  account: {
    id: string
    name: string
  }
  plan: {
    id: string
    name: string
    price: number
    currency: string
  }
  created_on: string // ISO 8601
  modified_on: string // ISO 8601
  activated_on: string // ISO 8601
  name_servers: string[]
  [key: string]: any // All other fields go to fullApiData
}

// Pages Response
export interface CloudflarePagesResponse {
  result: CloudflarePage[]
  success: boolean
  errors: any[]
  messages: any[]
  result_info: {
    page: number
    per_page: number
    count: number
    total_count: number
    total_pages: number
  }
}

export interface CloudflarePage {
  id: string
  name: string
  subdomain: string
  domains: string[]
  source: {
    type: "github" | "gitlab" | "bitbucket"
    config: {
      owner: string
      repo_name: string
      production_branch: string
    }
  }
  canonical_deployment?: {
    id: string
    url: string
    environment: "production" | "preview"
    latest_stage: {
      status: "success" | "failure" | "idle"
    }
  }
  latest_deployment?: {
    id: string
    url: string
    environment: "production" | "preview"
    latest_stage: {
      status: "success" | "failure" | "idle"
    }
  }
  created_on: string
  production_branch: string
  [key: string]: any
}

// Workers Response
export interface CloudflareWorkersResponse {
  result: CloudflareWorker[]
  success: boolean
  errors: any[]
  messages: any[]
  result_info: {
    page: number
    per_page: number
    count: number
    total_count: number
  }
}

export interface CloudflareWorker {
  id: string
  name: string
  subdomain: {
    enabled: boolean
    previews_enabled: boolean
  }
  created_on: string
  updated_on: string
  [key: string]: any
}

// DNS Records Response
export interface CloudflareDNSRecordsResponse {
  result: CloudflareDNSRecord[]
  success: boolean
  errors: any[]
  messages: any[]
  result_info: {
    page: number
    per_page: number
    count: number
    total_count: number
    total_pages: number
  }
}

export interface CloudflareDNSRecord {
  id: string
  name: string
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA"
  content: string
  proxied: boolean
  proxiable: boolean
  ttl: number
  created_on: string
  modified_on: string
  [key: string]: any
}

// User Response (for validation)
export interface CloudflareUserResponse {
  result: {
    id: string
    email: string
    [key: string]: any
  }
  success: boolean
}
```

---

### Step 3: Create Cloudflare API Client

**File**: `convex/docks/adapters/cloudflare/api.ts`

**Endpoints to Implement**:
```typescript
export class CloudflareAPI {
  private baseUrl: string = "https://api.cloudflare.com/client/v4"
  private apiToken: string
  private accountId?: string // Optional, can be extracted from zones

  constructor(apiToken: string, accountId?: string) {
    this.apiToken = apiToken
    this.accountId = accountId
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ errors: [{ message: "Unknown error" }] }))
      throw new Error(`Cloudflare API error: ${error.errors?.[0]?.message || response.statusText}`)
    }

    return response.json()
  }

  /**
   * Validate API token
   * GET /user/tokens/verify (for API tokens)
   * OR GET /user (for API key + email)
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // Try token verification first (preferred method)
      const response = await this.request<CloudflareUserResponse>("/user/tokens/verify")
      return response.success === true
    } catch {
      // Fall back to user endpoint
      try {
        const response = await this.request<CloudflareUserResponse>("/user")
        return response.success === true
      } catch {
        return false
      }
    }
  }

  /**
   * Get all DNS zones
   * GET /zones
   */
  async getZones(): Promise<CloudflareZone[]> {
    const response = await this.request<CloudflareZonesResponse>("/zones")
    return response.result || []
  }

  /**
   * Get DNS records for a zone
   * GET /zones/{zone_id}/dns_records
   */
  async getDNSRecords(zoneId: string): Promise<CloudflareDNSRecord[]> {
    const response = await this.request<CloudflareDNSRecordsResponse>(`/zones/${zoneId}/dns_records`)
    return response.result || []
  }

  /**
   * Get Pages projects
   * GET /accounts/{account_id}/pages/projects
   * 
   * Requires account ID (extract from zones or store in dock)
   */
  async getPages(accountId: string): Promise<CloudflarePage[]> {
    const response = await this.request<CloudflarePagesResponse>(
      `/accounts/${accountId}/pages/projects`
    )
    return response.result || []
  }

  /**
   * Get Workers scripts
   * GET /accounts/{account_id}/workers/scripts
   * 
   * Requires account ID (extract from zones or store in dock)
   */
  async getWorkers(accountId: string): Promise<CloudflareWorker[]> {
    const response = await this.request<CloudflareWorkersResponse>(
      `/accounts/${accountId}/workers/scripts`
    )
    return response.result || []
  }
}
```

**Authentication**: Bearer token in `Authorization` header
- **API Token** (preferred): `Authorization: Bearer {token}`
- **API Key + Email** (legacy): `X-Auth-Key: {key}` + `X-Auth-Email: {email}`

**Rate Limits**: 1,200 requests per 5 minutes per API token

---

### Step 4: Create Cloudflare Adapter

**File**: `convex/docks/adapters/cloudflare/adapter.ts`

**Key Functions**:

```typescript
/**
 * Map Cloudflare zone status to universal status
 */
function mapCloudflareZoneStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "active",
    pending: "pending",
    initializing: "pending",
    moved: "active", // Zone moved to another account, still active
    deleted: "stopped",
    read_only: "active", // Read-only mode, still active
  }
  return statusMap[status] || status.toLowerCase()
}

/**
 * Map Cloudflare Pages deployment status to universal status
 */
function mapCloudflarePagesStatus(deployment?: CloudflarePage["canonical_deployment"]): string {
  if (!deployment) return "pending"
  
  const stageStatus = deployment.latest_stage?.status
  if (stageStatus === "success") return "running"
  if (stageStatus === "failure") return "error"
  if (stageStatus === "idle") return "pending"
  
  return "pending"
}

/**
 * Get production URL from Cloudflare Page
 */
function getPagesProductionUrl(page: CloudflarePage): string | undefined {
  // Prefer canonical deployment URL (production)
  if (page.canonical_deployment?.url) {
    return page.canonical_deployment.url
  }
  
  // Fall back to first custom domain
  if (page.domains?.[0]) {
    const domain = page.domains[0]
    return domain.startsWith("http") ? domain : `https://${domain}`
  }
  
  // Fall back to subdomain
  if (page.subdomain) {
    return `https://${page.subdomain}`
  }
  
  return undefined
}

/**
 * Get git repo from Cloudflare Page source
 */
function getPagesGitRepo(page: CloudflarePage): string | undefined {
  if (!page.source?.config) return undefined
  
  const { owner, repo_name } = page.source.config
  if (owner && repo_name) {
    return `${owner}/${repo_name}`
  }
  
  return undefined
}

/**
 * Convert ISO 8601 string to Unix timestamp
 */
function isoToTimestamp(iso: string): number {
  return new Date(iso).getTime()
}
```

**Adapter Implementation**:

```typescript
export const cloudflareAdapter: DockAdapter = {
  provider: "cloudflare",

  async validateCredentials(apiKey: string): Promise<boolean> {
    const api = new CloudflareAPI(apiKey)
    return await api.validateCredentials()
  },

  async syncDomains(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: CloudflareZone[]
  ): Promise<void> {
    let zones: CloudflareZone[]
    
    if (preFetchedData) {
      zones = preFetchedData
    } else {
      const apiKey = await decryptApiKey(dock.encryptedApiKey)
      const api = new CloudflareAPI(apiKey)
      zones = await api.getZones()
    }

    // Extract account ID from first zone (if not already stored)
    if (zones.length > 0 && zones[0].account?.id && !dock.accountId) {
      await ctx.db.patch(dock._id, {
        accountId: zones[0].account.id,
        updatedAt: Date.now(),
      })
    }

    // Sync each zone to domains table
    for (const zone of zones) {
      const existing = await ctx.db
        .query("domains")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", zone.id)
        )
        .first()

      const domainData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "cloudflare",
        providerResourceId: zone.id,
        domainName: zone.name,
        status: mapCloudflareZoneStatus(zone.status),
        expiresAt: undefined, // DNS zones don't expire (domain registrations do)
        fullApiData: zone, // Store entire zone object
        updatedAt: isoToTimestamp(zone.modified_on),
      }

      if (existing) {
        await ctx.db.patch(existing._id, domainData)
      } else {
        await ctx.db.insert("domains", domainData)
      }
    }

    // Fetch and store DNS records for each zone
    const apiKey = await decryptApiKey(dock.encryptedApiKey)
    const api = new CloudflareAPI(apiKey)
    
    for (const zone of zones) {
      try {
        const records = await api.getDNSRecords(zone.id)
        
        // Update domain with DNS records in fullApiData
        const existing = await ctx.db
          .query("domains")
          .withIndex("by_dock_resource", (q) =>
            q.eq("dockId", dock._id).eq("providerResourceId", zone.id)
          )
          .first()

        if (existing) {
          await ctx.db.patch(existing._id, {
            fullApiData: {
              ...existing.fullApiData,
              dnsRecords: records,
            },
            updatedAt: Date.now(),
          })
        }
      } catch (error) {
        console.error(`Failed to fetch DNS records for zone ${zone.id}:`, error)
        // Continue with other zones even if one fails
      }
    }
  },

  async syncWebServices(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: any[]
  ): Promise<void> {
    // This will be called twice: once for Pages, once for Workers
    // The preFetchedData will contain the appropriate resource type
    
    if (!preFetchedData || preFetchedData.length === 0) {
      // If no pre-fetched data, we need account ID
      if (!dock.accountId) {
        throw new Error("Account ID required for Cloudflare Pages/Workers sync")
      }

      const apiKey = await decryptApiKey(dock.encryptedApiKey)
      const api = new CloudflareAPI(apiKey, dock.accountId)
      
      // Fetch both Pages and Workers
      const [pages, workers] = await Promise.all([
        api.getPages(dock.accountId),
        api.getWorkers(dock.accountId),
      ])

      // Sync Pages
      await this.syncPages(ctx, dock, pages)
      
      // Sync Workers
      await this.syncWorkers(ctx, dock, workers)
      
      return
    }

    // Determine resource type from first item
    const firstItem = preFetchedData[0]
    
    if (firstItem.id && firstItem.domains) {
      // It's a Page
      await this.syncPages(ctx, dock, preFetchedData as CloudflarePage[])
    } else if (firstItem.id && firstItem.subdomain) {
      // It's a Worker
      await this.syncWorkers(ctx, dock, preFetchedData as CloudflareWorker[])
    }
  },

  // Helper method for syncing Pages
  private async syncPages(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    pages: CloudflarePage[]
  ): Promise<void> {
    for (const page of pages) {
      const existing = await ctx.db
        .query("webServices")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", page.id)
        )
        .first()

      const webServiceData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "cloudflare",
        providerResourceId: page.id,
        name: page.name,
        productionUrl: getPagesProductionUrl(page),
        environment: page.production_branch || "production",
        gitRepo: getPagesGitRepo(page),
        status: mapCloudflarePagesStatus(page.canonical_deployment),
        fullApiData: {
          type: "pages",
          ...page,
        },
        updatedAt: isoToTimestamp(page.created_on),
      }

      if (existing) {
        await ctx.db.patch(existing._id, webServiceData)
      } else {
        await ctx.db.insert("webServices", webServiceData)
      }
    }
  },

  // Helper method for syncing Workers
  private async syncWorkers(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    workers: CloudflareWorker[]
  ): Promise<void> {
    for (const worker of workers) {
      const existing = await ctx.db
        .query("webServices")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", worker.id)
        )
        .first()

      const webServiceData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "cloudflare",
        providerResourceId: worker.id,
        name: worker.name,
        productionUrl: worker.subdomain?.enabled
          ? `https://${worker.name}.${worker.subdomain?.subdomain || "workers.dev"}`
          : undefined,
        environment: "production", // Workers are always production
        status: "running", // Workers are always running if deployed
        fullApiData: {
          type: "workers",
          ...worker,
        },
        updatedAt: isoToTimestamp(worker.created_on),
      }

      if (existing) {
        await ctx.db.patch(existing._id, webServiceData)
      } else {
        await ctx.db.insert("webServices", webServiceData)
      }
    }
  },
}
```

---

### Step 5: Create Index Export

**File**: `convex/docks/adapters/cloudflare/index.ts`

```typescript
export { cloudflareAdapter } from "./adapter"
export { CloudflareAPI } from "./api"
export * from "./types"
```

---

### Step 6: Update Registry

**File**: `convex/docks/registry.ts`

**Add import**:
```typescript
import { cloudflareAdapter } from "./adapters/cloudflare"
```

**Add to `adapterRegistry`**:
```typescript
export const adapterRegistry: Record<string, DockAdapter> = {
  gridpane: gridpaneAdapter,
  vercel: vercelAdapter,
  netlify: netlifyAdapter,
  cloudflare: cloudflareAdapter, // Add this
}
```

**Add to `providerMetadata`**:
```typescript
const providerMetadata: Record<string, { displayName: string }> = {
  gridpane: { displayName: "GridPane" },
  vercel: { displayName: "Vercel" },
  netlify: { displayName: "Netlify" },
  cloudflare: { displayName: "Cloudflare" }, // Add this
}
```

---

### Step 7: Update Actions

**File**: `convex/docks/actions.ts`

**Add Cloudflare case to `syncDockResources` action**:

```typescript
} else if (args.provider === "cloudflare") {
  const api = new CloudflareAPI(args.apiKey)
  
  // Get zones first (to extract account ID)
  if (args.resourceTypes.includes("domains")) {
    console.log(`[Dock Action] Fetching zones for ${args.provider}`)
    domains = await api.getZones()
    
    // Extract account ID from first zone
    if (domains.length > 0 && domains[0].account?.id) {
      // Store account ID in dock (will be handled in mutation)
      accountId = domains[0].account.id
    }
  }

  // Get Pages (requires account ID)
  if (args.resourceTypes.includes("webServices") && accountId) {
    console.log(`[Dock Action] Fetching Pages for ${args.provider}`)
    const pages = await api.getPages(accountId)
    webServices.push(...pages.map(p => ({ ...p, _type: "pages" })))
  }

  // Get Workers (requires account ID)
  if (args.resourceTypes.includes("webServices") && accountId) {
    console.log(`[Dock Action] Fetching Workers for ${args.provider}`)
    const workers = await api.getWorkers(accountId)
    webServices.push(...workers.map(w => ({ ...w, _type: "workers" })))
  }
}
```

**Note**: DNS records are fetched per-zone in the adapter's `syncDomains` method, not in the action.

---

### Step 8: Update Mutations

**File**: `convex/docks/mutations.ts`

The existing `syncDockResourcesMutation` should handle Cloudflare automatically since it calls adapter methods generically. However, we need to handle the account ID storage:

```typescript
// In syncDockResourcesMutation, after adapter sync:
// Account ID is already stored in syncDomains if zones were synced
// No additional changes needed
```

---

### Step 9: Create Documentation

**File**: `convex/docks/adapters/cloudflare/README.md`

See `stand-downs/active/mission-5-cloudflare-field-mapping-reference.md` for field mappings.

---

## Testing Checklist

- [ ] API token validation working
- [ ] Zones syncing to `domains` table
- [ ] DNS records stored in `domains.fullApiData.dnsRecords`
- [ ] Account ID extracted and stored in dock
- [ ] Pages syncing to `webServices` table with `type: "pages"`
- [ ] Workers syncing to `webServices` table with `type: "workers"`
- [ ] Status mappings correct for all resource types
- [ ] Production URLs correct for Pages
- [ ] Git repos extracted correctly for Pages
- [ ] Data displaying in UI tables (domains + webServices)
- [ ] Provider dropdown showing Cloudflare option

---

## Edge Cases

### Missing Account ID
- Extract from zones response during first sync
- Store in `dock.accountId` for future API calls
- Throw error if Pages/Workers sync attempted without account ID

### DNS Records Fetch Failure
- Continue syncing other zones even if one fails
- Log error but don't fail entire sync
- DNS records are optional metadata

### Missing Production URL
- Pages: Fall back to subdomain if no custom domain
- Workers: Use subdomain pattern if enabled
- Can be `undefined` if not available

### Multiple Account IDs
- Use first zone's account ID (all zones in same account)
- If zones from different accounts, use most common account ID

---

## Next Steps

1. Implement adapter following this guide
2. Test with real Cloudflare API token
3. Verify data in UI tables
4. Update frontend if needed (domains table should already work)
5. Create checkpoint document

---

**Ready for implementation. Follow Vercel/Netlify patterns closely.**

