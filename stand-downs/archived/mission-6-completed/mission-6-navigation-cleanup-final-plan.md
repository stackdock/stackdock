# Mission 6: Navigation Cleanup - Final Implementation Plan

**Status**: ✅ **APPROVED - Option A**  
**Priority**: High  
**Created**: November 12, 2025

---

## 🎯 Objective

Implement Option A navigation structure:
- Remove "General" group, rename to "Dashboard"
- Change "Dashboard" item to "Insights"
- Remove redundant parent items (Infrastructure, Operations, Settings)
- Achieve flat navigation structure

---

## 📐 Target Structure

```
Dashboard
├── Insights          → /dashboard
└── Projects          → /dashboard/projects

Infrastructure
├── Compute           → /dashboard/infrastructure/compute
├── Data              → /dashboard/infrastructure/data
└── Networking        → /dashboard/infrastructure/networking

Operations
├── Backups           → /dashboard/operations/backups
└── Workflows         → /dashboard/operations/workflows

Settings
├── Organization      → /dashboard/settings/organization
├── User              → /dashboard/settings/user
├── Theme             → /dashboard/settings/theme
└── Docks             → /dashboard/settings/docks
```

---

## 🔧 Implementation Steps

### Step 1: Update `sidebar-data.tsx`

**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

**Changes Required**:

#### 1.1 Update `useSidebarData()` hook (lines 54-157)

**Change "General" to "Dashboard"**:
```typescript
// BEFORE
{
  title: "General",
  items: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Projects",
      url: "/dashboard/projects",
      icon: FolderKanban,
    },
  ],
}

// AFTER
{
  title: "Dashboard",
  items: [
    {
      title: "Insights",  // Changed from "Dashboard"
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Projects",
      url: "/dashboard/projects",
      icon: FolderKanban,
    },
  ],
}
```

**Remove redundant Infrastructure parent**:
```typescript
// BEFORE
{
  title: "Infrastructure",
  items: [
    {
      title: "Infrastructure",  // ❌ REMOVE THIS
      icon: Server,
      items: [
        {
          title: "Compute",
          url: "/dashboard/infrastructure/compute",
          icon: Server,
        },
        {
          title: "Data",
          url: "/dashboard/infrastructure/data",
          icon: Database,
        },
        {
          title: "Networking",
          url: "/dashboard/infrastructure/networking",
          icon: Network,
        },
      ],
    },
  ],
}

// AFTER
{
  title: "Infrastructure",
  items: [
    {
      title: "Compute",
      url: "/dashboard/infrastructure/compute",
      icon: Server,
    },
    {
      title: "Data",
      url: "/dashboard/infrastructure/data",
      icon: Database,
    },
    {
      title: "Networking",
      url: "/dashboard/infrastructure/networking",
      icon: Network,
    },
  ],
}
```

**Remove redundant Operations parent**:
```typescript
// BEFORE
{
  title: "Operations",
  items: [
    {
      title: "Operations",  // ❌ REMOVE THIS
      icon: Network,
      items: [
        {
          title: "Backups",
          url: "/dashboard/operations/backups",
          icon: HardDrive,
        },
        {
          title: "Workflows",
          url: "/dashboard/operations/workflows",
          icon: Workflow,
        },
      ],
    },
  ],
}

// AFTER
{
  title: "Operations",
  items: [
    {
      title: "Backups",
      url: "/dashboard/operations/backups",
      icon: HardDrive,
    },
    {
      title: "Workflows",
      url: "/dashboard/operations/workflows",
      icon: Workflow,
    },
  ],
}
```

**Remove redundant Settings parent**:
```typescript
// BEFORE
{
  title: "Settings",
  items: [
    {
      title: "Settings",  // ❌ REMOVE THIS
      icon: Settings,
      items: [
        {
          title: "Organization",
          url: "/dashboard/settings/organization",
          icon: Building2,
        },
        {
          title: "User",
          url: "/dashboard/settings/user",
          icon: User,
        },
        {
          title: "Theme",
          url: "/dashboard/settings/theme",
          icon: Palette,
        },
        {
          title: "Docks",
          url: "/dashboard/settings/docks",
          icon: Plug,
        },
      ],
    },
  ],
}

// AFTER
{
  title: "Settings",
  items: [
    {
      title: "Organization",
      url: "/dashboard/settings/organization",
      icon: Building2,
    },
    {
      title: "User",
      url: "/dashboard/settings/user",
      icon: User,
    },
    {
      title: "Theme",
      url: "/dashboard/settings/theme",
      icon: Palette,
    },
    {
      title: "Docks",
      url: "/dashboard/settings/docks",
      icon: Plug,
    },
  ],
}
```

#### 1.2 Update `sidebarData` static export (lines 160-268)

**Apply same changes** to the static export to match the hook.

---

### Step 2: Verify Component Compatibility ✅

**File**: `apps/web/src/components/dashboard/NavGroup.tsx`

**Status**: ✅ **No changes needed**
- Component already supports flat structure (lines 35-50)
- Items without `items` property render directly as links
- Items with `items` property become collapsible (not needed anymore)

---

## ✅ Testing Checklist

After implementation:
- [ ] Dashboard group displays correctly
- [ ] "Insights" links to `/dashboard`
- [ ] "Projects" links to `/dashboard/projects`
- [ ] Infrastructure group has no redundant parent
- [ ] Compute, Data, Networking are direct items
- [ ] Operations group has no redundant parent
- [ ] Backups, Workflows are direct items
- [ ] Settings group has no redundant parent
- [ ] Organization, User, Theme, Docks are direct items
- [ ] No nested collapsibles visible
- [ ] Active state highlighting works
- [ ] Mobile navigation works
- [ ] Both hook and static export updated

---

## 📊 Expected Result

### Before
```
General
├── Dashboard
└── Projects

Infrastructure
└── Infrastructure ▼
    ├── Compute
    ├── Data
    └── Networking

Operations
└── Operations ▼
    ├── Backups
    └── Workflows

Settings
└── Settings ▼
    ├── Organization
    ├── User
    ├── Theme
    └── Docks
```

### After
```
Dashboard
├── Insights
└── Projects

Infrastructure
├── Compute
├── Data
└── Networking

Operations
├── Backups
└── Workflows

Settings
├── Organization
├── User
├── Theme
└── Docks
```

---

## 🚨 Critical Notes

1. **Update BOTH exports**: `useSidebarData()` hook AND `sidebarData` static export
2. **No component changes**: `NavGroup.tsx` already supports flat structure
3. **Icon unchanged**: Keep `LayoutDashboard` icon for "Insights"
4. **Routes unchanged**: All URLs stay the same

---

## 📚 References

- **Architecture Document**: `docs/architecture/NAVIGATION_ARCHITECTURE.md`
- **End Goal Structure**: See architecture document for complete scalable structure
- **Component**: `apps/web/src/components/dashboard/NavGroup.tsx` (no changes needed)

---

**Status**: Ready for frontend agent implementation
