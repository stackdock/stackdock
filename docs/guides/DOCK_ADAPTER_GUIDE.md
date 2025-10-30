# Dock Adapter Development Guide

> Learn how to build a dock adapter that translates any provider API to StackDock's universal schema.

## Table of Contents

1. [What is a Dock Adapter?](#what-is-a-dock-adapter)
2. [Adapter Interface](#adapter-interface)
3. [Step-by-Step Tutorial](#step-by-step-tutorial)
4. [Universal Table Mapping](#universal-table-mapping)
5. [Rate Limiting](#rate-limiting)
6. [Error Handling](#error-handling)
7. [Testing](#testing)
8. [Publishing](#publishing)

---

## What is a Dock Adapter?

A **dock adapter** is a translator that converts a provider's API into StackDock's universal schema.

**Example Flow**:
```
GridPane API Response     →  GridPane Adapter  →  Universal webServices Table
{                                                  {
  id: 12345,                                         provider: "gridpane",
  name: "site.com",          TRANSLATES TO         providerResourceId: "12345",
  primary_domain: "site.com",                       name: "site.com",
  status: "running",                                productionUrl: "site.com",
  phpVersion: "8.2",                                status: "running",
  backup_schedule: "daily"                          fullApiData: { /* original */ }
}                                                  }
```

### Why Adapters Matter

- **Extensibility**: Anyone can add support for new providers
- **Maintainability**: Each provider is isolated (changes don't cascade)
- **Ownership**: You copy the adapter into your repo (fork/modify as needed)

---

## Adapter Interface

Every adapter must implement:

```typescript
// convex/docks/_types.ts
export interface DockAdapter {
  provider: string                    // Unique identifier (e.g., "gridpane")
  
  // Validate API credentials before saving
  validateCredentials(apiKey: string): Promise<boolean>
  
  // Sync functions (one per resource type)
  syncWebServices?(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>
  syncServers?(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>
  syncDomains?(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>
  syncDatabases?(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>
  
  // Optional: Mutation operations (future)
  restartServer?(ctx: MutationCtx, serverId: string): Promise<void>
  deploySite?(ctx: MutationCtx, siteId: string): Promise<void>
  clearCache?(ctx: MutationCtx, siteId: string): Promise<void>
}
```

---

## Step-by-Step Tutorial

### Example: Building a Vercel Adapter

#### Step 1: Create Adapter File

```bash
packages/docks/vercel/
├── adapter.ts        # Main adapter logic
├── api.ts            # API client
├── types.ts          # TypeScript types
├── README.md         # Documentation
└── package.json
```

#### Step 2: Build API Client

```typescript
// packages/docks/vercel/api.ts
export class VercelAPI {
  constructor(private apiKey: string) {}
  
  private async fetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`https://api.vercel.com${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async getProjects() {
    return this.fetch('/v9/projects')
  }
  
  async testConnection() {
    try {
      await this.fetch('/v2/user')
      return true
    } catch {
      return false
    }
  }
}
```

#### Step 3: Implement Adapter

```typescript
// packages/docks/vercel/adapter.ts
import { MutationCtx } from "../../../convex/_generated/server"
import { Doc } from "../../../convex/_generated/dataModel"
import { decryptApiKey } from "../../../convex/lib/encryption"
import { VercelAPI } from "./api"
import type { DockAdapter } from "../../../convex/docks/_types"

export const vercelAdapter: DockAdapter = {
  provider: "vercel",
  
  async validateCredentials(apiKey: string): Promise<boolean> {
    const api = new VercelAPI(apiKey)
    return await api.testConnection()
  },
  
  async syncWebServices(ctx: MutationCtx, dock: Doc<"docks">): Promise<void> {
    // 1. Decrypt API key (only possible in Convex server)
    const apiKey = await decryptApiKey(dock.encryptedApiKey)
    const api = new VercelAPI(apiKey)
    
    // 2. Fetch projects from Vercel
    const { projects } = await api.getProjects()
    
    // 3. Translate each project to universal schema
    for (const project of projects) {
      // Check if already synced
      const existing = await ctx.db
        .query("webServices")
        .withIndex("by_dockId", q => q.eq("dockId", dock._id))
        .filter(q => q.eq(q.field("providerResourceId"), project.id))
        .first()
      
      // Map to universal schema
      const serviceData = {
        orgId: dock.orgId,
        dockId: dock._id,
        
        // Universal fields
        provider: "vercel",
        providerResourceId: project.id,
        name: project.name,
        productionUrl: this.getProductionUrl(project),
        status: this.mapStatus(project),
        gitRepo: project.link?.repo,
        
        // Provider-specific data (everything else)
        fullApiData: project,
      }
      
      // 4. Upsert (update if exists, insert if new)
      if (existing) {
        await ctx.db.patch(existing._id, serviceData)
      } else {
        await ctx.db.insert("webServices", serviceData)
      }
    }
  },
  
  // Helper: Get production URL
  getProductionUrl(project: any): string {
    // Use custom domain if available
    if (project.alias && project.alias.length > 0) {
      return `https://${project.alias[0].domain}`
    }
    // Otherwise use vercel.app domain
    return `https://${project.name}.vercel.app`
  },
  
  // Helper: Map Vercel status to universal status
  mapStatus(project: any): string {
    const deployment = project.latestDeployments?.[0]
    
    if (!deployment) return "unknown"
    
    switch (deployment.state) {
      case "READY": return "running"
      case "BUILDING": return "deploying"
      case "ERROR": return "error"
      case "CANCELED": return "stopped"
      default: return "unknown"
    }
  },
}
```

#### Step 4: Register Adapter

```typescript
// convex/docks/sync.ts
import { vercelAdapter } from "../../packages/docks/vercel/adapter"
import { gridpaneAdapter } from "../../packages/docks/gridpane/adapter"

const ADAPTERS: Record<string, DockAdapter> = {
  vercel: vercelAdapter,
  gridpane: gridpaneAdapter,
  // ... more adapters
}

export const syncDock = internalMutation({
  args: { dockId: v.id("docks") },
  handler: async (ctx, args) => {
    const dock = await ctx.db.get(args.dockId)
    if (!dock) throw new Error("Dock not found")
    
    const adapter = ADAPTERS[dock.provider]
    if (!adapter) throw new Error(`Unknown provider: ${dock.provider}`)
    
    try {
      await ctx.db.patch(dock._id, { lastSyncStatus: "syncing" })
      
      // Call adapter's sync functions
      if (adapter.syncWebServices) {
        await adapter.syncWebServices(ctx, dock)
      }
      if (adapter.syncServers) {
        await adapter.syncServers(ctx, dock)
      }
      if (adapter.syncDomains) {
        await adapter.syncDomains(ctx, dock)
      }
      
      await ctx.db.patch(dock._id, {
        lastSyncStatus: "success",
        lastSyncAt: Date.now(),
      })
    } catch (error) {
      await ctx.db.patch(dock._id, {
        lastSyncStatus: "error",
        lastSyncAt: Date.now(),
      })
      throw error
    }
  },
})
```

---

## Universal Table Mapping

### webServices (PaaS Applications)

| Universal Field | Required | Type | Description | Example |
|----------------|----------|------|-------------|---------|
| `provider` | ✅ | string | Adapter identifier | "vercel", "gridpane" |
| `providerResourceId` | ✅ | string | Provider's internal ID | "prj_abc123" |
| `name` | ✅ | string | Display name | "my-website" |
| `productionUrl` | ✅ | string | Live URL | "https://example.com" |
| `status` | ✅ | string | running/stopped/error/deploying | "running" |
| `gitRepo` | ❌ | string | Git repository URL | "github.com/user/repo" |
| `fullApiData` | ✅ | any | Original API response | `{ ... }` |

**Status Values**:
- `running`: Service is live
- `stopped`: Service is paused/stopped
- `error`: Service has errors
- `deploying`: Currently deploying
- `unknown`: Status unknown

### servers (IaaS Compute)

| Universal Field | Required | Type | Description | Example |
|----------------|----------|------|-------------|---------|
| `provider` | ✅ | string | Adapter identifier | "digitalocean", "aws" |
| `providerResourceId` | ✅ | string | Provider's internal ID | "i-0abc123" |
| `name` | ✅ | string | Display name | "web-server-01" |
| `ipAddress` | ✅ | string | Public IP address | "192.168.1.1" |
| `status` | ✅ | string | running/stopped/error | "running" |
| `fullApiData` | ✅ | any | Original API response | `{ ... }` |

### domains (DNS Zones)

| Universal Field | Required | Type | Description | Example |
|----------------|----------|------|-------------|---------|
| `provider` | ✅ | string | Adapter identifier | "cloudflare", "route53" |
| `providerResourceId` | ✅ | string | Provider's internal ID | "zone_abc123" |
| `domainName` | ✅ | string | Domain name | "example.com" |
| `status` | ✅ | string | active/pending/error | "active" |
| `expiresAt` | ❌ | number | Expiration timestamp | 1234567890 |
| `fullApiData` | ✅ | any | Original API response | `{ ... }` |

### Key Principles

1. **Universal fields**: Only add fields that 80%+ of providers have
2. **Provider-specific fields**: Store in `fullApiData` (access via `resource.fullApiData.customField`)
3. **Status normalization**: Map provider statuses to standard values
4. **Denormalization**: Store computed fields (like URLs) to avoid client-side logic

---

## Rate Limiting

### Why Rate Limiting Matters

Provider APIs have limits. Exceeding them causes:
- 429 errors (Too Many Requests)
- Temporary bans
- Failed syncs

### Implementation Pattern

```typescript
// packages/docks/gridpane/api.ts
export class GridPaneAPI {
  private requestQueue: Map<string, number> = new Map()
  private readonly RATE_LIMIT = {
    requestsPerMinute: 12,
    windowMs: 60000,
  }
  
  async fetch(endpoint: string) {
    await this.waitForRateLimit(endpoint)
    
    const response = await fetch(`https://my.gridpane.com/oauth/api/v1${endpoint}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    })
    
    this.recordRequest(endpoint)
    return response.json()
  }
  
  private async waitForRateLimit(endpoint: string) {
    const now = Date.now()
    const lastRequest = this.requestQueue.get(endpoint) || 0
    const timeSinceLastRequest = now - lastRequest
    const minInterval = this.RATE_LIMIT.windowMs / this.RATE_LIMIT.requestsPerMinute
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  private recordRequest(endpoint: string) {
    this.requestQueue.set(endpoint, Date.now())
  }
}
```

### Provider-Specific Limits

| Provider | GET Limit | POST/PUT Limit | Notes |
|----------|-----------|----------------|-------|
| GridPane | 12/min per endpoint | 2/min account-wide | Very strict |
| Vercel | 100/hour | 100/hour | Per team |
| DigitalOcean | 5000/hour | 5000/hour | Shared across all endpoints |
| Cloudflare | 1200/5min | 1200/5min | Per zone |

**Document limits in your adapter's README.**

---

## Error Handling

### Graceful Degradation

```typescript
async syncWebServices(ctx: MutationCtx, dock: Doc<"docks">): Promise<void> {
  try {
    const apiKey = await decryptApiKey(dock.encryptedApiKey)
    const api = new VercelAPI(apiKey)
    
    const { projects } = await api.getProjects()
    
    for (const project of projects) {
      try {
        // Sync individual project
        await this.syncProject(ctx, dock, project)
      } catch (error) {
        // Log error but continue with other projects
        console.error(`Failed to sync project ${project.id}:`, error)
        
        // Optional: Store failed sync in database
        await ctx.db.insert("syncErrors", {
          dockId: dock._id,
          resourceType: "webService",
          resourceId: project.id,
          error: error.message,
          timestamp: Date.now(),
        })
      }
    }
  } catch (error) {
    // Critical error (e.g., auth failure)
    throw new Error(`Vercel sync failed: ${error.message}`)
  }
}
```

### Error Types

1. **Auth Errors** (401/403):
   - API key invalid or expired
   - Action: Mark dock as "error", notify user

2. **Rate Limit Errors** (429):
   - Too many requests
   - Action: Exponential backoff, retry

3. **Server Errors** (500/502/503):
   - Provider API down
   - Action: Retry with backoff

4. **Not Found Errors** (404):
   - Resource deleted on provider side
   - Action: Delete from StackDock database

```typescript
async handleApiError(error: any, dock: Doc<"docks">, ctx: MutationCtx) {
  if (error.status === 401 || error.status === 403) {
    // Auth error: mark dock as invalid
    await ctx.db.patch(dock._id, {
      lastSyncStatus: "error",
      lastSyncError: "Invalid API credentials",
    })
    
    // Notify user (future: email/notification)
  } else if (error.status === 429) {
    // Rate limit: schedule retry
    await ctx.scheduler.runAfter(
      60000, // 1 minute
      internal.docks.sync.syncDock,
      { dockId: dock._id }
    )
  } else if (error.status >= 500) {
    // Server error: retry with backoff
    await ctx.scheduler.runAfter(
      300000, // 5 minutes
      internal.docks.sync.syncDock,
      { dockId: dock._id }
    )
  }
}
```

---

## Testing

### Unit Tests

```typescript
// packages/docks/vercel/adapter.test.ts
import { describe, it, expect, vi } from 'vitest'
import { vercelAdapter } from './adapter'

describe('Vercel Adapter', () => {
  describe('validateCredentials', () => {
    it('returns true for valid API key', async () => {
      const result = await vercelAdapter.validateCredentials('valid_key')
      expect(result).toBe(true)
    })
    
    it('returns false for invalid API key', async () => {
      const result = await vercelAdapter.validateCredentials('invalid_key')
      expect(result).toBe(false)
    })
  })
  
  describe('getProductionUrl', () => {
    it('uses custom domain if available', () => {
      const project = {
        name: 'my-app',
        alias: [{ domain: 'example.com' }]
      }
      
      const url = vercelAdapter.getProductionUrl(project)
      expect(url).toBe('https://example.com')
    })
    
    it('falls back to vercel.app domain', () => {
      const project = {
        name: 'my-app',
        alias: []
      }
      
      const url = vercelAdapter.getProductionUrl(project)
      expect(url).toBe('https://my-app.vercel.app')
    })
  })
  
  describe('mapStatus', () => {
    it('maps READY to running', () => {
      const project = {
        latestDeployments: [{ state: 'READY' }]
      }
      
      const status = vercelAdapter.mapStatus(project)
      expect(status).toBe('running')
    })
  })
})
```

### Integration Tests

```typescript
// Test with real API (use test account)
describe('Vercel Integration', () => {
  it('syncs projects successfully', async () => {
    const dock = {
      _id: "test_dock",
      orgId: "test_org",
      provider: "vercel",
      encryptedApiKey: await encryptApiKey(process.env.VERCEL_TEST_KEY!),
    }
    
    await vercelAdapter.syncWebServices(mockCtx, dock)
    
    // Verify projects were created
    const services = await mockCtx.db.query("webServices").collect()
    expect(services.length).toBeGreaterThan(0)
    expect(services[0].provider).toBe("vercel")
  })
})
```

---

## Publishing

### 1. Documentation

**README.md**:
```markdown
# Vercel Dock Adapter

Sync Vercel projects to StackDock.

## Features

- ✅ Syncs all projects
- ✅ Tracks deployment status
- ✅ Supports custom domains
- ❌ Mutations (coming soon)

## Installation

```bash
npx stackdock add vercel
```

## Configuration

1. Get Vercel API token: https://vercel.com/account/tokens
2. Connect dock in StackDock dashboard
3. Sync runs automatically every 5 minutes

## Rate Limits

- 100 requests per hour (per team)
- Automatic retry on rate limit

## Field Mapping

| Vercel Field | StackDock Field |
|--------------|-----------------|
| `project.id` | `providerResourceId` |
| `project.name` | `name` |
| `project.alias[0].domain` | `productionUrl` |
| `latestDeployments[0].state` | `status` |

## Support

- Issues: https://github.com/stackdock/docks/issues
- Discord: https://stackdock.dev/discord
```

### 2. Registry Entry

```json
// packages/docks/registry.json
{
  "vercel": {
    "name": "vercel",
    "title": "Vercel",
    "description": "Sync Vercel projects and deployments",
    "version": "1.0.0",
    "author": "StackDock Team",
    "resourceTypes": ["webServices"],
    "mutations": false,
    "files": [
      "vercel/adapter.ts",
      "vercel/api.ts",
      "vercel/types.ts"
    ],
    "dependencies": [],
    "rateLimit": {
      "requests": 100,
      "window": "1h"
    }
  }
}
```

### 3. Submit PR

```bash
# Fork https://github.com/stackdock/docks
git clone https://github.com/YOUR_USERNAME/docks
cd docks

# Create branch
git checkout -b add-vercel-adapter

# Add your adapter
cp -r vercel packages/docks/

# Update registry.json
vim packages/docks/registry.json

# Commit and push
git add .
git commit -m "feat: add Vercel dock adapter"
git push origin add-vercel-adapter

# Open PR on GitHub
```

---

## Next Steps

- **See adapter examples**: `packages/docks/`
- **Read provider API docs**: Understand their data model
- **Test thoroughly**: Unit + integration tests
- **Document rate limits**: Help others avoid issues

**Questions?** Open an issue or join Discord: https://stackdock.dev/discord
