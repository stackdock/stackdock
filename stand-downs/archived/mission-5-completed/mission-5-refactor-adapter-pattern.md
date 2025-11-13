# Refactor: Use Adapter Methods Directly

> **Location**: `stand-downs/active/mission-5-refactor-adapter-pattern.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/active/mission-5-refactor-adapter-pattern.md`  
> **Last Updated**: January 11, 2025  
> **Status**: Ready for Implementation  
> **Agent**: `backend-convex`  
> **Estimated Time**: 1-2 hours  
> **Priority**: HIGH (Eliminates code duplication)

---

## Problem Statement

Currently, we have **code duplication**:

1. **Adapter methods exist** (`syncWebServices()`, `syncServers()`, etc.) with complete implementation
2. **But they're not being used** - instead, provider-specific code exists in `actions.ts` and `mutations.ts`
3. **Adding new providers** requires changes in multiple places (actions, mutations, AND adapter)

**Current Flow:**
```
syncDock mutation
  → schedules syncDockResources action
    → fetches data (provider-specific code in actions.ts)
    → calls insertSyncResults mutation
      → transforms data (provider-specific code in mutations.ts)
      → inserts into DB
```

**Desired Flow:**
```
syncDock mutation
  → schedules syncDockResources action
    → fetches data (generic, using adapter API classes)
    → calls syncDockResourcesMutation
      → calls adapter.syncWebServices(ctx, dock, preFetchedData)
        → adapter handles transform + insert (no duplication!)
```

---

## Solution: Adapter-First Pattern

**Key Insight**: Adapter methods can accept **optional pre-fetched data**. This allows:
- Action to fetch data (can use `fetch`)
- Mutation to call adapter methods with pre-fetched data
- Adapter methods handle transformation and insertion (no duplication)

---

## Implementation Steps

### Step 1: Update DockAdapter Interface

**File**: `convex/docks/_types.ts`

**Change**: Add optional `preFetchedData` parameter to sync methods

**Before:**
```typescript
syncWebServices?(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>
```

**After:**
```typescript
/**
 * Sync web services (sites, deployments, apps) to universal `webServices` table
 * 
 * @param ctx - Convex mutation context (has database access)
 * @param dock - The dock document (contains encrypted API key)
 * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
 */
syncWebServices?(
  ctx: MutationCtx, 
  dock: Doc<"docks">,
  preFetchedData?: any[]
): Promise<void>
```

**Apply same pattern to:**
- `syncServers?()`
- `syncDomains?()`
- `syncDatabases?()`

---

### Step 2: Update GridPane Adapter

**File**: `convex/docks/adapters/gridpane/adapter.ts`

**Change**: Modify `syncServers()`, `syncWebServices()`, and `syncDomains()` to accept optional pre-fetched data

**Example for `syncWebServices()`:**

**Before:**
```typescript
async syncWebServices(
  ctx: MutationCtx,
  dock: Doc<"docks">
): Promise<void> {
  // Decrypt API key with audit logging
  const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
    dockId: dock._id,
    orgId: dock.orgId,
  })
  const api = new GridPaneAPI(apiKey)
  const sites = await api.getSites()

  // Transform and insert...
}
```

**After:**
```typescript
async syncWebServices(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: GridPaneSite[]
): Promise<void> {
  let sites: GridPaneSite[]
  
  if (preFetchedData) {
    // Use pre-fetched data from action
    sites = preFetchedData
  } else {
    // Fetch data directly (for direct mutation calls or testing)
    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })
    const api = new GridPaneAPI(apiKey)
    sites = await api.getSites()
  }

  // Transform and insert (existing logic unchanged)
  for (const site of sites) {
    // ... existing transformation logic ...
  }
}
```

**Apply same pattern to:**
- `syncServers()` - accept `GridPaneServer[]` as optional parameter
- `syncDomains()` - accept `GridPaneDomain[]` as optional parameter

---

### Step 3: Update Vercel Adapter

**File**: `convex/docks/adapters/vercel/adapter.ts`

**Change**: Modify `syncWebServices()` to accept optional pre-fetched data

**Before:**
```typescript
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

  // Transform and insert...
}
```

**After:**
```typescript
async syncWebServices(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: VercelProject[]
): Promise<void> {
  let projects: VercelProject[]
  
  if (preFetchedData) {
    // Use pre-fetched data from action
    projects = preFetchedData
  } else {
    // Fetch data directly (for direct mutation calls or testing)
    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })
    const api = new VercelAPI(apiKey)
    projects = await api.getProjects()
  }

  // Transform and insert (existing logic unchanged)
  for (const project of projects) {
    // ... existing transformation logic ...
  }
}
```

---

### Step 4: Create Generic Sync Mutation

**File**: `convex/docks/mutations.ts`

**Action**: Add new internal mutation `syncDockResourcesMutation` BEFORE the existing `insertSyncResults` mutation

**New Code:**
```typescript
/**
 * Internal mutation: Sync dock resources using adapter methods
 * 
 * Called by syncDockResources action after fetching data.
 * Uses adapter sync methods to transform and insert data.
 * 
 * This replaces insertSyncResults and eliminates provider-specific code.
 */
export const syncDockResourcesMutation = internalMutation({
  args: {
    dockId: v.id("docks"),
    provider: v.string(),
    fetchedData: v.object({
      servers: v.optional(v.array(v.any())),
      webServices: v.optional(v.array(v.any())),
      domains: v.optional(v.array(v.any())),
      databases: v.optional(v.array(v.any())),
    }),
  },
  handler: async (ctx, args) => {
    // Get dock to access orgId and verify dock exists
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      throw new ConvexError("Dock not found")
    }

    // Get adapter
    const adapter = getAdapter(args.provider)
    if (!adapter) {
      throw new ConvexError(`No adapter found for provider: ${args.provider}`)
    }

    // Use adapter methods to sync each resource type
    // Adapter methods handle transformation and insertion
    
    if (args.fetchedData.servers && adapter.syncServers) {
      await adapter.syncServers(ctx, dock, args.fetchedData.servers)
    }

    if (args.fetchedData.webServices && adapter.syncWebServices) {
      await adapter.syncWebServices(ctx, dock, args.fetchedData.webServices)
    }

    if (args.fetchedData.domains && adapter.syncDomains) {
      await adapter.syncDomains(ctx, dock, args.fetchedData.domains)
    }

    if (args.fetchedData.databases && adapter.syncDatabases) {
      await adapter.syncDatabases(ctx, dock, args.fetchedData.databases)
    }

    // Mark sync as successful
    await ctx.db.patch(args.dockId, {
      syncInProgress: false,
      lastSyncStatus: "success",
      lastSyncAt: Date.now(),
      lastSyncError: undefined,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})
```

**Placement**: Add this BEFORE `insertSyncResults` mutation (around line 182)

---

### Step 5: Update Sync Action to Use New Mutation

**File**: `convex/docks/actions.ts`

**Change**: Update `syncDockResources` action to call new `syncDockResourcesMutation` instead of `insertSyncResults`

**Find this code** (around line 150):
```typescript
// Call internal mutation to insert results into database
await ctx.runMutation(internal.docks.mutations.insertSyncResults as any, {
  dockId: args.dockId,
  provider: args.provider,
  servers,
  webServices,
  domains,
  databases,
})
```

**Replace with:**
```typescript
// Call internal mutation to sync using adapter methods
await ctx.runMutation(internal.docks.mutations.syncDockResourcesMutation, {
  dockId: args.dockId,
  provider: args.provider,
  fetchedData: {
    servers: servers.length > 0 ? servers : undefined,
    webServices: webServices.length > 0 ? webServices : undefined,
    domains: domains.length > 0 ? domains : undefined,
    databases: databases.length > 0 ? databases : undefined,
  },
})
```

---

### Step 6: Remove Provider-Specific Code from Mutations

**File**: `convex/docks/mutations.ts`

**Action**: Delete the entire `insertSyncResults` mutation (lines ~182-443)

**Why**: This mutation contains all the provider-specific transformation logic (GridPane, Vercel) that is now handled by adapter methods. The new `syncDockResourcesMutation` replaces it.

**Before deleting**, verify:
- The new `syncDockResourcesMutation` is in place
- The action is calling the new mutation
- All adapter methods are updated to accept optional pre-fetched data

---

### Step 7: Clean Up Action (Optional but Recommended)

**File**: `convex/docks/actions.ts`

**Action**: Make the action more generic by using a helper function or switch statement

**Current code** has provider-specific if/else blocks:
```typescript
if (args.provider === "gridpane") {
  // GridPane-specific code
} else if (args.provider === "vercel") {
  // Vercel-specific code
}
```

**Option A**: Keep as-is (works fine, just not as elegant)

**Option B**: Create helper function (more maintainable):
```typescript
/**
 * Get API class instance for provider
 */
async function getApiInstance(provider: string, apiKey: string): Promise<any> {
  switch (provider) {
    case "gridpane":
      const { GridPaneAPI } = await import("./adapters/gridpane/api")
      return new GridPaneAPI(apiKey)
    case "vercel":
      const { VercelAPI } = await import("./adapters/vercel/api")
      return new VercelAPI(apiKey)
    default:
      throw new Error(`No API class found for provider: ${provider}`)
  }
}

/**
 * Fetch resources for a provider
 */
async function fetchResources(
  api: any,
  provider: string,
  resourceTypes: string[]
): Promise<{
  servers?: any[]
  webServices?: any[]
  domains?: any[]
  databases?: any[]
}> {
  const result: any = {}

  if (resourceTypes.includes("servers") && provider === "gridpane") {
    result.servers = await api.getServers()
  }

  if (resourceTypes.includes("webServices")) {
    if (provider === "gridpane") {
      result.webServices = await api.getSites()
    } else if (provider === "vercel") {
      result.webServices = await api.getProjects()
    }
  }

  if (resourceTypes.includes("domains") && provider === "gridpane") {
    result.domains = await api.getDomains()
  }

  return result
}
```

**Then in `syncDockResources` handler:**
```typescript
const api = await getApiInstance(args.provider, args.apiKey)
const fetchedData = await fetchResources(api, args.provider, args.resourceTypes)

await ctx.runMutation(internal.docks.mutations.syncDockResourcesMutation, {
  dockId: args.dockId,
  provider: args.provider,
  fetchedData,
})
```

**Recommendation**: Option A (keep as-is) for now. Option B can be a future improvement.

---

## Testing Checklist

After refactoring, verify:

- [ ] **GridPane sync still works**
  - [ ] Servers sync correctly
  - [ ] Web services (sites) sync correctly
  - [ ] Domains sync correctly
  - [ ] Status mappings are correct
  - [ ] Data appears in UI tables

- [ ] **Vercel sync still works**
  - [ ] Web services (projects) sync correctly
  - [ ] Status mappings are correct
  - [ ] Data appears in UI tables

- [ ] **Error handling**
  - [ ] Invalid API key handled correctly
  - [ ] Missing dock handled correctly
  - [ ] Network errors handled correctly
  - [ ] Sync status updated correctly on errors

- [ ] **Edge cases**
  - [ ] Empty results handled (no projects/servers)
  - [ ] Missing fields handled (no production URL, etc.)
  - [ ] Concurrent syncs prevented

- [ ] **Code quality**
  - [ ] No TypeScript errors
  - [ ] No linter errors
  - [ ] No unused imports
  - [ ] Adapter methods handle both pre-fetched and direct fetch scenarios

---

## Rollback Plan

If issues arise, rollback steps:

1. **Keep `insertSyncResults` mutation** (don't delete it yet)
2. **Revert action** to call `insertSyncResults` instead of `syncDockResourcesMutation`
3. **Test** that everything still works
4. **Fix issues** in new code
5. **Re-apply changes** once fixed

**Safe approach**: Implement new mutation first, test it, then remove old one.

---

## Benefits After Refactor

1. **No code duplication** - Adapter methods are the single source of truth
2. **Easier to add providers** - Just create adapter, no changes to actions/mutations
3. **Consistent pattern** - All providers follow same flow
4. **Better maintainability** - Provider-specific logic lives in adapters
5. **Testable** - Adapter methods can be tested independently

---

## Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `convex/docks/_types.ts` | Modify | Add optional `preFetchedData` parameter to sync methods |
| `convex/docks/adapters/gridpane/adapter.ts` | Modify | Update sync methods to accept optional pre-fetched data |
| `convex/docks/adapters/vercel/adapter.ts` | Modify | Update sync methods to accept optional pre-fetched data |
| `convex/docks/mutations.ts` | Add | Add `syncDockResourcesMutation` |
| `convex/docks/mutations.ts` | Delete | Remove `insertSyncResults` mutation |
| `convex/docks/actions.ts` | Modify | Update to call new mutation |

---

## Implementation Order

1. ✅ Update `DockAdapter` interface (`_types.ts`)
2. ✅ Update GridPane adapter methods
3. ✅ Update Vercel adapter methods
4. ✅ Add new `syncDockResourcesMutation`
5. ✅ Update action to call new mutation
6. ✅ Test GridPane sync
7. ✅ Test Vercel sync
8. ✅ Delete old `insertSyncResults` mutation
9. ✅ Final testing

---

## Notes

- **Backward compatibility**: Adapter methods still work without `preFetchedData` (they fetch themselves)
- **Testing**: Can test adapter methods directly by calling them without pre-fetched data
- **Future providers**: Just create adapter with sync methods, no changes to actions/mutations needed
- **Error handling**: Adapter methods should handle errors and throw appropriately

---

**Ready for implementation. Follow steps in order, test after each major change.**
