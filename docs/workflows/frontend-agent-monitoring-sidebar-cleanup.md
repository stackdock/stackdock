# Frontend Agent: Monitoring Sidebar Cleanup

## Mission Overview

Clean up the Monitoring sidebar navigation by removing duplicate/nested Issues pages and reorganizing the menu structure. The Monitoring section should display three items in order: **Uptime**, **Alerts**, **Logs**.

## Current State

### Sidebar Issues (apps/web/src/components/dashboard/sidebar-data.tsx)

**Lines 171-197** - Monitoring section currently has:
1. Uptime (correct)
2. Alerts (correct)
3. Issues (duplicate #1 - line 183-186)
4. Issues (duplicate #2 - line 188-191)
5. Errors (should be removed)

### Existing Pages

- `apps/web/src/routes/dashboard/monitoring/uptime.tsx` - **LEAVE UNTOUCHED** (working page with table)
- `apps/web/src/routes/dashboard/monitoring/alerts.tsx` - Already uses workflows template (good)
- `apps/web/src/routes/dashboard/monitoring/issues.tsx` - Has functionality (Sentry issues table)
- `apps/web/src/routes/dashboard/monitoring/errors.tsx` - Uses workflows template (can be removed or repurposed)
- `apps/web/src/routes/dashboard/monitoring/activity.tsx` - Not in sidebar (can be removed or repurposed)

## Target State

### Sidebar Structure

Monitoring section should have exactly 3 items in this order:
1. **Uptime** - `/dashboard/monitoring/uptime` (icon: `Link2`)
2. **Alerts** - `/dashboard/monitoring/alerts` (icon: `Bell`)
3. **Logs** - `/dashboard/monitoring/logs` (icon: `FileText` or `ScrollText`)

### Page Requirements

- **Uptime** (`uptime.tsx`) - **DO NOT MODIFY** - Leave exactly as is
- **Alerts** (`alerts.tsx`) - Already uses workflows template, verify it matches exactly
- **Logs** (`logs.tsx`) - **CREATE NEW** - Use workflows template (same structure as `workflows.tsx`)

## Workflows Template Reference

**File**: `apps/web/src/routes/dashboard/operations/workflows.tsx`

```typescript
import { createFileRoute } from "@tanstack/react-router"
import { Workflow } from "lucide-react"

export const Route = createFileRoute("/dashboard/operations/workflows")({
  component: WorkflowsPage,
})

function WorkflowsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Workflows
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Automated workflows and task management
        </p>
      </div>
      
      {/* Workflows Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Workflows
          </h2>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="text-muted-foreground">Workflows coming soon...</p>
        </div>
      </div>
    </main>
  )
}
```

## Implementation Steps

### Step 1: Update Sidebar Navigation

**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

**Changes needed**:
1. Remove duplicate "Issues" entries (lines 183-191)
2. Remove "Errors" entry (lines 193-196)
3. Add "Logs" entry after "Alerts"
4. Ensure order is: Uptime, Alerts, Logs

**Update both**:
- `useSidebarData()` function (lines 171-197)
- `sidebarData` static object (lines 362-378)

**Icon for Logs**: Use `FileText` from lucide-react (import if needed)

### Step 2: Create Logs Page

**File**: `apps/web/src/routes/dashboard/monitoring/logs.tsx` (NEW FILE)

**Template**: Copy structure from `workflows.tsx` but adapt for Logs:
- Route: `/dashboard/monitoring/logs`
- Title: "Logs"
- Description: "Application logs and event streams"
- Icon: `FileText` (or `ScrollText` if FileText not available)
- Content: "Logs coming soon..." placeholder

### Step 3: Verify Alerts Page

**File**: `apps/web/src/routes/dashboard/monitoring/alerts.tsx`

**Verify**: Ensure it matches workflows template structure exactly. It already looks correct, but double-check:
- Same layout structure
- Same spacing/padding
- Same "coming soon" placeholder style

### Step 4: Clean Up Unused Pages (Optional)

**Files to consider removing** (if not needed):
- `apps/web/src/routes/dashboard/monitoring/issues.tsx` - Has functionality, but user wants it removed from sidebar
- `apps/web/src/routes/dashboard/monitoring/errors.tsx` - Not in target sidebar
- `apps/web/src/routes/dashboard/monitoring/activity.tsx` - Not in target sidebar

**Decision**: Check if Issues page should be deleted entirely or just removed from sidebar. User said "remove duplicated nested issues pages" - this likely means remove from sidebar, but confirm if the file should be deleted.

## Files to Modify

1. `apps/web/src/components/dashboard/sidebar-data.tsx`
   - Remove duplicate Issues entries
   - Remove Errors entry
   - Add Logs entry
   - Update both hook and static data

2. `apps/web/src/routes/dashboard/monitoring/logs.tsx` (CREATE NEW)
   - Use workflows template
   - Adapt for Logs content

3. `apps/web/src/routes/dashboard/monitoring/alerts.tsx` (VERIFY)
   - Ensure matches workflows template exactly

## Files to Leave Untouched

- `apps/web/src/routes/dashboard/monitoring/uptime.tsx` - **DO NOT MODIFY**

## Testing Checklist

- [ ] Sidebar shows exactly 3 items: Uptime, Alerts, Logs (in that order)
- [ ] No duplicate entries
- [ ] Logs page loads correctly
- [ ] Alerts page matches workflows template
- [ ] Uptime page still works (unchanged)
- [ ] All routes navigate correctly
- [ ] Icons display correctly

## Notes

- User explicitly said "Leave uptime. Untouched" - do not modify `uptime.tsx` at all
- Use workflows template for pages without functionality (logs, alerts)
- Order must be: Uptime (top), Alerts (middle), Logs (bottom)
- Remove all Issues and Errors entries from sidebar
