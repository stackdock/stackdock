# Cloudflare Dock Adapter

> **Provider**: Cloudflare  
> **Type**: Multi-Service (DNS, Pages, Workers)  
> **API Docs**: https://developers.cloudflare.com/api/

## Overview

Cloudflare adapter syncs multiple Cloudflare resource types to StackDock's universal tables:
- **DNS Zones** → `domains` table (first adapter to populate domains!)
- **Pages** → `webServices` table (similar to Vercel/Netlify)
- **Workers** → `webServices` table (serverless functions)
- **DNS Records** → Stored in `domains.fullApiData.dnsRecords`

**Important**: Cloudflare zones/pages/workers are provider resources, NOT StackDock projects. They sync to universal tables. Users link them to StackDock projects manually via `projectResources` table.

## Endpoints Used

- `GET /user/tokens/verify` - Validate credentials
- `GET /zones` - List DNS zones
- `GET /zones/{zone_id}/dns_records` - Get DNS records for a zone
- `GET /accounts/{account_id}/pages/projects` - List Pages projects
- `GET /accounts/{account_id}/workers/scripts` - List Workers scripts

## Field Mappings

### Zones → Domains Table

| Universal Field | Cloudflare Source | Example |
|----------------|-------------------|---------|
| `providerResourceId` | `zone.id` | `"99d49ad924b01325f6c8aea94c1923bf"` |
| `domainName` | `zone.name` | `"apexoutdoorsman.com"` |
| `status` | `zone.status` | `"active"` → `"active"` |
| `expiresAt` | `undefined` | DNS zones don't expire |
| `fullApiData` | Entire `zone` object | All zone fields |
| `fullApiData.dnsRecords` | DNS records array | Fetched separately per zone |

### Pages → WebServices Table

| Universal Field | Cloudflare Source | Example |
|----------------|-------------------|---------|
| `providerResourceId` | `page.id` | `"35829cc2-322a-4f5d-af33-6f4050add5e4"` |
| `name` | `page.name` | `"vapr-ballistics"` |
| `productionUrl` | `canonical_deployment.url` or `domains[0]` | `"https://vapr-ballistics.pages.dev"` |
| `environment` | `production_branch` | `"production"` |
| `gitRepo` | `source.config.owner/repo_name` | `"robsdevcraft/vapr-ballistics"` |
| `status` | `canonical_deployment.latest_stage.status` | `"success"` → `"running"` |
| `fullApiData.type` | `"pages"` | Type marker |
| `fullApiData` | Entire `page` object | All page fields |

### Workers → WebServices Table

| Universal Field | Cloudflare Source | Example |
|----------------|-------------------|---------|
| `providerResourceId` | `worker.id` | `"620112e7b94345d0a16e8c5bdb539067"` |
| `name` | `worker.name` | `"cloudflare-workers-next-template"` |
| `productionUrl` | `https://{name}.workers.dev` | `"https://cloudflare-workers-next-template.workers.dev"` |
| `environment` | Always `"production"` | `"production"` |
| `status` | Always `"running"` | Workers are always running if deployed |
| `fullApiData.type` | `"workers"` | Type marker |
| `fullApiData` | Entire `worker` object | All worker fields |

## Status Mapping

### Zone Status
- `active` → `active`
- `pending` → `pending`
- `initializing` → `pending`
- `moved` → `active` (zone moved to another account, still active)
- `deleted` → `stopped`
- `read_only` → `active` (read-only mode, still active)

### Pages Deployment Status
- `success` → `running`
- `failure` → `error`
- `idle` → `pending`
- No deployment → `pending`

### Workers Status
- Always `running` (if deployed)

## API Rate Limits

- 1,200 requests per 5 minutes per API token
- See: https://developers.cloudflare.com/fundamentals/api/reference/limits/

## Authentication

Bearer token in `Authorization` header:
```
Authorization: Bearer {apiToken}
```

**Note**: Cloudflare supports both API tokens (preferred) and API key + email (legacy). This adapter uses API tokens.

## Account ID

Cloudflare Pages and Workers endpoints require an account ID. The adapter:
1. Extracts account ID from first zone during `syncDomains()`
2. Stores it in `dock.accountId` for future API calls
3. Uses stored account ID for Pages/Workers sync

## Example Usage

```typescript
import { cloudflareAdapter } from "./adapters/cloudflare/adapter"

// Validate credentials
const isValid = await cloudflareAdapter.validateCredentials(apiToken)

// Sync domains (zones)
await cloudflareAdapter.syncDomains(ctx, dock)

// Sync web services (Pages + Workers)
await cloudflareAdapter.syncWebServices(ctx, dock)
```

## API Response Examples

See `docks/cloudflare/` directory for actual API response examples:
- `docks/cloudflare/zones/listZones.json`
- `docks/cloudflare/pages/getProjects.json`
- `docks/cloudflare/workers/getWorkersList.json`
- `docks/cloudflare/dns/records/getDNSRecordsbyZoneID.json`

## Edge Cases

### Missing Account ID
- Extract from zones response during first sync
- Store in `dock.accountId` for future API calls
- Throw error if Pages/Workers sync attempted without account ID

### DNS Records Fetch Failure
- Continue syncing other zones even if one fails
- Log error but don't fail entire sync
- DNS records are optional metadata

### Missing Production URL
- Pages: Fall back to subdomain if no custom domain
- Workers: Use subdomain pattern if enabled
- Can be `undefined` if not available

### Multiple Account IDs
- Use first zone's account ID (all zones in same account)
- If zones from different accounts, use most common account ID
