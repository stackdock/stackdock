# SST.dev Attribution

This package contains code derived from SST.dev (https://sst.dev), licensed under MIT License.

## SST Components Used

The following components from SST.dev have been extracted and refactored for StackDock:

### 1. Resource Lifecycle Management
- **Source**: SST's resource management system (built on Pulumi/Terraform)
- **Location**: `src/lifecycle/resource-manager.ts`
- **Purpose**: Handles creation, updating, and deletion of cloud resources
- **Modifications**: Refactored to write to StackDock universal tables (servers, webServices, domains, databases) instead of SST's resource registry

### 2. State Management
- **Source**: SST state management system (.sst/state directory)
- **Location**: `src/state/state-manager.ts`, `src/state/convex-state-adapter.ts`
- **Purpose**: Maintains state file tracking infrastructure configurations for incremental deployments
- **Modifications**: Replaced file-based state system with Convex database integration. State now stored in universal tables with provisioning metadata fields.

### 3. Deployment Orchestrator
- **Source**: SST Ion deployment engine (Pulumi/Terraform based)
- **Location**: `src/orchestrator/deployment-orchestrator.ts`
- **Purpose**: Coordinates deployment process, manages resource dependencies and provisioning order
- **Modifications**: Refactored to work with dock adapters. Orchestrates provisioning via universal table writes instead of SST constructs.

### 4. Provider System
- **Source**: SST provider registry system (150+ providers)
- **Location**: `src/providers/provider-registry.ts`
- **Purpose**: Manages cloud provider integrations via Pulumi providers
- **Modifications**: Integrated with dock adapter pattern. Uses SST providers when available, dock adapters as fallback.

## Original SST License

The original SST.dev code is licensed under MIT License. See LICENSE file for full text.

## StackDock Modifications

### Architectural Changes

1. **Universal Table Pattern**: All resource operations now map to StackDock's universal tables (servers, webServices, domains, databases) instead of SST's resource registry.

2. **Convex Integration**: State management migrated from file-based system (.sst/state) to Convex database. State stored in universal tables with provisioning metadata fields:
   - `provisioningSource`: 'sst' | 'api' | 'manual'
   - `sstResourceId`: SST resource identifier
   - `sstStackName`: SST stack name
   - `provisioningState`: 'provisioning' | 'provisioned' | 'failed' | 'deprovisioning'
   - `provisionedAt`: Timestamp

3. **Dock Adapter Integration**: Provisioning engine integrated with StackDock's dock adapter pattern. Dock adapters can use provisioning engine via `dock-adapter-api.ts`.

4. **RBAC Integration**: All provisioning operations integrated with StackDock's RBAC system. Permission checks enforced before provisioning operations.

5. **Audit Logging**: Provisioning operations logged via StackDock's audit logging system.

### Code Modifications

- Removed SST framework dependencies (CDK, CloudFormation references)
- Replaced SST resource registry with universal table writes
- Replaced file-based state with Convex database integration
- Added RBAC permission checks
- Added audit logging
- Created universal table mapper (SST resources → StackDock universal schema)
- Created provider selector (SST provider vs dock adapter)

### New Components Added

- `src/adapters/dock-adapter-api.ts`: Integration API for dock adapters
- `src/adapters/universal-table-mapper.ts`: Maps SST resources to universal tables
- `src/adapters/provisioning-context.ts`: Provisioning context (orgId, dockId, RBAC)
- `src/state/convex-state-adapter.ts`: Convex database state adapter
- `src/providers/provider-selector.ts`: Selects provisioning method (SST vs dock adapter)

## Attribution Statement

This package contains code derived from SST.dev (https://sst.dev). Original SST.dev code is licensed under MIT License. See LICENSE file for full license text.

StackDock modifications are also licensed under MIT License. See StackDock LICENSE file at repository root.

## References

- SST.dev: https://sst.dev
- SST.dev GitHub: https://github.com/sst/sst
- SST.dev Documentation: https://sst.dev/docs
- StackDock Repository: https://github.com/stackdock/stackdock
