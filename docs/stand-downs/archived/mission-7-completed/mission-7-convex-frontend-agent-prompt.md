# Mission 7: Convex Adapter - Frontend Agent Prompt

**Date**: November 12, 2025  
**Mission**: Mission 7 - Read-Only Infrastructure MVP  
**Provider**: Convex (Database Provider + Deployments)  
**Agent**: Frontend Agent  
**Priority**: High

---

## 🎯 Task

Create Operations > Deployments page and table to display Convex deployments. This is the **last database provider** before moving to IaaS.

---

## 📋 Implementation Tasks

### Task 1: Add Deployments Query

**File**: `convex/docks/queries.ts`

Add query to fetch deployments (similar to `getBackupSchedules`):

```typescript
export const getDeployments = query({
  args: {
    orgId: v.id("organizations"),
    dockId: v.optional(v.id("docks")),
  },
  handler: async (ctx, args) => {
    // RBAC check
    // Query deployments table
    // Filter by orgId and optionally dockId
    // Return deployments
  },
})
```

### Task 2: Add Deployments to Navigation

**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

Add "Deployments" to Operations section (between Backups and Workflows):

```typescript
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
      title: "Deployments",  // NEW
      url: "/dashboard/operations/deployments",
      icon: Rocket,  // Import from lucide-react
    },
    {
      title: "Workflows",
      url: "/dashboard/operations/workflows",
      icon: Workflow,
    },
  ],
},
```

### Task 3: Create Deployments Route

**File**: `apps/web/src/routes/dashboard/operations/deployments.tsx`

Create deployments page (similar to `backups.tsx`):

```typescript
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { DeploymentsTable } from "@/components/operations/deployments-table"

export const Route = createFileRoute("/dashboard/operations/deployments")({
  component: DeploymentsPage,
})

function DeploymentsPage() {
  const { orgId } = useAuth()
  const deployments = useQuery(api["docks/queries"].getDeployments, {
    orgId: orgId!,
  })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">Deployments</h2>
        <p className="text-muted-foreground text-xs">
          View deployments across all your infrastructure providers.
        </p>
      </div>

      <DeploymentsTable data={deployments} />
    </div>
  )
}
```

### Task 4: Create Deployments Table Component

**File**: `apps/web/src/components/operations/deployments-table.tsx`

Create table component (similar to `backup-schedules-table.tsx`):

**Columns**:
- Name (deployment name)
- Project (project name from fullApiData)
- Type (deploymentType: dev/prod/preview)
- Status (status badge)
- Created At (formatted date)
- Provider (badge)

**Reference**: `apps/web/src/components/operations/backup-schedules-table.tsx`

---

## 🔗 Reference Files

- **Page Pattern**: `apps/web/src/routes/dashboard/operations/backups.tsx`
- **Table Pattern**: `apps/web/src/components/operations/backup-schedules-table.tsx`
- **Navigation Pattern**: `apps/web/src/components/dashboard/sidebar-data.tsx` (Operations section)

---

## ✅ Testing Checklist

- [ ] Deployments query works
- [ ] Deployments appear in Operations navigation
- [ ] Deployments page renders at `/dashboard/operations/deployments`
- [ ] Deployments table displays data
- [ ] Table columns show correct data (name, project, type, status, created)
- [ ] Loading states work (`undefined = loading`)
- [ ] Empty states work (`[] = no deployments`)

---

**Ready to implement**: Backend will provide `deployments` table and query. Frontend needs to display it.
