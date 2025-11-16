# Agent Prompt: Implement Netlify Adapter

> **Agent**: `backend-convex`  
> **Mission**: Mission 5 - Multi-Provider Integration  
> **Task**: Implement Netlify adapter following Vercel pattern  
> **Estimated Time**: 0.5 days  
> **Priority**: HIGH

---

## Your Mission

Implement a Netlify dock adapter that syncs Netlify sites to StackDock's universal `webServices` table. Follow the Vercel adapter pattern exactly.

---

## Critical Clarification

**Netlify Sites ≠ StackDock Projects**

- **Netlify Sites** = Provider resources (web apps) → Sync to `webServices` table
- **StackDock Projects** = Logical groupings → `projects` table (user-created, NOT synced)

**The adapter should:**
- ✅ Sync Netlify sites to `webServices` table
- ❌ NOT create StackDock `projects` automatically
- ❌ NOT create `projectResources` links automatically
- ✅ Users will link Netlify webServices to StackDock projects manually later

---

## What You Need to Read First

1. **Implementation Guide**: `stand-downs/active/mission-5-netlify-adapter-implementation-guide.md`
   - Complete field mappings
   - Status mapping function
   - Edge case handling
   - Code examples

2. **Reference Implementation**: `convex/docks/adapters/vercel/`
   - `api.ts` - API client pattern
   - `types.ts` - Type definitions pattern
   - `adapter.ts` - Adapter implementation pattern

3. **Dock Adapter Interface**: `convex/docks/_types.ts`
   - Required methods
   - Expected return types
   - `preFetchedData` parameter support

4. **API Response Example**: `docks/netlify/site/listSites.json`
   - Actual Netlify API response structure
   - Field names and types

---

## Files to Create

1. `convex/docks/adapters/netlify/api.ts` - Netlify API client
2. `convex/docks/adapters/netlify/types.ts` - TypeScript types
3. `convex/docks/adapters/netlify/adapter.ts` - Adapter implementation
4. `convex/docks/adapters/netlify/index.ts` - Export adapter (follow Vercel pattern)
5. `convex/docks/adapters/netlify/README.md` - Documentation

## Files to Modify

1. `convex/docks/registry.ts` - Register netlify adapter and add to metadata
2. `convex/docks/actions.ts` - Add Netlify case to fetch sites

---

## Implementation Steps

### Step 1: Create Types (`types.ts`)

Based on `docks/netlify/site/listSites.json`:

- `NetlifySite` - Site object (id, name, ssl_url, lifecycle_state, build_settings, etc.)
- `NetlifyUser` - User object (for validateCredentials)

**Key Fields**:
- `site.id` → `"fc7cd4a9-6639-4a6a-907b-844526a43b87"`
- `site.name` → `"stackdock-docs"`
- `site.ssl_url` → Production URL (HTTPS)
- `site.lifecycle_state` → `"active"`, `"inactive"`, etc.
- `site.build_settings.repo_path` → Git repo (`"stackdock/docs"`)

---

### Step 2: Create API Client (`api.ts`)

Follow Vercel pattern:

```typescript
export class NetlifyAPI {
  constructor(apiKey: string, baseUrl: string = "https://api.netlify.com")
  
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T>
  async validateCredentials(): Promise<boolean>  // GET /api/v1/user
  async getSites(): Promise<NetlifySite[]>  // GET /api/v1/sites
}
```

**Authentication**: Bearer token in `Authorization` header

**Error Handling**: Match Vercel pattern (401 = invalid, throw errors for other failures)

**Note**: Netlify API returns array directly (not wrapped in object)

---

### Step 3: Create Adapter (`adapter.ts`)

Follow Vercel adapter pattern exactly:

```typescript
export const netlifyAdapter: DockAdapter = {
  provider: "netlify",
  
  async validateCredentials(apiKey: string): Promise<boolean> {
    // Use NetlifyAPI.validateCredentials()
  },
  
  async syncWebServices(ctx: MutationCtx, dock: Doc<"docks">, preFetchedData?: NetlifySite[]): Promise<void> {
    // 1. Use preFetchedData if provided, otherwise decrypt API key and fetch
    // 2. For each site:
    //    - Check if exists (by_dock_resource index)
    //    - Map to universal schema
    //    - Upsert (patch if exists, insert if new)
  },
}
```

**Status Mapping**:
```typescript
function mapNetlifyStatus(lifecycleState: string, state?: string): string {
  const lifecycleMap: Record<string, string> = {
    active: "running",
    inactive: "stopped",
    suspended: "stopped",
    deleted: "stopped",
  }
  return lifecycleMap[lifecycleState] || (state === "current" ? "running" : "pending")
}
```

**Field Mapping**:
- `providerResourceId` = `site.id` (NOT `site_id`)
- `name` = `site.name`
- `productionUrl` = `site.ssl_url` (prefer) or `site.url` (convert to HTTPS)
- `environment` = `"production"` (always for sites)
- `gitRepo` = `build_settings.repo_path` (if exists) or extract from `repo_url`
- `status` = `mapNetlifyStatus(lifecycle_state, state)`
- `fullApiData` = entire `site` object

**Edge Cases**:
- If `ssl_url` missing → use `url` and convert to HTTPS
- If `repo_path` missing → extract from `repo_url`
- If `lifecycle_state` missing → use `state` field or default to `"pending"`

---

### Step 4: Create Index Export

Create `convex/docks/adapters/netlify/index.ts` (follow Vercel pattern):

```typescript
/**
 * Netlify Adapter Export
 */
export { netlifyAdapter } from "./adapter"
export { NetlifyAPI } from "./api"
export * from "./types"
```

---

### Step 5: Register Adapter

Update `convex/docks/registry.ts`:

```typescript
import { netlifyAdapter } from "./adapters/netlify"  // Add import

const adapterRegistry: Record<string, DockAdapter> = {
  gridpane: gridpaneAdapter,
  vercel: vercelAdapter,
  netlify: netlifyAdapter,  // Add this line
}

const providerMetadata: Record<string, { displayName: string }> = {
  gridpane: { displayName: "GridPane" },
  vercel: { displayName: "Vercel" },
  netlify: { displayName: "Netlify" },  // Add this line
}
```

---

### Step 6: Update Action

Update `convex/docks/actions.ts`:

**Add import**:
```typescript
import { NetlifyAPI } from "./adapters/netlify/api"
```

**Add Netlify case** (after Vercel case):
```typescript
} else if (args.provider === "netlify") {
  const api = new NetlifyAPI(args.apiKey)
  
  if (args.resourceTypes.includes("webServices")) {
    webServices = await api.getSites()
  }
  
  // Netlify doesn't support servers, domains, or databases
  if (args.resourceTypes.includes("servers")) servers = []
  if (args.resourceTypes.includes("domains")) domains = []
  if (args.resourceTypes.includes("databases")) databases = []
}
```

---

### Step 7: Create Documentation

Create `convex/docks/adapters/netlify/README.md`:
- Field mappings table
- Status mappings
- API rate limits
- Example usage
- Reference to API response examples

---

## Testing Checklist

After implementation:

- [ ] `validateCredentials()` works with valid API key
- [ ] `validateCredentials()` returns false for invalid API key  
- [ ] `syncWebServices()` fetches sites from Netlify API
- [ ] Sites sync to `webServices` table
- [ ] `providerResourceId` uses site ID (not site_id)
- [ ] `productionUrl` prefers `ssl_url` (HTTPS)
- [ ] Status mapping works (`active` → `running`, etc.)
- [ ] `gitRepo` format is `"org/repo"`
- [ ] `fullApiData` contains entire site object
- [ ] Existing sites update (not duplicate)
- [ ] Edge cases handled (missing ssl_url, missing repo_path, etc.)
- [ ] Data displays in UI tables
- [ ] Provider badge shows "netlify"
- [ ] Netlify appears in provider dropdown

---

## Success Criteria

- ✅ Netlify adapter created following Vercel pattern
- ✅ Credential validation working
- ✅ Sites syncing to `webServices` table
- ✅ Data displaying in UI tables
- ✅ Status mappings correct
- ✅ Documentation complete
- ✅ No TypeScript errors
- ✅ No breaking changes to universal schema

---

## Reference Files

**Vercel Adapter** (follow this pattern exactly):
- `convex/docks/adapters/vercel/api.ts`
- `convex/docks/adapters/vercel/types.ts`
- `convex/docks/adapters/vercel/adapter.ts`

**API Response Examples**:
- `docks/netlify/site/listSites.json`

**Interface**:
- `convex/docks/_types.ts` - DockAdapter interface

**Utilities**:
- `convex/lib/encryption.ts` - `decryptApiKey()` function

---

## Important Notes

1. **Don't confuse Netlify sites with StackDock projects**
   - Netlify sites → `webServices` table
   - StackDock projects → `projects` table (user-created)

2. **Use site ID, not site_id**
   - `providerResourceId` = `site.id`
   - Both exist but `id` is preferred

3. **Prefer SSL URL**
   - Use `ssl_url` if available (HTTPS)
   - Convert `url` to HTTPS if needed

4. **Git repo extraction**
   - Prefer `build_settings.repo_path` (already formatted)
   - Extract from `repo_url` if needed

5. **Follow Vercel pattern exactly**
   - Same structure
   - Same error handling
   - Same upsert pattern
   - Same preFetchedData support

---

## Questions?

If you encounter issues:
1. Check Vercel adapter for pattern
2. Review API response examples in `docks/netlify/`
3. Check implementation guide for field mappings
4. Verify against DockAdapter interface

---

**Remember**: The universal schema should work for GridPane, Vercel, AND Netlify without changes. If you find yourself wanting to change the schema, stop and reconsider the mapping.
