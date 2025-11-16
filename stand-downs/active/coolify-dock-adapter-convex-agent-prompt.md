# Coolify Dock Adapter Implementation Plan

**Date**: November 15, 2025  
**Status**: Ready for Implementation  
**Priority**: High  
**Agent**: Convex Backend Agent  
**Estimated Time**: 2-3 hours

## Overview

Implement a dock adapter for **Coolify** (self-hosted PaaS platform) that syncs:
- **Servers** → `servers` table
- **Services** (applications/deployments) → `webServices` table  
- **Projects** → `projects` table (optional, for linking)
- **Databases** → `databases` table (extracted from services)

**Coolify API Base URL**: `https://app.coolify.io/api/v1` (or user's self-hosted instance)

## Data Mapping

### 1. Servers → `servers` Table

**Source**: `GET /api/v1/servers`  
**Sample Data**: `docks/coolify/listServers.json`

**Mapping**:
```typescript
{
  provider: "coolify",
  providerResourceId: server.uuid, // "wsckkgkwooowosokc0g0c04w"
  name: server.name, // "sd-do-coolify-web"
  primaryIpAddress: server.ip, // "165.227.97.118"
  status: mapCoolifyServerStatus(server.is_reachable, server.is_usable),
  fullApiData: {
    port: server.port,
    user: server.user,
    description: server.description,
    is_coolify_host: server.is_coolify_host,
    proxy: server.proxy,
    settings: server.settings, // All Docker/build configs
  }
}
```

**Status Mapping**:
```typescript
function mapCoolifyServerStatus(isReachable: boolean, isUsable: boolean): string {
  if (isReachable && isUsable) return "running"
  if (!isReachable) return "stopped"
  return "pending" // If reachable but not usable
}
```

### 2. Services → `webServices` Table

**Source**: `GET /api/v1/services`  
**Sample Data**: `docks/coolify/getServices.json`

**Key Insight**: Each service contains:
- `applications[]` - Deployed applications (with FQDN/URL)
- `databases[]` - Databases used by the service
- `server` - Server it's deployed on

**Mapping**:
```typescript
// For each service in getServices.json:
{
  provider: "coolify",
  providerResourceId: service.uuid, // "gkkkkskko0o40oc44swww440"
  name: service.name, // "sd-coolify-wp"
  productionUrl: service.applications[0]?.fqdn || null,
    // "http://wordpress-gkkkkskko0o40oc44swww440.172.236.241.179.sslip.io"
  environment: service.environment_id?.toString() || "production",
  status: mapCoolifyServiceStatus(service.status),
    // "running:healthy" → "running"
    // "stopped" → "stopped"
  fullApiData: {
    // Service-level data
    service_type: service.service_type, // "wordpress-with-mariadb"
    server_id: service.server_id,
    server_status: service.server_status,
    destination_type: service.destination_type,
    destination_id: service.destination_id,
    config_hash: service.config_hash,
    
    // Nested applications (all of them)
    applications: service.applications.map(app => ({
      id: app.id,
      uuid: app.uuid,
      name: app.name,
      fqdn: app.fqdn,
      status: app.status,
      image: app.image,
      ports: app.ports,
      last_online_at: app.last_online_at,
    })),
    
    // Nested databases (could also sync to databases table!)
    databases: service.databases.map(db => ({
      id: db.id,
      uuid: db.uuid,
      name: db.name,
      status: db.status,
      image: db.image,
    })),
    
    // Server info (denormalized)
    server: {
      id: service.server.id,
      uuid: service.server.uuid,
      name: service.server.name,
      ip: service.server.ip,
    },
    
    // Timestamps
    created_at: service.created_at,
    updated_at: service.updated_at,
  }
}
```

**Status Mapping**:
```typescript
function mapCoolifyServiceStatus(status: string): string {
  if (status.includes("running")) return "running"
  if (status.includes("stopped")) return "stopped"
  if (status.includes("building") || status.includes("deploying")) return "pending"
  if (status.includes("error") || status.includes("failed")) return "error"
  return "unknown"
}
```

### 3. Projects → `projects` Table (Optional)

**Source**: `GET /api/v1/projects`  
**Sample Data**: `docks/coolify/listProjects.json`

**Note**: Projects in Coolify are logical groupings (like StackDock projects). You can sync these for linking via `projectResources`, but they're not required for MVP.

**Mapping**:
```typescript
{
  name: project.name, // "StackDock Test"
  fullApiData: {
    id: project.id,
    uuid: project.uuid,
    description: project.description,
  }
}
```

### 4. Databases → `databases` Table (Optional)

**Source**: Extracted from `service.databases[]` in services response

**Mapping**:
```typescript
// For each database in service.databases:
{
  provider: "coolify",
  providerResourceId: db.uuid, // "qw0wsk48scocwokgowoko0o0"
  name: db.name, // "mariadb"
  engine: extractEngine(db.image), // "mariadb" from "mariadb:11"
  version: extractVersion(db.image), // "11" from "mariadb:11"
  status: mapCoolifyServiceStatus(db.status), // "running (healthy)" → "running"
  fullApiData: {
    service_id: db.service_id,
    image: db.image,
    ports: db.ports,
    is_public: db.is_public,
    public_port: db.public_port,
    last_online_at: db.last_online_at,
  }
}
```

**Helper Functions**:
```typescript
function extractEngine(image: string): string {
  // "mariadb:11" → "mariadb"
  // "postgres:15" → "postgres"
  // "mysql:8" → "mysql"
  return image.split(":")[0] || "unknown"
}

function extractVersion(image: string): string | undefined {
  // "mariadb:11" → "11"
  const parts = image.split(":")
  return parts.length > 1 ? parts[1] : undefined
}
```

## File Structure

Create the following files in `convex/docks/adapters/coolify/`:

```
convex/docks/adapters/coolify/
├── types.ts          # TypeScript interfaces for Coolify API responses
├── api.ts            # CoolifyAPI class (HTTP client)
├── adapter.ts        # coolifyAdapter implementation
└── index.ts          # Export adapter
```

## Implementation Steps

### Step 1: Create Types (`types.ts`)

Define TypeScript interfaces based on the JSON samples:

```typescript
// Based on listServers.json
export interface CoolifyServer {
  uuid: string
  name: string
  description: string
  ip: string
  port: number
  user: string
  is_coolify_host: boolean
  is_reachable: boolean
  is_usable: boolean
  proxy: {
    redirect_enabled: boolean
    // ... other proxy fields
  }
  settings: {
    // All settings fields from JSON
    id: number
    concurrent_builds: number
    // ... etc
  }
}

// Based on getServices.json
export interface CoolifyApplication {
  id: number
  uuid: string
  name: string
  fqdn: string
  status: string
  image: string
  ports: string
  last_online_at: string
  // ... other fields
}

export interface CoolifyDatabase {
  id: number
  uuid: string
  name: string
  status: string
  image: string
  ports: string
  is_public: boolean
  public_port: number | null
  // ... other fields
}

export interface CoolifyService {
  uuid: string
  name: string
  environment_id: number
  server_id: number
  service_type: string
  status: string
  server_status: boolean
  applications: CoolifyApplication[]
  databases: CoolifyDatabase[]
  server: {
    id: number
    uuid: string
    name: string
    ip: string
  }
  created_at: string
  updated_at: string
  // ... other fields
}

// Based on listProjects.json
export interface CoolifyProject {
  id: number
  uuid: string
  name: string
  description: string
}
```

### Step 2: Create API Client (`api.ts`)

**Coolify Authentication**: Uses Bearer token (API key)

**API Client Pattern** (follow Hetzner example):
```typescript
export class CoolifyAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://app.coolify.io/api/v1") {
    this.apiKey = apiKey.trim()
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`Coolify API error (${response.status}): ${errorText}`)
    }

    return response.json()
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Use lightweight endpoint (health or servers with limit)
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })
      
      if (response.status === 401) return false
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(`Coolify API error (${response.status}): ${errorText}`)
      }
      return true
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to validate Coolify credentials: ${error.message}`)
      }
      throw error
    }
  }

  async listServers(): Promise<CoolifyServer[]> {
    return this.request<CoolifyServer[]>("/servers")
  }

  async listServices(): Promise<CoolifyService[]> {
    return this.request<CoolifyService[]>("/services")
  }

  async listProjects(): Promise<CoolifyProject[]> {
    return this.request<CoolifyProject[]>("/projects")
  }
}
```

### Step 3: Create Adapter (`adapter.ts`)

Follow the Hetzner adapter pattern:

```typescript
import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { CoolifyAPI } from "./api"
import type { CoolifyServer, CoolifyService } from "./types"

// Status mapping functions (as defined above)
function mapCoolifyServerStatus(isReachable: boolean, isUsable: boolean): string {
  if (isReachable && isUsable) return "running"
  if (!isReachable) return "stopped"
  return "pending"
}

function mapCoolifyServiceStatus(status: string): string {
  if (status.includes("running")) return "running"
  if (status.includes("stopped")) return "stopped"
  if (status.includes("building") || status.includes("deploying")) return "pending"
  if (status.includes("error") || status.includes("failed")) return "error"
  return "unknown"
}

export const coolifyAdapter: DockAdapter = {
  provider: "coolify",

  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new CoolifyAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("Coolify credential validation failed:", error)
      throw error
    }
  },

  async syncServers(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: CoolifyServer[]
  ): Promise<void> {
    let servers: CoolifyServer[]

    if (preFetchedData) {
      servers = preFetchedData
    } else {
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new CoolifyAPI(apiKey)
      servers = await api.listServers()
    }

    for (const server of servers) {
      const providerResourceId = server.uuid
      
      const existing = await ctx.db
        .query("servers")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      const serverData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "coolify",
        providerResourceId,
        name: server.name,
        primaryIpAddress: server.ip,
        status: mapCoolifyServerStatus(server.is_reachable, server.is_usable),
        fullApiData: {
          port: server.port,
          user: server.user,
          description: server.description,
          is_coolify_host: server.is_coolify_host,
          proxy: server.proxy,
          settings: server.settings,
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, serverData)
      } else {
        await ctx.db.insert("servers", serverData)
      }
    }
  },

  async syncWebServices(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: CoolifyService[]
  ): Promise<void> {
    let services: CoolifyService[]

    if (preFetchedData) {
      services = preFetchedData
    } else {
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new CoolifyAPI(apiKey)
      services = await api.listServices()
    }

    for (const service of services) {
      const providerResourceId = service.uuid
      
      const existing = await ctx.db
        .query("webServices")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      // Use first application's FQDN as production URL
      const productionUrl = service.applications[0]?.fqdn || undefined

      const webServiceData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "coolify",
        providerResourceId,
        name: service.name,
        productionUrl,
        environment: service.environment_id?.toString() || "production",
        status: mapCoolifyServiceStatus(service.status),
        fullApiData: {
          service_type: service.service_type,
          server_id: service.server_id,
          server_status: service.server_status,
          destination_type: service.destination_type,
          destination_id: service.destination_id,
          config_hash: service.config_hash,
          applications: service.applications,
          databases: service.databases,
          server: service.server,
          created_at: service.created_at,
          updated_at: service.updated_at,
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, webServiceData)
      } else {
        await ctx.db.insert("webServices", webServiceData)
      }
    }
  },

  // Optional: Sync databases from services
  async syncDatabases(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: Array<CoolifyDatabase & { service_uuid?: string; service_name?: string }>
  ): Promise<void> {
    // Pre-fetched data is already extracted databases (from action)
    // If not provided, fetch services and extract databases
    let databases: Array<CoolifyDatabase & { service_uuid?: string; service_name?: string }>

    if (preFetchedData) {
      databases = preFetchedData
    } else {
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new CoolifyAPI(apiKey)
      const services = await api.listServices()
      
      // Extract all databases from all services
      databases = services.flatMap(service => 
        service.databases.map(db => ({
          ...db,
          service_uuid: service.uuid,
          service_name: service.name,
        }))
      )
    }

    for (const db of databases) {
      const providerResourceId = db.uuid
      
      const existing = await ctx.db
        .query("databases")
        .withIndex("by_dock_resource", (q) =>
          q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
        )
        .first()

      // Extract engine and version from image
      const imageParts = db.image.split(":")
      const engine = imageParts[0] || "unknown"
      const version = imageParts[1] || undefined

      const databaseData = {
        orgId: dock.orgId,
        dockId: dock._id,
        provider: "coolify",
        providerResourceId,
        name: db.name,
        engine,
        version,
        status: mapCoolifyServiceStatus(db.status),
        fullApiData: {
          service_id: db.service_id,
          image: db.image,
          ports: db.ports,
          is_public: db.is_public,
          public_port: db.public_port,
          last_online_at: db.last_online_at,
          service_uuid: db.service_uuid,
          service_name: db.service_name,
        },
        updatedAt: Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, databaseData)
      } else {
        await ctx.db.insert("databases", databaseData)
      }
    }
  },
}
```

### Step 4: Create Index (`index.ts`)

```typescript
export { coolifyAdapter } from "./adapter"
export { CoolifyAPI } from "./api"
export * from "./types"
```

### Step 5: Register Adapter

**Update `convex/docks/registry.ts`**:

1. Import:
```typescript
import { coolifyAdapter } from "./adapters/coolify"
```

2. Add to registry:
```typescript
const adapterRegistry: Record<string, DockAdapter> = {
  // ... existing adapters
  coolify: coolifyAdapter,
}
```

3. Add metadata:
```typescript
const providerMetadata: Record<string, { displayName: string }> = {
  // ... existing providers
  coolify: { displayName: "Coolify" },
}
```

### Step 6: Update Actions

**Update `convex/docks/actions.ts`**:

1. Import:
```typescript
import { CoolifyAPI } from "./adapters/coolify/api"
```

2. Add Coolify case in `syncDockResources` action:
```typescript
} else if (args.provider === "coolify") {
  const api = new CoolifyAPI(args.apiKey)

  if (args.resourceTypes.includes("servers")) {
    console.log(`[Dock Action] Fetching servers for ${args.provider}`)
    servers = await api.listServers()
  }

  // Always fetch services if webServices OR databases are requested
      // (databases are nested in services)
  if (args.resourceTypes.includes("webServices") || args.resourceTypes.includes("databases")) {
    console.log(`[Dock Action] Fetching services for ${args.provider}`)
    const services = await api.listServices()
    
    if (args.resourceTypes.includes("webServices")) {
      webServices = services
    }
    
    // Extract databases from services if requested
    if (args.resourceTypes.includes("databases")) {
      // Flatten databases from all services
      databases = services.flatMap(service => 
        service.databases.map(db => ({
          ...db,
          service_uuid: service.uuid,
          service_name: service.name,
        }))
      )
    }
  }

  // Coolify doesn't have separate domains endpoint
  if (args.resourceTypes.includes("domains")) {
    console.log(`[Dock Action] Domains not supported for ${args.provider}`)
    domains = []
  }
}
```

**Note**: The action extracts databases from services and passes them as a flat array. The adapter's `syncDatabases` method receives this array directly (not services).

## Testing Checklist

- [ ] Credential validation works (`validateCredentials`)
- [ ] Servers sync correctly (`syncServers`)
- [ ] Services sync correctly (`syncWebServices`)
- [ ] Databases extract correctly from services (`syncDatabases`)
- [ ] Status mappings work correctly
- [ ] Upsert logic prevents duplicates
- [ ] `fullApiData` contains all provider-specific fields
- [ ] Error handling works for invalid API keys
- [ ] Error handling works for network errors

## API Endpoints Reference

From `docks/coolify/endpoints.md`:
- `GET /api/v1/health` - Health check (for validation)
- `GET /api/v1/servers` - List servers
- `GET /api/v1/services` - List services (contains applications + databases)
- `GET /api/v1/projects` - List projects (optional)

## Notes

1. **Base URL**: Default is `https://app.coolify.io/api/v1`, but users may self-host. For MVP, hardcode the default. Future enhancement: Add `baseUrl` field to `docks` table and make it configurable.

2. **API Authentication**: Coolify uses Bearer token authentication. The API key is passed in the `Authorization` header as `Bearer {apiKey}`.

3. **Databases**: Coolify databases are nested in services, not a separate endpoint. The action extracts them from `service.databases[]` and passes them as a flat array to the adapter.

4. **Applications**: Each service can have multiple applications. Currently using `applications[0].fqdn` as the primary URL. All applications are stored in `fullApiData.applications[]`.

5. **Projects**: Projects are optional. They're logical groupings in Coolify (like StackDock projects). Can be synced for linking via `projectResources`, but not required for MVP.

6. **Status Mapping**: Coolify uses descriptive statuses like "running:healthy" or "running (healthy)". Map these to universal statuses: "running", "stopped", "pending", "error".

## Success Criteria

✅ Coolify adapter registered and working  
✅ Servers sync to `servers` table  
✅ Services sync to `webServices` table with URLs  
✅ Databases extract from services and sync to `databases` table  
✅ All data properly mapped to universal schema  
✅ Status mappings work correctly  
✅ `fullApiData` preserves all provider-specific fields  

## Reference Files

- Sample data: `docks/coolify/*.json`
- Endpoints: `docks/coolify/endpoints.md`
- Adapter pattern: `convex/docks/adapters/hetzner/`
- Interface: `convex/docks/_types.ts`
- Registry: `convex/docks/registry.ts`
- Actions: `convex/docks/actions.ts`
- Mutations: `convex/docks/mutations.ts`

---

**Ready to implement!** Follow the Hetzner adapter pattern and use the sample JSON files as reference for the exact data structure.
