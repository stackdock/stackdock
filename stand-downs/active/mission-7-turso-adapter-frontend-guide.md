# Mission 7: Turso Adapter Implementation - Frontend Agent Guide

**Date**: November 12, 2025  
**Mission**: Mission 7 - Read-Only Infrastructure MVP  
**Provider**: Turso (Database Provider)  
**Agent**: Frontend Agent  
**Priority**: High

---

## 🎯 Objective

Verify that Turso databases display correctly in the frontend. **No code changes expected** - the frontend should auto-support Turso via existing dynamic provider system.

---

## ✅ What Should Work Automatically

The frontend already supports dynamic providers through:
1. **Dynamic Provider Dropdown** - Fetches providers from backend (`listAvailableProviders` query)
2. **Provider Badges** - Displays provider name from `provider` field
3. **Universal Tables** - Databases table works for any provider
4. **Status Badges** - Maps status values to colors

**Turso should work automatically** once the Convex agent implements the adapter.

---

## 📋 Testing Tasks

### Task 1: Verify Turso Appears in Provider Dropdown

**File**: `apps/web/src/routes/dashboard/settings/docks.tsx`

**Steps:**
1. Navigate to Settings > Docks
2. Click "Add Dock" or "Connect Provider"
3. Check provider dropdown

**Expected Result:**
- ✅ "Turso" appears in the dropdown list
- ✅ Display name shows "Turso" (from `listAvailableProviders` query)

**If Not Working:**
- Check that Convex agent registered Turso in `convex/docks/registry.ts`
- Check that `listAvailableProviders` query includes Turso
- Verify Convex functions are deployed

---

### Task 2: Test Turso Dock Creation

**File**: `apps/web/src/routes/dashboard/settings/docks.tsx`

**Steps:**
1. Select "Turso" from provider dropdown
2. Enter Turso API token
3. Click "Connect" or "Save"
4. Verify dock is created

**Expected Result:**
- ✅ Dock created successfully
- ✅ API token encrypted and stored
- ✅ Dock appears in docks list
- ✅ Can trigger sync

**If Not Working:**
- Check that `validateCredentials` action works for Turso
- Check that dock creation mutation accepts "turso" as provider
- Verify API token format (should be Bearer token)

---

### Task 3: Verify Databases Table Displays Turso Data

**File**: `apps/web/src/routes/dashboard/infrastructure/data.tsx` (or wherever databases table is)

**Steps:**
1. Sync Turso dock (click sync button)
2. Navigate to Infrastructure > Data (or Databases table)
3. Check table displays Turso databases

**Expected Result:**
- ✅ Turso databases appear in table
- ✅ Provider badge shows "Turso"
- ✅ Database name displays correctly (from `name` field)
- ✅ Engine shows "turso" or "sqlite"
- ✅ Status badges display correctly

**Status Badge Colors to Verify:**
- `active` → Green badge
- `archived` → Gray/muted badge
- `sleeping` → Yellow/orange badge
- `blocked` → Red badge

**If Not Working:**
- Check that databases are syncing to Convex `databases` table
- Check that `listDatabases` query includes Turso databases
- Verify table columns display correct fields

---

### Task 4: Verify Status Badges Work Correctly

**File**: `apps/web/src/components/resources/databases-table.tsx` (or similar)

**Steps:**
1. Check status badges for Turso databases
2. Verify colors match status values

**Expected Status Values:**
- `active` - Should show green/active badge
- `archived` - Should show gray/archived badge
- `sleeping` - Should show yellow/pending badge
- `blocked` - Should show red/error badge

**Expected Result:**
- ✅ Status badges display correct colors
- ✅ Status text is readable
- ✅ Badges match other providers' status badges

**If Not Working:**
- Check status badge component handles all status values
- Verify status mapping in Convex adapter (should return standard statuses)
- Check if new status values need to be added to badge component

---

### Task 5: Verify Database Details Visible

**File**: `apps/web/src/routes/dashboard/infrastructure/data.tsx`

**Steps:**
1. Check database table columns
2. Verify all important fields are visible

**Expected Columns:**
- Name (from `name` field)
- Provider (badge showing "Turso")
- Engine (showing "turso" or "sqlite")
- Status (badge)
- Version (from `version` field, if column exists)
- Region (from `fullApiData.primaryRegion`, if column exists)

**Expected Result:**
- ✅ All important fields visible
- ✅ Data displays correctly
- ✅ No empty/null values where data exists

**If Not Working:**
- Check table column definitions
- Verify `fullApiData` is accessible (if needed for additional fields)
- Check if columns need to be added for database-specific fields

---

## 🐛 Troubleshooting

### Issue: Turso Not in Provider Dropdown

**Check:**
1. Convex `listAvailableProviders` query includes Turso
2. Convex functions are deployed
3. Frontend is fetching from correct query
4. No console errors

**Fix:**
- Verify Convex agent registered Turso in `registry.ts`
- Redeploy Convex functions
- Check browser console for errors

---

### Issue: Dock Creation Fails

**Check:**
1. API token format is correct (Bearer token)
2. `validateCredentials` action works for Turso
3. Dock creation mutation accepts "turso" provider
4. No validation errors

**Fix:**
- Verify API token is valid Turso token
- Check Convex logs for validation errors
- Verify `validateCredentials` implementation

---

### Issue: Databases Not Displaying

**Check:**
1. Databases synced to Convex `databases` table
2. `listDatabases` query includes Turso databases
3. Table filters not excluding Turso
4. No console errors

**Fix:**
- Trigger dock sync manually
- Check Convex dashboard for databases
- Verify query includes `provider: "turso"`
- Check table filters

---

### Issue: Status Badges Not Displaying

**Check:**
1. Status values are standard (`active`, `archived`, `sleeping`, `blocked`)
2. Badge component handles all status values
3. Status mapping in adapter is correct

**Fix:**
- Verify status values match expected values
- Add missing status values to badge component if needed
- Check Convex adapter status mapping

---

## ✅ Testing Checklist

- [ ] Turso appears in provider dropdown
- [ ] Can create Turso dock with API token
- [ ] API token encrypts correctly
- [ ] Dock syncs databases successfully
- [ ] Databases table displays Turso databases
- [ ] Provider badge shows "Turso"
- [ ] Status badges display correctly (active, archived, sleeping, blocked)
- [ ] Database name displays correctly
- [ ] Engine shows "turso" or "sqlite"
- [ ] Version displays (if column exists)
- [ ] Region displays (if column exists)
- [ ] No console errors
- [ ] No TypeScript errors

---

## 📝 Notes

- **No code changes expected** - Frontend should auto-support Turso
- **If changes needed** - Document what was changed and why
- **Status badges** - May need to add new status values if not already supported
- **Table columns** - May need to add columns for database-specific fields (version, region)

---

## 🔗 Reference Files

**Frontend Files:**
- `apps/web/src/routes/dashboard/settings/docks.tsx` - Dock creation form
- `apps/web/src/routes/dashboard/infrastructure/data.tsx` - Databases table
- `apps/web/src/components/resources/databases-table.tsx` - Database table component (if exists)

**Convex Queries:**
- `convex/docks/queries.ts` - `listAvailableProviders` query
- `convex/resources/queries.ts` - `listDatabases` query (if exists)

---

**Ready for testing**: Once Convex agent completes implementation.
