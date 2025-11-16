# Mission 6: Navigation UI Fix - Frontend Agent Guide

**Status**: 🔴 **URGENT - UI BROKEN**  
**Created**: November 12, 2025

---

## 🚨 Problem

**Current State** (BROKEN):
- All navigation items are flat (no collapsible dropdowns)
- Each top-level nav group title looks like an active tab
- Lost the collapsible dropdown UI that users liked

**Desired State**:
- Keep the old collapsible dropdown UI structure
- Fix the redundant naming issue (remove duplicate parent items)
- Top-level navs should be collapsible dropdowns, not flat tabs

---

## 📐 Correct Structure

### What User Wants

**OLD UI** (what they liked - collapsible dropdowns):
```
Dashboard (group label)
└── Dashboard ▼ (collapsible parent - click to expand/collapse)
    ├── Insights
    └── Projects

Infrastructure (group label)
└── Infrastructure ▼ (collapsible parent - click to expand/collapse)
    ├── Compute
    ├── Data
    └── Networking

Operations (group label)
└── Operations ▼ (collapsible parent - click to expand/collapse)
    ├── Backups
    └── Workflows

Settings (group label)
└── Settings ▼ (collapsible parent - click to expand/collapse)
    ├── Organization
    ├── User
    ├── Theme
    └── Docks
```

**ISSUE**: The parent items have the same name as the group (redundant)

**SOLUTION**: Keep collapsible structure, but use a generic parent or remove redundancy differently

---

## 🔧 Fix Required

### Option 1: Keep Collapsible Structure, Use Generic Parent Names

**Structure**:
```typescript
{
  title: "Infrastructure",  // Group label
  items: [
    {
      title: "Infrastructure",  // ✅ KEEP THIS - but it's collapsible parent
      icon: Server,  // Or use a different icon
      items: [  // ✅ KEEP THIS - makes it collapsible
        { title: "Compute", url: "/dashboard/infrastructure/compute", icon: Server },
        { title: "Data", url: "/dashboard/infrastructure/data", icon: Database },
        { title: "Networking", url: "/dashboard/infrastructure/networking", icon: Network },
      ],
    },
  ],
}
```

**Visual Result**:
```
Infrastructure (group label - not clickable)
└── Infrastructure ▼ (collapsible parent - click to expand)
    ├── Compute
    ├── Data
    └── Networking
```

**Problem**: Still redundant naming, but UI works correctly

---

### Option 2: Use Group Title as Collapsible Trigger (Better UX)

**Structure**: Make the group label itself collapsible (if component supports it)

**If not supported**: Keep Option 1 but understand the redundancy is acceptable for UX

---

## 🎯 What We Need

### Current Broken Code

**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

**Current** (lines 77-96):
```typescript
{
  title: "Infrastructure",
  items: [
    {
      title: "Compute",  // ❌ FLAT - no collapsible parent
      url: "/dashboard/infrastructure/compute",
      icon: Server,
    },
    {
      title: "Data",  // ❌ FLAT - no collapsible parent
      url: "/dashboard/infrastructure/data",
      icon: Database,
    },
    {
      title: "Networking",  // ❌ FLAT - no collapsible parent
      url: "/dashboard/infrastructure/networking",
      icon: Network,
    },
  ],
}
```

**This makes all items appear as active tabs** - NOT what user wants!

---

### Fixed Code (Restore Collapsible Structure)

**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

**Fixed**:
```typescript
{
  title: "Infrastructure",
  items: [
    {
      title: "Infrastructure",  // ✅ RESTORE - collapsible parent
      icon: Server,  // Or Boxes/Layers icon
      items: [  // ✅ RESTORE - makes it collapsible
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
```

**Visual Result**:
```
Infrastructure (group label)
└── Infrastructure ▼ (collapsible - click to expand/collapse)
    ├── Compute
    ├── Data
    └── Networking
```

---

## 📋 Complete Fixed Structure

### Dashboard Group
```typescript
{
  title: "Dashboard",
  items: [
    {
      title: "Dashboard",  // ✅ Collapsible parent
      icon: LayoutDashboard,
      items: [
        {
          title: "Insights",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Projects",
          url: "/dashboard/projects",
          icon: FolderKanban,
        },
      ],
    },
  ],
}
```

### Infrastructure Group
```typescript
{
  title: "Infrastructure",
  items: [
    {
      title: "Infrastructure",  // ✅ Collapsible parent
      icon: Server,  // Or Boxes/Layers
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
```

### Operations Group
```typescript
{
  title: "Operations",
  items: [
    {
      title: "Operations",  // ✅ Collapsible parent
      icon: Cog,  // Or Settings2 (NOT Network)
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
```

### Settings Group
```typescript
{
  title: "Settings",
  items: [
    {
      title: "Settings",  // ✅ Collapsible parent
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
```

---

## 🔍 Component Behavior

**File**: `apps/web/src/components/dashboard/NavGroup.tsx`

**How it works**:
- Items **WITHOUT** `items` property → Render as direct links (lines 35-50)
- Items **WITH** `items` property → Render as collapsible parents (lines 52-93)

**Current Issue**: We removed the `items` property, so everything became flat links

**Fix**: Restore the `items` property to make them collapsible again

---

## ✅ Summary

### What Went Wrong
1. We removed the collapsible parent items (`items` property)
2. This made all navigation items flat (no dropdowns)
3. Group labels now look like active tabs (bad UX)

### What to Fix
1. **Restore collapsible parent items** (add `items` property back)
2. **Keep the parent item names** (even if redundant with group name)
3. **Fix Operations icon** (use `Cog` or `Settings2`, not `Network`)
4. **Update both** `useSidebarData()` hook AND `sidebarData` static export

### Why Redundancy is OK
- The collapsible UI requires a parent item
- The parent item name can match the group (it's acceptable)
- Users understand the hierarchy (group label → collapsible parent → items)

---

## 🚨 Critical Notes

1. **Restore collapsible structure** - Users liked the dropdown UI
2. **Redundancy is acceptable** - Better than broken UI
3. **Fix Operations icon** - Use `Cog` or `Settings2`, not `Network`
4. **Update both exports** - Hook and static export must match

---

**Status**: Ready for frontend agent to fix UI
