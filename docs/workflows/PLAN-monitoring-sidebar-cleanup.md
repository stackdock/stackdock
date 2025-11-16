# Plan: Monitoring Sidebar Cleanup

## Objective

Clean up the Monitoring sidebar navigation by removing duplicate Issues entries and reorganizing to show: **Uptime**, **Alerts**, **Logs** (in that order, top to bottom).

## Current Problems

1. **Duplicate Issues entries** in sidebar (lines 183-191 in sidebar-data.tsx)
2. **Errors entry** should be removed (not in target structure)
3. **Missing Logs page** - needs to be created
4. **Alerts page** - verify it matches workflows template

## Target Structure

```
Monitoring (parent dropdown)
├── Uptime (/dashboard/monitoring/uptime) - LEAVE UNTOUCHED
├── Alerts (/dashboard/monitoring/alerts) - Verify workflows template
└── Logs (/dashboard/monitoring/logs) - CREATE NEW (workflows template)
```

## Implementation Plan

### Task 1: Update Sidebar Navigation

**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

**Actions**:
1. Remove duplicate "Issues" entries (lines 183-191)
2. Remove "Errors" entry (lines 193-196)
3. Add "Logs" entry after "Alerts"
4. Import `FileText` icon from lucide-react (if not already imported)
5. Update BOTH `useSidebarData()` function AND `sidebarData` static object

**Expected Result**:
```typescript
{
  title: "Monitoring",
  icon: BarChart3,
  items: [
    {
      title: "Uptime",
      url: "/dashboard/monitoring/uptime",
      icon: Link2,
    },
    {
      title: "Alerts",
      url: "/dashboard/monitoring/alerts",
      icon: Bell,
    },
    {
      title: "Logs",
      url: "/dashboard/monitoring/logs",
      icon: FileText, // or ScrollText
    },
  ],
}
```

### Task 2: Create Logs Page

**File**: `apps/web/src/routes/dashboard/monitoring/logs.tsx` (CREATE NEW)

**Template**: Copy from `apps/web/src/routes/dashboard/operations/workflows.tsx`

**Adaptations**:
- Change route to `/dashboard/monitoring/logs`
- Change title to "Logs"
- Change description to "Application logs and event streams"
- Change icon to `FileText` (or `ScrollText`)
- Change placeholder text to "Logs coming soon..."

**Code Structure**:
```typescript
import { createFileRoute } from "@tanstack/react-router"
import { FileText } from "lucide-react"

export const Route = createFileRoute("/dashboard/monitoring/logs")({
  component: LogsPage,
})

function LogsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Logs
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Application logs and event streams
        </p>
      </div>
      
      {/* Logs Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs
          </h2>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="text-muted-foreground">Logs coming soon...</p>
        </div>
      </div>
    </main>
  )
}
```

### Task 3: Verify Alerts Page

**File**: `apps/web/src/routes/dashboard/monitoring/alerts.tsx`

**Actions**:
1. Read the file
2. Compare structure with workflows.tsx
3. Ensure it matches exactly (same layout, spacing, placeholder style)
4. If differences found, update to match workflows template exactly

**Expected Structure**: Should match workflows.tsx template exactly

### Task 4: Verify Uptime Page (DO NOT MODIFY)

**File**: `apps/web/src/routes/dashboard/monitoring/uptime.tsx`

**Actions**:
1. Read the file to verify it exists and works
2. **DO NOT MODIFY** - User explicitly said to leave it untouched
3. Just verify it's there and functional

## Files Summary

### Files to Modify
1. `apps/web/src/components/dashboard/sidebar-data.tsx` - Update navigation structure
2. `apps/web/src/routes/dashboard/monitoring/logs.tsx` - CREATE NEW
3. `apps/web/src/routes/dashboard/monitoring/alerts.tsx` - VERIFY (update if needed)

### Files to Leave Alone
- `apps/web/src/routes/dashboard/monitoring/uptime.tsx` - **DO NOT TOUCH**

### Files to Consider (Optional)
- `apps/web/src/routes/dashboard/monitoring/issues.tsx` - Remove from sidebar, but file may stay
- `apps/web/src/routes/dashboard/monitoring/errors.tsx` - Remove from sidebar, file can be deleted
- `apps/web/src/routes/dashboard/monitoring/activity.tsx` - Not in sidebar, can be deleted

## Verification Steps

1. Check sidebar shows exactly 3 items in order: Uptime, Alerts, Logs
2. Verify no duplicate entries
3. Test all three routes navigate correctly
4. Verify Logs page loads and displays correctly
5. Verify Alerts page matches workflows template
6. Verify Uptime page still works (unchanged)

## Success Criteria

- [ ] Sidebar shows exactly 3 Monitoring items: Uptime, Alerts, Logs
- [ ] No duplicate Issues entries
- [ ] No Errors entry
- [ ] Logs page created and functional
- [ ] Alerts page matches workflows template
- [ ] Uptime page unchanged and working
- [ ] All routes navigate correctly
- [ ] Icons display correctly

## Notes

- User explicitly said "Leave uptime. Untouched" - do not modify uptime.tsx
- Use workflows template for pages without functionality
- Order must be: Uptime (top), Alerts (middle), Logs (bottom)
- Remove all Issues and Errors entries from sidebar navigation
