# Revert: Alerts Table → Issues Table

## Problem

The Convex agent renamed `issues` table to `alerts` table, which:
1. ❌ Broke the Issues page (`/dashboard/monitoring/issues`) - `listIssues` query doesn't exist
2. ❌ Created empty `alerts` table (no data migration)
3. ❌ Went against agreed approach (semantic alias, not rename)
4. ❌ Created confusion about why there's a separate Alerts page

## Decision

**REVERT to `issues` table** and use semantic alias approach as originally recommended.

## Architecture Decision

**Unified `issues` table** for all error tracking providers:
- Sentry "issues" → `issues` table
- Rollbar "items" → `issues` table  
- Bugsnag "errors" → `issues` table
- All error tracking providers → `issues` table

**Semantic clarity via queries**:
- `listIssues` query - queries `issues` table (backward compatible)
- `listAlerts` query - queries `issues` table (semantic alias for Alerts page)

**Single Issues page**:
- `/dashboard/monitoring/issues` - shows all issues/alerts from all providers
- No separate Alerts page needed (redundant)

## Revert Plan

### Step 1: Revert Schema

**File**: `convex/schema.ts`

**Change**:
```typescript
// OLD:
alerts: defineTable({ ... })

// NEW:
issues: defineTable({ ... })
```

**Action**: Rename `alerts` table back to `issues` table.

### Step 2: Revert Adapter

**File**: `convex/docks/adapters/sentry/adapter.ts`

**Changes**:
1. Rename method: `syncAlerts()` → `syncIssues()`
2. Update table references: `query("alerts")` → `query("issues")`
3. Update inserts: `insert("alerts", ...)` → `insert("issues", ...)`

### Step 3: Revert Query

**File**: `convex/monitoring/queries.ts`

**Changes**:
1. Keep `listAlerts` query but make it query `issues` table (semantic alias)
2. Add `listIssues` query (queries `issues` table) for backward compatibility

**Code**:
```typescript
/**
 * List all issues for the current user's organization
 * 
 * Returns issues from all connected monitoring providers (Sentry, Rollbar, etc.)
 * 
 * @requires monitoring:read permission
 * @returns Array of issue documents from the issues table
 */
export const listIssues = query({
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
    
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return issues
  },
})

/**
 * List all alerts for the current user's organization
 * 
 * **Semantic Alias**: This query returns the same data as `listIssues`, but uses
 * "alerts" terminology for semantic clarity. Sentry calls them "issues", but
 * StackDock calls them "alerts" to avoid confusion with GitHub issues, bug trackers, etc.
 * 
 * Internally queries the `issues` table (for backward compatibility).
 * 
 * @requires monitoring:read permission
 * @returns Array of alert documents from the issues table
 */
export const listAlerts = query({
  args: {},
  handler: async (ctx) => {
    // Reuse listIssues implementation (semantic alias)
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
    
    // Query issues table (backward compatible), return as "alerts"
    const alerts = await ctx.db
      .query("issues")
      .withIndex("by_orgId", (q) => q.eq("orgId", membership.orgId))
      .collect()
    
    return alerts
  },
})
```

### Step 4: Revert Actions/Mutations

**Files**: 
- `convex/docks/actions.ts`
- `convex/docks/mutations.ts`

**Changes**:
1. Change resource type: `"alerts"` → `"issues"`
2. Update variable names: `alerts` → `issues`
3. Update adapter method calls: `syncAlerts()` → `syncIssues()`

### Step 5: Revert Frontend Components

**File**: `apps/web/src/components/monitoring/issues-table.tsx`

**Change**:
```typescript
// OLD:
type Issue = Doc<"alerts">

// NEW:
type Issue = Doc<"issues">
```

### Step 6: Update Issues Page

**File**: `apps/web/src/routes/dashboard/monitoring/issues.tsx`

**Verify**: Should already use `listIssues` query (will work after revert).

### Step 7: Remove or Update Alerts Page

**Decision**: Remove Alerts page OR make it redirect to Issues page

**Option A**: Remove Alerts page entirely
- Delete `apps/web/src/routes/dashboard/monitoring/alerts.tsx`
- Remove from sidebar navigation

**Option B**: Make Alerts page use same data as Issues page
- Alerts page uses `listAlerts` query (semantic alias)
- Both pages show same data, just different terminology in UI

**Recommendation**: **Option B** - Keep Alerts page but make it use `listAlerts` query (which queries `issues` table). This gives users semantic clarity without breaking anything.

## Data Migration

**If there's data in `alerts` table**:
- Need to migrate data from `alerts` → `issues` before reverting
- Check if `alerts` table has any data first

**If `alerts` table is empty** (likely):
- No migration needed
- Just revert the schema and code

## Testing Checklist

- [ ] Schema reverted: `issues` table exists (not `alerts`)
- [ ] Adapter reverted: `syncIssues()` method, queries `issues` table
- [ ] Queries reverted: `listIssues` exists, `listAlerts` queries `issues` table
- [ ] Actions/Mutations reverted: use `"issues"` resource type
- [ ] Frontend components reverted: `Doc<"issues">` type
- [ ] Issues page works (uses `listIssues`)
- [ ] Alerts page works (uses `listAlerts` semantic alias)
- [ ] Sentry sync works (syncs to `issues` table)
- [ ] No data loss (if migration needed)

## Success Criteria

1. ✅ `issues` table exists (reverted from `alerts`)
2. ✅ `listIssues` query works (backward compatibility)
3. ✅ `listAlerts` query works (semantic alias, queries `issues` table)
4. ✅ Issues page works
5. ✅ Alerts page works (or removed if not needed)
6. ✅ Sentry sync works (syncs to `issues` table)
7. ✅ No breaking changes
8. ✅ No data loss

## Estimated Time

- Schema revert: 5 minutes
- Adapter revert: 10 minutes
- Query revert: 15 minutes
- Actions/Mutations revert: 10 minutes
- Frontend revert: 5 minutes
- Testing: 15 minutes

**Total**: ~1 hour

## Notes

- This reverts the breaking change that was made against recommendations
- Uses semantic alias approach as originally recommended
- Maintains backward compatibility
- Provides semantic clarity without breaking changes
