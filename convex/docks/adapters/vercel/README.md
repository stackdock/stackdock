# Vercel Dock Adapter

> **Provider**: Vercel  
> **Type**: PaaS (Web Services)  
> **API Docs**: https://vercel.com/docs/rest-api

## Overview

Vercel adapter syncs Vercel projects (web applications) to StackDock's universal `webServices` table.

**Important**: Vercel "projects" are provider resources, NOT StackDock projects. They sync to `webServices`. Users link them to StackDock projects manually via `projectResources` table.

## Endpoints Used

- `GET /v2/user` - Validate credentials
- `GET /v9/projects` - List all projects

## Field Mappings

| Universal Field | Vercel Source | Example |
|----------------|---------------|---------|
| `providerResourceId` | `project.id` | `"prj_8kpgj4jqKA28AHdtuidFVW7lij1U"` |
| `name` | `project.name` | `"vapr-ballistics-js-client"` |
| `productionUrl` | `targets.production.url` | `"https://vapr-ballistics-js-client-qxjujfn7z-vaos.vercel.app"` |
| `environment` | `targets.production.target` | `"production"` |
| `gitRepo` | `link.org + "/" + link.repo` | `"robsdevcraft/vapr-ballistics"` |
| `status` | `targets.production.readyState` | `"READY"` → `"running"` |

## Status Mapping

- `READY` → `running`
- `BUILDING` → `pending`
- `ERROR` → `error`
- `QUEUED` → `pending`
- `CANCELED` → `stopped`

## API Rate Limits

- 100 requests per 10 seconds per team
- See: https://vercel.com/docs/rest-api#rate-limits

## Authentication

Bearer token in `Authorization` header:
```
Authorization: Bearer {apiKey}
```

## Example Usage

```typescript
import { vercelAdapter } from "./adapters/vercel/adapter"

// Validate credentials
const isValid = await vercelAdapter.validateCredentials(apiKey)

// Sync web services
await vercelAdapter.syncWebServices(ctx, dock)
```

## API Response Examples

See `docks/vercel/` directory for actual API response examples:
- `docks/vercel/projects/retrievealistofprojects.json`
- `docks/vercel/deployments/listdeployments.json`
- `docks/vercel/domains/listalldomains.json`
