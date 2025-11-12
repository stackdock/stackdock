# Mission 4: UI Polish + Multi-Provider Integration → Beacons Extraction

> **Location**: `stand-downs/mission-4-execution-plan.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/mission-4-execution-plan.md`  
> **Last Updated**: November 11, 2025  
> **Status**: Ready for Assignment  
> **Priority**: HIGH  
> **Timeline**: 9 days (7 days + 2 buffer)

---

## Mission Overview

**Objective**: Polish UI tables, integrate 11 additional providers (GET endpoints only for hackathon MVP), and prepare StackDock codebase for clean extraction to Beacons (independent repo).

**Context**: 
- StackDock has GridPane partial MVP (servers + webServices working, sufficient for observability)
- UI tables polished and functional (Days 1-2 complete)
- Provider integration moved to Mission 5 (multi-provider validation priority)
- Beacons needs to be extracted as independent repo (created after Nov 1st)
- Beacons requires: RBAC + encryption + universal translation layer + polished UI

**Success Criteria**:
- ✅ UI tables match template (visual + functional)
- ✅ 8+ providers integrated (GET endpoints working)
- ✅ Data displaying in tables from multiple providers
- ✅ Extraction guide complete
- ✅ Beacons-ready codebase

---

## Prerequisites

Before starting, ensure you've read:
1. `stand-downs/system-state.json` - Current mission status
2. `docs/architecture/DEVELOPMENT_PRIORITY.md` - Development strategy
3. `convex/docks/_types.ts` - Dock adapter interface
4. `convex/docks/adapters/gridpane/` - Reference implementation
5. Your principle engineer SOP: `docs/workflows/principle-engineers/{your-agent}.md`

---

## Day-by-Day Execution Plan

### **Days 1-2: UI Fixes (Critical Path Blocker)** ✅ COMPLETE

**Priority**: CRITICAL - Blocks everything  
**Agent**: `frontend-agents` (TanStack/React specialist)  
**Status**: ✅ Complete  
**Completed**: January 11, 2025  
**Estimated Time**: 2 days  
**Actual Time**: 1 day

**Goal**: Fix table bugs and align with template

**Tasks**:
1. **Audit Current State**:
   - Compare current tables vs template (`apps/web/src/components/tanstack-table-template.tsx`)
   - Document visual inconsistencies (styling, spacing, colors)
   - Document functional bugs (filtering, sorting, pagination)
   - List missing features from template

2. **Fix Visual Issues**:
   - Match template styling (Tailwind classes, spacing, colors)
   - Fix badge styling (provider badges, status badges)
   - Fix table layout (column widths, row heights, borders)
   - Fix filter UI (popover styling, button states)
   - Fix pagination UI (button states, spacing)

3. **Fix Functional Bugs**:
   - Fix filtering (multi-column search, status filters, provider filters)
   - Fix sorting (column headers, sort indicators)
   - Fix pagination (page size selector, page navigation)
   - Fix column visibility toggle
   - Fix row selection (checkboxes, bulk actions)

4. **Add Missing Features**:
   - Add export functionality (if in template)
   - Add keyboard shortcuts (if in template)
   - Add loading states (skeletons, spinners)
   - Add empty states (no data messages)
   - Add error states (error messages, retry buttons)

5. **Test All Tables**:
   - Servers table (`apps/web/src/components/resources/servers-table.tsx`)
   - Web Services table (`apps/web/src/components/resources/web-services-table.tsx`)
   - Domains table (`apps/web/src/components/resources/domains-table.tsx`)
   - Databases table (`apps/web/src/components/resources/databases-table.tsx`)

**Files to Modify**:
- `apps/web/src/components/resources/servers-table.tsx`
- `apps/web/src/components/resources/web-services-table.tsx`
- `apps/web/src/components/resources/domains-table.tsx`
- `apps/web/src/components/resources/databases-table.tsx`
- `apps/web/src/components/resources/shared/provider-badge.tsx`
- `apps/web/src/components/resources/shared/status-badge.tsx`

**Reference**:
- Template: `apps/web/src/components/tanstack-table-template.tsx` (if available)
- shadcn/ui table examples: https://ui.shadcn.com/docs/components/table
- TanStack Table docs: https://tanstack.com/table/latest

**Success Criteria**:
- ✅ All tables visually match template
- ✅ All functional bugs fixed
- ✅ All features from template implemented
- ✅ All tables tested and working
- ✅ No console errors
- ✅ Responsive on mobile

**Completed Work**:
- ✅ Comprehensive frontend audit completed
- ✅ Global styles normalized (font sizes, spacing)
- ✅ Typography standardized (replaced arbitrary sizes)
- ✅ Spacing system fixed (responsive padding added)
- ✅ Color tokens migrated (20+ instances)
- ✅ Responsive design implemented (mobile-first breakpoints)
- ✅ Accessibility improvements (skip links, ARIA labels, semantic HTML)
- ✅ Documentation created (`docs/architecture/ACCESSIBILITY.md`)

**See**: `stand-downs/mission-4-frontend-audit-completion.md` for detailed completion report.

---

### **Days 3-7: Provider Integration Sprint** ⏸️ MOVED TO MISSION 5

**Priority**: HIGH  
**Agent**: `backend-convex` (with parallel frontend support)  
**Status**: ⏸️ Moved to Mission 5  
**Reason**: Multi-provider integration prioritized for schema validation. See `mission-5-provider-integration-strategy.md`

**Goal**: Add 11 providers with GET endpoints only (MVP for hackathon) - **NOW IN MISSION 5**

**Strategy**: Batch by complexity, parallelize where possible

---

#### **Batch 1: Simple REST APIs (Days 3-4)**

**Providers**: Vercel, Netlify, Cloudflare Pages, DNSimple  
**Agent**: `backend-convex`  
**Estimated Time**: 2 days (0.5 days per provider)

**Pattern** (per provider):
```typescript
// 1. API class (GET endpoints only)
// convex/docks/adapters/{provider}/api.ts
export class ProviderAPI {
  constructor(apiKey: string, baseUrl?: string) {}
  
  async validateCredentials(): Promise<boolean> {
    // GET /user or /account (lightweight endpoint)
  }
  
  async getWebServices(): Promise<ProviderWebService[]> {
    // GET /deployments or /sites or /projects
  }
  
  async getServers(): Promise<ProviderServer[]> {
    // GET /instances or /droplets (if IaaS)
  }
  
  async getDomains(): Promise<ProviderDomain[]> {
    // GET /domains (if DNS provider)
  }
}

// 2. Types
// convex/docks/adapters/{provider}/types.ts
export interface ProviderWebService {
  id: string | number
  name: string
  url?: string
  status: string
  // ... provider-specific fields
}

// 3. Adapter (minimal translation)
// convex/docks/adapters/{provider}/adapter.ts
export const providerAdapter: DockAdapter = {
  provider: "provider",
  
  async validateCredentials(apiKey: string) {
    const api = new ProviderAPI(apiKey)
    return await api.validateCredentials()
  },
  
  async syncWebServices(ctx: MutationCtx, dock: Doc<"docks">) {
    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })
    const api = new ProviderAPI(apiKey)
    const services = await api.getWebServices()
    
    for (const service of services) {
      const existing = await ctx.db
        .query("webServices")
        .withIndex("by_dock_resource", (q) =>
          q
            .eq("dockId", dock._id)
            .eq("providerResourceId", service.id.toString())
        )
        .first()
      
      const universal = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "provider",
        providerResourceId: service.id.toString(),
        name: service.name,
        productionUrl: service.url || undefined,
        status: mapStatus(service.status),
        fullApiData: service,
        updatedAt: Date.now(),
      }
      
      if (existing) {
        await ctx.db.patch(existing._id, universal)
      } else {
        await ctx.db.insert("webServices", universal)
      }
    }
  },
  
  // Similar for syncServers, syncDomains if applicable
}

// 4. Index
// convex/docks/adapters/{provider}/index.ts
export { providerAdapter } from "./adapter"
export { ProviderAPI } from "./api"
```

**Provider-Specific Details**:

**Vercel**:
- API: https://vercel.com/docs/rest-api
- Auth: `Authorization: Bearer {token}`
- Endpoints:
  - Validate: `GET /v2/user`
  - Web Services: `GET /v6/deployments` (or `GET /v9/projects`)
- Maps to: `webServices` table
- Status mapping: `READY` → `running`, `BUILDING` → `pending`, `ERROR` → `error`

**Netlify**:
- API: https://docs.netlify.com/api/get-started/
- Auth: `Authorization: Bearer {token}`
- Endpoints:
  - Validate: `GET /api/v1/user`
  - Web Services: `GET /api/v1/sites`
- Maps to: `webServices` table
- Status mapping: `published` → `running`, `building` → `pending`, `error` → `error`

**Cloudflare Pages**:
- API: https://developers.cloudflare.com/api/operations/pages-project-list-projects
- Auth: `Authorization: Bearer {token}` + `X-Auth-Email: {email}`
- Endpoints:
  - Validate: `GET /user/tokens/verify`
  - Web Services: `GET /accounts/{account_id}/pages/projects`
- Maps to: `webServices` table
- Status mapping: `active` → `running`, `building` → `pending`, `failed` → `error`

**DNSimple**:
- API: https://developer.dnsimple.com/v2/
- Auth: `Authorization: Bearer {token}`
- Endpoints:
  - Validate: `GET /whoami`
  - Domains: `GET /{account_id}/domains`
- Maps to: `domains` table
- Status mapping: `registered` → `active`, `expired` → `error`

**Files to Create** (per provider):
- `convex/docks/adapters/{provider}/api.ts`
- `convex/docks/adapters/{provider}/types.ts`
- `convex/docks/adapters/{provider}/adapter.ts`
- `convex/docks/adapters/{provider}/index.ts`
- `convex/docks/adapters/{provider}/README.md` (optional, but recommended)

**Register Adapter**:
- Update `convex/docks/adapters/index.ts`:
```typescript
import { providerAdapter } from "./{provider}"

export function getAdapter(provider: string): DockAdapter | null {
  switch (provider) {
    case "gridpane":
      return gridpaneAdapter
    case "vercel":
      return vercelAdapter
    case "netlify":
      return netlifyAdapter
    // ... etc
    default:
      return null
  }
}
```

**Success Criteria** (per provider):
- ✅ API class implemented (GET endpoints only)
- ✅ Adapter implemented (translation to universal schema)
- ✅ Registered in `getAdapter()`
- ✅ Credential validation working
- ✅ Resource sync working
- ✅ Data displaying in tables

---

#### **Batch 2: IaaS Providers (Days 5-6)**

**Providers**: DigitalOcean, Vultr, Linode  
**Agent**: `backend-convex`  
**Estimated Time**: 2 days (0.67 days per provider)

**Pattern**: Similar to Batch 1, but syncs to `servers` table

**Provider-Specific Details**:

**DigitalOcean**:
- API: https://docs.digitalocean.com/reference/api/api-reference/
- Auth: `Authorization: Bearer {token}`
- Endpoints:
  - Validate: `GET /v2/account`
  - Servers: `GET /v2/droplets`
- Maps to: `servers` table
- Status mapping: `active` → `running`, `off` → `stopped`, `new` → `pending`

**Vultr**:
- API: https://www.vultr.com/api/
- Auth: `Authorization: Bearer {token}`
- Endpoints:
  - Validate: `GET /v2/account`
  - Servers: `GET /v2/instances`
- Maps to: `servers` table
- Status mapping: `running` → `running`, `stopped` → `stopped`, `pending` → `pending`

**Linode**:
- API: https://www.linode.com/docs/api/
- Auth: `Authorization: Bearer {token}`
- Endpoints:
  - Validate: `GET /v4/profile`
  - Servers: `GET /v4/linode/instances`
- Maps to: `servers` table
- Status mapping: `running` → `running`, `stopped` → `stopped`, `booting` → `pending`

**Success Criteria**: Same as Batch 1

---

#### **Batch 3: Cloud Providers (Day 7)**

**Providers**: AWS, GCP, Azure  
**Agent**: `backend-convex`  
**Estimated Time**: 1 day (0.33 days per provider)

**Pattern**: SDK-based (more complex), but MVP = GET endpoints only

**Provider-Specific Details**:

**AWS**:
- SDK: `@aws-sdk/client-ec2`, `@aws-sdk/client-cloudfront`, `@aws-sdk/client-route53`
- Auth: Access Key ID + Secret Access Key
- Endpoints:
  - Validate: `sts:GetCallerIdentity`
  - Servers: `ec2:DescribeInstances`
  - Web Services: `cloudfront:ListDistributions`
  - Domains: `route53:ListHostedZones`
- Maps to: `servers`, `webServices`, `domains` tables
- Status mapping: `running` → `running`, `stopped` → `stopped`, `pending` → `pending`

**GCP**:
- SDK: `@google-cloud/compute`, `@google-cloud/run`, `@google-cloud/dns`
- Auth: Service Account JSON key
- Endpoints:
  - Validate: `compute.projects.get`
  - Servers: `compute.instances.list`
  - Web Services: `run.projects.locations.services.list`
  - Domains: `dns.managedZones.list`
- Maps to: `servers`, `webServices`, `domains` tables

**Azure**:
- SDK: `@azure/arm-compute`, `@azure/arm-appservice`, `@azure/arm-dns`
- Auth: Service Principal (Client ID + Secret + Tenant ID)
- Endpoints:
  - Validate: `subscriptions.list`
  - Servers: `virtualMachines.listAll`
  - Web Services: `webApps.list`
  - Domains: `zones.list`
- Maps to: `servers`, `webServices`, `domains` tables

**Note**: For MVP, focus on one resource type per provider (e.g., AWS = EC2 only, GCP = Compute Engine only)

**Success Criteria**: Same as Batch 1

---

#### **Batch 4: Specialized (Day 7)**

**Providers**: Rocket.net  
**Agent**: `backend-convex`  
**Estimated Time**: Part of Day 7

**Rocket.net**:
- API: Similar to GridPane (server management)
- Auth: API key (Bearer token)
- Endpoints:
  - Validate: `GET /api/v1/user` (or similar)
  - Web Services: `GET /api/v1/sites` (or similar)
- Maps to: `webServices` table
- Status mapping: Similar to GridPane

**Note**: DNSimple already covered in Batch 1

**Success Criteria**: Same as Batch 1

---

### **Days 8-9: Beacons Extraction Prep**

**Priority**: HIGH  
**Agent**: `devops` + `backend-convex`  
**Status**: Pending  
**Estimated Time**: 2 days

**Goal**: Prepare StackDock codebase for clean extraction to Beacons

**Tasks**:

1. **Document Extraction Checklist**:
   - Create `stand-downs/beacons-extraction-checklist.md`
   - List all files to copy (RBAC, encryption, adapters)
   - List all files to modify (remove provisioning, keep read-only)
   - List all files to add (beacon widget system)

2. **Core Systems to Extract**:
   - **RBAC System**:
     - `convex/lib/rbac.ts` - Permission checking
     - `convex/lib/withRBAC.ts` - RBAC middleware
     - `convex/schema.ts` - Roles, permissions schema
   - **Encryption**:
     - `convex/lib/encryption.ts` - AES-256-GCM encryption
     - `scripts/generate-encryption-key.js` - Key generation
   - **Universal Translation**:
     - `convex/docks/adapters/` - All adapter implementations
     - `convex/docks/_types.ts` - DockAdapter interface
     - `convex/docks/mutations.ts` - Dock CRUD (read-only subset)
     - `convex/docks/actions.ts` - Sync actions
   - **Schema**:
     - `convex/schema.ts` - Universal tables (servers, webServices, domains, databases)
   - **UI**:
     - `apps/web/src/components/resources/` - All table components
     - `apps/web/src/components/resources/shared/` - Shared components

3. **Create Extraction Guide**:
   - Create `docs/guides/BEACONS_EXTRACTION.md`
   - Step-by-step extraction process
   - What to copy, what to modify, what to add
   - Testing checklist

4. **Test Extraction Locally**:
   - Create `beacons-extraction/` folder
   - Copy core systems
   - Remove provisioning code
   - Verify functionality
   - Document any issues

5. **Beacon Widget System Design**:
   - Design beacon widget architecture
   - Document API endpoints needed
   - Document data model (beacon checks, uptime tracking)
   - Create implementation plan (not implemented, just planned)

**Files to Create**:
- `stand-downs/beacons-extraction-checklist.md`
- `docs/guides/BEACONS_EXTRACTION.md`
- `docs/architecture/BEACON_WIDGET_DESIGN.md` (design doc only)

**Success Criteria**:
- ✅ Extraction checklist complete
- ✅ Extraction guide complete
- ✅ Extraction tested locally
- ✅ Beacon widget design documented
- ✅ Beacons-ready codebase verified

---

## Parallelization Strategy

### **Frontend + Backend Split**:
- **Days 1-2**: Frontend agent fixes UI (can run in parallel with provider planning)
- **Days 3-7**: Backend agent adds providers (can run in parallel with UI polish)

### **Provider Batching**:
- **Agent 1**: Batch 1 (Vercel, Netlify, Cloudflare, DNSimple) - Days 3-4
- **Agent 2**: Batch 2 (DO, Vultr, Linode) - Days 5-6
- **Agent 3**: Batch 3 (AWS, GCP, Azure) + Batch 4 (Rocket.net) - Day 7

---

## Risk Mitigation

### **Risk 1: UI Fixes Take Longer**
- **Mitigation**: If UI takes 3 days, reduce providers to 8 (drop AWS/GCP/Azure)
- **Fallback**: Focus on Batch 1 + Batch 2 (7 providers total)

### **Risk 2: Provider APIs Differ**
- **Mitigation**: Start with simplest (Vercel, Netlify), establish pattern, then scale
- **Fallback**: Document API differences, handle edge cases later

### **Risk 3: Extraction Complexity**
- **Mitigation**: Document extraction on Day 8, test on Day 9, iterate if needed
- **Fallback**: Extraction guide complete even if testing incomplete

---

## Success Criteria Summary

By Day 9:
- ✅ UI tables match template (visual + functional)
- ✅ 8+ providers integrated (GET endpoints working)
- ✅ Data displaying in tables from multiple providers
- ✅ Extraction guide complete
- ✅ Beacons-ready codebase (RBAC + encryption + translation)

---

## Next Steps

1. **Find Template**: Locate original template file or use shadcn/ui examples as target
2. **Create Provider Briefs**: Create detailed briefs for each provider adapter
3. **Assign Agents**: Assign frontend agent (Days 1-2) and backend agents (Days 3-7)
4. **Start Day 1**: UI audit and fix plan

---

## Related Documents

- `docs/architecture/DEVELOPMENT_PRIORITY.md` - Development strategy
- `convex/docks/_types.ts` - Dock adapter interface
- `convex/docks/adapters/gridpane/` - Reference implementation
- `stand-downs/system-state.json` - Current mission status

---

**Remember**: This is a hackathon MVP. Focus on GET endpoints only. Edge cases (pagination, rate limits, error handling) can be improved later. The goal is to demonstrate multi-provider support with polished UI, ready for Beacons extraction.
