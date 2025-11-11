# Agent Prompt: Implement Cloudflare Adapter

> **Agent**: `backend-convex`  
> **Mission**: Mission 5 - Multi-Provider Integration  
> **Task**: Implement Cloudflare adapter with multi-resource support  
> **Estimated Time**: 1 day  
> **Priority**: HIGH

---

## Your Mission

Implement a Cloudflare dock adapter that syncs Cloudflare resources to StackDock's universal tables:
- **Zones** → `domains` table (first adapter to populate domains!)
- **Pages** → `webServices` table
- **Workers** → `webServices` table
- **DNS Records** → Stored in `domains.fullApiData.dnsRecords`

Follow the Vercel/Netlify adapter pattern exactly, but handle multiple resource types.

---

## Critical Clarification

**Cloudflare Resources ≠ StackDock Projects**

- **Cloudflare Zones/Pages/Workers** = Provider resources → Sync to universal tables
- **StackDock Projects** = Logical groupings → `projects` table (user-created, NOT synced)

**The adapter should:**
- ✅ Sync Cloudflare zones to `domains` table
- ✅ Sync Cloudflare Pages to `webServices` table
- ✅ Sync Cloudflare Workers to `webServices` table
- ✅ Store DNS records in `domains.fullApiData.dnsRecords`
- ❌ NOT create StackDock `projects` automatically
- ❌ NOT create `projectResources` links automatically
- ✅ Users will link Cloudflare resources to StackDock projects manually later

---

## What You Need to Read First

1. **Implementation Guide**: `stand-downs/active/mission-5-cloudflare-adapter-implementation-guide.md`
   - Complete field mappings
   - Status mapping functions
   - Edge case handling
   - Code examples

2. **Field Mapping Reference**: `stand-downs/active/mission-5-cloudflare-field-mapping-reference.md`
   - Quick reference for field mappings
   - Status mappings
   - Edge cases

3. **Reference Implementations**: 
   - `convex/docks/adapters/vercel/` - Vercel adapter pattern
   - `convex/docks/adapters/netlify/` - Netlify adapter pattern

4. **Dock Adapter Interface**: `convex/docks/_types.ts`
   - Required methods
   - Expected return types
   - `preFetchedData` parameter support

5. **API Response Examples**:
   - `docks/cloudflare/zones/listZones.json` - Zones structure
   - `docks/cloudflare/pages/getProjects.json` - Pages structure
   - `docks/cloudflare/workers/getWorkersList.json` - Workers structure
   - `docks/cloudflare/dns/records/getDNSRecordsbyZoneID.json` - DNS records structure

---

## Files to Create

1. `convex/docks/adapters/cloudflare/api.ts` - Cloudflare API client
2. `convex/docks/adapters/cloudflare/types.ts` - TypeScript types
3. `convex/docks/adapters/cloudflare/adapter.ts` - Adapter implementation
4. `convex/docks/adapters/cloudflare/index.ts` - Export adapter
5. `convex/docks/adapters/cloudflare/README.md` - Documentation

## Files to Modify

1. `convex/schema.ts` - Add `accountId` and `providerMetadata` to docks table
2. `convex/docks/registry.ts` - Register cloudflare adapter and add to metadata
3. `convex/docks/actions.ts` - Add Cloudflare case to fetch zones, pages, workers

---

## Implementation Steps

### Step 1: Update Schema

Add to `convex/schema.ts` docks table:
```typescript
accountId: v.optional(v.string()), // Provider account ID (Cloudflare, AWS, etc.)
providerMetadata: v.optional(v.any()), // Provider-specific metadata
```

### Step 2: Create Types (`types.ts`)

Based on API response examples:
- `CloudflareZone` - Zone object (id, name, status, account, plan, etc.)
- `CloudflarePage` - Page project object (id, name, domains, source, deployments)
- `CloudflareWorker` - Worker script object (id, name, subdomain, etc.)
- `CloudflareDNSRecord` - DNS record object (id, name, type, content, proxied)
- Response wrappers with `result`, `success`, `errors`, `messages`

### Step 3: Create API Client (`api.ts`)

Follow Vercel pattern:
```typescript
export class CloudflareAPI {
  constructor(apiToken: string, accountId?: string)
  
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T>
  async validateCredentials(): Promise<boolean>  // GET /user/tokens/verify or /user
  async getZones(): Promise<CloudflareZone[]>  // GET /zones
  async getDNSRecords(zoneId: string): Promise<CloudflareDNSRecord[]>  // GET /zones/{zone_id}/dns_records
  async getPages(accountId: string): Promise<CloudflarePage[]>  // GET /accounts/{account_id}/pages/projects
  async getWorkers(accountId: string): Promise<CloudflareWorker[]>  // GET /accounts/{account_id}/workers/scripts
}
```

**Authentication**: Bearer token in `Authorization` header
**Base URL**: `https://api.cloudflare.com/client/v4`

### Step 4: Create Adapter (`adapter.ts`)

Implement `DockAdapter` interface:

```typescript
export const cloudflareAdapter: DockAdapter = {
  provider: "cloudflare",
  
  async validateCredentials(apiKey: string): Promise<boolean> {
    // Use CloudflareAPI.validateCredentials()
  },
  
  async syncDomains(ctx, dock, preFetchedZones) {
    // 1. Use pre-fetched zones or fetch from API
    // 2. Extract account ID from first zone (store in dock.accountId)
    // 3. Sync each zone to domains table
    // 4. Fetch DNS records for each zone
    // 5. Store DNS records in domains.fullApiData.dnsRecords
  },
  
  async syncWebServices(ctx, dock, preFetchedData) {
    // Handle both Pages and Workers
    // Determine type from data structure
    // Call syncPages() or syncWorkers() helper methods
  },
}
```

**Key Helper Functions**:
- `mapCloudflareZoneStatus()` - Map zone status to universal status
- `mapCloudflarePagesStatus()` - Map deployment status to universal status
- `getPagesProductionUrl()` - Extract production URL from page
- `getPagesGitRepo()` - Extract git repo from page source
- `isoToTimestamp()` - Convert ISO 8601 to Unix timestamp

### Step 5: Update Registry

**File**: `convex/docks/registry.ts`

1. Import cloudflare adapter
2. Add to `adapterRegistry`
3. Add to `providerMetadata` map

### Step 6: Update Actions

**File**: `convex/docks/actions.ts`

Add Cloudflare case to `syncDockResources`:
```typescript
} else if (args.provider === "cloudflare") {
  const api = new CloudflareAPI(args.apiKey)
  
  // Get zones first (to extract account ID)
  if (args.resourceTypes.includes("domains")) {
    domains = await api.getZones()
    // Account ID extracted in adapter
  }
  
  // Get Pages (requires account ID from zones)
  if (args.resourceTypes.includes("webServices") && accountId) {
    const pages = await api.getPages(accountId)
    webServices.push(...pages.map(p => ({ ...p, _type: "pages" })))
  }
  
  // Get Workers (requires account ID from zones)
  if (args.resourceTypes.includes("webServices") && accountId) {
    const workers = await api.getWorkers(accountId)
    webServices.push(...workers.map(w => ({ ...w, _type: "workers" })))
  }
}
```

**Note**: Account ID extraction happens in adapter's `syncDomains` method. The action needs to handle this flow.

---

## Field Mappings

### Zones → Domains

| Universal Field | Cloudflare Source | Extraction Logic |
|----------------|------------------|------------------|
| `providerResourceId` | `zone.id` | Direct |
| `domainName` | `zone.name` | Direct |
| `status` | `zone.status` | Map via `mapCloudflareZoneStatus()` |
| `updatedAt` | `zone.modified_on` | Convert ISO to timestamp |
| `expiresAt` | N/A | DNS zones don't expire |
| `fullApiData` | `zone` | Entire object + `dnsRecords` array |

### Pages → WebServices

| Universal Field | Cloudflare Source | Extraction Logic |
|----------------|------------------|------------------|
| `providerResourceId` | `page.id` | Direct |
| `name` | `page.name` | Direct |
| `productionUrl` | `canonical_deployment.url` or `domains[0]` | Prefer canonical deployment |
| `environment` | `page.production_branch` | Direct |
| `gitRepo` | `source.config.owner` + `repo_name` | Format as `"owner/repo"` |
| `status` | `canonical_deployment.latest_stage.status` | Map via `mapCloudflarePagesStatus()` |
| `fullApiData` | `page` | Entire object + `type: "pages"` |

### Workers → WebServices

| Universal Field | Cloudflare Source | Extraction Logic |
|----------------|------------------|------------------|
| `providerResourceId` | `worker.id` | Direct |
| `name` | `worker.name` | Direct |
| `productionUrl` | `subdomain.enabled` | Build URL if enabled |
| `environment` | Always `"production"` | Direct |
| `status` | Always `"running"` | Workers are always running if deployed |
| `fullApiData` | `worker` | Entire object + `type: "workers"` |

---

## Status Mappings

### Zone Status
```typescript
"active" → "active"
"pending" → "pending"
"initializing" → "pending"
"moved" → "active"
"deleted" → "stopped"
"read_only" → "active"
```

### Pages Deployment Status
```typescript
"success" → "running"
"failure" → "error"
"idle" → "pending"
undefined → "pending"
```

### Workers Status
```typescript
Always → "running" (if deployed)
```

---

## Edge Cases

1. **Missing Account ID**: Extract from zones response, store in dock
2. **DNS Records Fetch Failure**: Continue syncing, log error
3. **Missing Production URL**: Can be `undefined` for Pages/Workers
4. **Multiple Account IDs**: Use first zone's account ID (all zones in same account)

---

## Testing Checklist

- [ ] API token validation working
- [ ] Zones syncing to `domains` table
- [ ] DNS records stored in `domains.fullApiData.dnsRecords`
- [ ] Account ID extracted and stored
- [ ] Pages syncing to `webServices` table
- [ ] Workers syncing to `webServices` table
- [ ] Status mappings correct
- [ ] Production URLs correct
- [ ] Git repos extracted correctly
- [ ] Data displaying in UI

---

## Important Notes

1. **Account ID**: Extract from zones response (`zone.account.id`), store in `dock.accountId`
2. **DNS Records**: Fetch per-zone in adapter, store in `domains.fullApiData.dnsRecords`
3. **Resource Type**: Distinguish Pages vs Workers via `fullApiData.type`
4. **Multiple Sync Methods**: `syncDomains` handles zones + DNS records, `syncWebServices` handles Pages + Workers

---

**Follow the implementation guide exactly. Test thoroughly before marking complete.**

