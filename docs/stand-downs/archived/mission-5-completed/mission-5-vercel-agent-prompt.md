# Agent Prompt: Implement Vercel Adapter

> **Agent**: `backend-convex`  
> **Mission**: Mission 5 - Multi-Provider Integration  
> **Task**: Implement Vercel adapter following GridPane pattern  
> **Estimated Time**: 0.5 days  
> **Priority**: HIGH

---

## Your Mission

Implement a Vercel dock adapter that syncs Vercel projects to StackDock's universal `webServices` table. Follow the GridPane adapter pattern exactly.

---

## Critical Clarification

**Vercel Projects ≠ StackDock Projects**

- **Vercel Projects** = Provider resources (web apps) → Sync to `webServices` table
- **StackDock Projects** = Logical groupings → `projects` table (user-created, NOT synced)

**The adapter should:**
- ✅ Sync Vercel projects to `webServices` table
- ❌ NOT create StackDock `projects` automatically
- ❌ NOT create `projectResources` links automatically
- ✅ Users will link Vercel webServices to StackDock projects manually later

---

## What You Need to Read First

1. **Implementation Guide**: `stand-downs/active/mission-5-vercel-adapter-implementation-guide.md`
   - Complete field mappings
   - Status mapping function
   - Edge case handling
   - Code examples

2. **Reference Implementation**: `convex/docks/adapters/gridpane/`
   - `api.ts` - API client pattern
   - `types.ts` - Type definitions pattern
   - `adapter.ts` - Adapter implementation pattern

3. **Dock Adapter Interface**: `convex/docks/_types.ts`
   - Required methods
   - Expected return types

4. **API Response Examples**: `docks/vercel/projects/retrievealistofprojects.json`
   - Actual Vercel API response structure
   - Field names and types

---

## Files to Create

1. `convex/docks/adapters/vercel/api.ts` - Vercel API client
2. `convex/docks/adapters/vercel/types.ts` - TypeScript types
3. `convex/docks/adapters/vercel/adapter.ts` - Adapter implementation
4. `convex/docks/adapters/vercel/index.ts` - Export adapter (follow GridPane pattern)
5. `convex/docks/adapters/vercel/README.md` - Documentation

## Files to Modify

1. `convex/docks/registry.ts` - Register vercel adapter in `adapterRegistry`

---

## Implementation Steps

### Step 1: Create Types (`types.ts`)

Based on `docks/vercel/projects/retrievealistofprojects.json`:

- `VercelProjectsResponse` - Response wrapper with pagination
- `VercelProject` - Project object (id, name, targets, link, etc.)
- `VercelDeployment` - Deployment object (id, url, readyState, etc.)
- `VercelUser` - User object (for validateCredentials)

**Key Fields**:
- `project.id` → `"prj_8kpgj4jqKA28AHdtuidFVW7lij1U"`
- `project.name` → `"vapr-ballistics-js-client"`
- `project.targets.production.url` → Production URL
- `project.targets.production.readyState` → `"READY"`, `"BUILDING"`, etc.
- `project.link.org` + `project.link.repo` → Git repo

---

### Step 2: Create API Client (`api.ts`)

Follow GridPane pattern:

```typescript
export class VercelAPI {
  constructor(apiKey: string, baseUrl: string = "https://api.vercel.com")
  
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T>
  async validateCredentials(): Promise<boolean>  // GET /v2/user
  async getProjects(): Promise<VercelProject[]>  // GET /v9/projects
}
```

**Authentication**: Bearer token in `Authorization` header

**Error Handling**: Match GridPane pattern (401 = invalid, throw errors for other failures)

---

### Step 3: Create Adapter (`adapter.ts`)

Follow GridPane adapter pattern exactly:

```typescript
export const vercelAdapter: DockAdapter = {
  provider: "vercel",
  
  async validateCredentials(apiKey: string): Promise<boolean> {
    // Use VercelAPI.validateCredentials()
  },
  
  async syncWebServices(ctx: MutationCtx, dock: Doc<"docks">): Promise<void> {
    // 1. Decrypt API key (use decryptApiKey from lib/encryption)
    // 2. Get projects from VercelAPI
    // 3. For each project:
    //    - Check if exists (by_dock_resource index)
    //    - Map to universal schema
    //    - Upsert (patch if exists, insert if new)
  },
}
```

**Status Mapping**:
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

**Field Mapping**:
- `providerResourceId` = `project.id` (NOT deployment.id)
- `name` = `project.name`
- `productionUrl` = `https://${targets.production.url}` (add https://)
- `environment` = `"production"` (always for projects)
- `gitRepo` = `${link.org}/${link.repo}` (if link exists)
- `status` = `mapVercelStatus(targets.production.readyState)`
- `fullApiData` = entire `project` object

**Edge Cases**:
- If `targets.production` missing → use `latestDeployments[0]`
- If `url` missing → set `productionUrl` to `undefined`
- If `link` missing → set `gitRepo` to `undefined`

---

### Step 4: Register Adapter

Update `convex/docks/registry.ts`:

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

### Step 4b: Create Index Export

Create `convex/docks/adapters/vercel/index.ts` (follow GridPane pattern):

```typescript
/**
 * Vercel Adapter Export
 */
export { vercelAdapter } from "./adapter"
export { VercelAPI } from "./api"
export * from "./types"
```

---

### Step 5: Create Documentation

Create `convex/docks/adapters/vercel/README.md`:
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
- [ ] `syncWebServices()` fetches projects from Vercel API
- [ ] Projects sync to `webServices` table
- [ ] `providerResourceId` uses project ID (not deployment ID)
- [ ] `productionUrl` has `https://` prefix
- [ ] Status mapping works (`READY` → `running`, etc.)
- [ ] `gitRepo` format is `"org/repo"`
- [ ] `fullApiData` contains entire project object
- [ ] Existing projects update (not duplicate)
- [ ] Edge cases handled (missing production, missing link, etc.)

---

## Success Criteria

- ✅ Vercel adapter created following GridPane pattern
- ✅ Credential validation working
- ✅ Projects syncing to `webServices` table
- ✅ Data displaying in UI tables
- ✅ Status mappings correct
- ✅ Documentation complete
- ✅ No TypeScript errors
- ✅ No breaking changes to universal schema

---

## Reference Files

**GridPane Adapter** (follow this pattern exactly):
- `convex/docks/adapters/gridpane/api.ts`
- `convex/docks/adapters/gridpane/types.ts`
- `convex/docks/adapters/gridpane/adapter.ts`

**API Response Examples**:
- `docks/vercel/projects/retrievealistofprojects.json`
- `docks/vercel/deployments/listdeployments.json`

**Interface**:
- `convex/docks/_types.ts` - DockAdapter interface

**Utilities**:
- `convex/lib/encryption.ts` - `decryptApiKey()` function

---

## Important Notes

1. **Don't confuse Vercel projects with StackDock projects**
   - Vercel projects → `webServices` table
   - StackDock projects → `projects` table (user-created)

2. **Use project ID, not deployment ID**
   - `providerResourceId` = `project.id` (`"prj_..."`)
   - NOT `deployment.id` (`"dpl_..."`)

3. **Handle missing fields gracefully**
   - Check `targets.production` exists
   - Check `link` exists before accessing
   - Use optional chaining

4. **URL formatting**
   - Vercel URLs don't include protocol
   - Add `https://` prefix

5. **Follow GridPane pattern exactly**
   - Same structure
   - Same error handling
   - Same upsert pattern

---

## Questions?

If you encounter issues:
1. Check GridPane adapter for pattern
2. Review API response examples in `docks/vercel/`
3. Check implementation guide for field mappings
4. Verify against DockAdapter interface

---

**Remember**: The universal schema should work for both GridPane and Vercel without changes. If you find yourself wanting to change the schema, stop and reconsider the mapping.
