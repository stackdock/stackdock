# Mission 5: GridPane Backup API Endpoints Implementation Plan

## Objective
Implement GridPane backup API endpoints to fetch and display backup schedules and integrations under the Operations > Backups navigation section.

## Current State

### GridPane Sync Status
✅ **GridPane is synced** - Currently syncing:
- Servers (`GET /oauth/api/v1/server`)
- Sites/Web Services (`GET /oauth/api/v1/site`)
- Domains (`GET /oauth/api/v1/domain`)

### Available Backup Endpoints (Read-Only)
GridPane API provides the following backup-related endpoints:

#### Integrations Endpoints
1. **`GET /oauth/api/v1/user/integrations`** - Get current user integrations
   - Returns all integrations available to the user account
   - Used for identifying integration IDs for API actions

2. **`GET /oauth/api/v1/backups/integrations`** - Get all available backup integrations
   - Returns all possible remote backup integrations available to a user

3. **`GET /oauth/api/v1/backups/integrations/{site.id}`** - Get site backup integrations
   - Returns backup integrations attached to a specific site

#### Backup Schedule Endpoints
4. **`GET /oauth/api/v1/backups/schedules`** - Get all sites backup schedules
   - Returns backup schedules for all sites belonging to a user

5. **`GET /oauth/api/v1/backups/schedules/server/{server.id}`** - Get server backup schedules
   - Returns backup schedules for all sites on a specific server

6. **`GET /oauth/api/v1/backups/schedules/site/{site.id}`** - Get site backup schedules
   - Returns backup schedule for a single site

7. **`GET /oauth/api/v1/backups/prune-schedule/{site.id}`** - Get site prune schedule
   - Returns prune schedules for a site's backups

### Frontend Navigation
✅ **Operations > Backups route exists** - `/dashboard/operations/backups`
- Route defined in sidebar (`apps/web/src/components/dashboard/sidebar-data.tsx`)
- Currently no implementation (route likely shows placeholder)

---

## Implementation Plan

### Phase 1: API Client Methods

**File**: `convex/docks/adapters/gridpane/api.ts`

#### 1.1 Add Backup Types

**File**: `convex/docks/adapters/gridpane/types.ts`

Add TypeScript interfaces for backup-related responses:

```typescript
/**
 * GridPane Integration
 * @see GET /oauth/api/v1/user/integrations
 */
export interface GridPaneIntegration {
  id: number
  name: string
  provider: string // "digitalocean", "aws", "s3", etc.
  type: string // "backup", "dns", etc.
  [key: string]: any
}

/**
 * GridPane Backup Integration
 * @see GET /oauth/api/v1/backups/integrations
 */
export interface GridPaneBackupIntegration {
  id: number
  name: string
  provider: string
  type: string
  [key: string]: any
}

/**
 * GridPane Backup Schedule
 * @see GET /oauth/api/v1/backups/schedules
 */
export interface GridPaneBackupSchedule {
  site_id: number
  site_url: string
  enabled: boolean
  frequency: string // "hourly", "daily", "weekly", etc.
  time: string // Time of day (e.g., "00:00")
  day_of_week?: number // 0-6 for weekly schedules
  remote_backups_enabled: boolean
  integration_id?: number
  [key: string]: any
}

/**
 * GridPane Prune Schedule
 * @see GET /oauth/api/v1/backups/prune-schedule/{site.id}
 */
export interface GridPanePruneSchedule {
  site_id: number
  keep_daily: number
  keep_weekly: number
  keep_monthly: number
  [key: string]: any
}
```

#### 1.2 Add API Methods to GridPaneAPI Class

**File**: `convex/docks/adapters/gridpane/api.ts`

Add the following methods:

```typescript
/**
 * Get current user integrations
 * GET /oauth/api/v1/user/integrations
 */
async getIntegrations(): Promise<GridPaneIntegration[]> {
  const response = await this.request<GridPaneResponse<GridPaneIntegration>>(
    "/user/integrations"
  )
  return response.data
}

/**
 * Get all available backup integrations
 * GET /oauth/api/v1/backups/integrations
 */
async getBackupIntegrations(): Promise<GridPaneBackupIntegration[]> {
  const response = await this.request<GridPaneResponse<GridPaneBackupIntegration>>(
    "/backups/integrations"
  )
  return response.data
}

/**
 * Get site backup integrations
 * GET /oauth/api/v1/backups/integrations/{site.id}
 */
async getSiteBackupIntegrations(siteId: number): Promise<GridPaneBackupIntegration[]> {
  const response = await this.request<GridPaneResponse<GridPaneBackupIntegration>>(
    `/backups/integrations/${siteId}`
  )
  return response.data
}

/**
 * Get all sites backup schedules
 * GET /oauth/api/v1/backups/schedules
 */
async getAllBackupSchedules(): Promise<GridPaneBackupSchedule[]> {
  const response = await this.request<GridPaneResponse<GridPaneBackupSchedule>>(
    "/backups/schedules"
  )
  return response.data
}

/**
 * Get server backup schedules
 * GET /oauth/api/v1/backups/schedules/server/{server.id}
 */
async getServerBackupSchedules(serverId: number): Promise<GridPaneBackupSchedule[]> {
  const response = await this.request<GridPaneResponse<GridPaneBackupSchedule>>(
    `/backups/schedules/server/${serverId}`
  )
  return response.data
}

/**
 * Get site backup schedules
 * GET /oauth/api/v1/backups/schedules/site/{site.id}
 */
async getSiteBackupSchedules(siteId: number): Promise<GridPaneBackupSchedule> {
  const response = await this.request<GridPaneResponse<GridPaneBackupSchedule>>(
    `/backups/schedules/site/${siteId}`
  )
  // Single site returns as array with one item
  return response.data[0]
}

/**
 * Get site prune schedule
 * GET /oauth/api/v1/backups/prune-schedule/{site.id}
 */
async getSitePruneSchedule(siteId: number): Promise<GridPanePruneSchedule> {
  const response = await this.request<GridPaneResponse<GridPanePruneSchedule>>(
    `/backups/prune-schedule/${siteId}`
  )
  // Single prune schedule returns as array with one item
  return response.data[0]
}
```

**Note**: Response structures may vary. Verify actual API responses and adjust types accordingly.

---

### Phase 2: Convex Actions & Queries

#### 2.1 Create Backup Actions

**File**: `convex/docks/actions.ts` (or create `convex/docks/backup-actions.ts`)

Add actions for fetching backup data:

```typescript
/**
 * Fetch GridPane backup schedules
 * Action (can use fetch) - called from queries
 */
export const fetchGridPaneBackupSchedules = internalAction({
  args: {
    dockId: v.id("docks"),
    apiKey: v.string(), // Decrypted API key
    siteId: v.optional(v.number()), // Optional: specific site
    serverId: v.optional(v.number()), // Optional: specific server
  },
  handler: async (ctx, args) => {
    const api = new GridPaneAPI(args.apiKey)
    
    if (args.siteId) {
      // Get single site schedule
      const schedule = await api.getSiteBackupSchedules(args.siteId)
      return { schedules: [schedule] }
    } else if (args.serverId) {
      // Get server schedules
      const schedules = await api.getServerBackupSchedules(args.serverId)
      return { schedules }
    } else {
      // Get all schedules
      const schedules = await api.getAllBackupSchedules()
      return { schedules }
    }
  },
})

/**
 * Fetch GridPane backup integrations
 */
export const fetchGridPaneBackupIntegrations = internalAction({
  args: {
    dockId: v.id("docks"),
    apiKey: v.string(),
    siteId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const api = new GridPaneAPI(args.apiKey)
    
    if (args.siteId) {
      // Get site-specific integrations
      const integrations = await api.getSiteBackupIntegrations(args.siteId)
      return { integrations }
    } else {
      // Get all available integrations
      const integrations = await api.getBackupIntegrations()
      return { integrations }
    }
  },
})

/**
 * Fetch GridPane user integrations
 */
export const fetchGridPaneIntegrations = internalAction({
  args: {
    dockId: v.id("docks"),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const api = new GridPaneAPI(args.apiKey)
    const integrations = await api.getIntegrations()
    return { integrations }
  },
})
```

#### 2.2 Create Backup Queries

**File**: `convex/docks/queries.ts` (or create `convex/docks/backup-queries.ts`)

Add queries that call the actions:

```typescript
/**
 * Get backup schedules for a GridPane dock
 */
export const getBackupSchedules = query({
  args: {
    dockId: v.id("docks"),
    siteId: v.optional(v.number()),
    serverId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get dock and decrypt API key
    const dock = await ctx.db.get(args.dockId)
    if (!dock || dock.provider !== "gridpane") {
      throw new ConvexError("Dock not found or not a GridPane dock")
    }

    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })

    // Call action to fetch schedules
    const result = await ctx.runAction(
      internal.docks.actions.fetchGridPaneBackupSchedules,
      {
        dockId: args.dockId,
        apiKey,
        siteId: args.siteId,
        serverId: args.serverId,
      }
    )

    return result.schedules
  },
})

/**
 * Get backup integrations for a GridPane dock
 */
export const getBackupIntegrations = query({
  args: {
    dockId: v.id("docks"),
    siteId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dock = await ctx.db.get(args.dockId)
    if (!dock || dock.provider !== "gridpane") {
      throw new ConvexError("Dock not found or not a GridPane dock")
    }

    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })

    const result = await ctx.runAction(
      internal.docks.actions.fetchGridPaneBackupIntegrations,
      {
        dockId: args.dockId,
        apiKey,
        siteId: args.siteId,
      }
    )

    return result.integrations
  },
})
```

**Note**: Consider caching backup data if it doesn't change frequently. For MVP, fetching on-demand is acceptable.

---

### Phase 3: Frontend Implementation

#### 3.1 Create Backups Route

**File**: `apps/web/src/routes/dashboard/operations/backups.tsx`

Create the backups page component:

```typescript
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { useDocks } from "@/hooks/use-docks" // Assuming this hook exists
import { BackupSchedulesTable } from "@/components/operations/backup-schedules-table"
import { BackupIntegrationsTable } from "@/components/operations/backup-integrations-table"

export function BackupsPage() {
  // Get GridPane docks
  const docks = useDocks() // Filter for GridPane docks
  const gridpaneDocks = docks?.filter(d => d.provider === "gridpane") || []

  // For MVP: Show first GridPane dock's data
  // Future: Allow selecting dock or show all
  const primaryDock = gridpaneDocks[0]

  const schedules = useQuery(
    api["docks/queries"].getBackupSchedules,
    primaryDock ? { dockId: primaryDock._id } : "skip"
  )

  const integrations = useQuery(
    api["docks/queries"].getBackupIntegrations,
    primaryDock ? { dockId: primaryDock._id } : "skip"
  )

  if (!primaryDock) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Backups</h1>
        <p className="text-muted-foreground">
          No GridPane dock configured. Add a GridPane dock in Settings to view backups.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Backups</h1>
        <p className="text-muted-foreground">
          View backup schedules and integrations for your GridPane sites.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Backup Schedules</h2>
          <BackupSchedulesTable data={schedules} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Backup Integrations</h2>
          <BackupIntegrationsTable data={integrations} />
        </section>
      </div>
    </div>
  )
}
```

#### 3.2 Create Backup Schedules Table Component

**File**: `apps/web/src/components/operations/backup-schedules-table.tsx`

Create a TanStack Table component for displaying backup schedules:

```typescript
"use client"

import { useMemo } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  PaginationState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface BackupSchedule {
  site_id: number
  site_url: string
  enabled: boolean
  frequency: string
  time: string
  day_of_week?: number
  remote_backups_enabled: boolean
  integration_id?: number
  [key: string]: any
}

interface BackupSchedulesTableProps {
  data: BackupSchedule[] | undefined
}

export function BackupSchedulesTable({ data = [] }: BackupSchedulesTableProps) {
  const columns: ColumnDef<BackupSchedule>[] = useMemo(
    () => [
      {
        header: "Site",
        accessorKey: "site_url",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("site_url")}</div>
        ),
      },
      {
        header: "Status",
        accessorKey: "enabled",
        cell: ({ row }) => {
          const enabled = row.getValue("enabled") as boolean
          return (
            <Badge variant={enabled ? "default" : "secondary"}>
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
          )
        },
      },
      {
        header: "Frequency",
        accessorKey: "frequency",
        cell: ({ row }) => {
          const frequency = row.getValue("frequency") as string
          return <span className="capitalize">{frequency}</span>
        },
      },
      {
        header: "Time",
        accessorKey: "time",
      },
      {
        header: "Remote Backups",
        accessorKey: "remote_backups_enabled",
        cell: ({ row }) => {
          const enabled = row.getValue("remote_backups_enabled") as boolean
          return (
            <Badge variant={enabled ? "default" : "outline"}>
              {enabled ? "Yes" : "No"}
            </Badge>
          )
        },
      },
    ],
    []
  )

  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: { sorting, pagination },
  })

  if (data === undefined) {
    return <div>Loading backup schedules...</div>
  }

  if (data.length === 0) {
    return <div className="text-muted-foreground">No backup schedules found.</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No backup schedules found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

#### 3.3 Create Backup Integrations Table Component

**File**: `apps/web/src/components/operations/backup-integrations-table.tsx`

Similar structure to schedules table, displaying:
- Integration name
- Provider (DigitalOcean, AWS S3, etc.)
- Type
- Status/Enabled state

---

### Phase 4: Testing & Validation

#### 4.1 API Response Validation
- [ ] Test each endpoint with real GridPane API
- [ ] Verify response structures match TypeScript types
- [ ] Handle edge cases (empty arrays, null values, etc.)
- [ ] Test error handling (invalid API key, network errors)

#### 4.2 Frontend Testing
- [ ] Verify backup schedules display correctly
- [ ] Verify backup integrations display correctly
- [ ] Test with multiple GridPane docks
- [ ] Test with no GridPane docks configured
- [ ] Test loading states
- [ ] Test error states

#### 4.3 Integration Testing
- [ ] Verify data flows: API → Action → Query → Frontend
- [ ] Test API key decryption
- [ ] Test RBAC permissions (if applicable)
- [ ] Verify no data leaks between organizations

---

## Database Schema Considerations

### Option 1: Store Backup Data (Recommended for MVP)
**Pros**: Faster queries, can cache data  
**Cons**: Requires sync mechanism, storage overhead

**New Tables** (if storing):
```typescript
backupSchedules: defineTable({
  orgId: v.id("organizations"),
  dockId: v.id("docks"),
  siteId: v.number(), // GridPane site ID
  siteUrl: v.string(),
  enabled: v.boolean(),
  frequency: v.string(),
  time: v.string(),
  remoteBackupsEnabled: v.boolean(),
  integrationId: v.optional(v.number()),
  fullApiData: v.any(),
  updatedAt: v.number(),
})
  .index("by_dockId", ["dockId"])
  .index("by_siteId", ["siteId"]),

backupIntegrations: defineTable({
  orgId: v.id("organizations"),
  dockId: v.id("docks"),
  integrationId: v.number(), // GridPane integration ID
  name: v.string(),
  provider: v.string(),
  type: v.string(),
  fullApiData: v.any(),
  updatedAt: v.number(),
})
  .index("by_dockId", ["dockId"]),
```

### Option 2: Fetch on Demand (Simpler for MVP)
**Pros**: No sync needed, always fresh data  
**Cons**: Slower, requires API calls on every page load

**Recommendation**: Start with Option 2 (fetch on demand) for MVP. Add caching/storage later if needed.

---

## Implementation Checklist

### Backend (Convex)
- [ ] Add backup types to `convex/docks/adapters/gridpane/types.ts`
- [ ] Add API methods to `GridPaneAPI` class
- [ ] Create backup actions (`fetchGridPaneBackupSchedules`, etc.)
- [ ] Create backup queries (`getBackupSchedules`, `getBackupIntegrations`)
- [ ] Test API endpoints with real GridPane credentials
- [ ] Handle errors gracefully

### Frontend
- [ ] Create `/dashboard/operations/backups` route component
- [ ] Create `BackupSchedulesTable` component
- [ ] Create `BackupIntegrationsTable` component
- [ ] Add loading states
- [ ] Add error states
- [ ] Add empty states
- [ ] Test with real data

### Documentation
- [ ] Update GridPane adapter README with backup endpoints
- [ ] Document API response structures
- [ ] Document field mappings

---

## Future Enhancements

1. **Backup Management**: Add ability to create/edit/delete backup schedules (POST/PUT/DELETE endpoints)
2. **Backup History**: Display backup history and restore options
3. **Backup Monitoring**: Show last backup time, next backup time, backup status
4. **Multi-Dock Support**: Allow selecting which GridPane dock to view
5. **Backup Alerts**: Notify users of failed backups or missing schedules
6. **Backup Storage**: Cache backup data in database for faster queries
7. **Backup Sync**: Periodic sync of backup schedules (similar to resource sync)

---

## Notes

- **Read-Only Phase**: This implementation focuses on read-only operations (GET endpoints)
- **GridPane Only**: Initially supports GridPane provider only
- **MVP Scope**: Display schedules and integrations, no editing capabilities
- **API Rate Limits**: Be mindful of GridPane API rate limits when fetching data
- **Error Handling**: GridPane API may return different error formats, handle gracefully
- **Response Structures**: Actual API responses may differ from Postman collection - verify with real API

---

## Priority

**High** - Operations visibility is important for users managing infrastructure

## Estimated Time

- **Backend (API + Actions + Queries)**: 2-3 hours
- **Frontend (Route + Tables)**: 2-3 hours
- **Testing & Refinement**: 1-2 hours
- **Total**: 5-8 hours

---

## Dependencies

- GridPane API access (API key)
- Existing GridPane adapter infrastructure
- TanStack Table component (already in use)
- Convex actions/queries pattern (already established)

---

**Status**: 📋 **PLANNED** - Ready for implementation
