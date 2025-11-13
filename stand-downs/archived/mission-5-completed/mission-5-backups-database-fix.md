# Mission 5: Fix Backups to Use Database (Not Actions)

## Problem

**Current State (WRONG)**:
- Queries exist but return `null` (just authorization checks)
- Frontend uses `useAction` to call actions directly
- No automatic loading states (`undefined = loading`)
- No database storage - fetches on every page load
- Manual loading state management

**Should Be (CORRECT)**:
- Backup data stored in `backupSchedules` and `backupIntegrations` tables
- Sync backups during dock sync (like servers/sites/domains)
- Queries read from database
- Frontend uses `useQuery` - gets automatic loading states
- Real-time updates automatically

## Root Cause

The plan included both actions AND queries, but:
1. Queries were implemented as placeholders (return `null`)
2. Frontend was told to "call actions directly"
3. No database tables were created
4. No sync logic was added to adapter

## Fix Plan

### Step 1: ✅ Add Database Tables (DONE)
- `backupSchedules` table added to schema
- `backupIntegrations` table added to schema

### Step 2: Add Sync Methods to Adapter Interface
Add optional sync methods to `DockAdapter`:
- `syncBackupSchedules?()`
- `syncBackupIntegrations?()`

### Step 3: Implement GridPane Backup Sync
Add sync methods to `gridpaneAdapter`:
- `syncBackupSchedules()` - Syncs schedules to `backupSchedules` table
- `syncBackupIntegrations()` - Syncs integrations to `backupIntegrations` table

### Step 4: Update Dock Sync Flow
Modify `syncDockResources` action/mutation to:
- Fetch backup schedules/integrations
- Call adapter sync methods
- Store in database

### Step 5: Fix Queries
Update `getBackupSchedules` and `getBackupIntegrations` queries to:
- Read from database (not return null)
- Filter by dockId/orgId
- Return actual data

### Step 6: Update Frontend
Change `backups.tsx` to:
- Use `useQuery` instead of `useAction`
- Remove manual loading state
- Get automatic loading states (`undefined = loading`)

## Implementation Order

1. ✅ Add tables to schema (DONE)
2. Add sync methods to adapter interface
3. Implement GridPane sync methods
4. Update sync flow to include backups
5. Fix queries to read from database
6. Update frontend to use queries

## Files to Modify

- `convex/docks/_types.ts` - Add sync methods to interface
- `convex/docks/adapters/gridpane/adapter.ts` - Implement sync methods
- `convex/docks/actions.ts` - Add backup fetching to sync flow
- `convex/docks/mutations.ts` - Call backup sync methods
- `convex/docks/queries.ts` - Read from database
- `apps/web/src/routes/dashboard/operations/backups.tsx` - Use queries

---

**Status**: ✅ COMPLETE - TESTED - Working, scalable global table structure

## Implementation Complete

✅ **Backend complete:**
- Database tables created (`backupSchedules`, `backupIntegrations`)
- Sync methods implemented in GridPane adapter
- Queries read from database
- RBAC filtering by organization

✅ **Frontend complete:**
- Field names updated to camelCase (matches database schema)
- Column accessors updated
- Skeleton loaders added for loading states
- Empty states properly handled
- Uses `useQuery` for automatic loading states

## Testing Results

✅ **Tested and Working**:
- Backup system functional
- Correct folder path (`Operations > Backups`)
- Scalable as global table
- May need UI improvements later but functional for now
