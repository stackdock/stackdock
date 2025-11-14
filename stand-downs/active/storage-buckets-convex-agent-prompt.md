# Storage and Buckets Implementation - Convex Agent Prompt

**Date**: November 14, 2025  
**Mission**: Storage and Buckets Implementation  
**Agent**: Convex Agent (Backend)  
**Priority**: High

---

## 🎯 Task

Implement storage resource tables for block volumes (Vultr blocks + DigitalOcean volumes) and object storage buckets (Linode buckets). This follows the universal table pattern established for `servers`, `webServices`, `domains`, and `databases`.

**Key Points**:
- **Block Volumes**: Vultr calls them "blocks", DigitalOcean calls them "volumes" - both are block storage → unified as `blockVolumes`
- **Buckets**: Linode object storage buckets → `buckets` table
- Both tables follow the universal schema pattern with provider-specific data in `fullApiData`

---

## 📋 Full Implementation Plan

**Read**: `docs/plans/STORAGE_AND_BUCKETS_IMPLEMENTATION.md`

This comprehensive plan includes:
- Schema changes (2 new tables: `blockVolumes`, `buckets`)
- Dock adapter interface updates
- Adapter implementations for Vultr, DigitalOcean, Linode
- API class updates
- Type definitions
- Query functions
- Complete field mappings

---

## 🔑 Implementation Phases

### Phase 1: Schema Updates

**File**: `convex/schema.ts`

1. Add `blockVolumes` table with:
   - Universal fields: `orgId`, `dockId`, `provider`, `providerResourceId`, `name`, `sizeGb`, `region`, `status`
   - Block-specific fields: `attachedToInstance`, `attachedToInstanceLabel`, `mountId`, `blockType`, `filesystemType`
   - Standard fields: `fullApiData`, `updatedAt`, provisioning metadata

2. Add `buckets` table with:
   - Universal fields: `orgId`, `dockId`, `provider`, `providerResourceId`, `name`, `region`, `status`
   - Bucket-specific fields: `cluster`, `hostname`, `s3Endpoint`, `sizeBytes`, `objectCount`
   - Standard fields: `fullApiData`, `updatedAt`, provisioning metadata

3. Update `projectResources` table:
   - Add `v.literal("blockVolumes")` to `resourceTable` union
   - Add `v.literal("buckets")` to `resourceTable` union

**Reference**: See `servers`, `webServices`, `databases` tables for pattern.

---

### Phase 2: Dock Adapter Interface

**File**: `convex/docks/_types.ts`

Add two new optional sync methods to `DockAdapter` interface:

```typescript
syncBlockVolumes?(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: any[]
): Promise<void>

syncBuckets?(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: any[]
): Promise<void>
```

**Reference**: See `syncServers?`, `syncWebServices?`, `syncDatabases?` methods for pattern.

---

### Phase 3: Dock Mutations

**File**: `convex/docks/mutations.ts`

1. Update `syncDock` mutation:
   - Add `if (adapter.syncBlockVolumes) resourceTypes.push("blockVolumes")`
   - Add `if (adapter.syncBuckets) resourceTypes.push("buckets")`

2. Update `syncDockResources` internal mutation:
   - Add `if (args.fetchedData.blockVolumes && adapter.syncBlockVolumes) { await adapter.syncBlockVolumes(ctx, dock, args.fetchedData.blockVolumes) }`
   - Add `if (args.fetchedData.buckets && adapter.syncBuckets) { await adapter.syncBuckets(ctx, dock, args.fetchedData.buckets) }`

**Reference**: See existing `syncServers`, `syncWebServices`, `syncDatabases` calls.

---

### Phase 4: API Classes

#### Vultr API
**File**: `convex/docks/adapters/vultr/api.ts`

Add method:
```typescript
async listBlocks(): Promise<VultrBlock[]> {
  const response = await this.request("GET", "/blocks")
  return response.blocks || []
}
```

#### DigitalOcean API
**File**: `convex/docks/adapters/digitalocean/api.ts`

Add method:
```typescript
async listVolumes(): Promise<DigitalOceanVolume[]> {
  const response = await this.request("GET", "/v2/volumes")
  return response.volumes || []
}
```

#### Linode API
**File**: `convex/docks/adapters/linode/api.ts`

Add method:
```typescript
async listBuckets(): Promise<LinodeBucket[]> {
  const response = await this.request("GET", "/v4/object-storage/buckets")
  return response.data || []
}
```

**Reference**: See `listInstances()`, `listDroplets()`, `listDatabases()` methods for pattern.

---

### Phase 5: Type Definitions

#### Vultr Types
**File**: `convex/docks/adapters/vultr/types.ts`

Add interface:
```typescript
export interface VultrBlock {
  id: string
  date_created: string
  cost: number
  pending_charges: number
  status: string
  size_gb: number
  region: string
  attached_to_instance: string
  attached_to_instance_ip: string
  attached_to_instance_label: string
  label: string
  mount_id: string
  block_type: string
  os_id: number
  snapshot_id: string
  bootable: boolean
}
```

**Reference JSON**: `docks/vultr/getBlocks.json`

#### DigitalOcean Types
**File**: `convex/docks/adapters/digitalocean/types.ts`

Add interface:
```typescript
export interface DigitalOceanVolume {
  id: string
  name: string
  created_at: string
  description: string
  droplet_ids: number[]
  region: {
    name: string
    slug: string
    available: boolean
    features: string[]
    sizes: string[]
  }
  size_gigabytes: number
  filesystem_type: string
  filesystem_label: string
  tags: string[] | null
}
```

**Reference JSON**: `docks/digitalocean/getVolumes.json`

#### Linode Types
**File**: `convex/docks/adapters/linode/types.ts`

Add interface:
```typescript
export interface LinodeBucket {
  hostname: string
  label: string
  created: string
  region: string
  cluster: string
  size: number
  objects: number
  endpoint_type: string
  s3_endpoint: string
}
```

**Reference JSON**: `docks/linode/getBuckets.json`

---

### Phase 6: Dock Adapter Implementations

#### Vultr Adapter
**File**: `convex/docks/adapters/vultr/adapter.ts`

Add `syncBlockVolumes` method:
- Fetch blocks (use preFetchedData if available, else call `api.listBlocks()`)
- For each block:
  - Check if exists using `by_dock_resource` index
  - Map Vultr fields to universal schema:
    - `block.id` → `providerResourceId`
    - `block.label || block.id` → `name`
    - `block.size_gb` → `sizeGb`
    - `block.region` → `region`
    - `block.status` → `status`
    - `block.attached_to_instance` → `attachedToInstance`
    - `block.attached_to_instance_label` → `attachedToInstanceLabel`
    - `block.mount_id` → `mountId`
    - `block.block_type` → `blockType`
  - Store all Vultr fields in `fullApiData.block`
  - Insert or patch

**Reference**: See `syncServers` method in same file.

#### DigitalOcean Adapter
**File**: `convex/docks/adapters/digitalocean/adapter.ts`

Add `syncBlockVolumes` method:
- Fetch volumes (use preFetchedData if available, else call `api.listVolumes()`)
- For each volume:
  - Check if exists using `by_dock_resource` index
  - Map DO fields to universal schema:
    - `volume.id` → `providerResourceId`
    - `volume.name` → `name`
    - `volume.size_gigabytes` → `sizeGb`
    - `volume.region.slug || volume.region.name` → `region`
    - `"active"` → `status` (DO volumes don't have explicit status)
    - `volume.droplet_ids[0]` → `attachedToInstance` (if exists)
    - `volume.filesystem_type` → `filesystemType`
  - Store all DO fields in `fullApiData.volume`
  - Insert or patch

**Reference**: See `syncServers` method in same file.

#### Linode Adapter
**File**: `convex/docks/adapters/linode/adapter.ts`

Add `syncBuckets` method:
- Fetch buckets (use preFetchedData if available, else call `api.listBuckets()`)
- For each bucket:
  - Check if exists using `by_dock_resource` index (use `bucket.label` as `providerResourceId`)
  - Map Linode fields to universal schema:
    - `bucket.label` → `providerResourceId` and `name`
    - `bucket.region` → `region`
    - `bucket.cluster` → `cluster`
    - `bucket.hostname` → `hostname`
    - `bucket.s3_endpoint` → `s3Endpoint`
    - `bucket.size` → `sizeBytes`
    - `bucket.objects` → `objectCount`
    - `"active"` → `status` (Linode buckets don't have explicit status)
  - Store all Linode fields in `fullApiData.bucket`
  - Insert or patch

**Reference**: See `syncServers` method in same file.

---

### Phase 7: Dock Actions

#### Vultr Actions
**File**: `convex/docks/actions/vultr.ts` (or similar)

Update `fetchAllResources` to include:
```typescript
const blocks = await api.listBlocks()
return {
  // ... existing resources
  blockVolumes: blocks,
}
```

#### DigitalOcean Actions
**File**: `convex/docks/actions/digitalocean.ts` (or similar)

Update `fetchAllResources` to include:
```typescript
const volumes = await api.listVolumes()
return {
  // ... existing resources
  blockVolumes: volumes,
}
```

#### Linode Actions
**File**: `convex/docks/actions/linode.ts` (or similar)

Update `fetchAllResources` to include:
```typescript
const buckets = await api.listBuckets()
return {
  // ... existing resources
  buckets: buckets,
}
```

**Reference**: See how `servers`, `webServices`, `databases` are fetched in existing actions.

---

### Phase 8: Query Functions

**File**: `convex/resources/queries.ts`

Add two new queries:

```typescript
/**
 * List all block volumes for the current user's organization
 */
export const listBlockVolumes = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return []
    }
    
    const volumes = await ctx.db
      .query("blockVolumes")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return volumes
  },
})

/**
 * List all buckets for the current user's organization
 */
export const listBuckets = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      return []
    }
    
    const buckets = await ctx.db
      .query("buckets")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return buckets
  },
})
```

**Reference**: See `listServers`, `listWebServices`, `listDatabases` queries for pattern.

---

## 📁 API Response Files Available

- ✅ `docks/vultr/getBlocks.json` - Vultr blocks response
- ✅ `docks/digitalocean/getVolumes.json` - DigitalOcean volumes response
- ✅ `docks/linode/getBuckets.json` - Linode buckets response

---

## 🔗 Reference Files

### Schema Pattern
- **File**: `convex/schema.ts`
- **Reference Tables**: `servers`, `webServices`, `databases`
- **Pattern**: Universal fields + provider-specific in `fullApiData`

### Adapter Pattern
- **File**: `convex/docks/adapters/vultr/adapter.ts`
- **Reference Method**: `syncServers`
- **Pattern**: Check existing → Map fields → Insert/Patch

### Query Pattern
- **File**: `convex/resources/queries.ts`
- **Reference Queries**: `listServers`, `listWebServices`
- **Pattern**: RBAC check → Query by orgId → Return results

---

## ✅ Testing Checklist

### Schema
- [ ] `blockVolumes` table created with all indexes
- [ ] `buckets` table created with all indexes
- [ ] `projectResources.resourceTable` union updated
- [ ] Convex auto-migration successful

### Adapters
- [ ] Vultr `syncBlockVolumes` syncs blocks correctly
- [ ] DigitalOcean `syncBlockVolumes` syncs volumes correctly
- [ ] Linode `syncBuckets` syncs buckets correctly
- [ ] Provider-specific data stored in `fullApiData`
- [ ] Duplicate syncs prevented (by_dock_resource index)

### Queries
- [ ] `listBlockVolumes` returns correct data
- [ ] `listBuckets` returns correct data
- [ ] RBAC enforced (users only see their org's resources)
- [ ] Empty arrays returned for users without org membership

### Integration
- [ ] Dock sync includes new resource types
- [ ] Resources appear after sync
- [ ] No TypeScript errors
- [ ] All indexes working correctly

---

## 🚨 Critical Rules

1. **Universal Schema Pattern**: Both Vultr blocks and DO volumes map to same `blockVolumes` table. Provider differences go in `fullApiData`.

2. **RBAC Enforcement**: All queries MUST check user membership and filter by `orgId`.

3. **Index Usage**: Always use `by_dock_resource` index to prevent duplicate syncs.

4. **Field Mapping**: Map provider fields to universal fields. Store ALL provider fields in `fullApiData`.

5. **Status Handling**: Vultr has explicit status. DO and Linode don't - use `"active"` as default if resource exists.

---

## 📝 Notes

- **Naming**: Vultr uses "blocks", DO uses "volumes" → unified as "blockVolumes"
- **Linode Buckets**: Object storage is different from block storage → separate `buckets` table
- **Future Providers**: Pattern supports AWS EBS, Azure disks (→ `blockVolumes`), S3, Spaces (→ `buckets`)
- **Attached Instances**: Store instance ID/label but no foreign keys (universal table pattern)

---

**Ready to implement**: Plan complete, JSON files available, patterns established. Follow universal table pattern strictly.
