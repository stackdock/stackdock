# Netlify Dock Adapter

> **Provider**: Netlify  
> **Type**: PaaS (Web Services)  
> **API Docs**: https://docs.netlify.com/api/get-started/

## Overview

Netlify adapter syncs Netlify sites (web applications) to StackDock's universal `webServices` table.

**Important**: Netlify "sites" are provider resources, NOT StackDock projects. They sync to `webServices`. Users link them to StackDock projects manually via `projectResources` table.

## Endpoints Used

- `GET /api/v1/user` - Validate credentials
- `GET /api/v1/sites` - List all sites

## Field Mappings

| Universal Field | Netlify Source | Example |
|----------------|---------------|---------|
| `providerResourceId` | `site.id` | `"fc7cd4a9-6639-4a6a-907b-844526a43b87"` |
| `name` | `site.name` | `"stackdock-docs"` |
| `productionUrl` | `site.ssl_url` (prefer) or `site.url` | `"https://stackdock-docs.netlify.app"` |
| `environment` | Always `"production"` | `"production"` |
| `gitRepo` | `build_settings.repo_path` | `"stackdock/docs"` |
| `status` | `lifecycle_state` | `"active"` → `"running"` |

## Status Mapping

- `active` → `running`
- `inactive` → `stopped`
- `suspended` → `stopped`
- `deleted` → `stopped`
- `state: "current"` (if lifecycle_state missing) → `running`
- Default → `pending`

## API Rate Limits

- 1000 requests per hour per access token
- See: https://docs.netlify.com/api/get-started/#rate-limits

## Authentication

Bearer token in `Authorization` header:
```
Authorization: Bearer {apiKey}
```

## Example Usage

```typescript
import { netlifyAdapter } from "./adapters/netlify/adapter"

// Validate credentials
const isValid = await netlifyAdapter.validateCredentials(apiKey)

// Sync web services
await netlifyAdapter.syncWebServices(ctx, dock)
```

## API Response Examples

See `docks/netlify/` directory for actual API response examples:
- `docks/netlify/site/listSites.json`
