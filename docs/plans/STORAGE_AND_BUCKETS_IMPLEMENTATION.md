# Storage and Buckets Implementation Plan

**Date**: 2025-11-14  
**Status**: Planning Phase  
**Involves**: Convex Backend Agent + Frontend Agent

## Overview

Implement storage resource tables for the Storage page under Infrastructure:
1. **Block Volumes Table** - Display Vultr blocks and DigitalOcean volumes (both are block storage)
2. **Buckets Table** - Display Linode object storage buckets

## Data Structures Analysis

### Vultr Blocks (`docks/vultr/getBlocks.json`)
```json
{
  "blocks": [{
    "id": "ae6c4452-b93b-4f4d-b8c1-2cea28d99fb8",
    "date_created": "2025-11-14T18:12:48+00:00",
    "cost": 1,
    "pending_charges": 0.01,
    "status": "active",
    "size_gb": 10,
    "region": "lax",
    "attached_to_instance": "",
    "attached_to_instance_ip": "",
    "attached_to_instance_label": "",
    "label": "sdtest",
    "mount_id": "lax-ae6c4452b93b4f",
    "block_type": "high_perf",
    "os_id": 0,
    "snapshot_id": "0",
    "bootable": false
  }]
}
```

### DigitalOcean Volumes (`docks/digitalocean/getVolumes.json`)
```json
{
  "volumes": [{
    "id": "3b6381a6-c187-11f0-a93d-0a58ac125cb7",
    "name": "sd-test-do",
    "created_at": "2025-11-14T18:25:00Z",
    "description": "",
    "droplet_ids": [529967704],
    "region": {
      "name": "Atlanta 1",
      "slug": "atl1",
      "available": false
    },
    "size_gigabytes": 10,
    "filesystem_type": "ext4",
    "filesystem_label": "",
    "tags": null
  }]
}
```

### Linode Buckets (`docks/linode/getBuckets.json`)
```json
{
  "data": [{
    "hostname": "sdtest.us-sea-1.linodeobjects.com",
    "label": "sdtest",
    "created": "2025-11-14T18:14:48",
    "region": "us-sea",
    "cluster": "us-sea-1",
    "size": 0,
    "objects": 0,
    "endpoint_type": "E1",
    "s3_endpoint": "us-sea-1.linodeobjects.com"
  }]
}
```

---

## Phase 1: Convex Backend - Schema Updates

### 1.1 Add Universal Tables to `convex/schema.ts`

#### Table: `blockVolumes`
```typescript
// Master Fleet List: Block Volumes (Block Storage)
blockVolumes: defineTable({
  orgId: v.id("organizations"),
  dockId: v.id("docks"),
  provider: v.string(), // "vultr", "digitalocean"
  providerResourceId: v.string(), // Vultr block ID or DO volume ID
  name: v.string(), // Vultr label or DO name
  sizeGb: v.number(), // Size in GB
  region: v.string(), // Provider region code
  status: v.string(), // "active", "attached", "detached", etc.
  attachedToInstance: v.optional(v.string()), // Instance/server ID it's attached to
  attachedToInstanceLabel: v.optional(v.string()), // Instance/server name
  mountId: v.optional(v.string()), // Vultr mount_id
  blockType: v.optional(v.string()), // Vultr block_type (e.g., "high_perf")
  filesystemType: v.optional(v.string()), // DO filesystem_type (e.g., "ext4")
  fullApiData: v.any(), // All provider-specific fields
  updatedAt: v.optional(v.number()),
  // Provisioning metadata (for future SST support)
  provisioningSource: v.optional(v.union(v.literal("sst"), v.literal("api"), v.literal("manual"))),
  sstResourceId: v.optional(v.string()),
  sstStackName: v.optional(v.string()),
  provisioningState: v.optional(v.union(v.literal("provisioning"), v.literal("provisioned"), v.literal("failed"), v.literal("deprovisioning"))),
  provisionedAt: v.optional(v.number()),
})
  .index("by_orgId", ["orgId"])
  .index("by_dockId", ["dockId"])
  .index("by_dock_resource", ["dockId", "providerResourceId"]) // Prevent duplicate syncs
  .index("by_provisioning_source", ["provisioningSource", "orgId"])
  .index("by_sst_resource", ["sstStackName", "sstResourceId"]),
```

#### Table: `buckets`
```typescript
// Master Fleet List: Object Storage Buckets
buckets: defineTable({
  orgId: v.id("organizations"),
  dockId: v.id("docks"),
  provider: v.string(), // "linode", "aws-s3", "digitalocean-spaces", etc.
  providerResourceId: v.string(), // Bucket name or ID (provider-specific)
  name: v.string(), // Bucket label/name
  region: v.string(), // Provider region code
  cluster: v.optional(v.string()), // Linode cluster (e.g., "us-sea-1")
  hostname: v.optional(v.string()), // Linode hostname
  s3Endpoint: v.optional(v.string()), // S3-compatible endpoint
  sizeBytes: v.optional(v.number()), // Total size in bytes
  objectCount: v.optional(v.number()), // Number of objects
  status: v.string(), // "active", "pending", etc.
  fullApiData: v.any(), // All provider-specific fields
  updatedAt: v.optional(v.number()),
  // Provisioning metadata (for future SST support)
  provisioningSource: v.optional(v.union(v.literal("sst"), v.literal("api"), v.literal("manual"))),
  sstResourceId: v.optional(v.string()),
  sstStackName: v.optional(v.string()),
  provisioningState: v.optional(v.union(v.literal("provisioning"), v.literal("provisioned"), v.literal("failed"), v.literal("deprovisioning"))),
  provisionedAt: v.optional(v.number()),
})
  .index("by_orgId", ["orgId"])
  .index("by_dockId", ["dockId"])
  .index("by_dock_resource", ["dockId", "providerResourceId"]) // Prevent duplicate syncs
  .index("by_provisioning_source", ["provisioningSource", "orgId"])
  .index("by_sst_resource", ["sstStackName", "sstResourceId"]),
```

### 1.2 Update `projectResources` Table
Add new resource types to the polymorphic union:
```typescript
resourceTable: v.union(
  v.literal("servers"),
  v.literal("domains"),
  v.literal("webServices"),
  v.literal("databases"),
  v.literal("blockVolumes"), // NEW
  v.literal("buckets") // NEW
),
```

---

## Phase 2: Convex Backend - Dock Adapter Interface Updates

### 2.1 Update `convex/docks/_types.ts`

Add new optional sync methods to `DockAdapter` interface:
```typescript
/**
 * Sync block volumes to universal `blockVolumes` table
 * 
 * Called during dock sync. Maps provider block storage (Vultr blocks, DO volumes) to universal schema.
 * 
 * @param ctx - Convex mutation context
 * @param dock - The dock document
 * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
 */
syncBlockVolumes?(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: any[]
): Promise<void>

/**
 * Sync buckets (object storage) to universal `buckets` table
 * 
 * Called during dock sync. Maps provider object storage (Linode buckets, S3, Spaces) to universal schema.
 * 
 * @param ctx - Convex mutation context
 * @param dock - The dock document
 * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
 */
syncBuckets?(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: any[]
): Promise<void>
```

### 2.2 Update `convex/docks/mutations.ts`

Add sync calls in `syncDockResources` internal mutation:
```typescript
if (args.fetchedData.blockVolumes && adapter.syncBlockVolumes) {
  await adapter.syncBlockVolumes(ctx, dock, args.fetchedData.blockVolumes)
}

if (args.fetchedData.buckets && adapter.syncBuckets) {
  await adapter.syncBuckets(ctx, dock, args.fetchedData.buckets)
}
```

Update `syncDock` mutation to include new resource types in `resourceTypes` array:
```typescript
if (adapter.syncBlockVolumes) resourceTypes.push("blockVolumes")
if (adapter.syncBuckets) resourceTypes.push("buckets")
```

---

## Phase 3: Convex Backend - Dock Adapter Implementations

### 3.1 Vultr Adapter - `convex/docks/adapters/vultr/adapter.ts`

#### Add `syncBlockVolumes` method:
```typescript
/**
 * Sync Vultr blocks to universal `blockVolumes` table
 * 
 * Maps Vultr block storage to universal schema:
 * - Vultr "blocks" → universal "blockVolumes"
 * - Provider-specific fields stored in fullApiData
 */
async syncBlockVolumes(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: VultrBlock[]
): Promise<void> {
  let blocks: VultrBlock[]

  if (preFetchedData) {
    blocks = preFetchedData
  } else {
    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })
    const api = new VultrAPI(apiKey)
    blocks = await api.listBlocks()
  }

  for (const block of blocks) {
    const providerResourceId = block.id

    const existing = await ctx.db
      .query("blockVolumes")
      .withIndex("by_dock_resource", (q) =>
        q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
      )
      .first()

    const volumeData = {
      orgId: dock.orgId,
      dockId: dock._id,
      provider: "vultr",
      providerResourceId,
      name: block.label || block.id,
      sizeGb: block.size_gb,
      region: block.region,
      status: block.status, // "active", etc.
      attachedToInstance: block.attached_to_instance || undefined,
      attachedToInstanceLabel: block.attached_to_instance_label || undefined,
      mountId: block.mount_id,
      blockType: block.block_type,
      fullApiData: {
        block: {
          ...block,
        },
      },
      updatedAt: Date.now(),
    }

    if (existing) {
      await ctx.db.patch(existing._id, volumeData)
    } else {
      await ctx.db.insert("blockVolumes", volumeData)
    }
  }
}
```

#### Add to adapter export:
```typescript
export const vultrAdapter: DockAdapter = {
  // ... existing methods
  syncBlockVolumes: async (ctx, dock, preFetchedData) => {
    // Implementation above
  },
}
```

### 3.2 DigitalOcean Adapter - `convex/docks/adapters/digitalocean/adapter.ts`

#### Add `syncBlockVolumes` method:
```typescript
/**
 * Sync DigitalOcean volumes to universal `blockVolumes` table
 * 
 * Maps DO volumes to universal schema:
 * - DO "volumes" → universal "blockVolumes"
 * - Provider-specific fields stored in fullApiData
 */
async syncBlockVolumes(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: DigitalOceanVolume[]
): Promise<void> {
  let volumes: DigitalOceanVolume[]

  if (preFetchedData) {
    volumes = preFetchedData
  } else {
    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })
    const api = new DigitalOceanAPI(apiKey)
    volumes = await api.listVolumes()
  }

  for (const volume of volumes) {
    const providerResourceId = volume.id

    const existing = await ctx.db
      .query("blockVolumes")
      .withIndex("by_dock_resource", (q) =>
        q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
      )
      .first()

    // Get attached instance info if available
    const attachedInstanceId = volume.droplet_ids && volume.droplet_ids.length > 0
      ? volume.droplet_ids[0].toString()
      : undefined

    const volumeData = {
      orgId: dock.orgId,
      dockId: dock._id,
      provider: "digitalocean",
      providerResourceId,
      name: volume.name,
      sizeGb: volume.size_gigabytes,
      region: volume.region?.slug || volume.region?.name || "unknown",
      status: "active", // DO volumes don't have explicit status, assume active if returned
      attachedToInstance: attachedInstanceId,
      filesystemType: volume.filesystem_type,
      fullApiData: {
        volume: {
          ...volume,
        },
      },
      updatedAt: Date.now(),
    }

    if (existing) {
      await ctx.db.patch(existing._id, volumeData)
    } else {
      await ctx.db.insert("blockVolumes", volumeData)
    }
  }
}
```

### 3.3 Linode Adapter - `convex/docks/adapters/linode/adapter.ts`

#### Add `syncBuckets` method:
```typescript
/**
 * Sync Linode object storage buckets to universal `buckets` table
 * 
 * Maps Linode buckets to universal schema:
 * - Linode "buckets" → universal "buckets"
 * - Provider-specific fields stored in fullApiData
 */
async syncBuckets(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: LinodeBucket[]
): Promise<void> {
  let buckets: LinodeBucket[]

  if (preFetchedData) {
    buckets = preFetchedData
  } else {
    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })
    const api = new LinodeAPI(apiKey)
    buckets = await api.listBuckets()
  }

  for (const bucket of buckets) {
    const providerResourceId = bucket.label // Linode uses label as unique identifier

    const existing = await ctx.db
      .query("buckets")
      .withIndex("by_dock_resource", (q) =>
        q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
      )
      .first()

    const bucketData = {
      orgId: dock.orgId,
      dockId: dock._id,
      provider: "linode",
      providerResourceId,
      name: bucket.label,
      region: bucket.region,
      cluster: bucket.cluster,
      hostname: bucket.hostname,
      s3Endpoint: bucket.s3_endpoint,
      sizeBytes: bucket.size || 0,
      objectCount: bucket.objects || 0,
      status: "active", // Linode buckets don't have explicit status, assume active if returned
      fullApiData: {
        bucket: {
          ...bucket,
        },
      },
      updatedAt: Date.now(),
    }

    if (existing) {
      await ctx.db.patch(existing._id, bucketData)
    } else {
      await ctx.db.insert("buckets", bucketData)
    }
  }
}
```

### 3.4 Update API Classes

#### Vultr API - `convex/docks/adapters/vultr/api.ts`
Add method:
```typescript
async listBlocks(): Promise<VultrBlock[]> {
  const response = await this.request("GET", "/blocks")
  return response.blocks || []
}
```

#### DigitalOcean API - `convex/docks/adapters/digitalocean/api.ts`
Add method:
```typescript
async listVolumes(): Promise<DigitalOceanVolume[]> {
  const response = await this.request("GET", "/v2/volumes")
  return response.volumes || []
}
```

#### Linode API - `convex/docks/adapters/linode/api.ts`
Add method:
```typescript
async listBuckets(): Promise<LinodeBucket[]> {
  const response = await this.request("GET", "/v4/object-storage/buckets")
  return response.data || []
}
```

### 3.5 Update Type Definitions

#### Vultr Types - `convex/docks/adapters/vultr/types.ts`
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

#### DigitalOcean Types - `convex/docks/adapters/digitalocean/types.ts`
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

#### Linode Types - `convex/docks/adapters/linode/types.ts`
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

---

## Phase 4: Convex Backend - Query Functions

### 4.1 Add Queries to `convex/resources/queries.ts`

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

---

## Phase 5: Frontend - Table Components

### 5.1 Create `apps/web/src/components/resources/block-volumes-table.tsx`

**Pattern**: Follow `servers-table.tsx` structure

**Key Columns**:
- Name (with provider badge)
- Provider (Vultr/DigitalOcean)
- Size (GB)
- Region
- Status
- Attached To (instance/server name if attached)
- Actions (view details, etc.)

**Features**:
- Filtering by provider, region, status
- Sorting by size, name, region
- Pagination
- Provider badges
- Status badges
- Copy size/region to clipboard

### 5.2 Create `apps/web/src/components/resources/buckets-table.tsx`

**Pattern**: Follow `servers-table.tsx` structure

**Key Columns**:
- Name (with provider badge)
- Provider (Linode)
- Region/Cluster
- Size (formatted bytes)
- Objects (count)
- S3 Endpoint (copyable)
- Status
- Actions (view details, etc.)

**Features**:
- Filtering by provider, region
- Sorting by size, name, object count
- Pagination
- Provider badges
- Status badges
- Copy endpoint to clipboard
- Format bytes to human-readable (KB, MB, GB, TB)

---

## Phase 6: Frontend - Storage Page Updates

### 6.1 Update `apps/web/src/routes/dashboard/infrastructure/storage.tsx`

Replace placeholder with:
```typescript
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Archive, HardDrive } from "lucide-react"
import { BlockVolumesTable } from "@/components/resources/block-volumes-table"
import { BucketsTable } from "@/components/resources/buckets-table"

export const Route = createFileRoute("/dashboard/infrastructure/storage")({
  component: StoragePage,
})

function StoragePage() {
  const blockVolumes = useQuery(api["resources/queries"].listBlockVolumes)
  const buckets = useQuery(api["resources/queries"].listBuckets)
  
  const volumesList = blockVolumes || []
  const bucketsList = buckets || []

  if (blockVolumes === undefined || buckets === undefined) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            Storage
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            View your storage resources
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="text-muted-foreground">Loading storage resources...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Storage
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          View your block volumes and object storage buckets
        </p>
      </div>
      
      {/* Block Volumes Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {volumesList.length} {volumesList.length === 1 ? 'Block Volume' : 'Block Volumes'}
          </h2>
        </div>
        <BlockVolumesTable data={blockVolumes} />
      </div>
      
      {/* Buckets Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Archive className="h-5 w-5" />
            {bucketsList.length} {bucketsList.length === 1 ? 'Bucket' : 'Buckets'}
          </h2>
        </div>
        <BucketsTable data={buckets} />
      </div>
    </main>
  )
}
```

---

## Phase 7: Frontend - Update Insights Page

### 7.1 Add Storage Cards to `apps/web/src/routes/dashboard/index.tsx`

Add queries:
```typescript
const blockVolumes = useQuery(api["resources/queries"].listBlockVolumes)
const buckets = useQuery(api["resources/queries"].listBuckets)
```

Add cards:
```typescript
<div className="rounded-lg border border-border bg-card p-4 md:p-6">
  <div className="flex items-center gap-2 mb-2">
    <HardDrive className="h-4 w-4 text-muted-foreground" />
    <h3 className="text-xs font-medium text-muted-foreground md:text-sm">
      Block Volumes
    </h3>
  </div>
  <p className="text-2xl font-bold text-foreground md:text-3xl">
    {blockVolumes?.length || 0}
  </p>
</div>

<div className="rounded-lg border border-border bg-card p-4 md:p-6">
  <div className="flex items-center gap-2 mb-2">
    <Archive className="h-4 w-4 text-muted-foreground" />
    <h3 className="text-xs font-medium text-muted-foreground md:text-sm">
      Buckets
    </h3>
  </div>
  <p className="text-2xl font-bold text-foreground md:text-3xl">
    {buckets?.length || 0}
  </p>
</div>
```

---

## Phase 8: Dock Actions Updates

### 8.1 Update Dock Action Files

#### Vultr Actions - `convex/docks/actions/vultr.ts`
Add to `fetchAllResources`:
```typescript
const blocks = await api.listBlocks()
return {
  // ... existing resources
  blockVolumes: blocks,
}
```

#### DigitalOcean Actions - `convex/docks/actions/digitalocean.ts`
Add to `fetchAllResources`:
```typescript
const volumes = await api.listVolumes()
return {
  // ... existing resources
  blockVolumes: volumes,
}
```

#### Linode Actions - `convex/docks/actions/linode.ts`
Add to `fetchAllResources`:
```typescript
const buckets = await api.listBuckets()
return {
  // ... existing resources
  buckets: buckets,
}
```

---

## Implementation Order

1. **Convex Schema** (`convex/schema.ts`)
   - Add `blockVolumes` table
   - Add `buckets` table
   - Update `projectResources` union

2. **Dock Adapter Interface** (`convex/docks/_types.ts`)
   - Add `syncBlockVolumes?` method
   - Add `syncBuckets?` method

3. **Dock Mutations** (`convex/docks/mutations.ts`)
   - Add sync calls for new resource types
   - Update resource types array

4. **API Classes** (Vultr, DigitalOcean, Linode)
   - Add `listBlocks()` to Vultr API
   - Add `listVolumes()` to DigitalOcean API
   - Add `listBuckets()` to Linode API

5. **Type Definitions** (Vultr, DigitalOcean, Linode)
   - Add `VultrBlock` interface
   - Add `DigitalOceanVolume` interface
   - Add `LinodeBucket` interface

6. **Dock Adapters** (Vultr, DigitalOcean, Linode)
   - Implement `syncBlockVolumes` in Vultr adapter
   - Implement `syncBlockVolumes` in DigitalOcean adapter
   - Implement `syncBuckets` in Linode adapter

7. **Dock Actions** (Vultr, DigitalOcean, Linode)
   - Add block volumes to Vultr fetch
   - Add volumes to DigitalOcean fetch
   - Add buckets to Linode fetch

8. **Query Functions** (`convex/resources/queries.ts`)
   - Add `listBlockVolumes` query
   - Add `listBuckets` query

9. **Frontend Table Components**
   - Create `block-volumes-table.tsx`
   - Create `buckets-table.tsx`

10. **Storage Page** (`apps/web/src/routes/dashboard/infrastructure/storage.tsx`)
    - Update to use new tables and queries

11. **Insights Page** (`apps/web/src/routes/dashboard/index.tsx`)
    - Add storage cards

---

## Testing Checklist

### Backend Testing
- [ ] Schema migration successful (Convex will auto-migrate)
- [ ] Vultr adapter syncs blocks correctly
- [ ] DigitalOcean adapter syncs volumes correctly
- [ ] Linode adapter syncs buckets correctly
- [ ] Queries return correct data filtered by org
- [ ] RBAC enforced (users only see their org's resources)

### Frontend Testing
- [ ] Block volumes table displays correctly
- [ ] Buckets table displays correctly
- [ ] Tables handle empty states
- [ ] Tables handle loading states
- [ ] Tables handle error states
- [ ] Filtering works correctly
- [ ] Sorting works correctly
- [ ] Pagination works correctly
- [ ] Copy to clipboard works
- [ ] Storage page displays both tables
- [ ] Insights page shows storage counts

### Integration Testing
- [ ] Dock sync includes new resource types
- [ ] Resources appear in Storage page after sync
- [ ] Resources appear in Insights page after sync
- [ ] Provider badges display correctly
- [ ] Status badges display correctly

---

## Notes

1. **Universal Schema Pattern**: Both Vultr blocks and DigitalOcean volumes map to the same `blockVolumes` table. Provider-specific differences are stored in `fullApiData`.

2. **Naming Consistency**: 
   - Vultr uses "blocks"
   - DigitalOcean uses "volumes"
   - Both are "block storage" → unified as "blockVolumes"

3. **Linode Buckets**: Object storage is different from block storage, so it gets its own `buckets` table.

4. **Future Providers**: This pattern supports adding AWS EBS volumes, Azure disks, etc. to `blockVolumes`, and S3, Spaces, etc. to `buckets`.

5. **Size Formatting**: Block volumes use GB (consistent). Buckets may need byte formatting (KB, MB, GB, TB) since Linode returns bytes.

6. **Attached Instances**: Block volumes can be attached to servers. We store the instance ID and label for reference, but don't create foreign key relationships (following the universal table pattern).

---

## Files to Create/Modify

### New Files
- `apps/web/src/components/resources/block-volumes-table.tsx`
- `apps/web/src/components/resources/buckets-table.tsx`

### Modified Files
- `convex/schema.ts`
- `convex/docks/_types.ts`
- `convex/docks/mutations.ts`
- `convex/docks/adapters/vultr/adapter.ts`
- `convex/docks/adapters/vultr/api.ts`
- `convex/docks/adapters/vultr/types.ts`
- `convex/docks/adapters/digitalocean/adapter.ts`
- `convex/docks/adapters/digitalocean/api.ts`
- `convex/docks/adapters/digitalocean/types.ts`
- `convex/docks/adapters/linode/adapter.ts`
- `convex/docks/adapters/linode/api.ts`
- `convex/docks/adapters/linode/types.ts`
- `convex/docks/actions/vultr.ts` (or similar)
- `convex/docks/actions/digitalocean.ts` (or similar)
- `convex/docks/actions/linode.ts` (or similar)
- `convex/resources/queries.ts`
- `apps/web/src/routes/dashboard/infrastructure/storage.tsx`
- `apps/web/src/routes/dashboard/index.tsx`

---

**END OF PLAN**
