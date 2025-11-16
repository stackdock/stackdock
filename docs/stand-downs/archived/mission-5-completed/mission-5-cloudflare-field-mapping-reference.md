# Cloudflare Field Mapping Reference

> **Quick Reference**: Field mappings from Cloudflare API to Universal Schema  
> **Source**: `docks/cloudflare/` JSON files  
> **Target**: `convex/schema.ts` → `domains` and `webServices` tables

---

## Zones → Domains Table

| Universal Field | Cloudflare Source | Extraction Logic | Example |
|----------------|------------------|------------------|---------|
| `providerResourceId` | `zone.id` | Direct | `"99d49ad924b01325f6c8aea94c1923bf"` |
| `domainName` | `zone.name` | Direct | `"apexoutdoorsman.com"` |
| `status` | `zone.status` | Map via function | `"active"` → `"active"` |
| `updatedAt` | `zone.modified_on` | Convert ISO to timestamp | `"2020-11-16T16:07:21.413505Z"` → `1605548841413` |
| `expiresAt` | N/A | DNS zones don't expire | `undefined` |
| `fullApiData` | `zone` + `dnsRecords` | Entire object + DNS records array | `{ id, name, status, plan, dnsRecords: [...] }` |

---

## Pages → WebServices Table

| Universal Field | Cloudflare Source | Extraction Logic | Example |
|----------------|------------------|------------------|---------|
| `providerResourceId` | `page.id` | Direct | `"35829cc2-322a-4f5d-af33-6f4050add5e4"` |
| `name` | `page.name` | Direct | `"vapr-ballistics"` |
| `productionUrl` | `canonical_deployment.url` (prefer) or `domains[0]` | Prefer canonical deployment URL | `"https://163542b1.vapr-ballistics.pages.dev"` |
| `environment` | `page.production_branch` | Direct | `"main"` |
| `gitRepo` | `source.config.owner` + `repo_name` | Format as `"owner/repo"` | `"robsdevcraft/vapr-ballistics"` |
| `status` | `canonical_deployment.latest_stage.status` | Map via function | `"success"` → `"running"` |
| `fullApiData` | `page` | Entire object + `type: "pages"` | `{ type: "pages", id, name, domains, ... }` |

---

## Workers → WebServices Table

| Universal Field | Cloudflare Source | Extraction Logic | Example |
|----------------|------------------|------------------|---------|
| `providerResourceId` | `worker.id` | Direct | `"620112e7b94345d0a16e8c5bdb539067"` |
| `name` | `worker.name` | Direct | `"cloudflare-workers-next-template"` |
| `productionUrl` | `subdomain.enabled` | Build URL if enabled | `"https://cloudflare-workers-next-template.workers.dev"` |
| `environment` | Always `"production"` | Direct | `"production"` |
| `status` | Always `"running"` | Workers are always running if deployed | `"running"` |
| `fullApiData` | `worker` | Entire object + `type: "workers"` | `{ type: "workers", id, name, subdomain, ... }` |

---

## Status Mappings

### Zone Status → Universal Status

```typescript
"active" → "active"
"pending" → "pending"
"initializing" → "pending"
"moved" → "active" (zone moved to another account, still active)
"deleted" → "stopped"
"read_only" → "active" (read-only mode, still active)
```

### Pages Deployment Status → Universal Status

```typescript
"success" → "running"
"failure" → "error"
"idle" → "pending"
undefined → "pending"
```

### Workers Status → Universal Status

```typescript
Always → "running" (if deployed)
```

---

## Edge Case Handling

### Missing Account ID
```typescript
// Extract from zones response during first sync
const accountId = zones[0]?.account?.id
if (accountId && !dock.accountId) {
  await ctx.db.patch(dock._id, { accountId })
}
```

### Missing Production URL (Pages)
```typescript
// Prefer canonical deployment URL
if (page.canonical_deployment?.url) {
  productionUrl = page.canonical_deployment.url
}
// Fall back to first custom domain
else if (page.domains?.[0]) {
  productionUrl = page.domains[0].startsWith("http") 
    ? page.domains[0] 
    : `https://${page.domains[0]}`
}
// Fall back to subdomain
else if (page.subdomain) {
  productionUrl = `https://${page.subdomain}`
}
```

### Missing Git Repo (Pages)
```typescript
// Extract from source config
if (page.source?.config) {
  const { owner, repo_name } = page.source.config
  if (owner && repo_name) {
    gitRepo = `${owner}/${repo_name}`
  }
}
```

### DNS Records Fetch Failure
```typescript
// Continue syncing other zones even if one fails
try {
  const records = await api.getDNSRecords(zone.id)
  // Store in domain's fullApiData
} catch (error) {
  console.error(`Failed to fetch DNS records for zone ${zone.id}:`, error)
  // Continue with next zone
}
```

### Missing Production URL (Workers)
```typescript
// Build URL from subdomain if enabled
if (worker.subdomain?.enabled) {
  productionUrl = `https://${worker.name}.workers.dev`
}
// Can be undefined if subdomain disabled
```

---

## Code Snippets

### Get Production URL (Pages)
```typescript
function getPagesProductionUrl(page: CloudflarePage): string | undefined {
  // Prefer canonical deployment URL (production)
  if (page.canonical_deployment?.url) {
    return page.canonical_deployment.url
  }
  
  // Fall back to first custom domain
  if (page.domains?.[0]) {
    const domain = page.domains[0]
    return domain.startsWith("http") ? domain : `https://${domain}`
  }
  
  // Fall back to subdomain
  if (page.subdomain) {
    return `https://${page.subdomain}`
  }
  
  return undefined
}
```

### Get Git Repo (Pages)
```typescript
function getPagesGitRepo(page: CloudflarePage): string | undefined {
  if (!page.source?.config) return undefined
  
  const { owner, repo_name } = page.source.config
  if (owner && repo_name) {
    return `${owner}/${repo_name}`
  }
  
  return undefined
}
```

### Map Zone Status
```typescript
function mapCloudflareZoneStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "active",
    pending: "pending",
    initializing: "pending",
    moved: "active",
    deleted: "stopped",
    read_only: "active",
  }
  return statusMap[status] || status.toLowerCase()
}
```

### Map Pages Status
```typescript
function mapCloudflarePagesStatus(deployment?: CloudflarePage["canonical_deployment"]): string {
  if (!deployment) return "pending"
  
  const stageStatus = deployment.latest_stage?.status
  if (stageStatus === "success") return "running"
  if (stageStatus === "failure") return "error"
  if (stageStatus === "idle") return "pending"
  
  return "pending"
}
```

### Convert ISO to Timestamp
```typescript
function isoToTimestamp(iso: string): number {
  return new Date(iso).getTime()
}
```

---

## Example Mappings

### Zone → Domain

**Input** (Cloudflare Zone):
```json
{
  "id": "99d49ad924b01325f6c8aea94c1923bf",
  "name": "apexoutdoorsman.com",
  "status": "active",
  "account": {
    "id": "3f639213140929b3a61a48de78cb9f6f"
  },
  "modified_on": "2020-11-16T16:07:21.413505Z"
}
```

**Output** (Universal domains):
```typescript
{
  providerResourceId: "99d49ad924b01325f6c8aea94c1923bf",
  domainName: "apexoutdoorsman.com",
  status: "active",  // active → active
  updatedAt: 1605548841413,  // ISO converted
  expiresAt: undefined,  // DNS zones don't expire
  fullApiData: { /* entire zone object + dnsRecords */ }
}
```

### Page → WebService

**Input** (Cloudflare Page):
```json
{
  "id": "35829cc2-322a-4f5d-af33-6f4050add5e4",
  "name": "vapr-ballistics",
  "domains": ["vaprballistics.com"],
  "canonical_deployment": {
    "url": "https://163542b1.vapr-ballistics.pages.dev",
    "latest_stage": { "status": "success" }
  },
  "source": {
    "config": {
      "owner": "robsdevcraft",
      "repo_name": "vapr-ballistics"
    }
  }
}
```

**Output** (Universal webServices):
```typescript
{
  providerResourceId: "35829cc2-322a-4f5d-af33-6f4050add5e4",
  name: "vapr-ballistics",
  productionUrl: "https://163542b1.vapr-ballistics.pages.dev",
  environment: "main",
  gitRepo: "robsdevcraft/vapr-ballistics",
  status: "running",  // success → running
  fullApiData: { type: "pages", /* entire page object */ }
}
```

### Worker → WebService

**Input** (Cloudflare Worker):
```json
{
  "id": "620112e7b94345d0a16e8c5bdb539067",
  "name": "cloudflare-workers-next-template",
  "subdomain": { "enabled": true }
}
```

**Output** (Universal webServices):
```typescript
{
  providerResourceId: "620112e7b94345d0a16e8c5bdb539067",
  name: "cloudflare-workers-next-template",
  productionUrl: "https://cloudflare-workers-next-template.workers.dev",
  environment: "production",
  status: "running",  // Always running if deployed
  fullApiData: { type: "workers", /* entire worker object */ }
}
```

---

## Validation Rules

- ✅ `providerResourceId` must be zone/page/worker `id` (not name)
- ✅ `domainName` must be zone `name` (full domain)
- ✅ `productionUrl` must prefer canonical deployment for Pages
- ✅ `gitRepo` format must be `"owner/repo"` (not full URL)
- ✅ `status` must be mapped via status mapping functions
- ✅ `fullApiData` must contain entire object + `type` field for Pages/Workers
- ✅ DNS records must be stored in `domains.fullApiData.dnsRecords`

---

**Use this as a quick reference while implementing the adapter.**

