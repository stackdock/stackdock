# Mission 5: Multi-Provider Integration Strategy

> **Location**: `stand-downs/mission-5-provider-integration-strategy.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/mission-5-provider-integration-strategy.md`  
> **Last Updated**: January 11, 2025  
> **Status**: IN PROGRESS  
> **Priority**: HIGH  
> **Timeline**: 3 weeks (15 days)  
> **Current Step**: Netlify adapter complete - universal schema validated across 3 providers

---

## Mission Overview

**Objective**: Integrate 11 additional cloud providers (Vercel, Netlify, Cloudflare, DNSimple, DigitalOcean, Vultr, Linode, AWS, GCP, Azure, Rocket.net) with GET endpoints only for hackathon MVP. Follow GridPane adapter pattern to populate universal tables (`servers`, `webServices`, `domains`, `databases`).

**Context**: 
- GridPane adapter partial MVP (Mission 3 pending - servers + webServices working, sufficient for observability)
- UI tables polished and displaying data (Mission 4 Phase 1 complete)
- Universal schema needs validation across multiple providers (GridPane alone insufficient)
- Ready to expand translation layer across multiple providers to validate schema before completing GridPane

**Success Criteria**:
- ✅ 8+ providers integrated (GET endpoints working)
- ✅ Data displaying in tables from multiple providers
- ✅ Universal schema validated across providers
- ✅ Translation layer proven scalable
- ✅ Ready for Beacons extraction (Mission 4 Phase 3)

---

## Strategic End-Goal Alignment

### Multi-Level Views
- **Org Level**: All resources across all providers
- **Team Level**: Resources from docks assigned to team
- **Client Level**: Resources linked to client projects
- **Project Level**: Resources linked to specific project

### RBAC Filtering
- Teams see only their assigned docks' resources
- Clients see only their projects' resources
- Admins see everything

### Cost Visibility (Post-MVP)
- Per-provider costs
- Per-project costs (sum of linked resources)
- Per-team costs (sum of team docks)
- Per-client costs (sum of client projects)

### Cross-Provider Linking
- Projects can link:
  - Server (DigitalOcean) + Web Service (Vercel) + Domain (Cloudflare)
  - Database (AWS RDS) + Storage (GCP Storage) + Compute (Azure VM)

---

## Provider Breakdown by Category

### Category 1: IaaS Providers (→ `servers` table)

#### DigitalOcean
**Core Endpoints** (Must-Have):
- `GET /v2/droplets` → Sync all droplets to `servers`
- `GET /v2/account` → Validate credentials, get org info

**Depth Endpoints** (For Views/Roles):
- `GET /v2/droplets/{id}` → Detailed server view
- `GET /v2/regions` → Region list (for filtering/grouping)
- `GET /v2/sizes` → Instance sizes (for cost estimation)

**Cost Endpoints** (Post-MVP):
- `GET /v2/customers/my/balance` → Account balance
- `GET /v2/billing_history` → Billing history

**Priority**: HIGH  
**Estimated Time**: 0.5 days  
**Universal Table**: `servers`

---

#### Vultr
**Core Endpoints**:
- `GET /v2/instances` → Sync all instances to `servers`
- `GET /v2/account` → Validate credentials

**Depth Endpoints**:
- `GET /v2/instances/{id}` → Detailed instance view
- `GET /v2/regions` → Region list
- `GET /v2/plans` → Plan list (for cost estimation)

**Cost Endpoints**:
- `GET /v2/billing/history` → Billing history

**Priority**: HIGH  
**Estimated Time**: 0.5 days  
**Universal Table**: `servers`

---

#### Linode
**Core Endpoints**:
- `GET /v4/linode/instances` → Sync all Linodes to `servers`
- `GET /v4/profile` → Validate credentials

**Depth Endpoints**:
- `GET /v4/linode/instances/{id}` → Detailed instance view
- `GET /v4/regions` → Region list
- `GET /v4/linode/types` → Instance types (for cost estimation)

**Cost Endpoints**:
- `GET /v4/account/invoices` → Invoice history
- `GET /v4/account` → Account balance

**Priority**: HIGH  
**Estimated Time**: 0.5 days  
**Universal Table**: `servers`

---

#### AWS (EC2)
**Core Endpoints**:
- `GET /ec2/v1/instances` (via AWS SDK) → Sync EC2 instances to `servers`
- `GET /sts/v1/identity` → Validate credentials (GetCallerIdentity)

**Depth Endpoints**:
- `GET /ec2/v1/instances/{id}` → Detailed instance view
- `GET /ec2/v1/regions` → Region list
- `GET /ec2/v1/instance-types` → Instance types

**Cost Endpoints** (Post-MVP):
- `GET /cost-explorer/v1/cost-and-usage` → Cost data
- `GET /billing/v1/account-summary` → Account summary

**Priority**: MEDIUM  
**Estimated Time**: 1 day (AWS SDK complexity)  
**Universal Table**: `servers`

---

#### GCP (Compute Engine)
**Core Endpoints**:
- `GET /compute/v1/projects/{project}/zones/{zone}/instances` → Sync VM instances to `servers`
- `GET /oauth2/v2/userinfo` → Validate credentials

**Depth Endpoints**:
- `GET /compute/v1/projects/{project}/zones/{zone}/instances/{id}` → Detailed instance view
- `GET /compute/v1/regions` → Region list
- `GET /compute/v1/machineTypes` → Machine types

**Cost Endpoints** (Post-MVP):
- `GET /billing/v1/billingAccounts/{account}/budgets` → Budget info
- `GET /cloudbilling/v1/projects/{project}/billingInfo` → Billing info

**Priority**: MEDIUM  
**Estimated Time**: 1 day (GCP API complexity)  
**Universal Table**: `servers`

---

#### Azure (Virtual Machines)
**Core Endpoints**:
- `GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Compute/virtualMachines` → Sync VMs to `servers`
- `GET /subscriptions/{sub}` → Validate credentials, get subscription info

**Depth Endpoints**:
- `GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Compute/virtualMachines/{vm}` → Detailed VM view
- `GET /subscriptions/{sub}/locations` → Location list
- `GET /subscriptions/{sub}/providers/Microsoft.Compute/skus` → VM sizes

**Cost Endpoints** (Post-MVP):
- `GET /subscriptions/{sub}/providers/Microsoft.CostManagement/query` → Cost query
- `GET /subscriptions/{sub}` → Subscription details

**Priority**: MEDIUM  
**Estimated Time**: 1 day (Azure API complexity)  
**Universal Table**: `servers`

---

### Category 2: PaaS Providers (→ `webServices` table)

#### Vercel
**Core Endpoints**:
- `GET /v9/projects` → Sync all projects to `webServices`
- `GET /v2/user` → Validate credentials

**Depth Endpoints**:
- `GET /v9/projects/{id}` → Detailed project view
- `GET /v9/projects/{id}/deployments` → Deployment list (for activity view)
- `GET /v9/projects/{id}/domains` → Domain list (for linking to `domains` table)

**Cost Endpoints** (Post-MVP):
- `GET /v2/teams/{id}/usage` → Team usage
- `GET /v2/teams/{id}/billing` → Billing info

**Priority**: HIGH  
**Estimated Time**: 0.5 days  
**Universal Table**: `webServices`

---

#### Netlify
**Core Endpoints**:
- `GET /api/v1/sites` → Sync all sites to `webServices`
- `GET /api/v1/user` → Validate credentials

**Depth Endpoints**:
- `GET /api/v1/sites/{id}` → Detailed site view
- `GET /api/v1/sites/{id}/deploys` → Deploy list (for activity view)
- `GET /api/v1/sites/{id}/domains` → Domain list (for linking)

**Cost Endpoints** (Post-MVP):
- `GET /api/v1/accounts/{id}/usage` → Account usage
- `GET /api/v1/accounts/{id}/billing` → Billing info

**Priority**: HIGH  
**Estimated Time**: 0.5 days  
**Universal Table**: `webServices`  
**Status**: ✅ COMPLETE - API key encryption working, web services syncing, data rendering in UI

---

#### Cloudflare (Pages/Workers)
**Core Endpoints**:
- `GET /client/v4/accounts/{account}/pages/projects` → Sync Pages projects to `webServices`
- `GET /client/v4/accounts/{account}/workers/scripts` → Sync Workers to `webServices`
- `GET /client/v4/user/tokens/verify` → Validate credentials

**Depth Endpoints**:
- `GET /client/v4/accounts/{account}/pages/projects/{project}` → Detailed Pages project
- `GET /client/v4/accounts/{account}/workers/scripts/{script}` → Detailed Worker
- `GET /client/v4/accounts/{account}/pages/projects/{project}/deployments` → Deployment list

**Cost Endpoints** (Post-MVP):
- `GET /client/v4/accounts/{account}/analytics/analytics/colos` → Analytics (usage)
- `GET /client/v4/accounts/{account}/subscription` → Subscription info

**Priority**: HIGH  
**Estimated Time**: 0.75 days (two services: Pages + Workers)  
**Universal Table**: `webServices`

---

#### Rocket.net
**Core Endpoints**:
- `GET /api/v1/sites` → Sync all sites to `webServices`
- `GET /api/v1/user` → Validate credentials

**Depth Endpoints**:
- `GET /api/v1/sites/{id}` → Detailed site view
- `GET /api/v1/sites/{id}/domains` → Domain list (for linking)

**Cost Endpoints** (Post-MVP):
- `GET /api/v1/billing` → Billing info
- `GET /api/v1/usage` → Usage data

**Priority**: MEDIUM  
**Estimated Time**: 0.5 days  
**Universal Table**: `webServices`

---

### Category 3: DNS/Domain Providers (→ `domains` table)

#### Cloudflare (Zones)
**Core Endpoints**:
- `GET /client/v4/zones` → Sync all zones to `domains`
- `GET /client/v4/user/tokens/verify` → Validate credentials

**Depth Endpoints**:
- `GET /client/v4/zones/{id}` → Detailed zone view
- `GET /client/v4/zones/{id}/dns_records` → DNS records (for detail view)

**Cost Endpoints** (Post-MVP):
- `GET /client/v4/accounts/{account}/subscription` → Subscription info

**Priority**: HIGH  
**Estimated Time**: 0.5 days  
**Universal Table**: `domains`

---

#### DNSimple
**Core Endpoints**:
- `GET /v2/domains` → Sync all domains to `domains`
- `GET /v2/whoami` → Validate credentials

**Depth Endpoints**:
- `GET /v2/domains/{domain}` → Detailed domain view
- `GET /v2/domains/{domain}/records` → DNS records (for detail view)

**Cost Endpoints** (Post-MVP):
- `GET /v2/accounts/{account}/billing` → Billing info

**Priority**: MEDIUM  
**Estimated Time**: 0.5 days  
**Universal Table**: `domains`

---

## Implementation Strategy

### Phase 1: Core Resources (MVP) - Week 1

**Goal**: Get data in tables, basic detail views, credential validation

**For Each Provider**:
1. ✅ List endpoint → Sync to universal table
2. ✅ Validate endpoint → Credential validation
3. ✅ Single resource endpoint → Detail view

**Providers** (Priority Order):
1. **Vercel** (PaaS, common) - 0.5 days
2. **Netlify** (PaaS, common) - 0.5 days
3. **DigitalOcean** (IaaS, simple API) - 0.5 days
4. **Vultr** (IaaS, simple API) - 0.5 days
5. **Cloudflare** (DNS + Pages/Workers) - 0.75 days

**Total Week 1**: ~2.75 days

---

### Phase 2: Additional Providers - Week 2

**Goal**: Expand coverage, validate universal schema across more providers

**Providers**:
6. **Linode** (IaaS) - 0.5 days
7. **DNSimple** (DNS) - 0.5 days
8. **Rocket.net** (PaaS) - 0.5 days
9. **AWS EC2** (IaaS, complex) - 1 day
10. **GCP Compute** (IaaS, complex) - 1 day

**Total Week 2**: ~3.5 days

---

### Phase 3: Cloud Providers (If Time) - Week 3

**Goal**: Full cloud provider coverage

**Providers**:
11. **Azure VMs** (IaaS, complex) - 1 day
12. **AWS S3** (Storage → `webServices`) - 0.5 days
13. **AWS RDS** (Databases → `databases`) - 0.5 days
14. **GCP Storage** (Storage → `webServices`) - 0.5 days
15. **GCP Cloud SQL** (Databases → `databases`) - 0.5 days

**Total Week 3**: ~3 days

---

## Implementation Pattern (Following GridPane)

### Step 1: API Client (`convex/docks/adapters/{provider}/api.ts`)

```typescript
export class ProviderAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey.trim()
    this.baseUrl = baseUrl || "https://api.provider.com"
  }

  async validateCredentials(): Promise<boolean> {
    // Lightweight GET endpoint to validate
  }

  async getResources(): Promise<Resource[]> {
    // GET /v1/resources → List all
  }

  async getResource(id: string): Promise<Resource> {
    // GET /v1/resources/{id} → Single resource
  }
}
```

### Step 2: Types (`convex/docks/adapters/{provider}/types.ts`)

```typescript
export interface ProviderResource {
  id: string
  name: string
  status: string
  // Provider-specific fields
}

export interface ProviderResponse<T> {
  data: T[]
}
```

### Step 3: Adapter (`convex/docks/adapters/{provider}/adapter.ts`)

```typescript
export const providerAdapter: DockAdapter = {
  provider: "provider-name",

  async validateCredentials(apiKey: string): Promise<boolean> {
    const api = new ProviderAPI(apiKey)
    return await api.validateCredentials()
  },

  async syncServers(ctx: MutationCtx, dock: Doc<"docks">): Promise<void> {
    // Decrypt API key
    // Fetch resources
    // Map to universal schema
    // Upsert to `servers` table
  },

  async syncWebServices(ctx: MutationCtx, dock: Doc<"docks">): Promise<void> {
    // Similar pattern for `webServices`
  },

  async syncDomains(ctx: MutationCtx, dock: Doc<"docks">): Promise<void> {
    // Similar pattern for `domains`
  },

  async syncDatabases(ctx: MutationCtx, dock: Doc<"docks">): Promise<void> {
    // Similar pattern for `databases`
  },
}
```

### Step 4: Register Adapter (`convex/docks/adapters/index.ts`)

```typescript
import { gridpaneAdapter } from "./gridpane/adapter"
import { providerAdapter } from "./provider/adapter"

export const adapters: Record<string, DockAdapter> = {
  gridpane: gridpaneAdapter,
  "provider-name": providerAdapter,
}
```

---

## Testing Checklist (Per Provider)

- [ ] API client validates credentials correctly
- [ ] List endpoint fetches all resources
- [ ] Single resource endpoint fetches details
- [ ] Resources sync to correct universal table
- [ ] Status mapping works correctly
- [ ] `fullApiData` contains all provider-specific fields
- [ ] Data displays in UI tables
- [ ] RBAC filtering works (teams/clients see only their resources)
- [ ] Error handling works (invalid API key, network errors)

---

## Success Metrics

### Week 1 (Phase 1)
- ✅ 5 providers integrated
- ✅ Data displaying in tables
- ✅ Universal schema validated

### Week 2 (Phase 2)
- ✅ 10 providers integrated
- ✅ Cross-provider linking working
- ✅ RBAC filtering validated

### Week 3 (Phase 3)
- ✅ 15+ providers integrated (if time allows)
- ✅ Full cloud provider coverage
- ✅ Ready for Beacons extraction

---

## Risk Mitigation

### Risk 1: API Rate Limits
**Mitigation**: 
- Respect rate limits in adapter layer
- Add exponential backoff
- Track rate limit headers

### Risk 2: API Changes
**Mitigation**:
- Store API response examples in `docks/{provider}/`
- Document API versions
- Version adapter code

### Risk 3: Complex Cloud Provider APIs
**Mitigation**:
- Start with simple providers (DigitalOcean, Vultr)
- Build patterns with simple APIs
- Apply patterns to complex APIs (AWS, GCP, Azure)

### Risk 4: Universal Schema Gaps
**Mitigation**:
- Validate schema with GridPane first
- Add fields as needed (backward compatible)
- Document schema decisions

---

## Documentation Requirements

### Per Provider
1. **API Client** (`convex/docks/adapters/{provider}/api.ts`)
2. **Types** (`convex/docks/adapters/{provider}/types.ts`)
3. **Adapter** (`convex/docks/adapters/{provider}/adapter.ts`)
4. **README** (`convex/docks/adapters/{provider}/README.md`)
   - API rate limits
   - Field mappings (provider → universal)
   - Example usage
   - Known issues

### Global
1. **Provider Comparison** (`docs/architecture/PROVIDERS.md`)
   - Provider capabilities matrix
   - Universal table mappings
   - Cost endpoint availability

---

## Related Documents

- `convex/docks/adapters/gridpane/` - Reference implementation
- `convex/docks/_types.ts` - DockAdapter interface
- `convex/schema.ts` - Universal schema
- `docs/architecture/DEVELOPMENT_PRIORITY.md` - Development strategy
- `stand-downs/mission-4-execution-plan.md` - UI polish mission

---

## Next Steps

1. ✅ Review this strategy document
2. ✅ Prioritize providers based on needs
3. ✅ Start with Phase 1 (Week 1 providers)
4. ✅ Follow GridPane adapter pattern
5. ✅ Test each provider before moving to next
6. ✅ Document as you go

---

**Remember**: The goal is to prove the universal translation layer works across multiple providers. Quality > Quantity. Better to have 5 providers working perfectly than 11 providers with bugs.
