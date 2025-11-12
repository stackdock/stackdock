# Mission 6: Top-Level Navigation Cleanup

**Status**: 🔄 In Progress  
**Priority**: High  
**Created**: January 12, 2025

---

## Objective

Clean up and optimize the top-level navigation structure to ensure logical grouping, clear hierarchy, and intuitive user experience before adding more provider adapters.

---

## Current Navigation Structure

### Current Sidebar Structure (`apps/web/src/components/dashboard/sidebar-data.tsx`)

```
General
├── Dashboard (/dashboard)
└── Projects (/dashboard/projects)

Infrastructure
└── Infrastructure (parent item - redundant?)
    ├── Compute (/dashboard/infrastructure/compute)
    ├── Data (/dashboard/infrastructure/data)
    └── Networking (/dashboard/infrastructure/networking)

Operations
└── Operations (parent item - redundant?)
    ├── Backups (/dashboard/operations/backups)
    └── Workflows (/dashboard/operations/workflows)

Settings
└── Settings (parent item - redundant?)
    ├── Organization (/dashboard/settings/organization)
    ├── User (/dashboard/settings/user)
    ├── Theme (/dashboard/settings/theme)
    └── Docks (/dashboard/settings/docks)
```

### Current Routes Structure

```
/dashboard/
├── index.tsx (Dashboard overview)
├── projects/
│   ├── index.tsx
│   └── $projectId/
│       ├── overview.tsx
│       ├── resources.tsx
│       ├── activity.tsx
│       └── settings.tsx
├── infrastructure/
│   ├── compute.tsx (Servers)
│   ├── data.tsx (Databases)
│   └── networking.tsx (Domains)
├── operations/
│   ├── backups.tsx
│   └── workflows.tsx
├── provision/ (NOT IN NAVIGATION)
│   ├── index.tsx
│   ├── $provider.tsx
│   ├── $provider.$resourceType.tsx
│   └── $provider.$resourceType.$provisionId.tsx
└── settings/
    ├── organization.tsx
    ├── user.tsx
    ├── theme.tsx
    └── docks.tsx
```

---

## Issues Identified

### 1. Redundant Nesting
**Problem**: Each top-level group has a parent item with the same name
- "Infrastructure" group contains "Infrastructure" item
- "Operations" group contains "Operations" item  
- "Settings" group contains "Settings" item

**Impact**: 
- Confusing hierarchy
- Unnecessary nesting
- Wastes vertical space

**Solution**: Remove redundant parent items, make group title the parent

### 2. Icon Inconsistencies
**Problem**: 
- "Operations" uses `Network` icon (should be different)
- Some items use same icon as parent

**Impact**: 
- Visual confusion
- Hard to distinguish items

**Solution**: Use appropriate icons for each section

### 3. Missing Navigation Item
**Problem**: 
- `/dashboard/provision` route exists but not in navigation
- Users can't discover provisioning functionality

**Impact**: 
- Hidden functionality
- Poor discoverability

**Solution**: Add to navigation or remove route if not needed

### 4. Group Naming
**Problem**: 
- "General" is vague
- Could be clearer

**Solution**: Consider better naming or structure

### 5. Logical Grouping
**Problem**: 
- Need to ensure items are logically grouped
- Consider future additions (monitoring, alerts, etc.)

**Solution**: Review and optimize grouping

---

## Proposed Navigation Structure

### Recommended: Remove Redundant Parent Items

**Current Issue**: Each group has a redundant parent item with the same name as the group.

**Solution**: Remove parent items, make group title the visual parent. Items become direct children of the group.

```
General
├── Dashboard (/dashboard)
└── Projects (/dashboard/projects)

Infrastructure
├── Compute (/dashboard/infrastructure/compute) - Servers
├── Data (/dashboard/infrastructure/data) - Databases
└── Networking (/dashboard/infrastructure/networking) - Domains

Operations
├── Backups (/dashboard/operations/backups)
└── Workflows (/dashboard/operations/workflows)

Settings
├── Organization (/dashboard/settings/organization)
├── User (/dashboard/settings/user)
├── Theme (/dashboard/settings/theme)
└── Docks (/dashboard/settings/docks)
```

**Benefits**:
- Removes redundancy (no "Infrastructure" parent item inside "Infrastructure" group)
- Cleaner hierarchy
- More vertical space
- Easier to scan
- Still maintains logical grouping

**Note**: The `NavGroup` component supports this - items without a parent item will render directly under the group label. The collapsible functionality can be handled at the group level if needed.

---

## Implementation Plan

### Step 1: Analyze Current Sidebar Component
**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

**Tasks**:
- [ ] Review current structure
- [ ] Identify all navigation items
- [ ] Map icons to items
- [ ] Document current behavior

### Step 2: Design New Structure
**Decisions Needed**:
- [x] Structure: Remove redundant parent items (recommended approach)
- [ ] Decide on Provision route (add to nav or remove?)
- [ ] Choose appropriate icons (Operations should not use Network icon)
- [ ] Consider future additions (monitoring, alerts, etc.)
- [ ] Consider renaming "General" to something clearer (optional)

### Step 3: Update Sidebar Data
**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

**Changes**:
- [ ] Remove redundant parent items (Infrastructure, Operations, Settings parent items)
- [ ] Move child items directly under group (no nested parent)
- [ ] Update Operations icon from `Network` to `Cog` or `Settings2`
- [ ] Update Infrastructure icon if needed (currently `Server`, could be `Boxes` or `Layers`)
- [ ] Add Provision to navigation if needed, or document decision to exclude
- [ ] Ensure all routes are accessible
- [ ] Update both `useSidebarData()` hook and `sidebarData` static export

### Step 4: Update Sidebar Component (if needed)
**File**: `apps/web/src/components/dashboard/NavGroup.tsx`

**Analysis**: 
- Component already supports items without parent (lines 35-50)
- Items with `items` property become collapsible (lines 52-93)
- Items without `items` render directly (lines 36-49)

**Changes**:
- [ ] Verify component handles direct items correctly (should work as-is)
- [ ] Test that group labels display correctly
- [ ] Ensure proper indentation/hierarchy
- [ ] Test expanded/collapsed states (if groups become collapsible)
- [ ] May need to add group-level collapsible if desired

### Step 5: Verify Routes
**Tasks**:
- [ ] Ensure all navigation items have corresponding routes
- [ ] Remove unused routes or add missing navigation items
- [ ] Test navigation flow

### Step 6: Update Documentation
**Files**: 
- Navigation documentation
- User guides
- Route documentation

---

## Icon Recommendations

### Current Icons
- Dashboard: `LayoutDashboard` ✅
- Projects: `FolderKanban` ✅
- Infrastructure: `Server` (parent) - could be `Server` or `Boxes`
- Compute: `Server` ✅
- Data: `Database` ✅
- Networking: `Network` ✅
- Operations: `Network` (parent) - **SHOULD CHANGE** to `Cog` or `Settings2`
- Backups: `HardDrive` ✅
- Workflows: `Workflow` ✅
- Settings: `Settings` ✅
- Organization: `Building2` ✅
- User: `User` ✅
- Theme: `Palette` ✅
- Docks: `Plug` ✅

### Recommended Changes
- Operations (parent): `Cog` or `Settings2` or `Wrench` (not `Network`)
- Infrastructure (parent): `Boxes` or `Server` or `Layers` (to distinguish from Compute)

---

## Detailed Implementation Steps

### Step 1: Remove Redundant Parent Items

**Current Structure** (redundant):
```typescript
{
  title: "Infrastructure",
  items: [
    {
      title: "Infrastructure", // ❌ REDUNDANT - same as group title
      icon: Server,
      items: [
        { title: "Compute", url: "/dashboard/infrastructure/compute", icon: Server },
        { title: "Data", url: "/dashboard/infrastructure/data", icon: Database },
        { title: "Networking", url: "/dashboard/infrastructure/networking", icon: Network },
      ],
    },
  ],
}
```

**New Structure** (clean):
```typescript
{
  title: "Infrastructure",
  items: [
    // ✅ Direct items, no redundant parent
    { title: "Compute", url: "/dashboard/infrastructure/compute", icon: Server },
    { title: "Data", url: "/dashboard/infrastructure/data", icon: Database },
    { title: "Networking", url: "/dashboard/infrastructure/networking", icon: Network },
  ],
}
```

### Step 2: Fix Icon Assignments

**Current Issues**:
- Operations parent uses `Network` icon (confusing, should be different)
- Infrastructure parent uses `Server` icon (same as Compute child)

**Recommended Changes**:
```typescript
// Import new icons if needed
import { Cog, Settings2, Boxes, Layers } from "lucide-react"

// Operations group - use Cog or Settings2
// Infrastructure group - could use Boxes or Layers (or keep Server)
```

### Step 3: Handle Provision Route

**Decision Needed**: 
- Option A: Add to navigation (where? New group? Under Operations?)
- Option B: Remove route if not needed
- Option C: Keep route but don't add to navigation (hidden feature)

**Recommendation**: Add under "General" or create new "Provision" group if it's a core feature.

## Questions to Answer

1. **Provision Route**: Should `/dashboard/provision` be in navigation? If yes, where?
   - [ ] Add to "General" group
   - [ ] Create new "Provision" group
   - [ ] Add to "Operations" group
   - [ ] Keep hidden (not in navigation)

2. **Group Collapsibility**: Should groups be collapsible?
   - [ ] Yes - add collapsible functionality to groups
   - [ ] No - keep groups always expanded

3. **Future Additions**: Where will monitoring/alerts/logs go?
   - [ ] New "Monitoring" group
   - [ ] Under "Operations"
   - [ ] Under "Infrastructure"
   - [ ] Other: ___________

4. **Icon Consistency**: Standardize icon usage?
   - [ ] Yes - use distinct icons for each group
   - [ ] No - current icons are fine (except Operations)

---

## Files to Modify

### Primary
- `apps/web/src/components/dashboard/sidebar-data.tsx` - Navigation structure
- `apps/web/src/components/dashboard/NavGroup.tsx` - Rendering logic (if needed)

### Secondary (if routes change)
- Route files in `apps/web/src/routes/dashboard/`
- Route tree generation

---

## Testing Checklist

- [ ] All navigation items link to correct routes
- [ ] Icons display correctly
- [ ] Navigation hierarchy is clear
- [ ] No broken links
- [ ] Mobile navigation works (if applicable)
- [ ] Active state highlighting works
- [ ] Expanded/collapsed states work (if applicable)

---

## Priority

**HIGH** - User priority before adding more adapters. Navigation is foundational UX.

---

## Notes

- Keep it simple and intuitive
- Consider scalability (more items will be added)
- Ensure consistency with design system
- Test with real users if possible
