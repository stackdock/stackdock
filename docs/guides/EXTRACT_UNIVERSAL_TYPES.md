# Extract Universal Types - Implementation Guide

**Status**: ✅ Complete  
**Mission**: Mission 1, Task 1  
**Date**: November 17, 2025

## Overview

This guide documents the extraction of universal types from the codebase into a shared package (`@stackdock/shared`) and the process for keeping types synchronized across the StackDock ecosystem.

## Architecture

### Type Sources

1. **Source of Truth**: `packages/shared/src/schema.ts`
   - Contains all universal resource type definitions
   - Built and published as `@stackdock/shared` package
   - Can be imported by UI components and external integrations

2. **Convex Copy**: `convex/lib/universalTypes.ts`
   - Copy of shared types for use in Convex functions
   - Required because Convex functions cannot import from npm packages directly
   - Must be kept in sync with shared package

### Type Flow

```
packages/shared/src/schema.ts
    ↓ (build)
packages/shared/dist/schema.js
    ↓ (sync script)
convex/lib/universalTypes.ts
    ↓ (import)
convex/docks/adapters/*/adapter.ts
```

## Implementation

### 1. Shared Package Setup

The `@stackdock/shared` package contains:
- Universal resource types (Server, WebService, Domain, etc.)
- Utility types (ResourceTypeMap, UniversalResource, etc.)
- Enums and constants (ProvisioningSource, ResourceTable, etc.)

**Location**: `packages/shared/src/schema.ts`

### 2. Sync Script

A sync script copies types from the shared package to Convex:

**Script**: `scripts/sync-universal-types.js`  
**Command**: `npm run sync:types`

**Usage**:
```bash
# After updating types in packages/shared/src/schema.ts
npm run build --workspace=packages/shared
npm run sync:types
```

### 3. Adapter Type Annotations

Adapters should use explicit type annotations when creating universal resource objects:

**Before**:
```typescript
const universalServer = {
  orgId: dock.orgId,
  dockId: dock._id,
  provider: "gridpane",
  // ... rest of fields
}
```

**After**:
```typescript
import type { Server } from "../../../lib/universalTypes"

const universalServer: Omit<Server, "_id" | "_creationTime"> = {
  orgId: dock.orgId,
  dockId: dock._id,
  provider: "gridpane",
  // ... rest of fields
}
```

## Updating Adapters

### Step-by-Step Process

1. **Import the type**:
   ```typescript
   import type { Server, WebService, Domain } from "../../../lib/universalTypes"
   ```

2. **Add type annotation**:
   ```typescript
   const universalResource: Omit<ResourceType, "_id" | "_creationTime"> = {
     // ... resource data
   }
   ```

3. **Verify type safety**:
   - TypeScript will catch missing required fields
   - TypeScript will catch incorrect field types
   - TypeScript will catch typos in field names

### Example: GridPane Adapter

The GridPane adapter has been updated as a reference implementation:

- ✅ `Server` type annotation added
- ✅ `WebService` type annotation added
- ✅ `Domain` type annotation added
- ✅ `BackupSchedule` type annotation added
- ✅ `BackupIntegration` type annotation added

**File**: `convex/docks/adapters/gridpane/adapter.ts`

## Benefits

1. **Type Safety**: TypeScript catches errors at compile time
2. **Consistency**: All adapters use the same type definitions
3. **Documentation**: Types serve as documentation for expected fields
4. **Refactoring**: Changes to types propagate automatically
5. **IDE Support**: Better autocomplete and IntelliSense

## Maintenance

### When Updating Types

1. Update `packages/shared/src/schema.ts`
2. Build the shared package: `npm run build --workspace=packages/shared`
3. Sync to Convex: `npm run sync:types`
4. Update adapters that use the changed types
5. Run type check: `npm run type-check`

### Sync Script Details

The sync script (`scripts/sync-universal-types.js`):
- Reads from `packages/shared/src/schema.ts`
- Writes to `convex/lib/universalTypes.ts`
- Preserves file structure and comments
- Can be run anytime to ensure sync

## Remaining Work

### Adapters to Update

The following adapters need type annotations added:

- [ ] Vercel adapter (`convex/docks/adapters/vercel/adapter.ts`)
- [ ] Netlify adapter (`convex/docks/adapters/netlify/adapter.ts`)
- [ ] Cloudflare adapter (`convex/docks/adapters/cloudflare/adapter.ts`)
- [ ] DigitalOcean adapter (`convex/docks/adapters/digitalocean/adapter.ts`)
- [ ] Vultr adapter (`convex/docks/adapters/vultr/adapter.ts`)
- [ ] Linode adapter (`convex/docks/adapters/linode/adapter.ts`)
- [ ] Hetzner adapter (`convex/docks/adapters/hetzner/adapter.ts`)
- [ ] Turso adapter (`convex/docks/adapters/turso/adapter.ts`)
- [ ] Neon adapter (`convex/docks/adapters/neon/adapter.ts`)
- [ ] PlanetScale adapter (`convex/docks/adapters/planetscale/adapter.ts`)
- [ ] Convex adapter (`convex/docks/adapters/convex/adapter.ts`)
- [ ] GitHub adapter (`convex/docks/adapters/github/adapter.ts`)
- [ ] Sentry adapter (`convex/docks/adapters/sentry/adapter.ts`)
- [ ] Better Stack adapter (`convex/docks/adapters/betterstack/adapter.ts`)
- [ ] Coolify adapter (`convex/docks/adapters/coolify/adapter.ts`)

### Pattern to Follow

For each adapter:

1. Import types at the top:
   ```typescript
   import type { Server, WebService, Domain, Database } from "../../../lib/universalTypes"
   ```

2. Add type annotations to resource objects:
   ```typescript
   const universalServer: Omit<Server, "_id" | "_creationTime"> = { ... }
   ```

3. Verify with type check:
   ```bash
   npm run type-check
   ```

## Related Files

- `packages/shared/src/schema.ts` - Source of truth for types
- `convex/lib/universalTypes.ts` - Convex copy (synced)
- `scripts/sync-universal-types.js` - Sync script
- `convex/docks/adapters/gridpane/adapter.ts` - Reference implementation
- `packages/shared/README.md` - Shared package documentation

## Notes

- The `Omit<Type, "_id" | "_creationTime">` pattern is used because Convex adds these fields automatically
- Types are provider-agnostic - all provider-specific data goes in `fullApiData`
- The sync script preserves comments and formatting
- Types should match the Convex schema (`convex/schema.ts`) exactly
