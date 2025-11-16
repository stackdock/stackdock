# Sync Deletion Architecture - Critical Fix

**Date**: November 15, 2025  
**Status**: 🔴 **CRITICAL** - Blocking production  
**Priority**: High (MVP blocker)

## Problem Statement

**Current State**: Sync only upserts resources, never deletes orphaned resources.

**User Report**: "I have a repo that is deleted on GitHub's side, but I still see it on StackDock"

**Root Cause**: 
- Adapters only call `insert()` or `patch()` - never `delete()`
- No orphan detection logic
- Resources deleted on provider remain in StackDock forever

## Architecture: Discovered vs Provisioned

### Resource Lifecycle States

**Discovered Resources** (`provisioningSource === undefined`):
- Found via provider API LIST endpoints
- Read-only sync
- **Safe to delete** if missing from provider API

**Provisioned Resources** (`provisioningSource === "sst" | "api" | "manual"`):
- Created by StackDock via mutations
- Owned by StackDock
- **NEVER delete** - even if missing from provider API

### Deletion Rules

```typescript
// ✅ SAFE TO DELETE
if (resource.provisioningSource === undefined) {
  // Discovered resource - delete if missing from API
  await ctx.db.delete(resource._id)
}

// ❌ NEVER DELETE
if (resource.provisioningSource === "sst" || resource.provisioningSource === "api" || resource.provisioningSource === "manual") {
  // Provisioned resource - StackDock owns it
  // Don't delete even if missing from provider API
}
```

## Implementation Pattern

### For Each Adapter Sync Method

```typescript
async syncServers(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: ProviderServer[]
): Promise<void> {
  // 1. Get data from API
  const servers = preFetchedData || await fetchFromAPI()
  
  // 2. Track synced resource IDs
  const syncedResourceIds = new Set<string>()
  
  // 3. Upsert each resource from API
  for (const server of servers) {
    const providerResourceId = server.id.toString()
    syncedResourceIds.add(providerResourceId)
    
    // Upsert logic...
  }
  
  // 4. Find orphaned resources (exist in DB but not in API)
  const existingResources = await ctx.db
    .query("servers")
    .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
    .collect()
  
  // 5. Delete only discovered resources (provisioningSource === undefined)
  for (const existing of existingResources) {
    if (
      !syncedResourceIds.has(existing.providerResourceId) &&
      existing.provisioningSource === undefined // Only delete discovered resources
    ) {
      console.log(`[${provider}] Deleting orphaned resource: ${existing.name}`)
      await ctx.db.delete(existing._id)
    }
  }
}
```

## Adapters That Need Fixing

### ✅ Fixed
- [x] GitHub (`syncProjects`) - Fixed
- [x] DigitalOcean (`syncServers`, `syncBlockVolumes`) - Fixed
- [x] Vultr (`syncServers`, `syncBlockVolumes`) - Fixed
- [x] Hetzner (`syncServers`) - Fixed
- [x] Linode (`syncServers`, `syncBuckets`) - Fixed
- [x] Coolify (`syncServers`, `syncWebServices`, `syncDatabases`) - Fixed
- [x] GridPane (`syncServers`, `syncWebServices`, `syncDomains`) - Fixed
- [x] Vercel (`syncWebServices`) - Fixed
- [x] Netlify (`syncWebServices`) - Fixed
- [x] Cloudflare (`syncDomains`, `syncWebServices` - Pages & Workers) - Fixed
- [x] Turso (`syncDatabases`) - Fixed
- [x] Neon (`syncDatabases`) - Fixed
- [x] PlanetScale (`syncDatabases`) - Fixed
- [x] Convex (`syncDatabases`, `syncDeployments`) - Fixed

### ⚠️ Optional (Backup/Metadata Resources)
- [ ] GridPane (`syncBackupSchedules`, `syncBackupIntegrations`) - Less critical, can be done later
- [ ] Neon (`syncBackupSchedules`) - Less critical, can be done later

## Special Cases

### Projects (GitHub)
- Uses `githubRepo` field, not `providerResourceId`
- No `dockId` field (org-level)
- Already fixed ✅

### Resources with Multiple Docks
- Some resources might be synced by multiple docks
- Only delete if missing from ALL docks that sync it
- **Current implementation**: Delete if missing from THIS dock (may need refinement)

## Testing Checklist

- [ ] Deleted repo on GitHub → Removed from StackDock after sync
- [ ] Deleted server on provider → Removed from StackDock after sync
- [ ] Provisioned resource (via StackDock) → NOT deleted even if missing from provider
- [ ] Multiple docks syncing same resource → Handled correctly
- [ ] Empty API response → All discovered resources deleted

## Next Steps

1. **Fix all adapters** - Apply deletion pattern to all sync methods
2. **Verify continuous sync** - Ensure sync is actually running every 60s
3. **Test deletion logic** - Verify discovered vs provisioned distinction works
4. **Document edge cases** - Multiple docks, empty responses, etc.

## Related Issues

- Continuous sync may not be running (user reports stale data)
- Frontend reactivity may not be working (TanStack Start caching?)
- Need to verify sync is actually updating database
