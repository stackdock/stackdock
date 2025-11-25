# StackDock Provisioning

Devpush-style provisioning engine. Direct API calls, no abstraction layers. You own the code.

## Architecture

**The Primitive**: Dock adapter provisioning methods (copy/paste/own pattern)
**The Approach**: Direct provider API calls (like [devpush](https://github.com/hunvreus/devpush))

**Inspired by**: [devpush](https://github.com/hunvreus/devpush) - Like Vercel, but open source and for all languages

## Philosophy

**"Direct API Calls"**: No Pulumi, no Terraform, no abstraction layers. Dock adapters call provider APIs directly.

**"You Own the Code"**: Provisioning logic lives in dock adapters. Copy them. Edit them. Own them.

**"Simple and Transparent"**: What you see is what you get. No magic, no hidden layers.

## Tech Stack

- **Dock Adapters** - Provider-specific provisioning logic
- **Direct API Calls** - Provider REST/GraphQL APIs
- **Convex** - State tracking and real-time updates
- **Universal Tables** - Provisioned resources stored in universal schema

## Monorepo Integration

### Shared Packages

- `packages/shared` - Encryption, RBAC, schema types
- `packages/docks` - Dock adapter registry (provisioning methods live here)
- `convex/docks/adapters/` - Runtime dock adapters with provisioning

### Code Sharing Strategy

```typescript
// Import shared utilities
import { encryptApiKey } from "@stackdock/shared/encryption"
import { withRBAC } from "@stackdock/shared/rbac"

// Provisioning happens in dock adapters
import { vercelAdapter } from "@stackdock/docks/vercel"
```

## Provisioning Pattern

### Dock Adapter Provisioning Methods

Each dock adapter implements provisioning methods:

```typescript
// packages/docks/vercel/adapter.ts
export const vercelAdapter: DockAdapter = {
  provider: "vercel",
  
  // Provision a web service (direct API call)
  async provisionWebService(ctx, dock, config) {
    const apiKey = await decryptApiKey(dock.encryptedApiKey)
    const api = new VercelAPI(apiKey)
    
    // Direct API call - no abstraction layer
    const deployment = await api.createDeployment({
      name: config.name,
      files: config.files,
      projectSettings: config.projectSettings
    })
    
    // Write to universal table
    await ctx.db.insert("webServices", {
      orgId: dock.orgId,
      dockId: dock._id,
      provider: "vercel",
      providerResourceId: deployment.id,
      name: deployment.name,
      productionUrl: deployment.url,
      status: "provisioning",
      provisioningSource: "api", // Mark as API-provisioned
      fullApiData: deployment,
      provisionedAt: Date.now(),
      provisioningState: "provisioning"
    })
    
    return deployment
  }
}
```

### Universal Table Integration

All provisioned resources map to universal tables:
- Servers → `servers` table
- Web services → `webServices` table
- Domains → `domains` table
- Databases → `databases` table

**Provisioning Metadata**:
- `provisioningSource`: `"api"` (API-provisioned) vs `"manual"` (discovered)
- `provisioningState`: `"provisioning"` | `"provisioned"` | `"failed"` | `"deprovisioning"`
- `provisionedAt`: Timestamp when provisioning started

## Project Structure

```
packages/
├── provisioning/          # This package (devpush-style)
│   ├── README.md         # This file
│   └── docs/             # Provisioning documentation
│
├── core/                  # SST placeholder (future option)
│   └── provisioning/     # SST-style provisioning (placeholder)
│
└── docks/                 # Dock adapter registry
    ├── vercel/
    │   ├── adapter.ts    # Includes provisionWebService()
    │   └── api.ts        # Vercel API client
    └── netlify/
        ├── adapter.ts    # Includes provisionWebService()
        └── api.ts        # Netlify API client

convex/
└── docks/
    └── adapters/          # Runtime dock adapters
        ├── vercel/
        │   └── adapter.ts # Runtime adapter (imports from packages/docks)
        └── netlify/
            └── adapter.ts
```

## Provisioning Flow

### Simple Flow (Devpush-Style)

```
User → Dock Adapter → Provider API → Universal Table
```

**Example: Provision Vercel Deployment**

1. User clicks "Provision" in UI
2. Frontend calls Convex mutation: `provisionWebService`
3. Mutation calls dock adapter: `vercelAdapter.provisionWebService()`
4. Adapter decrypts API key, calls Vercel API directly
5. Adapter writes to `webServices` table
6. Real-time update via Convex subscription

### No Abstraction Layers

**What we DON'T use**:
- ❌ Pulumi
- ❌ Terraform
- ❌ SST constructs
- ❌ Infrastructure abstraction layers

**What we DO use**:
- ✅ Direct REST/GraphQL API calls
- ✅ Provider-native APIs
- ✅ Dock adapters (copy/paste/own)
- ✅ Universal tables (state tracking)

## Comparison with Devpush

**Similarities**:
- Direct API calls (no abstraction)
- Docker-based deployments (for applicable providers)
- Simple, transparent provisioning
- Open source, MIT licensed

**Differences**:
- **Dock Adapter Pattern**: Provisioning logic in adapters (copy/paste/own)
- **Universal Schema**: All resources map to universal tables
- **Multi-Provider**: Works across all providers (not just Docker)
- **Registry Model**: Adapters live in registry, users copy them

## Provider Examples

### PaaS Providers (Simple)

**Vercel**:
```typescript
// Direct Vercel API call
const deployment = await vercelAPI.createDeployment(config)
```

**Netlify**:
```typescript
// Direct Netlify API call
const site = await netlifyAPI.createSite(config)
```

**Cloudflare Pages**:
```typescript
// Direct Cloudflare API call
const project = await cloudflareAPI.createPagesProject(config)
```

### IaaS Providers (Servers)

**DigitalOcean**:
```typescript
// Direct DO API call
const droplet = await digitalOceanAPI.createDroplet(config)
```

**Vultr**:
```typescript
// Direct Vultr API call
const instance = await vultrAPI.createInstance(config)
```

### Database Providers

**Turso**:
```typescript
// Direct Turso API call
const database = await tursoAPI.createDatabase(config)
```

## Docker-Based Provisioning (Devpush-Style)

For providers that support Docker (like devpush):

```typescript
// Dock adapter for Docker-based deployment
export const dockerAdapter: DockAdapter = {
  async provisionWebService(ctx, dock, config) {
    // Build Docker image
    const image = await docker.build(config.dockerfile)
    
    // Push to registry
    await docker.push(image, config.registry)
    
    // Deploy container (via provider API or Docker API)
    const container = await docker.deploy({
      image: image.tag,
      ports: config.ports,
      env: config.env
    })
    
    // Write to universal table
    await ctx.db.insert("webServices", {
      // ...
      fullApiData: { docker: { containerId: container.id } }
    })
  }
}
```

## State Management

### Convex Real-Time Updates

Provisioning state tracked in universal tables:

```typescript
// Frontend subscribes to provisioning state
const resource = useQuery(api.provisioning.queries.getProvisionStatus, {
  provisionId: resourceId
})

// State updates in real-time
// provisioningState: "provisioning" → "provisioned" → "success"
```

### Provisioning States

- `"provisioning"` - Provisioning in progress
- `"provisioned"` - Provisioning complete
- `"failed"` - Provisioning failed
- `"deprovisioning"` - Deprovisioning in progress

## Error Handling

### Provider API Errors

```typescript
try {
  const deployment = await vercelAPI.createDeployment(config)
} catch (error) {
  // Update provisioning state to "failed"
  await ctx.db.patch(resourceId, {
    provisioningState: "failed",
    fullApiData: {
      ...existingData,
      error: {
        message: error.message,
        code: error.code,
        timestamp: Date.now()
      }
    }
  })
  throw error
}
```

### Rollback Strategy

**Simple Rollback** (devpush-style):
- Delete provisioned resource via provider API
- Update state to "deprovisioning" → "deprovisioned"
- Remove from universal table (or mark as deleted)

## Integration with StackDock Platform

### RBAC Integration

```typescript
// Provisioning mutations check permissions
export const provisionWebService = mutation({
  handler: withRBAC("provisioning:full")(async (ctx, args) => {
    // Check user has provisioning:full permission
    // Then call dock adapter
  })
})
```

### Audit Logging

```typescript
// Log all provisioning operations
await auditLog(ctx, "provisioning.create", "success", {
  resourceType: "webService",
  provider: "vercel",
  resourceId: resource._id
})
```

## Relationship with SST

### SST as Future Option

**Current**: Devpush-style (direct API calls) is primary approach
**Future**: SST-style (declarative IaC) available as optional enhancement

**When SST might help**:
- Complex multi-resource deployments (VPCs, load balancers, databases)
- Infrastructure as Code requirements
- Complex dependency management

**When Devpush-style is better**:
- Simple deployments (most common case)
- Fast iteration
- Provider-native features
- Transparency and simplicity

### Coexistence Strategy

**Dock adapters choose approach**:
```typescript
// Simple provider: Direct API (devpush-style)
export const vercelAdapter: DockAdapter = {
  async provisionWebService(ctx, dock, config) {
    // Direct API call
  }
}

// Complex provider: Can use SST if needed (future)
export const awsAdapter: DockAdapter = {
  async provisionServer(ctx, dock, config) {
    // Could use SST for complex AWS infrastructure
    // But user can copy adapter and switch to direct API
  }
}
```

## Development

### Adding Provisioning to Dock Adapter

1. **Add provisioning method** to dock adapter:
```typescript
export const myAdapter: DockAdapter = {
  async provisionWebService(ctx, dock, config) {
    // Direct API call
    // Write to universal table
  }
}
```

2. **Create Convex mutation**:
```typescript
export const provisionWebService = mutation({
  handler: withRBAC("provisioning:full")(async (ctx, args) => {
    const adapter = getAdapter(args.provider)
    return await adapter.provisionWebService(ctx, dock, args.config)
  })
})
```

3. **Add UI** (provisioning form, status display)

## Status

**Current**: Primary provisioning approach (devpush-style)
**Status**: Ready for implementation
**SST**: Available as future option (placeholder in `packages/core/provisioning/`)

## References

- [devpush](https://github.com/hunvreus/devpush) - Inspiration and reference
- [devpush Docs](https://devpu.sh/docs) - Documentation
- [Dock Adapter Guide](../docks/README.md) - How to build dock adapters
- [Universal Schema](../../convex/schema.ts) - Universal table definitions
