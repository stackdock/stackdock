# @stackdock/core

StackDock core provisioning engine - Extracted and refactored from SST.dev.

## Overview

This package provides infrastructure provisioning capabilities for StackDock, derived from SST.dev's core provisioning engine. It manages resource lifecycle, state tracking, deployment orchestration, and provider integration.

## Attribution

**This package contains code derived from SST.dev (https://sst.dev), licensed under MIT License.**

See [ATTRIBUTION.md](./ATTRIBUTION.md) for details on SST components used and modifications made.

See [LICENSE](./LICENSE) for SST's original MIT license.

## Installation

```bash
npm install @stackdock/core
```

## Architecture

The provisioning engine is organized into several modules:

- **lifecycle/**: Resource lifecycle management (create, update, delete)
- **state/**: State management and Convex integration
- **orchestrator/**: Deployment orchestration and dependency management
- **adapters/**: Dock adapter integration API
- **providers/**: Provider registry and selection

## Usage

### Basic Provisioning

```typescript
import { provisionResource } from '@stackdock/core/adapters';

const resource = await provisionResource(ctx, {
  type: 'server',
  provider: 'aws',
  configuration: { /* ... */ }
});
```

### Universal Table Integration

All provisioned resources are automatically mapped to StackDock universal tables:
- Servers → `servers` table
- Web services → `webServices` table
- Domains → `domains` table
- Databases → `databases` table

### Provider Selection

The engine automatically selects the best provisioning method:
1. SST provider (if available for resource type)
2. Dock adapter (fallback for providers SST doesn't support)

## Integration with Dock Adapters

Dock adapters can use the provisioning engine via the adapter API:

```typescript
import { DockAdapterAPI } from '@stackdock/core/adapters';

// In your dock adapter
export const myAdapter: DockAdapter = {
  provider: 'my-provider',
  
  async provisionServer(ctx, dock, config) {
    return await DockAdapterAPI.provisionResource(ctx, {
      type: 'server',
      provider: 'my-provider',
      configuration: config
    });
  }
};
```

## State Management

State is managed via Convex database integration. All provisioning state is stored in universal tables with provisioning metadata fields:

- `provisioningSource`: How resource was provisioned ('sst' | 'api' | 'manual')
- `sstResourceId`: SST resource identifier (if SST-provisioned)
- `sstStackName`: SST stack name (if SST-provisioned)
- `provisioningState`: Current provisioning state
- `provisionedAt`: Provisioning timestamp

## License

This package contains code derived from SST.dev, licensed under MIT License. See [LICENSE](./LICENSE) for full text.

StackDock modifications are also licensed under MIT License.

## Documentation

- [API Documentation](./docs/API.md)
- [Integration Guide](./docs/INTEGRATION.md)
- [Attribution Details](./ATTRIBUTION.md)

## Development

```bash
# Build
npm run build

# Test
npm run test

# Type check
npm run type-check
```

## References

- [SST.dev](https://sst.dev)
- [SST.dev GitHub](https://github.com/sst/sst)
- [StackDock Repository](https://github.com/stackdock/stackdock)
