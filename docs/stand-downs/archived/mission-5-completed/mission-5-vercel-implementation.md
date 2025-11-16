# Mission 5: Vercel Adapter Implementation

> **Location**: `stand-downs/active/mission-5-vercel-implementation.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/active/mission-5-vercel-implementation.md`  
> **Last Updated**: January 11, 2025  
> **Status**: Ready for Implementation  
> **Priority**: HIGH  
> **Estimated Time**: 0.5 days

---

## Overview

Implement Vercel adapter following GridPane pattern. Vercel is a PaaS provider that hosts web applications with deployments, projects, and domains.

**Goal**: Get Vercel projects/deployments syncing to `webServices` table, validate universal schema with different API structure.

---

## Prerequisites

- [x] GridPane adapter working (reference implementation)
- [x] Universal schema defined (`convex/schema.ts`)
- [x] Dock adapter interface (`convex/docks/_types.ts`)
- [x] API response examples available (`docks/vercel/`)

---

## Implementation Steps

### Step 1: Review Vercel API Response Examples

**Location**: `docks/vercel/`

**Files to Review**:
- `docks/vercel/projects/retrievealistofprojects.json` - Project list structure
- `docks/vercel/deployments/listdeployments.json` - Deployment list structure
- `docks/vercel/domains/listalldomains.json` - Domain list structure

**Key Observations**:
- Projects contain multiple deployments
- Deployments have status: `READY`, `BUILDING`, `ERROR`, `QUEUED`, `CANCELED`
- Projects have `url` field (production URL)
- Deployments have `url` field (deployment-specific URL)

---

### Step 2: Create Vercel API Client

**File**: `convex/docks/adapters/vercel/api.ts`

**Endpoints to Implement**:
```typescript
export class VercelAPI {
  constructor(apiKey: string, baseUrl: string = "https://api.vercel.com")
  
  // Validate credentials
  async validateCredentials(): Promise<boolean>
  // GET /v2/user
  
  // Get all projects
  async getProjects(): Promise<VercelProject[]>
  // GET /v9/projects
  
  // Get project deployments
  async getDeployments(projectId: string): Promise<VercelDeployment[]>
  // GET /v9/projects/{id}/deployments
  
  // Get project domains
  async getDomains(projectId: string): Promise<VercelDomain[]>
  // GET /v9/projects/{id}/domains
}
```

**Authentication**: Bearer token in `Authorization` header

---

### Step 3: Create Vercel Types

**File**: `convex/docks/adapters/vercel/types.ts`

**Types Needed**:
```typescript
export interface VercelProject {
  id: string
  name: string
  url?: string  // Production URL
  // ... other fields
}

export interface VercelDeployment {
  id: string
  url: string
  state: "READY" | "BUILDING" | "ERROR" | "QUEUED" | "CANCELED"
  // ... other fields
}

export interface VercelDomain {
  name: string
  // ... other fields
}
```

---

### Step 4: Create Vercel Adapter

**File**: `convex/docks/adapters/vercel/adapter.ts`

**Follow GridPane Pattern**:
```typescript
export const vercelAdapter: DockAdapter = {
  provider: "vercel",
  
  async validateCredentials(apiKey: string): Promise<boolean> {
    // Use VercelAPI.validateCredentials()
  },
  
  async syncWebServices(ctx: MutationCtx, dock: Doc<"docks">): Promise<void> {
    // 1. Decrypt API key
    // 2. Get projects from VercelAPI
    // 3. Map each project to universal webServices schema
    // 4. Upsert to webServices table
  },
  
  async syncDomains(ctx: MutationCtx, dock: Doc<"docks">): Promise<void> {
    // Optional: Sync domains if needed
  },
}
```

**Status Mapping**:
- `READY` → `running`
- `BUILDING` → `pending`
- `ERROR` → `error`
- `QUEUED` → `pending`
- `CANCELED` → `stopped`

**Field Mapping**:
- `project.id` → `providerResourceId`
- `project.name` → `name`
- `project.url` → `productionUrl`
- `project` → `fullApiData` (all Vercel-specific fields)

---

### Step 5: Register Adapter

**File**: `convex/docks/adapters/index.ts`

```typescript
import { gridpaneAdapter } from "./gridpane/adapter"
import { vercelAdapter } from "./vercel/adapter"

export const adapters: Record<string, DockAdapter> = {
  gridpane: gridpaneAdapter,
  vercel: vercelAdapter,
}
```

---

### Step 6: Test Vercel Adapter

**Test Checklist**:
- [ ] Credential validation works
- [ ] Projects sync to `webServices` table
- [ ] Status mapping correct (`READY` → `running`, etc.)
- [ ] `fullApiData` contains all Vercel fields
- [ ] Data displays in UI tables
- [ ] Provider badge shows "vercel"

---

## Files to Create

1. `convex/docks/adapters/vercel/api.ts` - API client
2. `convex/docks/adapters/vercel/types.ts` - TypeScript types
3. `convex/docks/adapters/vercel/adapter.ts` - Adapter implementation
4. `convex/docks/adapters/vercel/README.md` - Documentation

---

## Reference Implementation

**GridPane Adapter**: `convex/docks/adapters/gridpane/`

**Key Files**:
- `convex/docks/adapters/gridpane/api.ts` - API client pattern
- `convex/docks/adapters/gridpane/adapter.ts` - Adapter pattern
- `convex/docks/adapters/gridpane/types.ts` - Types pattern

---

## Success Criteria

- [x] Vercel adapter created
- [ ] Credential validation working
- [ ] Projects syncing to `webServices` table
- [ ] Data displaying in UI tables
- [ ] Status mappings correct
- [ ] Documentation complete

---

## Next Steps After Vercel

1. **Netlify Adapter** (similar to Vercel, PaaS)
2. **DigitalOcean Adapter** (IaaS, tests server abstraction)
3. **Cloudflare Adapter** (DNS + Pages/Workers)
4. **Schema Validation** (review field mappings across providers)

---

**Remember**: Follow GridPane pattern exactly. The universal schema should work for both GridPane and Vercel without changes.
