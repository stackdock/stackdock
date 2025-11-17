# Repository State Assessment
**Date**: 2025-11-17  
**Status**: ✅ CLEANED UP

## Current Situation

You're on `main` branch after pulling. Cleanup complete.

## What Exists Right Now

### Monitoring Routes (apps/web/src/routes/dashboard/monitoring/)
- ✅ `issues.tsx` - EXISTS (correct) - Uses `listIssues` query ✅
- ✅ `logs.tsx` - EXISTS (correct)  
- ✅ `uptime.tsx` - EXISTS (correct)
- ✅ `alerts.tsx` - DELETED ✅

### Sidebar Configuration
- ✅ Updated to "Issues" (correct)
- ✅ URL points to `/dashboard/monitoring/issues` (correct)
- ✅ Icon is `AlertCircle` (correct)

### Route Tree
- ⚠️ Still references `alerts.tsx` (will auto-regenerate when alerts.tsx is deleted)

## What Needs To Happen

### Step 1: Delete alerts.tsx
```bash
# Delete the alerts route file
rm apps/web/src/routes/dashboard/monitoring/alerts.tsx
```

### Step 2: Verify issues.tsx uses correct query
- Should use: `api["monitoring/queries"].listIssues`
- NOT: `api["monitoring/queries"].listAlerts`

### Step 3: Verify monitoring/queries.ts
- Should have `listIssues` query
- `listAlerts` can exist as alias (but issues.tsx should use listIssues)

### Step 4: Route tree will auto-regenerate
- When you start dev server, routeTree.gen.ts will update automatically
- Will remove alerts references

## Known Good State

**Monitoring Routes (MVP)**:
- `issues.tsx` - Uses `listIssues` query
- `logs.tsx` - Placeholder/workflows template
- `uptime.tsx` - Working table

**Sidebar**:
- "Issues" (not "Alerts")
- URL: `/dashboard/monitoring/issues`
- Icon: `AlertCircle`

**Convex Queries**:
- `listIssues` - Queries `issues` table
- `listAlerts` - Optional alias (can exist, but issues.tsx should use listIssues)

## Action Plan - COMPLETED

1. ✅ Delete `alerts.tsx` - DONE
2. ✅ Verify `issues.tsx` uses `listIssues` - VERIFIED (line 19)
3. ✅ Verify sidebar is correct - VERIFIED (uses "Issues", correct URL/icon)
4. ⏳ Start dev server to regenerate route tree - READY (will auto-regenerate)
5. ⏳ Test that Issues page loads correctly - READY TO TEST

## Current State Summary

✅ **REPOSITORY IS CLEAN**

- Only 3 monitoring routes: `issues.tsx`, `logs.tsx`, `uptime.tsx`
- Sidebar correctly configured
- `issues.tsx` uses correct query (`listIssues`)
- Route tree will auto-regenerate on next dev server start

**Next Step**: Start dev server to regenerate routeTree.gen.ts (it will automatically remove alerts references)

## Files That Should NOT Exist

- ❌ `apps/web/src/routes/dashboard/monitoring/alerts.tsx`
- ❌ `apps/web/src/routes/dashboard/monitoring/activity.tsx` (moved to Settings)
- ❌ `apps/web/src/routes/dashboard/monitoring/errors.tsx`

## Files That SHOULD Exist

- ✅ `apps/web/src/routes/dashboard/monitoring/issues.tsx`
- ✅ `apps/web/src/routes/dashboard/monitoring/logs.tsx`
- ✅ `apps/web/src/routes/dashboard/monitoring/uptime.tsx`
