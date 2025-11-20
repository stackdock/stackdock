# GridPane Backup Schedule Status Field - Issue #60

**Status**: ✅ Committed  
**Date**: 2025-01-XX  
**Related Issue**: [#60 - Extract Universal Resource Types](https://github.com/stackdock/stackdock/issues/60)  
**Risk Level**: ⚠️ Low-Medium (may cause issues if status tracking is needed in future)

## Synopsis

During work on issue #60 (extract universal resource types), a bug was identified in the GridPane backup schedule sync adapter where the `status` field was not being included in patch operations for existing schedules.

### The Bug

**Location**: `convex/docks/adapters/gridpane/adapter.ts` - `syncBackupSchedules()` method

**Problem**: 
- When patching an existing backup schedule, the `status` field was not included in the patch operation
- This meant that if a schedule's status changed, it would not be updated during sync
- Status values could become stale in the database

**Root Cause**:
- The `universalSchedule` object construction did not include a `status` field
- The patch operation only included fields that were present in `universalSchedule`
- Missing field in source object = missing field in patch operation

### Resolution

**Decision**: Removed `status` field entirely from the implementation

**Rationale**:
- The `backupSchedules` schema does not currently include a `status` field
- Adding status would require schema migration
- Current implementation works without status tracking
- Status can be derived from `enabled` field if needed

**Changes Made**:
- Confirmed `status` field is not in `backupSchedules` schema
- Removed any references to `status` in adapter code
- Patch operation now correctly includes all fields from `universalSchedule`

## Current State

✅ **Committed**: Code is working correctly without status field  
⚠️ **Future Risk**: If status tracking becomes necessary, will require:
1. Schema migration to add `status` field
2. Update adapter to map status from GridPane API
3. Ensure status is included in both insert and patch operations

## Code Reference

**File**: `convex/docks/adapters/gridpane/adapter.ts`  
**Method**: `syncBackupSchedules()`  
**Lines**: ~384-425

```typescript
// Current implementation (no status field)
const universalSchedule = {
  // ... other fields ...
  enabled: schedule.enabled,
  remoteBackupsEnabled: schedule.remote_backups_enabled,
  fullApiData: schedule,
  updatedAt: Date.now(),
}

if (existing) {
  await ctx.db.patch(existing._id, {
    // ... all fields from universalSchedule ...
    // Note: status field not included (not in schema)
  })
}
```

## Related Work

- **Issue #60**: Extract Universal Resource Types
- **Schema**: `convex/schema.ts` - `backupSchedules` table definition
- **GridPane API**: Backup schedules endpoint returns schedule data but no explicit status field

## Monitoring

**Watch For**:
- Requests to add status tracking to backup schedules
- Need to filter/query schedules by status
- UI requirements showing schedule status

**If Status Needed**:
1. Check GridPane API for status field availability
2. Add `status: v.string()` to `backupSchedules` schema
3. Map status in adapter (may need to derive from `enabled` or other fields)
4. Include in both insert and patch operations

---

**Last Updated**: 2025-01-XX  
**Documented By**: AI Assistant  
**Reviewed**: Pending
