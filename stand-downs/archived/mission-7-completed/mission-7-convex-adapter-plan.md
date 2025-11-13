# Mission 7: Convex Adapter Implementation Plan

**Date**: November 12, 2025  
**Mission**: Mission 7 - Read-Only Infrastructure MVP  
**Provider**: Convex (Database Provider + Deployments)  
**Status**: 📋 Planning  
**Priority**: High

---

## 🎯 Objective

Implement Convex adapter following the established adapter pattern. Convex is a backend-as-a-service platform. This is the **last database provider** before moving to IaaS providers.

**Key Difference**: Convex has **deployments** that need a new table and Operations page.

---

## 📋 API Structure

**Base URL**: `https://cloud.convex.dev/api/v1`

**Endpoints for read-only MVP:**
1. `GET /token` - Get token details (returns `teamId`)
2. `GET /projects?teamId={teamId}` - List projects for a team
3. `GET /deployments?projectId={projectId}` - List deployments for a project

**Authentication**: Single API token (Bearer token in `Authorization` header)

**Flow**:
1. Validate credentials → `GET /token` (get teamId)
2. List projects → `GET /projects?teamId={teamId}`
3. For each project → `GET /deployments?projectId={projectId}`

**Reference JSON files:**
- `docks/convex/getTokenDetails.json` ✅ (real API response)
- `docks/convex/listProjects.json` ✅ (real API response)
- `docks/convex/listDeployments.json` ✅ (real API response)

---

## 🔄 Field Mapping

### Convex Project → Universal `databases` table

| Universal Field | Convex Field | Mapping Logic |
|----------------|-------------|---------------|
| `providerResourceId` | `project.id` | `1248586` |
| `name` | `project.name` | `"stackdock-test-v1"` |
| `engine` | `"convex"` | Hardcoded |
| `version` | `"latest"` | Hardcoded (Convex manages versions) |
| `status` | **Derived** | Always `"active"` (projects are active) |
| `fullApiData` | **Entire object** | Store project + teamId |

### Convex Deployment → Universal `deployments` table (NEW)

| Universal Field | Convex Field | Mapping Logic |
|----------------|-------------|---------------|
| `providerResourceId` | `deployment.name` | `"warmhearted-ferret-15"` |
| `name` | `deployment.name` | `"warmhearted-ferret-15"` |
| `projectId` | `deployment.projectId` | `1248586` |
| `deploymentType` | `deployment.deploymentType` | `"dev"` or `"prod"` |
| `status` | **Derived** | Always `"active"` (deployments are active) |
| `createdAt` | `deployment.createTime` | Convert timestamp |
| `fullApiData` | **Entire object** | Store all deployment fields |

---

## 📝 Implementation Tasks

### Phase 1: Schema & Backend (Convex Agent)

#### Task 1.1: Create Deployments Table

**File**: `convex/schema.ts`

Add new `deployments` table:

```typescript
// Master Fleet List: Deployments
deployments: defineTable({
  orgId: v.id("organizations"),
  dockId: v.id("docks"),
  provider: v.string(), // "convex", etc.
  providerResourceId: v.string(), // Deployment name/ID (provider-specific)
  projectId: v.optional(v.number()), // Convex project ID
  name: v.string(), // Deployment name
  deploymentType: v.string(), // "dev", "prod", "preview"
  status: v.string(), // "active", "inactive", "error"
  createdAt: v.optional(v.number()), // Creation timestamp
  fullApiData: v.any(),
  updatedAt: v.optional(v.number()),
})
  .index("by_orgId", ["orgId"])
  .index("by_dockId", ["dockId"])
  .index("by_dock_deployment", ["dockId", "providerResourceId"]) // Prevent duplicate syncs
  .index("by_projectId", ["projectId"]),
```

#### Task 1.2: Update DockAdapter Interface

**File**: `convex/docks/_types.ts`

Add optional `syncDeployments` method:

```typescript
/**
 * Sync deployments to universal `deployments` table
 * 
 * Called during dock sync. Should:
 * 1. Use pre-fetched data if provided, otherwise fetch from provider API
 * 2. Upsert into `deployments` table
 * 3. Map provider fields to universal schema
 * 4. Store all provider-specific data in `fullApiData`
 */
syncDeployments?(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: any[]
): Promise<void>
```

#### Task 1.3: Create Convex Types

**File**: `convex/docks/adapters/convex/types.ts`

```typescript
/**
 * Convex API Types
 * 
 * Generated from actual API responses in docks/convex/
 */

/**
 * Convex Token Details
 * @see docks/convex/getTokenDetails.json
 */
export interface ConvexTokenDetails {
  type: "teamToken" | "userToken"
  teamId: number
  name: string
  createTime: number
}

/**
 * Convex Project
 * @see docks/convex/listProjects.json
 */
export interface ConvexProject {
  id: number
  name: string
  slug: string
  teamId: number
  createTime: number
}

/**
 * Convex Deployment
 * @see docks/convex/listDeployments.json
 */
export interface ConvexDeployment {
  name: string
  createTime: number
  deploymentType: "dev" | "prod" | "preview"
  projectId: number
  previewIdentifier: string | null
}
```

#### Task 1.4: Create Convex API Client

**File**: `convex/docks/adapters/convex/api.ts`

```typescript
export class ConvexAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://cloud.convex.dev/api/v1") {
    this.apiKey = apiKey.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Get token details (returns teamId)
   */
  async getTokenDetails(): Promise<ConvexTokenDetails> {
    return await this.request<ConvexTokenDetails>("/token")
  }

  /**
   * List projects for a team
   */
  async listProjects(teamId: number): Promise<ConvexProject[]> {
    const response = await this.request<ConvexProject[]>(`/projects?teamId=${teamId}`)
    return Array.isArray(response) ? response : []
  }

  /**
   * List deployments for a project
   */
  async listDeployments(projectId: number): Promise<ConvexDeployment[]> {
    const response = await this.request<ConvexDeployment[]>(`/deployments?projectId=${projectId}`)
    return Array.isArray(response) ? response : []
  }

  /**
   * Validate API credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      await this.getTokenDetails()
      return true
    } catch (error) {
      if (error instanceof Error && error.message.includes("401")) {
        return false
      }
      throw error
    }
  }
}
```

#### Task 1.5: Create Convex Adapter

**File**: `convex/docks/adapters/convex/adapter.ts`

Implement:
- `validateCredentials()` - Uses `getTokenDetails()`
- `syncDatabases()` - Syncs projects to `databases` table
- `syncDeployments()` - Syncs deployments to `deployments` table

#### Task 1.6: Update Actions

**File**: `convex/docks/actions.ts`

Add Convex case:
1. Get token details → extract teamId
2. List projects for teamId
3. For each project:
   - Add to databases array
   - List deployments → add to deployments array

#### Task 1.7: Update Mutations

**File**: `convex/docks/mutations.ts`

Update `syncDockResourcesMutation` to handle `deployments` in `fetchedData`.

#### Task 1.8: Register Adapter

**File**: `convex/docks/registry.ts`

Add `convexAdapter` to registry and metadata.

---

### Phase 2: Frontend (Frontend Agent)

#### Task 2.1: Add Deployments Query

**File**: `convex/docks/queries.ts`

Add query to fetch deployments:

```typescript
export const getDeployments = query({
  args: {
    orgId: v.id("organizations"),
    dockId: v.optional(v.id("docks")),
  },
  handler: async (ctx, args) => {
    // RBAC check
    // Query deployments table
    // Return filtered by orgId and optionally dockId
  },
})
```

#### Task 2.2: Add Deployments to Navigation

**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

Add "Deployments" to Operations:

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
      icon: Rocket,  // or appropriate icon
    },
    {
      title: "Workflows",
      url: "/dashboard/operations/workflows",
      icon: Workflow,
    },
  ],
},
```

#### Task 2.3: Create Deployments Route

**File**: `apps/web/src/routes/dashboard/operations/deployments.tsx`

Create deployments page with table (similar to backups page):

```typescript
export function DeploymentsPage() {
  const { orgId } = useAuth()
  const deployments = useQuery(api.docks.queries.getDeployments, {
    orgId: orgId!,
  })

  // Render table with deployments
  // Columns: Name, Project, Type, Status, Created At
}
```

#### Task 2.4: Update API Routes Documentation

**File**: `docks/convex/api-routes.md`

Update with actual endpoints:

```markdown
## Token Details
- URL: `GET /token`
- Returns: Token details with teamId

## List projects
- URL: `GET /projects?teamId={teamId}`
- Returns: Array of projects

## List deployments
- URL: `GET /deployments?projectId={projectId}`
- Returns: Array of deployments
```

---

## ✅ Testing Checklist

### Backend
- [ ] Token details endpoint returns teamId
- [ ] Projects endpoint works with teamId parameter
- [ ] Deployments endpoint works with projectId parameter
- [ ] Credential validation works
- [ ] Projects sync to `databases` table
- [ ] Deployments sync to `deployments` table
- [ ] Adapter registered in registry

### Frontend
- [ ] Deployments query works
- [ ] Deployments appear in navigation
- [ ] Deployments page renders
- [ ] Deployments table displays data
- [ ] Table columns show correct data

---

## 📁 File Structure

```
convex/
├── schema.ts (add deployments table)
├── docks/
│   ├── _types.ts (add syncDeployments)
│   ├── actions.ts (add Convex case)
│   ├── mutations.ts (handle deployments)
│   ├── queries.ts (add getDeployments)
│   ├── registry.ts (register convexAdapter)
│   └── adapters/
│       └── convex/
│           ├── types.ts
│           ├── api.ts
│           ├── adapter.ts
│           └── index.ts

apps/web/src/
├── routes/
│   └── dashboard/
│       └── operations/
│           └── deployments.tsx (NEW)
└── components/
    └── dashboard/
        └── sidebar-data.tsx (add Deployments nav)

docks/convex/
├── api-routes.md (update with actual endpoints)
├── getTokenDetails.json ✅
├── listProjects.json ✅
└── listDeployments.json ✅
```

---

## 📝 Notes

- **Last Database Provider**: This completes Mission 7 Phase 1 (Database Providers)
- **Deployments are NEW**: First provider with deployments table
- **Three-Step Flow**: Token → Projects → Deployments
- **Team ID Required**: Must fetch token details first to get teamId
- **Project ID Required**: Need projectId to fetch deployments

---

## 🎯 Success Criteria

1. ✅ Convex projects sync to `databases` table
2. ✅ Convex deployments sync to `deployments` table
3. ✅ Deployments page exists under Operations
4. ✅ Deployments table displays data
5. ✅ Navigation includes Deployments
6. ✅ Ready to move to IaaS providers (Mission 7 Phase 2)

---

**Ready for implementation**: Pattern established, API responses available, tasks clear.
