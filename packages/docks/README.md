# StackDock Docks Registry

> **Copy/paste/own infrastructure adapters**

The Docks Registry is a collection of provider adapters that translate provider APIs to StackDock's universal schema. Adapters follow the copy/paste/own model - you install them into your codebase and own the code.

## ⚠️ Important: Registry vs Runtime

**Two Locations, Two Purposes:**

1. **`packages/docks/`** - **Registry** (copy/paste/own)
   - Source code for adapters
   - Copy to your repo via CLI
   - You own and modify them

2. **`convex/docks/adapters/`** - **Runtime** (execution)
   - Adapters imported and executed by Convex
   - These are copies from the registry
   - Modified versions live here

**Flow:**
```
packages/docks/gridpane/  →  npx stackdock add gridpane  →  convex/docks/adapters/gridpane/
     (registry)                    (CLI copies)                    (runtime execution)
```

## Quick Start

```bash
# Install an adapter (when CLI is ready)
npx stackdock add gridpane

# Adapter is copied to convex/docks/adapters/gridpane/
# You own it, modify it, customize it
```

## Registry Structure

```
packages/docks/
├── gridpane/            # Provider adapter
│   ├── adapter.ts       # Main adapter logic
│   ├── api.ts           # API client
│   ├── types.ts         # TypeScript types
│   ├── README.md        # Documentation
│   └── package.json
├── vercel/
├── digitalocean/
└── registry.json        # Registry manifest
```

## Adapter Philosophy

### Universal Table Mapping

Adapters translate provider APIs to universal tables:

- `servers` - Any server provider (AWS, DigitalOcean, Vultr, etc.)
- `webServices` - Any PaaS provider (Vercel, GridPane, Railway, etc.)
- `domains` - Any DNS provider (Cloudflare, Route53, etc.)
- `databases` - Any database provider

### Example

```typescript
// GridPane API Response → Universal webServices Table
{
  id: 12345,                          →  provider: "gridpane",
  name: "site.com",        TRANSLATES  providerResourceId: "12345",
  primary_domain: "site.com",     TO   name: "site.com",
  status: "running",                    productionUrl: "site.com",
  phpVersion: "8.2",                   status: "running",
  backup_schedule: "daily"             fullApiData: { /* original */ }
}
```

## Adding an Adapter

See [DOCK_ADAPTER_GUIDE.md](../../docs/guides/DOCK_ADAPTER_GUIDE.md) for complete instructions.

### Quick Steps

1. Create adapter directory: `packages/docks/my-provider/`
2. Implement `DockAdapter` interface (see `convex/docks/_types.ts`)
3. Build API client: `api.ts`
4. Add adapter logic: `adapter.ts`
5. Add documentation: `README.md`
6. Update `registry.json` with adapter metadata

## Adapter Interface

Every adapter must implement:

```typescript
export interface DockAdapter {
  provider: string
  
  // Validate API credentials
  validateCredentials(apiKey: string): Promise<boolean>
  
  // Sync functions (one per resource type)
  syncWebServices?(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>
  syncServers?(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>
  syncDomains?(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>
  syncDatabases?(ctx: MutationCtx, dock: Doc<"docks">): Promise<void>
}
```

## Registry Format

See `registry.json` for the manifest format. Each adapter entry includes:

- `name`: Adapter identifier
- `title`: Display name
- `description`: What provider it supports
- `version`: Semantic version
- `provider`: Provider identifier (e.g., "gridpane")
- `resourceTypes`: Universal tables it syncs to
- `files`: Files to copy
- `dependencies`: npm dependencies
- `apiDocs`: Link to provider API documentation

## Current Adapters

_No adapters in registry yet. Check back soon!_

**Note**: Runtime adapters exist in `convex/docks/adapters/` (e.g., GridPane), but registry structure is being set up.

## Contributing

1. Build your adapter following [DOCK_ADAPTER_GUIDE.md](../../docs/guides/DOCK_ADAPTER_GUIDE.md)
2. Ensure it maps to universal tables (not provider-specific tables)
3. Implement all required sync methods
4. Add tests
5. Submit PR

## Related Documentation

- [DOCK_ADAPTER_GUIDE.md](../../docs/guides/DOCK_ADAPTER_GUIDE.md) - How to build adapters
- [ARCHITECTURE.md](../../docs/architecture/ARCHITECTURE.md) - System architecture
- [CONTRIBUTING.md](../../docs/guides/CONTRIBUTING.md) - Development workflow

---

**Remember**: Adapters are copy/paste/own. You install them, you own them, you customize them.
