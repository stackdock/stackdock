# Convex Agent Plan Review & Feedback

## ✅ Excellent Additions

### 1. Terminology Clarification
**Status**: ✅ **EXCELLENT** - Critical clarification added

The plan correctly identifies the terminology distinction:
- Sentry API uses "issues" (their terminology)
- StackDock should use "alerts" (to avoid confusion with GitHub issues, bug trackers)

**Impact**: This prevents confusion and makes the codebase more maintainable.

### 2. Sentry Projects vs StackDock Projects
**Status**: ✅ **CRITICAL** - Well documented

The clarification that Sentry "projects" are NOT StackDock `projects` is essential:
- Sentry projects → metadata fields in `alerts` table
- StackDock projects → core `projects` table
- Follows same pattern as other providers (Vercel, GridPane, etc.)

**Impact**: Prevents architectural mistakes and maintains consistency.

## ⚠️ Critical Concern: Breaking Change

### Issue: Table Rename (`issues` → `alerts`)

**Current State**:
- `issues` table exists and is working
- `listIssues` query exists and is used by Issues page (`/dashboard/monitoring/issues`)
- `IssuesTable` component displays data from `issues` table
- Frontend plan says to reuse `listIssues` query

**Problem**: 
Renaming the table from `issues` to `alerts` is a **breaking change** that would:
1. Break existing Issues page (`/dashboard/monitoring/issues`)
2. Break all existing queries/mutations referencing `issues` table
3. Require migration of existing data
4. Require updating all code references simultaneously
5. Risk data loss if migration fails

**Recommendation**: **DO NOT RENAME THE TABLE**

Instead, use a **semantic alias approach**:

### Alternative Approach: Semantic Alias (Recommended)

**Keep the `issues` table as-is** (it's working, don't break it), but:

1. **Create `listAlerts` query** that queries the same `issues` table:
   ```typescript
   /**
    * List all alerts for the current user's organization
    * 
    * **Terminology Note**: Sentry calls these "issues", but StackDock calls them "alerts"
    * to avoid confusion with GitHub issues, bug trackers, etc. This query returns what
    * Sentry calls "issues" but what we call "alerts".
    * 
    * Internally queries the `issues` table (for backward compatibility), but semantically
    * returns "alerts" (critical notifications from error tracking providers).
    * 
    * @requires monitoring:read permission
    * @returns Array of alert documents from the issues table
    */
   export const listAlerts = query({
     args: {},
     handler: async (ctx) => {
       // Same implementation as listIssues, but with "alerts" terminology
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

2. **Keep `listIssues` query** for backward compatibility (Issues page still works)

3. **Update adapter method naming** (optional):
   - Keep `syncIssues()` method name (it syncs Sentry "issues" to `issues` table)
   - Add JSDoc clarifying terminology
   - OR rename to `syncAlerts()` but keep table as `issues` (less breaking)

4. **Update documentation** to clarify:
   - `issues` table stores what Sentry calls "issues" but we call "alerts"
   - `listAlerts` query is the preferred way to query alerts
   - `listIssues` query is maintained for backward compatibility

**Benefits**:
- ✅ No breaking changes
- ✅ Backward compatible (Issues page still works)
- ✅ Semantic clarity (Alerts page uses `listAlerts`)
- ✅ Can migrate gradually
- ✅ Lower risk

## 📋 Revised Implementation Plan

### Task 1: Create `listAlerts` Query (Semantic Alias)

**File**: `convex/monitoring/queries.ts`

**Action**: Add `listAlerts` query that queries `issues` table with proper documentation.

**Keep**: `listIssues` query unchanged (backward compatibility).

### Task 2: Update Adapter Documentation

**File**: `convex/docks/adapters/sentry/adapter.ts`

**Action**: 
- Keep `syncIssues()` method name (or rename to `syncAlerts()` if preferred, but keep table as `issues`)
- Add JSDoc clarifying terminology:
  ```typescript
  /**
   * Sync Sentry issues to universal `issues` table
   * 
   * **Terminology**: Sentry calls these "issues", but StackDock calls them "alerts"
   * to avoid confusion with GitHub issues, bug trackers, etc. This method syncs
   * what Sentry calls "issues" to the `issues` table (which stores alerts).
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each project, fetch issues
   * 4. For each issue, upsert into `issues` table
   * 5. Map level to severity, status to universal status
   * 6. Store all Sentry fields in fullApiData
   */
  async syncIssues(...) { ... }
  ```

### Task 3: Update Actions/Mutations Documentation

**Files**: 
- `convex/docks/actions.ts`
- `convex/docks/mutations.ts`

**Action**: Add comments clarifying that `"issues"` resource type maps to `issues` table, which stores alerts.

### Task 4: Update Schema Comments

**File**: `convex/schema.ts`

**Action**: Update table comment to clarify terminology:
```typescript
// Master Fleet List: Issues (Errors/Exceptions/Alerts)
// Note: Sentry calls these "issues", but StackDock calls them "alerts"
// to avoid confusion with GitHub issues, bug trackers, etc.
issues: defineTable({ ... })
```

## 🎯 Recommended Approach Summary

**DO**:
- ✅ Create `listAlerts` query (semantic alias)
- ✅ Keep `listIssues` query (backward compatibility)
- ✅ Keep `issues` table name (no breaking changes)
- ✅ Update documentation with terminology clarification
- ✅ Update adapter JSDoc comments

**DON'T**:
- ❌ Rename `issues` table to `alerts` (breaking change)
- ❌ Remove `listIssues` query (breaks Issues page)
- ❌ Make breaking changes without migration plan

## 🔄 Migration Path (If Rename is Required Later)

If you decide to rename the table in the future:

1. **Phase 1**: Create `listAlerts` query (semantic alias)
2. **Phase 2**: Update frontend to use `listAlerts`
3. **Phase 3**: Deprecate `listIssues` query (mark as deprecated)
4. **Phase 4**: Create migration script to rename table
5. **Phase 5**: Update all code references
6. **Phase 6**: Remove deprecated `listIssues` query

**Estimated Time**: 4-6 hours (with testing and rollback plan)

## ✅ Final Recommendation

**Use the semantic alias approach** - it provides semantic clarity without breaking changes. The table name `issues` is fine as long as documentation clarifies that it stores "alerts" (what Sentry calls "issues").

## 📝 Updated Success Criteria

1. ✅ `listAlerts` query exists and queries `issues` table
2. ✅ `listIssues` query still works (backward compatibility)
3. ✅ Query has proper RBAC enforcement
4. ✅ Query performance is acceptable
5. ✅ Sentry "issues" sync correctly to `issues` table
6. ✅ Query is documented with JSDoc clarifying terminology
7. ✅ All code uses "alerts" terminology in user-facing contexts
8. ✅ No breaking changes introduced

## 🎓 Key Takeaway

**Terminology clarity can be achieved through documentation and semantic aliases without breaking changes.** The table name `issues` is fine as long as:
- Documentation clarifies it stores "alerts"
- User-facing code uses "alerts" terminology
- Queries have semantic names (`listAlerts`)
