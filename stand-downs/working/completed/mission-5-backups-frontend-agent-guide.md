# Mission 5: Backups Frontend - What You Need to Know

## ✅ What Convex Agent Already Fixed

The Convex agent has completed the database-backed approach:

1. **✅ Database Tables Created**
   - `backupSchedules` table
   - `backupIntegrations` table

2. **✅ Queries Fixed**
   - `getBackupSchedules()` - Reads from `backupSchedules` table
   - `getBackupIntegrations()` - Reads from `backupIntegrations` table
   - Both queries support optional `dockId` filter
   - Both queries automatically filter by user's organization

3. **✅ Sync Logic Implemented**
   - Backup data syncs during dock sync (like servers/sites/domains)
   - GridPane adapter syncs schedules and integrations to database

4. **✅ Frontend Already Updated**
   - `backups.tsx` already uses `useQuery` (not `useAction`)
   - Automatic loading states (`undefined = loading`)

---

## ✅ What Frontend Agent Already Fixed

### Issue 1: Field Name Mismatch ✅ COMPLETED

**All field names updated to camelCase to match database schema:**

**BackupSchedulesTable:**
- ✅ `site_url` → `siteUrl`
- ✅ `day_of_week` → `dayOfWeek`
- ✅ `integration_id` → `serviceId`
- ✅ `remote_backups_enabled` → `remoteBackupsEnabled`
- ✅ Added `serviceName` field

**BackupIntegrationsTable:**
- ✅ `id` → `integrationId`
- ✅ `integrated_service` → `integratedService`
- ✅ `integration_name` → `integrationName`

**All column `accessorKey` values updated to match camelCase field names.**

---

### Issue 2: Loading States ✅ COMPLETED

**Skeleton loaders added to both tables:**

Both tables now show skeleton table rows when `data === undefined`:
- ✅ Prevents layout shift
- ✅ Shows expected table structure while loading
- ✅ Uses shadcn `Skeleton` component
- ✅ Matches patterns used in other resource tables

**Loading state handling:**
- ✅ `undefined` → Shows skeleton loader (table structure preserved)
- ✅ `[]` → Shows empty state message
- ✅ `[...]` → Shows data

---

### Issue 3: Provider Badge Already Added ✅

Both tables already have Provider column with `ProviderBadge` - this is correct!

---

### Issue 4: Empty State Handling ✅ COMPLETED

**Empty states properly handled:**
- ✅ Skeleton loader shown when `data === undefined` (separate check)
- ✅ Empty state message shown when `data.length === 0`
- ✅ Proper styling with border and card background

---

## ✅ Frontend Agent Checklist - COMPLETED

### BackupSchedulesTable Component
- [x] ✅ Update `BackupSchedule` interface to use camelCase field names:
  - ✅ `site_url` → `siteUrl`
  - ✅ `day_of_week` → `dayOfWeek`
  - ✅ `integration_id` → `serviceId`
  - ✅ `remote_backups_enabled` → `remoteBackupsEnabled`
  - ✅ Added `serviceName` field
- [x] ✅ Update column `accessorKey` values to match camelCase
- [x] ✅ Verify loading state handles `undefined` correctly (skeleton loader)
- [x] ✅ Verify empty state shows proper message
- [ ] ⏳ Test with real data from database (pending user testing)

### BackupIntegrationsTable Component
- [x] ✅ Update `BackupIntegration` interface to use camelCase:
  - ✅ `id` → `integrationId`
  - ✅ `integrated_service` → `integratedService`
  - ✅ `integration_name` → `integrationName`
- [x] ✅ Update column `accessorKey` values to match camelCase
- [x] ✅ Verify loading state handles `undefined` correctly (skeleton loader)
- [x] ✅ Verify empty state shows proper message
- [ ] ⏳ Test with real data from database (pending user testing)

### Backups Page Component
- [x] ✅ Verify queries are called correctly (no args needed - gets all org data)
- [x] ✅ Loading handled by table components (skeleton loaders)
- [x] ✅ Empty state handled by table components
- [ ] ⏳ Test with multiple GridPane docks (pending user testing)

---

## 🧪 Testing Steps

1. **Sync a GridPane dock** (if not already synced)
   - Go to Settings > Docks
   - Click "Sync" on GridPane dock
   - Wait for sync to complete

2. **Check Backups Page**
   - Navigate to Operations > Backups
   - Should see schedules and integrations
   - Should show provider badges
   - Should show correct field values

3. **Verify Loading States**
   - Refresh page
   - Should see loading state briefly
   - Then data appears

4. **Verify Empty States**
   - If no GridPane dock: Should show "No backup-enabled docks configured"
   - If dock synced but no backups: Should show "No backup schedules found"

---

## 📝 Database Schema Reference

### backupSchedules Table Fields
```typescript
{
  _id: Id<"backupSchedules">
  orgId: Id<"organizations">
  dockId: Id<"docks">
  provider: string
  providerResourceId: string
  siteId: number              // GridPane site ID
  siteUrl: string             // ✅ Use this (not site_url)
  scheduleId: number           // GridPane schedule ID
  type: "local" | "remote"
  frequency: string            // "daily", "weekly", "hourly"
  hour: string
  minute: string
  time: string                 // Formatted "HH:mm"
  dayOfWeek?: number           // ✅ Use this (not day_of_week)
  serviceId?: number           // ✅ Use this (not integration_id)
  serviceName?: string         // ✅ Use this
  enabled: boolean
  remoteBackupsEnabled: boolean // ✅ Use this (not remote_backups_enabled)
  fullApiData: any
  updatedAt?: number
}
```

### backupIntegrations Table Fields
```typescript
{
  _id: Id<"backupIntegrations">
  orgId: Id<"organizations">
  dockId: Id<"docks">
  provider: string
  providerResourceId: string
  integrationId: number        // ✅ Use this (not id)
  integratedService: string    // ✅ Use this (not integrated_service)
  integrationName: string      // ✅ Use this (not integration_name)
  region?: string
  fullApiData: any
  updatedAt?: number
}
```

---

## 🎯 Summary

**What's Already Done ✅**:
- Database tables created
- Queries read from database
- Frontend uses `useQuery`
- Provider badges added
- Sync logic implemented
- **✅ Field names updated to camelCase**
- **✅ Column accessors updated**
- **✅ Skeleton loaders added**

**What Frontend Agent Fixed ✅**:
1. ✅ Updated field names in interfaces (snake_case → camelCase)
2. ✅ Updated column accessors to match database fields
3. ✅ Verified loading/empty states work correctly (skeleton loaders)
4. ⏳ Ready for testing with real synced data

**Status**: ✅ **COMPLETE - TESTED** - Working, scalable global table structure

---

## Testing Results

✅ **Tested and Working**:
- Backup system functional
- Correct folder path (`Operations > Backups`)
- Scalable as global table
- May need UI improvements later but functional for now

**Priority**: High  
**Status**: Complete and tested
