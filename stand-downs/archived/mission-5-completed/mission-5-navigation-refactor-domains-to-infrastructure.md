# Navigation Refactor: Move Domains to Infrastructure

> **Location**: `stand-downs/active/mission-5-navigation-refactor-domains-to-infrastructure.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/active/mission-5-navigation-refactor-domains-to-infrastructure.md`  
> **Last Updated**: January 11, 2025  
> **Status**: Ready for Implementation  
> **Agent**: `frontend-tanstack`  
> **Estimated Time**: 30 minutes  
> **Priority**: MEDIUM

---

## Overview

Move domains from `Operations > Networking` to `Infrastructure > Networking` to better align with the mental model that domains are infrastructure resources (like servers, databases, web services).

**Current**: `/dashboard/operations/networking`  
**Target**: `/dashboard/infrastructure/networking`

---

## Rationale

### Why Move Domains to Infrastructure?

1. **Consistency**: Domains are infrastructure resources (DNS zones, domain registrations)
2. **Mental Model**: All resource types (servers, databases, web services, domains) belong together
3. **Clarity**: "Infrastructure > Networking" is clearer than "Operations > Networking"
4. **Future-Proofing**: As we add more networking resources (load balancers, CDNs), they'll fit naturally

### Current Structure Issues

- **Operations** suggests actions/workflows, not resource management
- Domains are passive resources (like servers), not operations
- Inconsistent: Servers/Databases in Infrastructure, but Domains in Operations

---

## Implementation Plan

### Step 1: Move Route File

**Action**: Move route file to infrastructure folder

**From**: `apps/web/src/routes/dashboard/operations/networking.tsx`  
**To**: `apps/web/src/routes/dashboard/infrastructure/networking.tsx`

**Changes Required**:
- Update route path: `/dashboard/operations/networking` → `/dashboard/infrastructure/networking`
- Update file location
- No component changes needed (same component, just different route)

---

### Step 2: Update Sidebar Navigation

**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

**Current Structure** (lines 98-123):
```typescript
{
  title: "Operations",
  items: [
    {
      title: "Operations",
      icon: Network,
      items: [
        {
          title: "Backups",
          url: "/dashboard/operations/backups",
          icon: HardDrive,
        },
        {
          title: "Networking",
          url: "/dashboard/operations/networking",  // ← REMOVE THIS
          icon: Network,
        },
        {
          title: "Workflows",
          url: "/dashboard/operations/workflows",
          icon: Workflow,
        },
      ],
    },
  ],
},
```

**New Structure**:
```typescript
{
  title: "Infrastructure",
  items: [
    {
      title: "Infrastructure",
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
          title: "Networking",  // ← ADD HERE
          url: "/dashboard/infrastructure/networking",
          icon: Network,
        },
      ],
    },
  ],
},
{
  title: "Operations",
  items: [
    {
      title: "Operations",
      icon: Network,
      items: [
        {
          title: "Backups",
          url: "/dashboard/operations/backups",
          icon: HardDrive,
        },
        // ← REMOVE Networking from here
        {
          title: "Workflows",
          url: "/dashboard/operations/workflows",
          icon: Workflow,
        },
      ],
    },
  ],
},
```

**Update Both**:
- `useSidebarData()` function (dynamic version)
- `sidebarData` constant (static version)

---

### Step 3: Delete Old Route File

**Action**: Delete the old route file after confirming new one works

**File to Delete**: `apps/web/src/routes/dashboard/operations/networking.tsx`

**Note**: TanStack Router will auto-generate route tree, so old route will be removed automatically when file is deleted.

---

### Step 4: Update Route Tree (Auto-Generated)

**File**: `apps/web/src/routeTree.gen.ts`

**Action**: None - TanStack Router will auto-regenerate this file when route file is moved.

**Verification**: Run `npm run dev` and check that route tree includes new path.

---

### Step 5: Update Any Hardcoded Links

**Search for**: References to `/dashboard/operations/networking`

**Files to Check**:
- Any redirects or navigation links
- Documentation files
- Test files

**Command**:
```bash
grep -r "/dashboard/operations/networking" apps/web/src
```

---

### Step 6: Verify DNS Records Display

**File**: `apps/web/src/components/resources/domains-table.tsx`

**Action**: Verify DNS records column still works (no changes needed)

**Verification**:
- DNS Records column exists (lines 182-233)
- Popover displays correctly
- Data source: `domains.fullApiData.dnsRecords`
- No changes required - component is route-agnostic

---

## Testing Checklist

### Navigation
- [ ] Sidebar shows "Networking" under Infrastructure section
- [ ] Clicking "Networking" navigates to `/dashboard/infrastructure/networking`
- [ ] Old route `/dashboard/operations/networking` returns 404 (or redirects)
- [ ] Navigation highlights correctly when on networking page

### Domains Table
- [ ] Domains table displays correctly
- [ ] DNS Records column shows record count
- [ ] DNS Records popover opens and displays records
- [ ] Record type badges display correctly
- [ ] Proxied badges display correctly (for Cloudflare)
- [ ] Filtering and sorting still work

### Route Generation
- [ ] TanStack Router generates route tree correctly
- [ ] No TypeScript errors
- [ ] Route is accessible and renders

### Data Flow
- [ ] `useQuery(api["resources/queries"].listDomains)` still works
- [ ] Domains data loads correctly
- [ ] DNS records in `fullApiData.dnsRecords` display correctly

---

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/web/src/routes/dashboard/infrastructure/networking.tsx` | Create | New route file (move from operations) |
| `apps/web/src/routes/dashboard/operations/networking.tsx` | Delete | Remove old route file |
| `apps/web/src/components/dashboard/sidebar-data.tsx` | Modify | Update navigation structure (2 places) |
| `apps/web/src/routeTree.gen.ts` | Auto-update | TanStack Router will regenerate |

---

## Rollback Plan

If issues occur:

1. **Revert route file**: Move `infrastructure/networking.tsx` back to `operations/networking.tsx`
2. **Revert sidebar**: Restore original sidebar structure
3. **Clear route cache**: Delete `.tanstack` folder if needed
4. **Restart dev server**: `npm run dev`

---

## Expected Result

### New Navigation Structure

```
Dashboard
├── General
│   ├── Dashboard
│   └── Projects
│
├── Infrastructure  ← ALL RESOURCES HERE
│   ├── Compute (Servers + Web Services)
│   ├── Data (Databases)
│   └── Networking (Domains + DNS Records)  ← MOVED HERE
│
└── Operations
    ├── Backups
    └── Workflows
```

### Benefits

✅ **Consistency**: All resource types in Infrastructure  
✅ **Clarity**: Clear separation between resources and operations  
✅ **Scalability**: Room to add more networking resources (load balancers, CDNs)  
✅ **Mental Model**: Matches user expectations (domains = infrastructure)

---

## Implementation Order

1. **Create new route file** (`infrastructure/networking.tsx`)
2. **Update sidebar navigation** (move Networking to Infrastructure)
3. **Test navigation** (verify links work)
4. **Delete old route file** (`operations/networking.tsx`)
5. **Verify DNS records** (confirm display still works)
6. **Test full flow** (navigate, view domains, view DNS records)

---

## Notes

- **DNS Records**: Already implemented, no changes needed
- **Component**: `DomainsTable` is route-agnostic, works anywhere
- **Data**: No backend changes required
- **Breaking**: Old URLs will break, but this is acceptable for MVP
- **Future**: Consider redirect from old URL to new URL if needed

---

**Ready for implementation. Estimated 30 minutes. Low risk, high clarity improvement.**

