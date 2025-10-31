# GridPane Dock Adapter

GridPane adapter for StackDock - syncs servers, sites, and domains from GridPane to universal schema.

## API Endpoints Used

### List Endpoints (Implemented)
- `GET /oauth/api/v1/server` - List all servers
- `GET /oauth/api/v1/site` - List all sites (web services)
- `GET /oauth/api/v1/domain` - List all domains

### Detail Endpoints (Available but not used in sync)
- `GET /oauth/api/v1/server/{id}` - Single server detail
- `GET /oauth/api/v1/site/{id}` - Single site detail
- `GET /oauth/api/v1/domain/{id}` - Single domain detail

### Auth Endpoint
- `GET /oauth/api/v1/user` - Validate credentials (lightweight check)

## Field Mappings

### Servers → `servers` table
| GridPane Field | Universal Field | Notes |
|---------------|-----------------|-------|
| `id` | `providerResourceId` | Converted to string |
| `label` | `name` | Server name/hostname |
| `ip` | `primaryIpAddress` | Main IP address |
| `region` | `region` | Server region |
| `status` | `status` | Mapped: `active` → `running` |
| All other fields | `fullApiData` | Provider-specific data |

### Sites → `webServices` table
| GridPane Field | Universal Field | Notes |
|---------------|-----------------|-------|
| `id` | `providerResourceId` | Converted to string |
| `url` | `name` | Site URL |
| `url` | `productionUrl` | Prefixed with `https://` if needed |
| `type` / `url` | `environment` | Derived: staging/canary → staging/dev, else production |
| Derived | `status` | Based on `ssl_status` and `resolved_at` |
| All other fields | `fullApiData` | Provider-specific data |

### Domains → `domains` table
| GridPane Field | Universal Field | Notes |
|---------------|-----------------|-------|
| `id` | `providerResourceId` | Converted to string |
| `url` | `domainName` | Domain name |
| Derived | `expiresAt` | Estimated from `updated_at` + 1 year |
| Derived | `status` | Based on `ssl_status` and `resolved_at` |
| All other fields | `fullApiData` | Provider-specific data |

## Status Mapping

### Server Status
- `active` → `running`
- `inactive` → `stopped`
- `building` → `pending`
- `error` → `error`

### Site Status (derived)
- `ssl_status: "succeed"` + `resolved_at` → `running`
- `ssl_status: "failed"` → `error`
- Otherwise → `pending`

### Domain Status (derived)
- `ssl_status: "succeed"` + `resolved_at` → `active`
- `ssl_status: "failed"` → `error`
- Otherwise → `pending`

## Usage

```typescript
import { gridpaneAdapter } from "./adapters/gridpane/adapter"

// Validate credentials
const isValid = await gridpaneAdapter.validateCredentials(apiKey)

// Sync resources (called by dock sync mutation)
await gridpaneAdapter.syncServers(ctx, dock)
await gridpaneAdapter.syncWebServices(ctx, dock)
await gridpaneAdapter.syncDomains(ctx, dock)
```

## API Response Examples

See `docks/gridpane/` directory for actual API response examples:
- `server/getserverslist.json` - Server list response
- `site/getallsites.json` - Site list response
- `domain/getdomainslist.json` - Domain list response
- `user/getcurrentUser.json` - User/auth response

## Rate Limiting

GridPane API rate limits:
- Not documented in API docs
- Recommended: 60 requests/minute
- Sync operations batch resources, so limits should not be hit

## Error Handling

- API errors throw with status code and message
- Invalid credentials return `false` from `validateCredentials()`
- Network errors propagate (handled by caller)

