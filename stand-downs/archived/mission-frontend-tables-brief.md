# Frontend Agent Brief: Build Resource Tables with TanStack Table

> **Date**: November 11, 2025  
> **Agent**: `frontend-agents` (TanStack/React specialist)  
> **Mission**: Build 4 data tables for universal resource views  
> **Priority**: HIGH  
> **Status**: Ready for Assignment

---

## Mission Overview

**Objective**: Replace JSON dumps with TanStack Table components for all universal resource tables. Use `apps/web/src/components/tanstack-table-template.tsx` as the starting template.

**Impact**: Users can view, filter, sort, and manage their infrastructure resources (servers, web services, domains, databases) across all providers in a unified interface.

---

## Tables to Build

### 1. **Servers Table** (`/dashboard/infrastructure/compute`)
- **File**: `apps/web/src/routes/dashboard/infrastructure/compute.tsx`
- **Query**: `api["resources/queries"].listServers`
- **Schema**: `convex/schema.ts` lines 117-139

### 2. **Web Services Table** (`/dashboard/infrastructure/compute`)
- **File**: `apps/web/src/routes/dashboard/infrastructure/compute.tsx` (same page, separate table)
- **Query**: `api["resources/queries"].listWebServices`
- **Schema**: `convex/schema.ts` lines 143-166

### 3. **Domains Table** (`/dashboard/operations/networking`)
- **File**: `apps/web/src/routes/dashboard/operations/networking.tsx`
- **Query**: `api["resources/queries"].listDomains`
- **Schema**: `convex/schema.ts` lines 169-190

### 4. **Databases Table** (`/dashboard/infrastructure/data`)
- **File**: `apps/web/src/routes/dashboard/infrastructure/data.tsx`
- **Query**: **NEEDS TO BE CREATED** - `api["resources/queries"].listDatabases` (create this query first)
- **Schema**: `convex/schema.ts` lines 193-215

---

## Data Structures

### Servers (from schema)
```typescript
type Server = {
  _id: Id<"servers">
  orgId: Id<"organizations">
  dockId: Id<"docks">
  provider: string // "gridpane", "vultr", "aws", etc.
  providerResourceId: string
  name: string
  primaryIpAddress?: string
  region?: string
  status: string // "running", "stopped", "pending", "error"
  fullApiData: any // Provider-specific data
  updatedAt?: number
  provisioningSource?: "sst" | "api" | "manual"
  sstResourceId?: string
  sstStackName?: string
  provisioningState?: "provisioning" | "provisioned" | "failed" | "deprovisioning"
  provisionedAt?: number
}
```

### Web Services (from schema)
```typescript
type WebService = {
  _id: Id<"webServices">
  orgId: Id<"organizations">
  dockId: Id<"docks">
  provider: string // "gridpane", "vercel", "netlify", etc.
  providerResourceId: string
  name: string
  productionUrl?: string
  environment?: string // "production", "staging", "development"
  gitRepo?: string
  status: string // "running", "stopped", "pending", "error"
  fullApiData: any
  updatedAt?: number
  provisioningSource?: "sst" | "api" | "manual"
  sstResourceId?: string
  sstStackName?: string
  provisioningState?: "provisioning" | "provisioned" | "failed" | "deprovisioning"
  provisionedAt?: number
}
```

### Domains (from schema)
```typescript
type Domain = {
  _id: Id<"domains">
  orgId: Id<"organizations">
  dockId: Id<"docks">
  provider: string
  providerResourceId: string
  domainName: string
  expiresAt?: number // Timestamp
  status: string // "active", "pending", "error"
  fullApiData: any
  updatedAt?: number
  provisioningSource?: "sst" | "api" | "manual"
  sstResourceId?: string
  sstStackName?: string
  provisioningState?: "provisioning" | "provisioned" | "failed" | "deprovisioning"
  provisionedAt?: number
}
```

### Databases (from schema)
```typescript
type Database = {
  _id: Id<"databases">
  orgId: Id<"organizations">
  dockId: Id<"docks">
  provider: string // "aws-rds", "digitalocean-db", "planetscale", etc.
  providerResourceId: string
  name: string
  engine?: string // "mysql", "postgresql", "mongodb", etc.
  version?: string
  status: string // "running", "stopped", "pending", "error"
  fullApiData: any
  updatedAt?: number
  provisioningSource?: "sst" | "api" | "manual"
  sstResourceId?: string
  sstStackName?: string
  provisioningState?: "provisioning" | "provisioned" | "failed" | "deprovisioning"
  provisionedAt?: number
}
```

---

## Template Reference

**Use this file as your starting point**: `apps/web/src/components/tanstack-table-template.tsx`

**Key patterns to follow**:
- ✅ `useQuery` from `convex/react` for real-time data
- ✅ TanStack Table setup with `useReactTable`
- ✅ Filtering, sorting, pagination
- ✅ Column visibility toggle
- ✅ Row selection with bulk actions
- ✅ Status badges with color coding
- ✅ Provider badges/indicators
- ✅ Row actions dropdown menu

---

## Column Specifications

### Servers Table Columns
| Column | Accessor | Cell Renderer | Notes |
|--------|----------|--------------|-------|
| Select | `select` | Checkbox | Row selection |
| Name | `name` | Font medium | Primary identifier |
| Provider | `provider` | Badge (colored) | Show provider name (gridpane, vultr, etc.) |
| IP Address | `primaryIpAddress` | Monospace font | Show IP or "N/A" |
| Region | `region` | Text | Show region or "N/A" |
| Status | `status` | Badge (color-coded) | running=green, stopped=gray, error=red, pending=yellow |
| Updated | `updatedAt` | Formatted date | "2 hours ago" or date |
| Actions | `actions` | Dropdown menu | View, Edit, Delete, Sync |

**Filtering**:
- Multi-column search: Name + IP Address
- Status filter: Multi-select (running, stopped, pending, error)
- Provider filter: Multi-select (gridpane, vultr, aws, etc.)

### Web Services Table Columns
| Column | Accessor | Cell Renderer | Notes |
|--------|----------|--------------|-------|
| Select | `select` | Checkbox | Row selection |
| Name | `name` | Font medium | Site/service name |
| Provider | `provider` | Badge (colored) | Show provider (gridpane, vercel, etc.) |
| URL | `productionUrl` | Link | External link, show domain only |
| Environment | `environment` | Badge | production=blue, staging=yellow, development=gray |
| Status | `status` | Badge (color-coded) | Same as servers |
| Git Repo | `gitRepo` | Link or "N/A" | Show repo name, link to GitHub/GitLab |
| Updated | `updatedAt` | Formatted date | Relative time |
| Actions | `actions` | Dropdown menu | View, Edit, Deploy, Delete |

**Filtering**:
- Multi-column search: Name + URL
- Status filter: Multi-select
- Provider filter: Multi-select
- Environment filter: Multi-select

### Domains Table Columns
| Column | Accessor | Cell Renderer | Notes |
|--------|----------|--------------|-------|
| Select | `select` | Checkbox | Row selection |
| Domain | `domainName` | Font medium | Full domain name |
| Provider | `provider` | Badge (colored) | DNS provider |
| Status | `status` | Badge (color-coded) | active=green, pending=yellow, error=red |
| Expires | `expiresAt` | Formatted date | "Expires in 30 days" or date |
| Updated | `updatedAt` | Formatted date | Relative time |
| Actions | `actions` | Dropdown menu | View, Edit DNS, Delete |

**Filtering**:
- Search: Domain name
- Status filter: Multi-select
- Provider filter: Multi-select
- Expiry filter: Expiring soon (next 30 days)

### Databases Table Columns
| Column | Accessor | Cell Renderer | Notes |
|--------|----------|--------------|-------|
| Select | `select` | Checkbox | Row selection |
| Name | `name` | Font medium | Database name |
| Provider | `provider` | Badge (colored) | Show provider |
| Engine | `engine` | Badge | mysql, postgresql, mongodb |
| Version | `version` | Text | Show version or "N/A" |
| Status | `status` | Badge (color-coded) | Same as servers |
| Updated | `updatedAt` | Formatted date | Relative time |
| Actions | `actions` | Dropdown menu | View, Connect, Delete |

**Filtering**:
- Search: Name
- Status filter: Multi-select
- Provider filter: Multi-select
- Engine filter: Multi-select (mysql, postgresql, etc.)

---

## Status Badge Colors

Use consistent color coding across all tables:

| Status | Badge Color | Variant |
|--------|-------------|---------|
| `running` / `active` | Green | `bg-green-500 text-green-50` |
| `stopped` / `inactive` | Gray | `bg-muted-foreground/60 text-primary-foreground` |
| `pending` / `provisioning` | Yellow | `bg-yellow-500 text-yellow-50` |
| `error` / `failed` | Red | `variant="destructive"` |

---

## Provider Badge Colors

Show provider with colored badges (suggested colors):

| Provider | Badge Color |
|----------|-------------|
| `gridpane` | Purple (`bg-purple-500 text-purple-50`) |
| `vercel` | Black (`bg-black text-white`) |
| `aws` | Orange (`bg-orange-500 text-orange-50`) |
| `vultr` | Blue (`bg-blue-500 text-blue-50`) |
| `digitalocean` | Blue (`bg-blue-600 text-blue-50`) |
| Default | Gray (`bg-gray-500 text-gray-50`) |

---

## Required Features

### All Tables Must Have:
1. ✅ **Real-time Data**: Use `useQuery()` from Convex (auto-updates)
2. ✅ **Loading State**: Show spinner/skeleton while `data === undefined`
3. ✅ **Empty State**: Show "No resources found" when `data?.length === 0`
4. ✅ **Error State**: Handle query errors gracefully
5. ✅ **Filtering**: Multi-column search + status/provider filters
6. ✅ **Sorting**: Click column headers to sort
7. ✅ **Pagination**: 5, 10, 25, 50 rows per page
8. ✅ **Column Visibility**: Toggle columns on/off
9. ✅ **Row Selection**: Checkbox selection with bulk actions
10. ✅ **Provider Badges**: Color-coded provider indicators
11. ✅ **Status Badges**: Color-coded status indicators
12. ✅ **Row Actions**: Dropdown menu (View, Edit, Delete, etc.)

### Row Actions Menu (All Tables):
- **View Details** - Navigate to resource detail page (future)
- **Edit** - Open edit dialog (future)
- **Sync** - Trigger sync for this resource (for servers/webServices)
- **Delete** - Delete resource (with confirmation dialog)
- **Separator**
- **Provider Actions** - Provider-specific actions (if applicable)

---

## Implementation Steps

### Step 1: Create Databases Query (if missing)
**File**: `convex/resources/queries.ts`

Add `listDatabases` query following the same pattern as `listServers`:

```typescript
export const listDatabases = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
      
    if (!membership) {
      return []
    }
    
    const databases = await ctx.db
      .query("databases")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return databases
  },
})
```

### Step 2: Build Servers Table
**File**: `apps/web/src/routes/dashboard/infrastructure/compute.tsx`

1. Copy structure from `tanstack-table-template.tsx`
2. Replace `Item` type with `Server` type (from Convex query)
3. Use `useQuery(api["resources/queries"].listServers)` for data
4. Build columns per spec above
5. Add provider badges, status badges
6. Implement filtering by status and provider

### Step 3: Build Web Services Table
**Same file**: `apps/web/src/routes/dashboard/infrastructure/compute.tsx`

1. Add second table component below servers table
2. Use `useQuery(api["resources/queries"].listWebServices)` for data
3. Build columns per spec above
4. Add environment badges (production/staging/dev)
5. Make URLs clickable links

### Step 4: Build Domains Table
**File**: `apps/web/src/routes/dashboard/operations/networking.tsx`

1. Replace JSON dump with TanStack Table
2. Use `useQuery(api["resources/queries"].listDomains)` for data
3. Build columns per spec above
4. Format expiry dates ("Expires in X days")
5. Add expiry warning (red badge if < 30 days)

### Step 5: Build Databases Table
**File**: `apps/web/src/routes/dashboard/infrastructure/data.tsx`

1. Replace placeholder with TanStack Table
2. Use `useQuery(api["resources/queries"].listDatabases)` for data (create query first)
3. Build columns per spec above
4. Add engine badges (MySQL, PostgreSQL, MongoDB)

---

## Code Patterns

### Provider Badge Component
```typescript
function ProviderBadge({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    gridpane: "bg-purple-500 text-purple-50",
    vercel: "bg-black text-white",
    aws: "bg-orange-500 text-orange-50",
    vultr: "bg-blue-500 text-blue-50",
    // ... add more providers
  }
  
  return (
    <Badge className={colors[provider] || "bg-gray-500 text-gray-50"}>
      {provider}
    </Badge>
  )
}
```

### Status Badge Component
```typescript
function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    running: "bg-green-500 text-green-50",
    active: "bg-green-500 text-green-50",
    stopped: "bg-muted-foreground/60 text-primary-foreground",
    inactive: "bg-muted-foreground/60 text-primary-foreground",
    pending: "bg-yellow-500 text-yellow-50",
    provisioning: "bg-yellow-500 text-yellow-50",
    error: "destructive",
    failed: "destructive",
  }
  
  return (
    <Badge 
      variant={status === "error" || status === "failed" ? "destructive" : "default"}
      className={statusColors[status] || ""}
    >
      {status}
    </Badge>
  )
}
```

### Date Formatting
```typescript
function formatDate(timestamp?: number): string {
  if (!timestamp) return "N/A"
  const date = new Date(timestamp)
  const now = Date.now()
  const diff = now - timestamp
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  
  return date.toLocaleDateString()
}
```

---

## Testing Checklist

After building each table:
- [ ] Table loads data from Convex query
- [ ] Loading state shows while `data === undefined`
- [ ] Empty state shows when `data?.length === 0`
- [ ] Provider badges display correctly
- [ ] Status badges display with correct colors
- [ ] Filtering works (search + status/provider filters)
- [ ] Sorting works (click column headers)
- [ ] Pagination works (change page size, navigate pages)
- [ ] Column visibility toggle works
- [ ] Row selection works (checkbox)
- [ ] Bulk delete works (select multiple rows)
- [ ] Row actions dropdown works
- [ ] Real-time updates work (data updates automatically)

---

## Files to Create/Modify

### Create:
- `apps/web/src/components/resources/servers-table.tsx` (optional - can be inline)
- `apps/web/src/components/resources/web-services-table.tsx` (optional)
- `apps/web/src/components/resources/domains-table.tsx` (optional)
- `apps/web/src/components/resources/databases-table.tsx` (optional)

### Modify:
- `apps/web/src/routes/dashboard/infrastructure/compute.tsx` - Add Servers + Web Services tables
- `apps/web/src/routes/dashboard/operations/networking.tsx` - Replace JSON with Domains table
- `apps/web/src/routes/dashboard/infrastructure/data.tsx` - Replace placeholder with Databases table
- `convex/resources/queries.ts` - Add `listDatabases` query (if missing)

---

## Success Criteria

✅ **Mission Complete When**:
- [ ] All 4 tables implemented with TanStack Table
- [ ] All tables show real data from Convex queries
- [ ] All tables support filtering, sorting, pagination
- [ ] Provider badges display correctly
- [ ] Status badges display with correct colors
- [ ] Row actions work (at least delete with confirmation)
- [ ] Tables are responsive (mobile-friendly)
- [ ] No console errors
- [ ] Real-time updates work (Convex subscriptions)

---

## Resources

- **Template**: `apps/web/src/components/tanstack-table-template.tsx`
- **Schema**: `convex/schema.ts` (lines 117-215)
- **Queries**: `convex/resources/queries.ts`
- **Routes**: `apps/web/src/routes/dashboard/infrastructure/` and `operations/`
- **TanStack Table Docs**: https://tanstack.com/table/latest
- **shadcn/ui Components**: `apps/web/src/components/ui/`

---

## Notes

- **Universal Table Pattern**: All tables use the same universal schema, so the code should be reusable
- **Provider Agnostic**: Tables show resources from ALL providers (GridPane, Vercel, AWS, etc.)
- **Real-time**: Convex queries auto-update, so tables update automatically when data changes
- **RBAC**: Queries already filter by user's organization, so no additional RBAC needed in tables
- **Mobile**: Ensure tables are responsive (consider horizontal scroll on mobile)

---

**Good luck! Build beautiful, functional tables that showcase StackDock's universal resource management.**
