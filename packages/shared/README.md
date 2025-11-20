# @stackdock/shared

Shared TypeScript types and utilities for StackDock.

## Purpose

This package provides universal resource types that are provider-agnostic and can be used across the StackDock ecosystem:
- Adapters (via `convex/lib/universalTypes.ts`)
- UI components
- External integrations
- Documentation

## Installation

```bash
npm install @stackdock/shared
```

## Usage

### In Convex Functions (Adapters)

Adapters use types from `convex/lib/universalTypes.ts` (a copy of this package's types) for type checking resource data objects:

```typescript
import type { WebService } from "../../../lib/universalTypes"

const universalWebService: Omit<WebService, "_id" | "_creationTime"> = {
  orgId: dock.orgId,
  dockId: dock._id,
  provider: "vercel",
  providerResourceId: project.id,
  name: project.name,
  productionUrl: getProductionUrl(project),
  environment: getEnvironment(project),
  status: getStatus(project),
  fullApiData: project,
  updatedAt: Date.now(),
}
```

### In UI Components

For components that consume Convex queries, continue using `Doc` types:

```typescript
import type { Doc } from "../../convex/_generated/dataModel"

type WebService = Doc<"webServices">
```

For components that accept resource props or work with resource data generically, use shared types:

```typescript
import type { WebService } from "@stackdock/shared"

interface ResourceCardProps {
  resource: Omit<WebService, "_id" | "_creationTime">
}
```

### Available Types

- `Server` - IaaS instances (Vultr, DigitalOcean, AWS EC2, etc.)
- `WebService` - PaaS applications (Vercel, Netlify, Railway, etc.)
- `Domain` - DNS zones and domain registrations
- `Database` - Managed database instances
- `BlockVolume` - Block storage volumes
- `Bucket` - Object storage buckets
- `Monitor` - Uptime monitoring
- `Issue` - Error tracking (Sentry, etc.)
- `Repository` - Code repositories (GitHub, etc.)
- `Deployment` - Deployment instances
- `BackupSchedule` - Backup schedules
- `BackupIntegration` - Backup integrations

### Type Utilities

```typescript
import type { 
  ResourceTable, 
  ResourceType, 
  UniversalResource 
} from "@stackdock/shared"

// Get type for a specific table
type MyServer = ResourceType<"servers">

// Union of all resource types
type AnyResource = UniversalResource
```

## Architecture

- **Source of Truth**: Convex schema (`convex/schema.ts`) defines the database schema
- **Shared Types**: This package provides TypeScript types that match the schema
- **Adapter Copy**: `convex/lib/universalTypes.ts` is a copy for use in Convex functions
- **UI Usage**: UI components can import from `@stackdock/shared` when needed

## Maintenance

When updating resource types:
1. Update `packages/shared/src/schema.ts`
2. Build: `npm run build`
3. Copy to `convex/lib/universalTypes.ts` for adapter use
4. Ensure Convex schema stays in sync
