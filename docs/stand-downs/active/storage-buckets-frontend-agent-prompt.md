# Storage and Buckets Implementation - Frontend Agent Prompt

**Date**: November 14, 2025  
**Mission**: Storage and Buckets Implementation  
**Agent**: Frontend Agent  
**Priority**: High

---

## 🎯 Task

Create frontend table components and update the Storage page to display block volumes (Vultr blocks + DigitalOcean volumes) and object storage buckets (Linode buckets). Follow the established table component patterns.

**Key Points**:
- **Block Volumes Table**: Display Vultr blocks and DigitalOcean volumes in one unified table
- **Buckets Table**: Display Linode object storage buckets
- Both tables follow the `servers-table.tsx` pattern
- Update Storage page to show both tables
- Add storage cards to Insights page

---

## 📋 Full Implementation Plan

**Read**: `docs/plans/STORAGE_AND_BUCKETS_IMPLEMENTATION.md`

This comprehensive plan includes:
- Table component specifications
- Column definitions
- Storage page updates
- Insights page updates
- Complete field mappings

---

## 🔑 Implementation Tasks

### Task 1: Create Block Volumes Table Component

**File**: `apps/web/src/components/resources/block-volumes-table.tsx`

**Pattern**: Follow `apps/web/src/components/resources/servers-table.tsx`

**Key Columns**:
- **Name** (with provider badge)
  - Display: `volume.name`
  - Provider badge: `volume.provider` (Vultr/DigitalOcean)

- **Provider** (badge)
  - Use `ProviderBadge` component
  - Values: "vultr", "digitalocean"

- **Size** (GB)
  - Display: `volume.sizeGb` + " GB"
  - Sortable
  - Copyable (toast on copy)

- **Region**
  - Display: `volume.region`
  - Sortable
  - Copyable (toast on copy)

- **Status** (badge)
  - Use `StatusBadge` component
  - Values: "active", "attached", "detached", etc.

- **Attached To** (optional)
  - Display: `volume.attachedToInstanceLabel` if exists, else "N/A"
  - Show instance/server name if attached

- **Actions** (dropdown)
  - View details (future)
  - Copy mount ID (Vultr only, if exists)

**Features**:
- Filtering by provider, region, status
- Sorting by size, name, region
- Pagination (10, 25, 50, 100 per page)
- Column visibility toggle
- Provider badges
- Status badges
- Copy size/region to clipboard (toast confirmation)
- Loading state (`undefined = loading`)
- Empty state (`[] = no volumes`)

**Reference**: `apps/web/src/components/resources/servers-table.tsx`

---

### Task 2: Create Buckets Table Component

**File**: `apps/web/src/components/resources/buckets-table.tsx`

**Pattern**: Follow `apps/web/src/components/resources/servers-table.tsx`

**Key Columns**:
- **Name** (with provider badge)
  - Display: `bucket.name`
  - Provider badge: `bucket.provider` (Linode)

- **Provider** (badge)
  - Use `ProviderBadge` component
  - Value: "linode"

- **Region/Cluster**
  - Display: `bucket.region` + " / " + `bucket.cluster` (if cluster exists)
  - Sortable
  - Copyable (toast on copy)

- **Size** (formatted bytes)
  - Display: Format `bucket.sizeBytes` to human-readable (KB, MB, GB, TB)
  - Use utility function: `formatBytes(bucket.sizeBytes || 0)`
  - Sortable (by bytes)
  - Copyable (toast on copy)

- **Objects** (count)
  - Display: `bucket.objectCount || 0`
  - Format with commas: `1,234`
  - Sortable

- **S3 Endpoint** (copyable)
  - Display: `bucket.s3Endpoint` or "N/A"
  - Copyable (toast on copy)
  - Monospace font

- **Status** (badge)
  - Use `StatusBadge` component
  - Value: "active" (Linode buckets don't have explicit status)

- **Actions** (dropdown)
  - View details (future)
  - Copy endpoint (if exists)

**Features**:
- Filtering by provider, region
- Sorting by size, name, object count
- Pagination (10, 25, 50, 100 per page)
- Column visibility toggle
- Provider badges
- Status badges
- Copy endpoint/size/region to clipboard (toast confirmation)
- Byte formatting utility
- Loading state (`undefined = loading`)
- Empty state (`[] = no buckets`)

**Reference**: `apps/web/src/components/resources/servers-table.tsx`

**Byte Formatting Utility**:
Add to `apps/web/src/components/resources/shared/format-utils.tsx`:
```typescript
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
}
```

---

### Task 3: Update Storage Page

**File**: `apps/web/src/routes/dashboard/infrastructure/storage.tsx`

Replace placeholder with full implementation:

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

**Reference**: `apps/web/src/routes/dashboard/infrastructure/compute.tsx` (similar structure with two tables)

---

### Task 4: Update Insights Page

**File**: `apps/web/src/routes/dashboard/index.tsx`

Add storage queries and cards:

1. **Add imports**:
```typescript
import { HardDrive, Archive } from "lucide-react"
```

2. **Add queries**:
```typescript
const blockVolumes = useQuery(api["resources/queries"].listBlockVolumes)
const buckets = useQuery(api["resources/queries"].listBuckets)
```

3. **Update loading check**:
```typescript
if (servers === undefined || webServices === undefined || domains === undefined || databases === undefined || projects === undefined || blockVolumes === undefined || buckets === undefined) {
  // ... loading state
}
```

4. **Add storage cards** (after databases card, before domains card):
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

**Reference**: `apps/web/src/routes/dashboard/index.tsx` (existing card pattern)

---

## 🔗 Reference Files

### Table Component Pattern
- **File**: `apps/web/src/components/resources/servers-table.tsx`
- **Pattern**: TanStack Table, filtering, sorting, pagination, column visibility
- **Components**: `ProviderBadge`, `StatusBadge`, `formatDate` from shared

### Page Pattern
- **File**: `apps/web/src/routes/dashboard/infrastructure/compute.tsx`
- **Pattern**: Two tables with section headers, loading/empty states

### Shared Components
- **File**: `apps/web/src/components/resources/shared/provider-badge.tsx`
- **File**: `apps/web/src/components/resources/shared/status-badge.tsx`
- **File**: `apps/web/src/components/resources/shared/format-utils.tsx`

### Icons
- **HardDrive**: Block volumes icon (from `lucide-react`)
- **Archive**: Buckets icon (from `lucide-react`)

---

## ✅ Testing Checklist

### Block Volumes Table
- [ ] Table displays Vultr blocks correctly
- [ ] Table displays DigitalOcean volumes correctly
- [ ] Provider badges show correctly (Vultr/DigitalOcean)
- [ ] Size displays in GB format
- [ ] Region displays correctly
- [ ] Status badges show correctly
- [ ] Attached To column shows instance name or "N/A"
- [ ] Filtering by provider works
- [ ] Filtering by region works
- [ ] Filtering by status works
- [ ] Sorting works (size, name, region)
- [ ] Pagination works
- [ ] Copy to clipboard works (size, region)
- [ ] Toast notifications show on copy
- [ ] Loading state works (`undefined = loading`)
- [ ] Empty state works (`[] = no volumes`)

### Buckets Table
- [ ] Table displays Linode buckets correctly
- [ ] Provider badge shows correctly (Linode)
- [ ] Region/Cluster displays correctly
- [ ] Size formats correctly (KB, MB, GB, TB)
- [ ] Object count displays with commas
- [ ] S3 Endpoint displays correctly
- [ ] Status badge shows correctly
- [ ] Filtering by provider works
- [ ] Filtering by region works
- [ ] Sorting works (size, name, object count)
- [ ] Pagination works
- [ ] Copy to clipboard works (endpoint, size, region)
- [ ] Toast notifications show on copy
- [ ] Loading state works (`undefined = loading`)
- [ ] Empty state works (`[] = no buckets`)

### Storage Page
- [ ] Page renders at `/dashboard/infrastructure/storage`
- [ ] Both tables display correctly
- [ ] Section headers show correct counts
- [ ] Loading state works
- [ ] Empty states work
- [ ] Page matches format of other infrastructure pages

### Insights Page
- [ ] Block Volumes card displays correct count
- [ ] Buckets card displays correct count
- [ ] Cards match format of other cards
- [ ] Loading state includes new queries
- [ ] Cards show 0 when no resources exist

### Integration
- [ ] Tables update after dock sync
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Responsive design works (mobile/tablet/desktop)

---

## 🚨 Critical Rules

1. **Table Pattern**: Follow `servers-table.tsx` exactly - same structure, same features, same styling.

2. **Loading States**: Always check `undefined` for loading, `[]` for empty.

3. **Toast Notifications**: Use `toast.success()` from `sonner` for copy confirmations.

4. **Provider Badges**: Use `ProviderBadge` component from shared.

5. **Status Badges**: Use `StatusBadge` component from shared.

6. **Byte Formatting**: Format bytes to human-readable (KB, MB, GB, TB) for buckets.

7. **Icon Consistency**: Use `HardDrive` for block volumes, `Archive` for buckets (matches sidebar).

---

## 📝 Notes

- **Block Volumes**: Unified table for Vultr blocks and DigitalOcean volumes. Provider badge distinguishes them.

- **Buckets**: Separate table for object storage. Currently Linode only, but pattern supports future providers (S3, Spaces, etc.).

- **Size Display**: Block volumes use GB (consistent). Buckets use formatted bytes (KB, MB, GB, TB) since Linode returns bytes.

- **Attached Instances**: Block volumes can be attached to servers. Display instance name if attached, "N/A" if not.

- **S3 Endpoint**: Linode buckets have S3-compatible endpoints. Display and make copyable.

---

**Ready to implement**: Backend will provide queries. Frontend needs to display data in tables following established patterns.
