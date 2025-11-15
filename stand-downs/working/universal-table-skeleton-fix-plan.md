# Universal Table Skeleton Loading Fix Plan

**Date**: November 14, 2025  
**Status**: Draft - Awaiting Review  
**Priority**: High (UX Consistency)

## Problem Statement

Three pages are not showing proper loading skeletons, causing inconsistent UX:

1. **Code Page** (`/dashboard/projects/code`): Shows "No GitHub repositories found" during loading instead of skeleton
2. **Networking Page** (`/dashboard/infrastructure/networking`): Shows table with "No domains found" during loading instead of skeleton
3. **Backups Page** (`/dashboard/operations/backups`): Shows cards saying "No schedules found" / "No backup integrations found" during loading instead of skeletons

**Reference Implementation**: Compute, Data, and Storage pages correctly show skeletons during loading.

## Root Cause Analysis

### Issue 1: Code Page (`RepositoriesTable`)
- **File**: `apps/web/src/routes/dashboard/projects/code.tsx`
- **Problem**: Page filters `projects` immediately: `projects?.filter(...) || []`
- **Result**: `RepositoriesTable` receives `[]` (empty array) instead of `undefined` when loading
- **Table Check**: `RepositoriesTable` checks `if (projects.length === 0)` which is true during loading
- **Fix**: Pass `undefined` when `projects === undefined`, only filter when data is loaded

### Issue 2: Networking Page (`DomainsTable`)
- **File**: `apps/web/src/routes/dashboard/infrastructure/networking.tsx`
- **Problem**: Page does `const domainsList = domains || []` before filtering
- **Result**: `DomainsTable` receives filtered `[]` instead of `undefined` when loading
- **Table Check**: `DomainsTable` correctly checks `if (data === undefined)` but never receives `undefined`
- **Fix**: Pass `undefined` when `domains === undefined`, only filter when data is loaded

### Issue 3: Backups Page (`BackupSchedulesTable` & `BackupIntegrationsTable`)
- **Files**: 
  - `apps/web/src/components/operations/backup-schedules-table.tsx`
  - `apps/web/src/components/operations/backup-integrations-table.tsx`
- **Problem**: Both tables have default parameters `data = []` in function signature
- **Result**: Tables never receive `undefined`, always receive `[]` (empty array)
- **Table Checks**: Both correctly check `if (data === undefined)` but it's never true
- **Additional Issue**: Both have separate empty state cards that should be removed (empty state handled by table's "No X found" message)
- **Fix**: 
  1. Remove default parameters from function signatures
  2. Use `data || []` when passing to `useReactTable` (like other tables)
  3. Remove empty state card components (lines 384-389 and 161-166)
  4. Ensure `TableSkeleton` is used consistently

## Solution Pattern (From Working Examples)

**Working Pattern** (from `servers-table.tsx`, `block-volumes-table.tsx`, etc.):
```typescript
// Page component
const servers = useQuery(api["resources/queries"].listServers)
// Pass undefined directly when loading
<ServersTable data={servers} />

// Table component
export function ServersTable({ data }: { data: Server[] | undefined }) {
  // No default parameter!
  const table = useReactTable({
    data: data || [], // Handle undefined here
    // ...
  })
  
  if (data === undefined) {
    return <TableSkeleton columnCount={X} showCheckbox={true} />
  }
  
  // Rest of table...
}
```

## Implementation Plan

### Phase 1: Fix Code Page
1. **File**: `apps/web/src/routes/dashboard/projects/code.tsx`
   - Change line 16: Only filter when `projects` is defined
   - Pass `undefined` to `RepositoriesTable` when `projects === undefined`
   - Pass filtered array when `projects` is loaded

### Phase 2: Fix Networking Page
1. **File**: `apps/web/src/routes/dashboard/infrastructure/networking.tsx`
   - Change line 13: Don't default to `[]` when `domains === undefined`
   - Pass `undefined` to `DomainsTable` when `domains === undefined`
   - Only filter when `domains` is loaded

### Phase 3: Fix Backups Page Tables
1. **File**: `apps/web/src/components/operations/backup-schedules-table.tsx`
   - Remove default parameter `data = []` from function signature (line 237)
   - Change `data: BackupSchedule[] | undefined` to not have default
   - Update `useReactTable` to use `data || []` (line 249)
   - Remove empty state card (lines 384-389)
   - Verify `TableSkeleton` is used (should already be there, line 327-382)

2. **File**: `apps/web/src/components/operations/backup-integrations-table.tsx`
   - Remove default parameter `data = []` from function signature (line 47)
   - Change `data: BackupIntegration[] | undefined` to not have default
   - Update `useReactTable` to use `data || []` (line 102)
   - Remove empty state card (lines 161-166)
   - Verify `TableSkeleton` is used (should already be there, line 112-158)

### Phase 4: Verify Consistency
1. Check all table components use `TableSkeleton` consistently
2. Verify no other tables have default `data = []` parameters
3. Test loading states on all pages

## Testing Checklist

- [ ] Code page shows skeleton when loading repositories
- [ ] Code page shows table when repositories are loaded
- [ ] Code page shows "No repositories found" only when data is loaded but empty
- [ ] Networking page shows skeleton when loading domains
- [ ] Networking page shows table when domains are loaded
- [ ] Networking page shows "No domains found" only when data is loaded but empty
- [ ] Backups page shows skeleton for schedules when loading
- [ ] Backups page shows skeleton for integrations when loading
- [ ] Backups page shows tables when data is loaded
- [ ] Backups page shows "No X found" only when data is loaded but empty
- [ ] No layout shift occurs during loading transitions
- [ ] All pages match Compute/Data/Storage page behavior

## Files to Modify

1. `apps/web/src/routes/dashboard/projects/code.tsx` - Fix data passing
2. `apps/web/src/routes/dashboard/infrastructure/networking.tsx` - Fix data passing
3. `apps/web/src/components/operations/backup-schedules-table.tsx` - Remove default, remove empty card
4. `apps/web/src/components/operations/backup-integrations-table.tsx` - Remove default, remove empty card

## Expected Outcome

All pages will show consistent skeleton loading states matching Compute, Data, and Storage pages. No empty state messages will appear during loading - only after data is confirmed to be empty.

---

## Implementation Review

**Date**: November 14, 2025  
**Status**: ✅ Complete (with minor fix applied)

### Review Summary

**Overall Assessment**: ✅ **APPROVED** - Implementation follows plan correctly with one minor column count fix applied.

### Phase 1: Code Page ✅ Complete
- ✅ Page component correctly passes `undefined` when loading
- ✅ Table component correctly checks for `undefined` and shows skeleton
- ✅ Column count correct (10 data columns + 1 checkbox = 11 total)

### Phase 2: Networking Page ✅ Complete
- ✅ Page component correctly passes `undefined` when loading
- ✅ Table component already had correct `undefined` check
- ✅ No changes needed to table component

### Phase 3: Backups Page ✅ Complete (after fix)
- ✅ **BackupSchedulesTable**: 
  - Removed default parameter
  - Uses `TableSkeleton` correctly
  - Removed empty state card
  - **Fixed**: Column count corrected from 8 to 7 (7 data columns + 1 checkbox = 8 total)
- ✅ **BackupIntegrationsTable**:
  - Removed default parameter
  - Uses `TableSkeleton` correctly
  - Removed empty state card
  - Column count correct (5 columns, no checkbox)

### Files Modified

1. ✅ `apps/web/src/routes/dashboard/projects/code.tsx` - Fixed data passing
2. ✅ `apps/web/src/routes/dashboard/infrastructure/networking.tsx` - Fixed data passing
3. ✅ `apps/web/src/components/projects/RepositoriesTable.tsx` - Added skeleton support
4. ✅ `apps/web/src/components/operations/backup-schedules-table.tsx` - Removed default, removed empty card, fixed column count
5. ✅ `apps/web/src/components/operations/backup-integrations-table.tsx` - Removed default, removed empty card

### Final Status

All pages now show consistent skeleton loading states matching Compute, Data, and Storage pages. Empty state messages only appear after data is confirmed to be empty, not during loading.
