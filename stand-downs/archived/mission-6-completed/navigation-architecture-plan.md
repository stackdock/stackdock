# Navigation Architecture Implementation Plan

**Status**: 📋 **PLANNED**  
**Approach**: Option A - Flat Navigation Structure  
**End Goal**: See `docs/architecture/NAVIGATION_ARCHITECTURE.md`

---

## 🎯 Objective

Implement Option A navigation structure:
- Flat sidebar navigation (no nested collapsibles)
- Detail pages accessed via table clicks (not in sidebar)
- Scalable for future additions (Monitoring, etc.)

---

## 📋 Current State

### Existing Navigation Structure
**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

**Current Groups**:
- ❌ "General" group (should be "Dashboard")
  - "Dashboard" item → `/dashboard` (should be "Insights")
  - "Projects" item → `/dashboard/projects`
- ❌ Infrastructure group (has redundant parent)
  - "Infrastructure" parent item (redundant)
    - "Compute" → `/dashboard/infrastructure/compute`
    - "Data" → `/dashboard/infrastructure/data`
    - "Networking" → `/dashboard/infrastructure/networking`
- ❌ Operations group (has redundant parent)
  - "Operations" parent item (redundant)
    - "Backups" → `/dashboard/operations/backups`
    - "Workflows" → `/dashboard/operations/workflows`
- ❌ Settings group (has redundant parent)
  - "Settings" parent item (redundant)
    - "Organization" → `/dashboard/settings/organization`
    - "User" → `/dashboard/settings/user`
    - "Theme" → `/dashboard/settings/theme`
    - "Docks" → `/dashboard/settings/docks`

### Existing Routes
- ✅ `/dashboard` - Main dashboard
- ✅ `/dashboard/projects` - Projects list
- ✅ `/dashboard/projects/$projectId` - Project detail (with sub-routes)
- ✅ `/dashboard/infrastructure/compute` - Servers + Web Services tables
- ✅ `/dashboard/infrastructure/data` - Databases table
- ✅ `/dashboard/infrastructure/networking` - Domains table
- ✅ `/dashboard/operations/backups` - Backup schedules + integrations
- ✅ `/dashboard/operations/workflows` - Workflows table
- ✅ `/dashboard/settings/*` - Settings pages

---

## 🔄 Changes Needed

### 1. Update Navigation Component

**File**: `apps/web/src/components/layout/NavMenu.tsx` (or wherever navigation is defined)

**Changes**:
- Ensure flat structure (no nested collapsibles)
- Remove any detail page links from sidebar
- Add Dashboard group with Insights and Projects
- Verify all groups follow flat pattern

### 2. Add Detail Page Routes (Future)

**Routes to create**:
- `/dashboard/infrastructure/servers/$serverId` - Server detail
- `/dashboard/infrastructure/web-services/$webServiceId` - Web service detail
- `/dashboard/infrastructure/databases/$databaseId` - Database detail
- `/dashboard/infrastructure/domains/$domainId` - Domain detail

**Pattern**: Follow Projects detail page pattern with sub-routes

### 3. Update Table Components

**Files**: 
- `apps/web/src/components/resources/servers-table.tsx`
- `apps/web/src/components/resources/web-services-table.tsx`
- `apps/web/src/components/resources/databases-table.tsx`
- `apps/web/src/components/resources/domains-table.tsx`

**Changes**:
- Add row click handlers
- Navigate to detail pages on row click
- Add breadcrumb navigation on detail pages

---

## 📐 Implementation Steps

### Step 1: Update Navigation Data Structure ✅

**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

**Current Issues**:
- ❌ "General" group exists (should be "Dashboard")
- ❌ Redundant parent items in Infrastructure, Operations, Settings
- ❌ "Dashboard" item instead of "Insights"

**Required Changes**:
1. Change "General" group to "Dashboard"
2. Change "Dashboard" item to "Insights" (links to `/dashboard`)
3. Remove redundant parent items from Infrastructure, Operations, Settings
4. Update both `useSidebarData()` hook AND `sidebarData` static export

**Status**: Ready for implementation

---

### Step 2: Verify NavGroup Component ✅

**File**: `apps/web/src/components/dashboard/NavGroup.tsx`

**Action**: Verify component supports flat structure
- ✅ Component already supports items without `items` property (lines 35-50)
- ✅ No changes needed - component is compatible

**Status**: ✅ Verified - No changes needed

---

### Step 3: Document Current vs. Target State

**Action**: Create comparison document

**Current**:
- List current navigation structure
- List current routes

**Target**:
- List target navigation structure (from architecture doc)
- List target routes

**Gap Analysis**:
- Identify differences
- Plan migration path

**Status**: Ready to create

---

### Step 4: Add Detail Page Routes (Future)

**Action**: Create detail page routes following Projects pattern

**Pattern**:
```
/dashboard/infrastructure/servers/$serverId/overview
/dashboard/infrastructure/servers/$serverId/metrics
/dashboard/infrastructure/servers/$serverId/logs
/dashboard/infrastructure/servers/$serverId/settings
```

**Status**: Future work

---

### Step 5: Update Table Components (Future)

**Action**: Add row click handlers to navigate to detail pages

**Pattern**:
```typescript
const handleRowClick = (resource: Resource) => {
  router.navigate({
    to: `/dashboard/infrastructure/${resource.type}/${resource.id}/overview`,
  })
}
```

**Status**: Future work

---

## ⚠️ Decision Points

### Decision 1: Dashboard Group Structure

**Question**: Should "Dashboard" be the group name, or should we use "Overview"?

**Decision**: Use "Dashboard" as group name
- Clear and familiar
- Matches route structure
- Consistent with common patterns

---

### Decision 2: Insights vs. Overview

**Question**: Should the main dashboard be called "Insights" or "Overview"?

**Decision**: Use "Insights"
- More descriptive
- Implies analytics/stats
- Differentiates from Projects

---

### Decision 3: Compute Combined vs. Split

**Question**: Keep servers + web services together, or split?

**Decision**: Keep combined for now
- Current implementation works
- Split only if needed (50+ items, different permissions, user feedback)

---

## 🚨 Critical Rules

1. **Never add detail pages to sidebar** - They're accessed via table clicks
2. **Keep flat structure** - No nested collapsibles
3. **Follow Projects pattern** - List in nav, detail via click
4. **Consistent detail routes** - Use same sub-route pattern

---

## 📊 Success Criteria

- [ ] Navigation follows flat structure (no nested items)
- [ ] Dashboard group has Insights and Projects
- [ ] No detail pages in sidebar
- [ ] Detail pages accessible via table clicks
- [ ] Structure scales for Monitoring addition
- [ ] Consistent with Projects pattern

---

## 📚 References

- **Architecture Document**: `docs/architecture/NAVIGATION_ARCHITECTURE.md`
- **End Goal Structure**: See architecture document for complete route structure
- **Projects Pattern**: `/dashboard/projects/$projectId` with sub-routes

---

**Status**: Ready for implementation  
**Next Step**: Verify current navigation structure matches Option A
