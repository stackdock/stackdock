# Mission 6: Navigation Cleanup - Implementation Guide

**Status**: Ready for Implementation  
**Priority**: High  
**Created**: January 12, 2025

---

## Quick Reference

**Main File**: `apps/web/src/components/dashboard/sidebar-data.tsx`  
**Component**: `apps/web/src/components/dashboard/NavGroup.tsx` (may not need changes)

---

## Current vs. Proposed Structure

### Current (Redundant)
```typescript
{
  title: "Infrastructure",
  items: [
    {
      title: "Infrastructure", // ❌ REDUNDANT
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

### Proposed (Clean)
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

---

## Code Changes

### File: `apps/web/src/components/dashboard/sidebar-data.tsx`

#### Change 1: Update Icon Imports
```typescript
import {
  LayoutDashboard,
  FolderKanban,
  Server,
  Database,
  HardDrive,
  Network,
  Workflow,
  Settings,
  Building2,
  User,
  Palette,
  Plug,
  Cog, // ✅ ADD - for Operations
  // Boxes, // Optional - for Infrastructure if desired
} from "lucide-react"
```

#### Change 2: Update Infrastructure Group
```typescript
// BEFORE
{
  title: "Infrastructure",
  items: [
    {
      title: "Infrastructure",
      icon: Server,
      items: [
        { title: "Compute", url: "/dashboard/infrastructure/compute", icon: Server },
        { title: "Data", url: "/dashboard/infrastructure/data", icon: Database },
        { title: "Networking", url: "/dashboard/infrastructure/networking", icon: Network },
      ],
    },
  ],
}

// AFTER
{
  title: "Infrastructure",
  items: [
    { title: "Compute", url: "/dashboard/infrastructure/compute", icon: Server },
    { title: "Data", url: "/dashboard/infrastructure/data", icon: Database },
    { title: "Networking", url: "/dashboard/infrastructure/networking", icon: Network },
  ],
}
```

#### Change 3: Update Operations Group
```typescript
// BEFORE
{
  title: "Operations",
  items: [
    {
      title: "Operations",
      icon: Network, // ❌ WRONG ICON
      items: [
        { title: "Backups", url: "/dashboard/operations/backups", icon: HardDrive },
        { title: "Workflows", url: "/dashboard/operations/workflows", icon: Workflow },
      ],
    },
  ],
}

// AFTER
{
  title: "Operations",
  items: [
    { title: "Backups", url: "/dashboard/operations/backups", icon: HardDrive },
    { title: "Workflows", url: "/dashboard/operations/workflows", icon: Workflow },
  ],
}
```

#### Change 4: Update Settings Group
```typescript
// BEFORE
{
  title: "Settings",
  items: [
    {
      title: "Settings",
      icon: Settings,
      items: [
        { title: "Organization", url: "/dashboard/settings/organization", icon: Building2 },
        { title: "User", url: "/dashboard/settings/user", icon: User },
        { title: "Theme", url: "/dashboard/settings/theme", icon: Palette },
        { title: "Docks", url: "/dashboard/settings/docks", icon: Plug },
      ],
    },
  ],
}

// AFTER
{
  title: "Settings",
  items: [
    { title: "Organization", url: "/dashboard/settings/organization", icon: Building2 },
    { title: "User", url: "/dashboard/settings/user", icon: User },
    { title: "Theme", url: "/dashboard/settings/theme", icon: Palette },
    { title: "Docks", url: "/dashboard/settings/docks", icon: Plug },
  ],
}
```

#### Change 5: Update Static Export
**Important**: Update BOTH `useSidebarData()` hook AND `sidebarData` static export to match.

---

## Testing Checklist

After changes:
- [ ] All navigation items link correctly
- [ ] Icons display correctly
- [ ] No redundant nesting visible
- [ ] Active state highlighting works
- [ ] Mobile navigation works
- [ ] All routes accessible
- [ ] Visual hierarchy is clear

---

## Expected Result

**Before**:
```
Infrastructure
└── Infrastructure ▼
    ├── Compute
    ├── Data
    └── Networking
```

**After**:
```
Infrastructure
├── Compute
├── Data
└── Networking
```

**Benefits**:
- Cleaner visual hierarchy
- Less vertical space used
- No confusion from redundant names
- Easier to scan

---

## Notes

- `NavGroup` component already supports this structure (items without parent)
- No component changes needed if structure is correct
- Both hook and static export must be updated
- Test thoroughly before committing
