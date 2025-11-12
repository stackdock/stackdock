# Mission 5: Backups Page Refactor - Frontend Agent Guide

## Objective
Refactor the Operations > Backups page to be provider-agnostic, display provider badges, and fix missing data in backup schedules.

## Current Issues

### Issue 1: GridPane-Specific Implementation
- Page filters for only GridPane docks
- Shows GridPane-specific messaging
- Doesn't support multiple providers

### Issue 2: Missing Data in Schedules Table
- Frequency and Time columns are empty
- Likely API response structure mismatch
- Need to check `fullApiData` or adjust field mappings

### Issue 3: No Provider Identification
- Tables don't show which provider each backup belongs to
- Need Provider column with ProviderBadge component

---

## Implementation Plan

### Step 1: Refactor Backups Page to be Provider-Agnostic

**File**: `apps/web/src/routes/dashboard/operations/backups.tsx`

#### Current Implementation Issues:
```typescript
// ❌ BAD: GridPane-specific
const gridpaneDocks = docks?.filter((d) => d.provider === "gridpane") || []
const primaryDock = gridpaneDocks[0]

// ❌ BAD: GridPane-specific messaging
<p>No GridPane dock configured. Add a GridPane dock in Settings...</p>
<p>View backup schedules and integrations for your GridPane sites.</p>
```

#### New Implementation:
```typescript
// ✅ GOOD: Provider-agnostic
// Get all docks that support backups (currently GridPane, future: others)
const backupSupportedProviders = ["gridpane"] // Future: ["gridpane", "digitalocean", etc.]
const backupDocks = docks?.filter((d) => 
  backupSupportedProviders.includes(d.provider)
) || []

// Aggregate data from all backup-supporting docks
const allSchedules: Array<{ dockId: string; provider: string; schedules: any[] }> = []
const allIntegrations: Array<{ dockId: string; provider: string; integrations: any[] }> = []

// Fetch from all docks
useEffect(() => {
  if (!backupDocks.length) return
  
  setIsLoading(true)
  
  Promise.all(
    backupDocks.map(async (dock) => {
      try {
        const [schedulesResult, integrationsResult] = await Promise.all([
          fetchSchedules({ dockId: dock._id }),
          fetchIntegrations({ dockId: dock._id }),
        ])
        
        allSchedules.push({
          dockId: dock._id,
          provider: dock.provider,
          schedules: schedulesResult.schedules || [],
        })
        
        allIntegrations.push({
          dockId: dock._id,
          provider: dock.provider,
          integrations: integrationsResult.integrations || [],
        })
      } catch (error) {
        console.error(`Failed to fetch backups for dock ${dock._id}:`, error)
      }
    })
  ).finally(() => {
    setIsLoading(false)
    // Flatten and combine with provider info
    const combinedSchedules = allSchedules.flatMap(({ dockId, provider, schedules }) =>
      schedules.map(schedule => ({ ...schedule, dockId, provider }))
    )
    const combinedIntegrations = allIntegrations.flatMap(({ dockId, provider, integrations }) =>
      integrations.map(integration => ({ ...integration, dockId, provider }))
    )
    
    setSchedules(combinedSchedules)
    setIntegrations(combinedIntegrations)
  })
}, [backupDocks, fetchSchedules, fetchIntegrations])
```

#### Updated Empty State:
```typescript
if (!backupDocks.length) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">Backups</h2>
        <p className="text-muted-foreground text-xs">
          Backup management and scheduling
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">
          No backup-enabled docks configured. Add a dock that supports backups (e.g., GridPane) in Settings to view backups.
        </p>
      </div>
    </div>
  )
}
```

#### Updated Description:
```typescript
<p className="text-muted-foreground text-xs">
  View backup schedules and integrations across all your infrastructure providers.
</p>
```

---

### Step 2: Add Provider Column to Backup Schedules Table

**File**: `apps/web/src/components/operations/backup-schedules-table.tsx`

#### Update Interface:
```typescript
interface BackupSchedule {
  site_id: number
  site_url: string
  enabled: boolean
  frequency: string
  time: string
  day_of_week?: number
  remote_backups_enabled: boolean
  integration_id?: number
  provider: string // ✅ ADD: Provider identifier
  dockId: string // ✅ ADD: Dock ID for reference
  [key: string]: any
}
```

#### Add Provider Column:
```typescript
import { ProviderBadge } from "@/components/resources/shared/provider-badge"

const columns: ColumnDef<BackupSchedule>[] = useMemo(
  () => [
    {
      header: "Provider", // ✅ ADD: Provider column first
      accessorKey: "provider",
      cell: ({ row }) => (
        <ProviderBadge provider={row.getValue("provider")} />
      ),
      size: 120,
    },
    {
      header: "Site",
      accessorKey: "site_url",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("site_url")}</div>
      ),
    },
    // ... rest of columns
  ],
  []
)
```

---

### Step 3: Fix Missing Data in Schedules Table

✅ **FIXED IN BACKEND**: The backend now correctly flattens the nested API response structure.

The API returns:
```json
{
  "success": true,
  "data": [
    {
      "server_id": 41522,
      "site_id": 869581,
      "url": "deltaninemedia.com",
      "schedule_backups": [
        {
          "id": 156226,
          "type": "local",
          "bup_schedule": "weekly",
          "hour": "05",
          "minute": "00",
          "day": "0",
          "service_id": null,
          "service_name": null
        }
      ]
    }
  ]
}
```

The backend now flattens this to:
```typescript
{
  server_id: number
  site_id: number
  site_url: string  // ✅ From "url"
  schedule_id: number
  type: "local" | "remote"
  frequency: string  // ✅ From "bup_schedule" ("daily", "weekly", "hourly")
  hour: string
  minute: string
  time: string  // ✅ Formatted as "HH:mm" (e.g., "05:00")
  day_of_week: number | null
  service_id: number | null
  service_name: string | null
  enabled: boolean
  remote_backups_enabled: boolean
}
```

#### Update Table Columns

The table should now use the correct field names:

```typescript
{
  header: "Site",
  accessorKey: "site_url", // ✅ Changed from "site_url" (already correct)
  cell: ({ row }) => (
    <div className="font-medium">{row.getValue("site_url")}</div>
  ),
},
{
  header: "Frequency",
  accessorKey: "frequency", // ✅ Backend provides this
  cell: ({ row }) => {
    const frequency = row.getValue("frequency") as string
    if (!frequency) {
      return <span className="text-muted-foreground">—</span>
    }
    return <span className="capitalize">{frequency}</span>
  },
},
{
  header: "Time",
  accessorKey: "time", // ✅ Backend provides formatted "HH:mm"
  cell: ({ row }) => {
    const time = row.getValue("time") as string
    if (!time) {
      return <span className="text-muted-foreground">—</span>
    }
    return <span>{time}</span>
  },
},
```

**Note**: The backend handles all the flattening and formatting. The frontend just needs to use the correct field names.

---

### Step 4: Add Provider Column to Backup Integrations Table

**File**: `apps/web/src/components/operations/backup-integrations-table.tsx`

#### Update Interface:
```typescript
interface BackupIntegration {
  id: number
  integrated_service: string
  integration_name: string
  token?: string
  secret_token?: string
  region?: string
  provider: string // ✅ ADD: Provider identifier
  dockId: string // ✅ ADD: Dock ID for reference
  [key: string]: any
}
```

#### Add Provider Column:
```typescript
import { ProviderBadge } from "@/components/resources/shared/provider-badge"

const columns: ColumnDef<BackupIntegration>[] = useMemo(
  () => [
    {
      header: "Provider", // ✅ ADD: Provider column first
      accessorKey: "provider",
      cell: ({ row }) => (
        <ProviderBadge provider={row.getValue("provider")} />
      ),
      size: 120,
    },
    {
      header: "Name",
      accessorKey: "integration_name",
      // ... rest
    },
    // ... rest of columns
  ],
  []
)
```

---

### Step 5: Handle Loading and Error States

#### Update Loading State:
```typescript
{isLoading ? (
  <div className="rounded-lg border border-border bg-card p-6">
    <p className="text-muted-foreground">Loading backup data from {backupDocks.length} dock{backupDocks.length !== 1 ? 's' : ''}...</p>
  </div>
) : (
  // ... tables
)}
```

#### Add Error Handling:
```typescript
const [errors, setErrors] = useState<Record<string, string>>({})

// In fetch logic:
try {
  // ... fetch logic
} catch (error) {
  console.error(`Failed to fetch backups for dock ${dock._id}:`, error)
  setErrors(prev => ({
    ...prev,
    [dock._id]: error instanceof Error ? error.message : "Failed to fetch backups"
  }))
}

// Display errors:
{Object.keys(errors).length > 0 && (
  <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
    <p className="text-sm text-destructive">
      Some docks failed to load: {Object.values(errors).join(", ")}
    </p>
  </div>
)}
```

---

## Implementation Checklist

### Backups Page (`apps/web/src/routes/dashboard/operations/backups.tsx`)
- [ ] Remove GridPane-specific filtering
- [ ] Add `backupSupportedProviders` array (currently `["gridpane"]`)
- [ ] Fetch from all backup-supporting docks
- [ ] Combine schedules/integrations with provider info
- [ ] Update empty state messaging (provider-agnostic)
- [ ] Update description text (provider-agnostic)
- [ ] Add error handling for failed dock fetches
- [ ] Update loading state to show dock count

### Backup Schedules Table (`apps/web/src/components/operations/backup-schedules-table.tsx`)
- [ ] Add `provider` and `dockId` to `BackupSchedule` interface
- [ ] Import `ProviderBadge` component
- [ ] Add Provider column (first column)
- [ ] Update Frequency column to use `frequency` field (backend provides this)
- [ ] Update Time column to use `time` field (backend provides formatted "HH:mm")
- [ ] Update Site column to use `site_url` field (backend provides this)
- [ ] Add fallback display for missing data (`—` or `N/A`)
- [ ] Consider adding Type column to show "local" vs "remote"

### Backup Integrations Table (`apps/web/src/components/operations/backup-integrations-table.tsx`)
- [ ] Add `provider` and `dockId` to `BackupIntegration` interface
- [ ] Import `ProviderBadge` component
- [ ] Add Provider column (first column)

### Testing
- [ ] Test with GridPane dock only
- [ ] Test with multiple GridPane docks
- [ ] Test with no docks configured
- [ ] Test with docks that fail to fetch
- [ ] Verify Provider badges display correctly
- [ ] Verify missing data shows fallback (`—`)
- [ ] Verify Frequency and Time display correctly (or show `—` if missing)

---

## Expected Result

### Before:
```
Backups
View backup schedules and integrations for your GridPane sites.

Backup Schedules
Site          Status     Frequency  Time  Remote Backups
example.com   Disabled              No
```

### After:
```
Backups
View backup schedules and integrations across all your infrastructure providers.

Backup Schedules
Provider  Site          Status     Frequency  Time      Remote Backups
gridpane  example.com   Disabled   daily      00:00     No
gridpane  test.com      Enabled    hourly     12:00     Yes
```

---

## Notes

1. **Provider-Agnostic Design**: The page should work with any provider that supports backups, not just GridPane
2. **Missing Data Handling**: If Frequency/Time are missing, show `—` instead of empty cells
3. **Future-Proof**: The `backupSupportedProviders` array can be expanded as more providers are added
4. **Error Resilience**: If one dock fails, others should still load
5. **Performance**: Consider batching API calls or using Promise.allSettled for better error handling

---

## Backend Changes Summary

✅ **Backend Updated**: The GridPane API client now correctly handles the nested response structure:

1. **API Response Structure**: `{ success: true, data: [{ server_id, site_id, url, schedule_backups: [...] }] }`
2. **Flattening Logic**: Each site's `schedule_backups` array is flattened into separate rows
3. **Field Mapping**:
   - `url` → `site_url`
   - `bup_schedule` → `frequency`
   - `hour` + `minute` → `time` (formatted as "HH:mm")
   - `type` → `type` ("local" | "remote")
   - `day` → `day_of_week` (parsed as number or null)
4. **Computed Fields**:
   - `enabled`: Always `true` (if schedule exists, it's enabled)
   - `remote_backups_enabled`: `true` if `type === "remote"`

**Frontend Just Needs**: Use the correct field names (`frequency`, `time`, `site_url`) - backend handles everything else.

## Debugging Missing Data

If Frequency/Time are still empty:

1. **Check Backend**: Verify `fetchGridPaneBackupSchedules` action is being called correctly
2. **Check Console**: Look for any errors in the action execution
3. **Verify Data Structure**: Add temporary console.log to see what the frontend receives:

```typescript
// In backup-schedules-table.tsx, add temporarily:
useEffect(() => {
  if (data && data.length > 0) {
    console.log("First schedule from backend:", data[0])
    console.log("Available fields:", Object.keys(data[0]))
  }
}, [data])
```

The backend should now provide all fields correctly formatted.

---

**Priority**: High  
**Estimated Time**: 1-2 hours  
**Dependencies**: ProviderBadge component (already exists)
