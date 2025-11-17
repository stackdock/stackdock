# Convex Agent: Sentry Issues → Alerts Table Integration Plan

## Mission Overview

Enable the Alerts page (`/dashboard/monitoring/alerts`) to display Sentry issues from the `alerts` table. The backend infrastructure already exists - we need to ensure queries are properly set up and accessible.

## ⚠️ CRITICAL: Terminology Clarification

**IMPORTANT**: Sentry calls them "issues", but StackDock calls them **"alerts"**.

- **Sentry API**: Uses "issues" terminology (e.g., `/projects/{org}/{project}/issues/`)
- **StackDock**: Uses "alerts" terminology (e.g., `alerts` table, `listAlerts` query)
- **Why**: "Issues" could be confused with GitHub issues, bug trackers, etc. "Alerts" is a broader term that fits critical notifications from error tracking, monitoring, and other alerting systems.

**Terminology Mapping**:
- Sentry "issues" → StackDock "alerts"
- Sentry API `listIssues()` → StackDock adapter `syncAlerts()`
- Sentry API `/issues/` endpoint → StackDock `alerts` table

## ⚠️ CRITICAL: Sentry Projects vs StackDock Projects

**IMPORTANT**: Sentry "projects" are provider resources, **NOT** StackDock core projects.

- **Sentry Projects**: Provider-specific resources from Sentry API (e.g., "my-app-frontend", "my-api-backend")
- **StackDock Projects**: Core StackDock projects in the `projects` table (user-created project containers)

**Sync Pattern** (same as other providers):
- ✅ Sentry "issues" (what Sentry calls them) → `alerts` table (what StackDock calls them)
- ✅ Sentry project info stored as metadata fields (`project`, `projectSlug`, `organizationSlug`) in `alerts` table
- ❌ Sentry projects do NOT sync to StackDock `projects` table
- ❌ Sentry alerts do NOT link to StackDock `projects` table

**This follows the same pattern as**:
- Vercel projects → `webServices` table (not `projects` table)
- GridPane sites → `webServices` table (not `projects` table)
- GitHub repositories → `repositories` table (not `projects` table)
- Better Stack monitors → `monitors` table (not `projects` table)

Users can manually link Sentry alerts to StackDock projects via the `projectResources` table if needed, but the sync itself does NOT create this link.

## Current State

### ✅ What Already Exists

1. **Schema**: `alerts` table in `convex/schema.ts` (currently named `issues`, needs rename)
   - Stores alerts from Sentry and other providers (Sentry calls them "issues", we call them "alerts")
   - Has proper indexes: `by_orgId`, `by_status`, `by_severity`
   - Fields: `title`, `status`, `severity`, `project`, `count`, `lastSeen`, etc.

2. **Sentry Adapter**: `convex/docks/adapters/sentry/adapter.ts`
   - `syncIssues()` method exists (needs rename to `syncAlerts()`)
   - Maps Sentry API responses to universal schema
   - Syncs Sentry "issues" to `alerts` table (NOT `projects` table)
   - Stores Sentry project info as metadata fields (`project`, `projectSlug`, `organizationSlug`)
   - Handles pagination and orphan cleanup

3. **Sentry API Client**: `convex/docks/adapters/sentry/api.ts`
   - `listIssues()` - fetches "issues" from Sentry API (Sentry's terminology)
   - `listAllIssues()` - fetches "issues" across all projects (Sentry's terminology)
   - Handles cursor-based pagination
   - **Note**: These methods use Sentry's API terminology ("issues"), which is correct for the API layer

4. **Query**: `convex/monitoring/queries.ts`
   - `listIssues` query exists (needs rename to `listAlerts`)
   - Has RBAC check (`monitoring:read` permission)
   - Returns all alerts for user's organization

### ❌ What's Missing / Needs Rename

1. **Table Rename**: `issues` table → `alerts` table (breaking change, requires migration)
2. **Adapter Method Rename**: `syncIssues()` → `syncAlerts()` 
3. **Query Rename**: `listIssues` → `listAlerts`
4. **Code References**: All references to `issues` table need to be updated to `alerts`
5. **Resource Type Updates**: Update resource type from `"issues"` to `"alerts"` in mutations and actions
6. **Documentation**: Query usage not documented for alerts context with terminology clarification

## Target State

The Alerts page should display alerts from the `alerts` table. The table stores critical notifications from error tracking providers (Sentry calls them "issues", but we call them "alerts" to avoid confusion with GitHub issues, bug trackers, etc.).

## Implementation Plan

### Task 1: Rename Table and Update References (REQUIRED)

**Files to Update**:
- `convex/schema.ts` - Rename `issues` table to `alerts`
- `convex/docks/adapters/sentry/adapter.ts` - Rename `syncIssues()` to `syncAlerts()`, update table references
- `convex/monitoring/queries.ts` - Rename `listIssues` to `listAlerts`, update table references
- `convex/docks/actions.ts` - Update resource type from `"issues"` to `"alerts"`
- `convex/docks/mutations.ts` - Update resource type from `"issues"` to `"alerts"`
- `convex/docks/_types.ts` - Update `DockAdapter` interface if needed

**Schema Change**:
```typescript
// OLD: issues: defineTable({ ... })
// NEW:
alerts: defineTable({
  orgId: v.id("organizations"),
  dockId: v.id("docks"),
  provider: v.string(), // "sentry", "rollbar", "bugsnag", etc.
  providerResourceId: v.string(), // Alert ID from provider (Sentry calls it "issue ID")
  title: v.string(), // Alert title/name
  status: v.string(), // "open", "resolved", "ignored", etc.
  severity: v.string(), // "low", "medium", "high", "critical"
  project: v.string(), // Provider project name (Sentry project, not StackDock project)
  projectSlug: v.optional(v.string()), // Provider project slug
  organizationSlug: v.optional(v.string()), // Provider organization slug
  count: v.optional(v.number()), // Number of occurrences
  userCount: v.optional(v.number()), // Number of affected users
  firstSeen: v.optional(v.number()), // First seen timestamp
  lastSeen: v.optional(v.number()), // Last seen timestamp
  fullApiData: v.any(), // All provider-specific data
  updatedAt: v.optional(v.number()), // Track modification time
})
  .index("by_orgId", ["orgId"])
  .index("by_dockId", ["dockId"])
  .index("by_dock_resource", ["dockId", "providerResourceId"])
  .index("by_status", ["orgId", "status"])
  .index("by_severity", ["orgId", "severity"]),
```

**Query Rename**:
```typescript
/**
 * List all alerts for the current user's organization
 * 
 * Returns alerts from all connected monitoring providers (Sentry, Rollbar, etc.)
 * Note: Sentry calls them "issues", but StackDock calls them "alerts" to avoid
 * confusion with GitHub issues, bug trackers, etc.
 * 
 * @requires monitoring:read permission
 * @returns Array of alert documents from the alerts table
 */
export const listAlerts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership) {
      throw new ConvexError("Not authorized")
    }
    
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      membership.orgId,
      "monitoring:read"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: monitoring:read required")
    }
    
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return alerts
  },
})
```

**Action**: Rename table and update all references. This is a breaking change that requires careful migration.

### Task 2: Update Sentry Sync Flow (After Rename)

**Files to Update**:
- `convex/docks/mutations.ts` - Update resource type from `"issues"` to `"alerts"`
- `convex/docks/actions.ts` - Update resource type from `"issues"` to `"alerts"`, update variable names
- `convex/docks/adapters/sentry/adapter.ts` - Rename `syncIssues()` to `syncAlerts()`, update table references

**Verification Steps**:

1. **Check syncDock mutation**:
   - Update to include `syncAlerts` in resourceTypes (change from `syncIssues`)
   - Update to schedule `syncDockResources` action with `"alerts"` resource type (change from `"issues"`)

2. **Check syncDockResources action**:
   - Update Sentry provider handling to use `"alerts"` resource type
   - Keep `api.listAllIssues()` (correct - uses Sentry's API terminology)
   - Update to call adapter's `syncAlerts()` method (rename from `syncIssues`)

3. **Check adapter syncAlerts**:
   - Rename method from `syncIssues()` to `syncAlerts()`
   - Update table references from `"issues"` to `"alerts"`
   - Maps Sentry "issues" (Sentry's term) to StackDock "alerts" (our term)
   - Handles upsert logic (insert or patch)
   - Cleans up orphaned alerts

**Action**: Update all three files after table rename. Verify they work together.

### Task 3: Test Query Performance

**File**: `convex/monitoring/queries.ts`

**Check**:
- Query uses index `by_orgId` ✅
- No N+1 queries
- Returns reasonable data size

**Action**: Run `listAlerts` query in Convex dashboard and verify performance. If slow, consider:
- Adding pagination
- Adding filters (status, severity)
- Adding sorting options

### Task 4: Document Query Usage

**File**: `convex/monitoring/queries.ts`

**Ensure JSDoc comments clarify terminology**:

```typescript
/**
 * List all alerts for the current user's organization
 * 
 * Returns alerts from all connected monitoring providers (Sentry, Rollbar, etc.)
 * 
 * **Terminology Note**: Sentry calls these "issues", but StackDock calls them "alerts"
 * to avoid confusion with GitHub issues, bug trackers, etc. This query returns what
 * Sentry calls "issues" but what we call "alerts".
 * 
 * @requires monitoring:read permission
 * @returns Array of alert documents from the alerts table
 * 
 * @example
 * ```ts
 * const alerts = await ctx.runQuery(api.monitoring.queries.listAlerts, {})
 * ```
 */
export const listAlerts = query({
  // ... existing code
})
```

**Action**: Add comprehensive JSDoc comments that clarify the terminology distinction.

## Testing Checklist

- [ ] Table renamed from `issues` to `alerts` in schema
- [ ] All code references updated from `issues` to `alerts`
- [ ] Query renamed from `listIssues` to `listAlerts`
- [ ] Adapter method renamed from `syncIssues` to `syncAlerts`
- [ ] Query returns alerts for user's organization
- [ ] Query respects RBAC (`monitoring:read` permission)
- [ ] Query returns empty array for users without permission
- [ ] Query handles users with no organization membership
- [ ] Query performance is acceptable (< 500ms for 1000 alerts)
- [ ] Sentry sync populates alerts table correctly
- [ ] Alerts appear in correct format (title, status, severity, etc.)
- [ ] Terminology is consistent: Sentry "issues" → StackDock "alerts"

## Success Criteria

1. ✅ `alerts` table exists (renamed from `issues`)
2. ✅ `listAlerts` query works and is accessible from frontend
3. ✅ Query has proper RBAC enforcement
4. ✅ Query performance is acceptable
5. ✅ Sentry "issues" sync correctly to `alerts` table
6. ✅ Query is documented with JSDoc clarifying terminology
7. ✅ All code uses "alerts" terminology (except Sentry API layer which correctly uses "issues")

## Notes

- **Terminology**: Sentry calls them "issues", StackDock calls them "alerts"
- The `alerts` table is the universal table for all error tracking providers
- Sentry "issues" are synced via the dock adapter to the `alerts` table
- **Sentry projects are NOT StackDock projects** - they're just metadata stored in the `alerts` table
- The Sentry API client correctly uses "issues" terminology (Sentry's API)
- The adapter and queries use "alerts" terminology (StackDock's terminology)
- Frontend agent will handle the UI integration
- Users can manually link alerts to StackDock projects via `projectResources` table if needed

## Related Files

- `convex/schema.ts` - Alerts table definition (needs rename from `issues`)
- `convex/monitoring/queries.ts` - Query implementation (needs rename to `listAlerts`)
- `convex/docks/adapters/sentry/adapter.ts` - Sentry sync logic (needs rename to `syncAlerts`)
- `convex/docks/actions.ts` - Sync orchestration (needs resource type update)
- `convex/docks/mutations.ts` - Sync trigger (needs resource type update)
- `convex/docks/_types.ts` - DockAdapter interface (may need update)

## Estimated Time

- Task 1 (Rename Table & References): 1-2 hours (breaking change, requires careful migration)
- Task 2 (Update Sync Flow): 30 minutes
- Task 3 (Performance Testing): 15 minutes
- Task 4 (Documentation): 15 minutes

**Total**: ~2-3 hours (includes breaking change migration)
