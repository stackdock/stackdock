# Frontend Agent: Sentry Issues → Alerts Table UI Integration Plan

## Mission Overview

Display Sentry alerts in the Alerts table on `/dashboard/monitoring/alerts` page. Reuse existing `IssuesTable` component and `listAlerts` query.

**⚠️ CRITICAL**: The Convex implementation uses `alerts` table and `listAlerts` query (not `issues` table or `listIssues` query). Sentry calls them "issues", but StackDock calls them "alerts" to avoid confusion with GitHub issues.

## Current State

### ✅ What Already Exists

1. **Alerts Page**: `apps/web/src/routes/dashboard/monitoring/alerts.tsx`
   - Route: `/dashboard/monitoring/alerts`
   - Currently shows "Alerts coming soon..." placeholder
   - Has proper page structure (header, description)

2. **Issues Table Component**: `apps/web/src/components/monitoring/issues-table.tsx`
   - Full TanStack Table implementation
   - Columns: Select, Title, Status, Severity, Project, Count, Last Seen, Provider, Actions
   - Filters: Search, Status, Severity, Provider
   - Pagination, sorting, column visibility
   - Handles empty states

3. **Issues Page**: `apps/web/src/routes/dashboard/monitoring/issues.tsx`
   - Uses `listIssues` query (NOTE: This page may need updating separately)
   - Uses `IssuesTable` component
   - Has empty state with CTA to connect dock

4. **Query**: `convex/monitoring/queries.ts`
   - `listAlerts` query exists and works ✅
   - Has RBAC enforcement (`monitoring:read` permission)
   - Queries `alerts` table (not `issues` table)

### ❌ What's Missing

1. **Alerts Page Integration**: Page doesn't use query or table component
2. **IssuesTable Component Type**: Component uses `Doc<"issues">` but should use `Doc<"alerts">` (prerequisite fix)
3. **Consistent Empty State**: Should match Issues page pattern

## Target State

The Alerts page should:
- Display Sentry alerts (and future alert providers) in a table
- Use the same `IssuesTable` component as Issues page (after type fix)
- Have consistent empty state messaging
- Match the visual design of other monitoring pages
- Query `alerts` table via `listAlerts` query

## Implementation Plan

### Task 0: Fix IssuesTable Component Type (PREREQUISITE)

**File**: `apps/web/src/components/monitoring/issues-table.tsx`

**Current Code (Line 97)**:
```typescript
type Issue = Doc<"issues"> // ❌ WRONG - table was renamed to "alerts"
```

**Target Code**:
```typescript
type Issue = Doc<"alerts"> // ✅ CORRECT - matches alerts table
```

**Reason**: The Convex schema table was renamed from `issues` to `alerts`. The TypeScript type must match the actual table name.

**Action**: Update line 97 to use `Doc<"alerts">` instead of `Doc<"issues">`.

**Note**: This fix is required before Task 1, otherwise TypeScript will show errors.

### Task 1: Update Alerts Page to Use Query and Table

**File**: `apps/web/src/routes/dashboard/monitoring/alerts.tsx`

**Current Code**:
```typescript
function AlertsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      {/* ... header ... */}
      <div className="rounded-lg border border-border bg-card p-4 md:p-6">
        <p className="text-muted-foreground">Alerts coming soon...</p>
      </div>
    </main>
  )
}
```

**Target Code**:
```typescript
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { IssuesTable } from "@/components/monitoring/issues-table"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/dashboard/monitoring/alerts")({
  component: AlertsPage,
})

function AlertsPage() {
  const alerts = useQuery(api["monitoring/queries"].listAlerts)
  const alertsList = alerts || []

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Alerts
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          System alerts and notifications from your monitoring providers
        </p>
      </div>

      {alertsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No alerts found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Connect a monitoring provider dock (like Sentry) to start tracking alerts and errors.
            </p>
          </div>
          <Button asChild>
            <a href="/dashboard/docks/add">Connect a Dock</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {alertsList.length} {alertsList.length === 1 ? "Alert" : "Alerts"}
            </h2>
          </div>
          <IssuesTable data={alerts} />
        </div>
      )}
    </main>
  )
}
```

**Changes**:
1. Import `useQuery` and `api` from Convex
2. Import `IssuesTable` component
3. Import icons (`Bell`) and `Button`
4. Call `listAlerts` query (not `listIssues`)
5. Use `alerts` and `alertsList` variable names (not `issues`/`issuesList`)
6. Replace placeholder with conditional rendering:
   - Empty state: Bell icon, "No alerts found", CTA button
   - With data: Header with count, `IssuesTable` component

**Action**: Replace entire file content with target code.

### Task 2: Verify Component Consistency

**Files to Compare**:
- `apps/web/src/routes/dashboard/monitoring/alerts.tsx` (after update)
- `apps/web/src/routes/dashboard/monitoring/issues.tsx` (reference)

**Check**:
- ✅ Alerts page uses `listAlerts` query (Issues page may use different query)
- ✅ Both use same table component (`IssuesTable`)
- ✅ Both have similar empty state structure
- ✅ Both have consistent spacing and layout
- ✅ Icons match context (Bell for Alerts, AlertCircle for Issues)

**Action**: Compare files and ensure consistency. Adjust if needed.

### Task 3: Test Empty State

**Scenario**: User has no Sentry dock connected

**Expected Behavior**:
- Page shows empty state
- Empty state has Bell icon
- Message: "No alerts found"
- CTA button links to `/dashboard/docks/add`
- Button text: "Connect a Dock"

**Action**: Test empty state visually and functionally.

### Task 4: Test With Data

**Scenario**: User has Sentry dock connected with alerts synced

**Expected Behavior**:
- Page shows header with count: "X Alerts"
- Table displays all alerts (from `alerts` table)
- Table has all columns: Select, Title, Status, Severity, Project, Count, Last Seen, Provider, Actions
- Filters work (Search, Status, Severity, Provider)
- Pagination works
- Sorting works
- Column visibility toggle works
- "View Issue" action opens Sentry permalink in new tab

**Action**: Test all table functionality.

### Task 5: Verify Responsive Design

**Check**:
- ✅ Page layout works on mobile (< 768px)
- ✅ Table scrolls horizontally on mobile
- ✅ Filters stack vertically on mobile
- ✅ Pagination controls are accessible
- ✅ Empty state is centered and readable

**Action**: Test on different screen sizes (mobile, tablet, desktop).

### Task 6: Verify Accessibility

**Check**:
- ✅ Page has proper heading hierarchy (h1 → h2)
- ✅ Table has proper ARIA labels
- ✅ Buttons have accessible labels
- ✅ Empty state is announced to screen readers
- ✅ Keyboard navigation works

**Action**: Test with keyboard navigation and screen reader.

## Testing Checklist

- [ ] IssuesTable component type fixed (`Doc<"alerts">`)
- [ ] Alerts page loads without errors
- [ ] Query fetches alerts correctly (`listAlerts`)
- [ ] Empty state displays when no alerts
- [ ] Table displays when alerts exist
- [ ] All table columns render correctly
- [ ] Filters work (Search, Status, Severity, Provider)
- [ ] Pagination works
- [ ] Sorting works
- [ ] Column visibility toggle works
- [ ] "View Issue" action opens Sentry link
- [ ] Page is responsive (mobile, tablet, desktop)
- [ ] Page is accessible (keyboard, screen reader)
- [ ] Loading state handled (skeleton or spinner)
- [ ] Error state handled (if query fails)

## Success Criteria

1. ✅ IssuesTable component type updated to `Doc<"alerts">`
2. ✅ Alerts page displays Sentry alerts in table (from `alerts` table)
3. ✅ Query uses `listAlerts` (not `listIssues`)
4. ✅ Empty state matches Issues page pattern
5. ✅ Table functionality matches Issues page
6. ✅ Page is responsive and accessible
7. ✅ Code follows existing patterns

## Design Notes

- **Icon**: Use `Bell` icon for Alerts (vs `AlertCircle` for Issues)
- **Terminology**: 
  - Sentry calls them "issues", but StackDock calls them "alerts"
  - Data comes from `alerts` table (not `issues` table)
  - Query is `listAlerts` (not `listIssues`)
- **Consistency**: Match Issues page layout and styling exactly
- **Empty State**: Use Bell icon, "No alerts found" message, CTA to connect dock

## Related Files

- `apps/web/src/routes/dashboard/monitoring/alerts.tsx` - **PRIMARY FILE TO UPDATE**
- `apps/web/src/routes/dashboard/monitoring/issues.tsx` - Reference implementation
- `apps/web/src/components/monitoring/issues-table.tsx` - Table component (reuse)
- `convex/monitoring/queries.ts` - Query (reuse)

## Estimated Time

- Task 0 (Fix IssuesTable Type): 5 minutes
- Task 1 (Update Page): 20 minutes
- Task 2 (Verify Consistency): 10 minutes
- Task 3 (Test Empty State): 10 minutes
- Task 4 (Test With Data): 20 minutes
- Task 5 (Responsive Design): 15 minutes
- Task 6 (Accessibility): 15 minutes

**Total**: ~1.5 hours

## Notes

- **CRITICAL**: The Convex implementation uses `alerts` table and `listAlerts` query
- Must fix `IssuesTable` component type first (`Doc<"issues">` → `Doc<"alerts">`)
- This is a straightforward integration - most code already exists
- Reuse existing components and queries (DRY principle)
- Match Issues page patterns for consistency
- The `IssuesTable` component is already perfect for this use case (after type fix)
- Variable names should use `alerts`/`alertsList` (not `issues`/`issuesList`) for clarity
