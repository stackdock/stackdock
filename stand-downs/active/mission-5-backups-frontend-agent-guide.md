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

## 🔍 What Frontend Agent Needs to Check/Fix

### Issue 1: Field Name Mismatch

**Database Schema Fields** (from `convex/schema.ts`):
```typescript
backupSchedules: {
  siteUrl: string        // ✅ camelCase
  scheduleId: number     // ✅ camelCase
  dayOfWeek: number      // ✅ camelCase
  serviceId: number      // ✅ camelCase
  serviceName: string    // ✅ camelCase
  remoteBackupsEnabled: boolean  // ✅ camelCase
  // ... other fields
}

backupIntegrations: {
  integrationId: number      // ✅ camelCase
  integratedService: string  // ✅ camelCase
  integrationName: string    // ✅ camelCase
  // ... other fields
}
```

**Frontend Table Interfaces** (from `backup-schedules-table.tsx`):
```typescript
interface BackupSchedule {
  site_url: string      // ❌ snake_case (should be siteUrl)
  day_of_week: number   // ❌ snake_case (should be dayOfWeek)
  integration_id: number // ❌ snake_case (should be serviceId)
  remote_backups_enabled: boolean // ❌ snake_case (should be remoteBackupsEnabled)
}
```

**Frontend Table Interfaces** (from `backup-integrations-table.tsx`):
```typescript
interface BackupIntegration {
  id: number                    // ❌ Should be integrationId
  integrated_service: string   // ❌ snake_case (should be integratedService)
  integration_name: string      // ❌ snake_case (should be integrationName)
}
```

### Fix Required

Update the table component interfaces and column accessors to match the database schema (camelCase):

**For BackupSchedulesTable:**
- `site_url` → `siteUrl`
- `day_of_week` → `dayOfWeek`
- `integration_id` → `serviceId` (note: it's `serviceId` in DB, not `integration_id`)
- `remote_backups_enabled` → `remoteBackupsEnabled`

**For BackupIntegrationsTable:**
- `id` → `integrationId`
- `integrated_service` → `integratedService`
- `integration_name` → `integrationName`

---

### Issue 2: Loading States

The frontend already handles loading correctly:
```typescript
const schedules = useQuery(api["docks/queries"].getBackupSchedules)
// schedules === undefined → loading
// schedules === [] → no data
// schedules === [...] → has data
```

But the table components need to handle `undefined` properly:

**Current** (in `backup-schedules-table.tsx`):
```typescript
if (data === undefined) {
  return <div>Loading...</div>  // ✅ Good
}
```

**Make sure** both tables handle:
- `undefined` → Show loading skeleton/spinner
- `[]` → Show empty state
- `[...]` → Show data

---

### Issue 3: Provider Badge Already Added ✅

Both tables already have Provider column with `ProviderBadge` - this is correct!

---

### Issue 4: Empty State Handling

**Current** (in `backup-schedules-table.tsx`):
```typescript
if (data.length === 0) {
  return <div>No backup schedules found.</div>
}
```

**Should be**:
```typescript
if (!data || data.length === 0) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-muted-foreground">
        {data === undefined ? "Loading..." : "No backup schedules found."}
      </p>
    </div>
  )
}
```

---

## 📋 Frontend Agent Checklist

### BackupSchedulesTable Component
- [ ] Update `BackupSchedule` interface to use camelCase field names:
  - `site_url` → `siteUrl`
  - `day_of_week` → `dayOfWeek` (optional)
  - `integration_id` → `serviceId` (if used)
  - `remote_backups_enabled` → `remoteBackupsEnabled`
- [ ] Update column `accessorKey` values to match camelCase
- [ ] Verify loading state handles `undefined` correctly
- [ ] Verify empty state shows proper message
- [ ] Test with real data from database

### BackupIntegrationsTable Component
- [ ] Update `BackupIntegration` interface to use camelCase:
  - `id` → `integrationId`
  - `integrated_service` → `integratedService`
  - `integration_name` → `integrationName`
- [ ] Update column `accessorKey` values to match camelCase
- [ ] Verify loading state handles `undefined` correctly
- [ ] Verify empty state shows proper message
- [ ] Test with real data from database

### Backups Page Component
- [ ] Verify queries are called correctly (no args needed - gets all org data)
- [ ] Add loading skeleton/spinner if needed
- [ ] Verify empty state when no docks configured
- [ ] Test with multiple GridPane docks

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

**What Frontend Agent Needs to Fix**:
1. Update field names in interfaces (snake_case → camelCase)
2. Update column accessors to match database fields
3. Verify loading/empty states work correctly
4. Test with real synced data

**Key Point**: The database uses **camelCase** field names, but the frontend interfaces use **snake_case**. Update the frontend to match the database schema.

---

**Priority**: High  
**Estimated Time**: 30-45 minutes  
**Dependencies**: GridPane dock must be synced first (to populate database)
