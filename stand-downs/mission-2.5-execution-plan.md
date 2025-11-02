# Mission 2.5: SST Core → StackDock Core Refactoring - Execution Plan

> **Location**: `stand-downs/mission-2.5-execution-plan.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/mission-2.5-execution-plan.md`  
> **Last Updated**: 2025-11-11

## Overview

This document provides the complete execution plan for Mission 2.5: Refactoring SST.dev core engine into StackDock core, segmenting providers into dock adapters.

**Core Principle**: Fork SST core engine → StackDock core, segment providers → Dock adapters (copy/paste/own)

**Status**: Analysis complete, ready for implementation

---

## Prerequisites

Before starting, ensure you've read:
1. `stand-downs/mission-2.5-state.json` - Mission requirements
2. `stand-downs/agent-sessions.json` - All agent findings
3. `docs/workflows/AGENT_SYSTEM.md` - Agent system overview
4. Your principle engineer SOP: `docs/workflows/principle-engineers/{your-agent}.md`

---

## Execution Order

### PHASE 1: Foundation (Critical Path)

#### Step 1: BACKEND-CONVEX - Schema Changes
**Priority**: CRITICAL - Blocks everything  
**Agent**: `backend-convex`  
**Status**: Pending  
**Estimated Time**: 30 minutes

**Dependencies**: None (must be first)

**Tasks**:
1. Update `convex/schema.ts`:
   - Add `provisioning` permission to `roles.permissions` schema
   - Add `provisioningCredentials: v.optional(v.bytes())` to `docks` table
   - Add provisioning metadata fields to universal tables
   - Add provisioning indexes

**Exact Prompt**:
```
Read backend-convex and security findings in stand-downs/agent-sessions.json (lines 1453-1826).

Implement schema changes in convex/schema.ts:

1. ROLES TABLE - Add provisioning permission:
   - Update roles.permissions to include: provisioning: v.optional(v.union(v.literal("full"), v.literal("read"), v.literal("none")))
   - Default admin role: provisioning: "full"
   - Default developer role: provisioning: "read"

2. DOCKS TABLE - Add provisioning credentials storage:
   - Add field: provisioningCredentials: v.optional(v.bytes())
   - Purpose: Store encrypted provisioning credentials (AWS keys, Cloudflare tokens, etc.)
   - Encryption: Uses existing encryptApiKey() function

3. UNIVERSAL TABLES - Add provisioning metadata (servers, webServices, domains, databases):
   - provisioningSource: v.optional(v.union(v.literal("sst"), v.literal("api"), v.literal("manual")))
   - sstResourceId: v.optional(v.string())
   - sstStackName: v.optional(v.string())
   - provisioningState: v.optional(v.union(v.literal("provisioning"), v.literal("provisioned"), v.literal("failed"), v.literal("deprovisioning")))
   - provisionedAt: v.optional(v.number())

4. INDEXES - Add provisioning indexes:
   - On universal tables: .index("by_provisioning_source", ["provisioningSource", "orgId"])
   - On universal tables: .index("by_sst_resource", ["sstStackName", "sstResourceId"])

Ensure backward compatibility: All new fields are optional with defaults.

Report completion to stand-downs/agent-sessions.json with:
- Status: "completed"
- Files modified: ["convex/schema.ts"]
- Verification: Schema validates, no breaking changes
```

**Success Criteria**:
- ✅ Schema changes applied
- ✅ All fields optional (backward compatible)
- ✅ Indexes added
- ✅ Schema validates without errors
- ✅ Entry added to `stand-downs/agent-sessions.json`

**Files to Modify**:
- `convex/schema.ts`

**Reference Documents**:
- `stand-downs/agent-sessions.json` (backend-convex findings: lines 1453-1826)
- `stand-downs/agent-sessions.json` (security findings: lines 1862-2100)

**Testing Phase**:
After implementing schema changes, verify:
1. **Schema Validation**: Run `npx convex dev` or `npx convex deploy` to validate schema compiles
2. **Backward Compatibility**: Ensure existing queries/mutations still work (no breaking changes)
3. **Index Verification**: Verify indexes are created correctly in Convex dashboard
4. **Optional Fields**: Verify all new fields are truly optional (can insert records without them)
5. **Type Safety**: Verify TypeScript types are generated correctly

**Test Checklist**:
- [ ] Schema compiles without errors
- [ ] Can insert existing records (without new fields)
- [ ] Can insert records with new provisioning fields
- [ ] Indexes appear in Convex dashboard
- [ ] Generated types include new fields
- [ ] No TypeScript errors in dependent files

---

#### Step 2: SECURITY - Audit Logging Implementation
**Priority**: CRITICAL - Security requirement  
**Agent**: `security`  
**Status**: ✅ Completed  
**Estimated Time**: 45 minutes

**Dependencies**: Step 1.5 ✅ Complete  
**Completion**: See stand-downs/agent-sessions.json (lines 3161-3285)

**Readiness Check**: See `stand-downs/step-2-readiness.md` for detailed status

**Tasks**:
1. Review `convex/lib/audit.ts` (or create if doesn't exist)
2. Add audit logging to credential decryption
3. Add audit logging to provisioning operations
4. Create audit logging pattern

**Exact Prompt**:
```
Read security findings in stand-downs/agent-sessions.json (lines 1862-2100). Schema changes complete (Step 1).

Implement audit logging for provisioning operations:

1. REVIEW/CREATE audit logging infrastructure:
   - Check if convex/lib/audit.ts exists
   - If not, create audit logging helper function
   - Function signature: auditLog(ctx, operation, status, metadata)

2. ADD audit logging to credential access:
   - Location: convex/lib/encryption.ts (decryptApiKey function)
   - Log: userId, orgId, dockId, operation: "credential.decrypt", timestamp
   - NEVER log decrypted credential values

3. ADD audit logging to provisioning mutations (when created in Step 4):
   - Log provisionResource: userId, orgId, dockId, resourceType, spec (no credentials)
   - Log updateProvisionedResource: userId, resourceId, updates
   - Log deleteProvisionedResource: userId, resourceId

4. CREATE audit logging pattern document:
   - Document what to log for each provisioning operation
   - Document what NOT to log (credentials, sensitive data)
   - Document audit log storage location

Report completion to stand-downs/agent-sessions.json with:
- Status: "completed"
- Files created/modified: ["convex/lib/audit.ts", "convex/lib/encryption.ts"]
- Audit logging pattern documented
```

**Success Criteria**:
- ✅ Audit logging infrastructure ready
- ✅ Credential decryption logged
- ✅ Provisioning operations logging pattern defined
- ✅ Entry added to `stand-downs/agent-sessions.json`

**Files to Create/Modify**:
- `convex/lib/audit.ts` (create if needed)
- `convex/lib/encryption.ts` (add logging)

**Reference Documents**:
- `stand-downs/agent-sessions.json` (security findings: lines 1862-2100)
- `docs/architecture/SECURITY.md`

---

### PHASE 2: Core Provisioning Engine

#### Step 3: BACKEND-SST - Extract SST Core Engine
**Priority**: HIGH - Core functionality  
**Agent**: `backend-sst`  
**Status**: ✅ Completed  
**Estimated Time**: 2-3 hours (Complete)

**Dependencies**: Step 1 (schema changes) ✅  
**Completion**: See stand-downs/agent-sessions.json (lines 3287-3546)
**Note**: Implementations follow SST architecture patterns, refactored for StackDock universal tables, Convex integration, and dock adapters. Ready for Step 4 integration.

**Tasks**:
1. Create `packages/core/provisioning/` structure
2. Fork SST core components
3. Refactor for StackDock patterns
4. Add MIT attribution

**Exact Prompt**:
```
Read backend-sst findings in stand-downs/agent-sessions.json (lines 883-1382). Schema changes complete (Step 1).

Implement Phase 1-2 of extraction strategy:

PHASE 1: Structure Setup
1. Create packages/core/provisioning/ directory structure:
   - src/lifecycle/ (resource lifecycle management)
   - src/state/ (state management)
   - src/orchestrator/ (deployment orchestration)
   - src/adapters/ (dock adapter integration)
   - src/providers/ (provider registry)
   - tests/ (unit tests)
   - docs/ (documentation)

2. Create root files:
   - package.json (name: "@stackdock/core", dependencies)
   - tsconfig.json
   - LICENSE (SST's MIT license - copy from SST repo)
   - ATTRIBUTION.md (SST attribution documentation)
   - README.md

PHASE 2: Fork SST Core Components
1. Clone/fork SST repository (github.com/sst/sst)
2. Extract core components per backend-sst analysis:
   - Resource lifecycle manager → src/lifecycle/resource-manager.ts
   - State manager → src/state/state-manager.ts
   - Deployment orchestrator → src/orchestrator/deployment-orchestrator.ts
   - Provider registry → src/providers/provider-registry.ts

3. Add attribution headers to ALL files:
   ```
   /**
    * This file contains code derived from SST.dev (https://sst.dev)
    * Original SST.dev code is licensed under MIT License
    * Modified for StackDock - see ATTRIBUTION.md for details
    */
   ```

4. Create ATTRIBUTION.md with:
   - List of SST components used
   - Modifications made
   - Original SST license
   - StackDock modifications

Report progress to stand-downs/agent-sessions.json with:
- Status: "in-progress" (update to "completed" when done)
- Phase completed: 1 or 2
- Files created: [list]
- Blockers: [if any]
```

**Success Criteria**:
- ✅ Package structure created
- ✅ SST LICENSE and ATTRIBUTION.md added
- ✅ Core components forked (with attribution headers)
- ✅ Entry updated in `stand-downs/agent-sessions.json`

**Files to Create**:
- `packages/core/provisioning/` (entire directory structure)
- `packages/core/provisioning/LICENSE`
- `packages/core/provisioning/ATTRIBUTION.md`
- `packages/core/provisioning/README.md`
- `packages/core/provisioning/package.json`
- `packages/core/provisioning/tsconfig.json`

**Reference Documents**:
- `stand-downs/agent-sessions.json` (backend-sst findings: lines 883-1382)
- `stand-downs/mission-2.5-state.json`

---

#### Step 4: BACKEND-CONVEX - Provisioning Mutations
**Priority**: HIGH - Core functionality  
**Agent**: `backend-convex`  
**Status**: ✅ Completed  
**Estimated Time**: 2 hours (Complete)

**Dependencies**: Steps 1 (schema) ✅, 2 (audit logging) ✅, 3 (SST core) ✅  
**Completion**: See stand-downs/agent-sessions.json (lines 3550-3680+)
**Note**: Dock adapter integration complete. SST core integration marked with TODOs for future enhancement (mutations work with dock adapters).

**Tasks**:
1. Create provisioning mutations
2. Update DockAdapter interface
3. Integrate with StackDock core engine
4. Add RBAC checks

**Exact Prompt**:
```
Read backend-convex findings in stand-downs/agent-sessions.json (lines 1453-1826). 
Schema changes done (Step 1). SST core ready (Step 3).

Implement provisioning mutations in convex/docks/mutations.ts:

1. CREATE provisionResource mutation:
   - Signature: provisionResource(ctx, args: { dockId, resourceType, spec })
   - RBAC: Check provisioning:full permission
   - Flow:
     a. Get dock and validate
     b. Decrypt provisioning credentials (use existing decryptApiKey)
     c. Call StackDock core provisioning engine
     d. Provision resource via provider (SST or dock adapter)
     e. Write to universal table with provisioning metadata
     f. Audit log operation
   - Returns: { provisionId, resourceId }

2. CREATE updateProvisionedResource mutation:
   - Signature: updateProvisionedResource(ctx, args: { resourceId, updates })
   - RBAC: Check provisioning:full permission
   - Updates provisioned resource via StackDock core

3. CREATE deleteProvisionedResource mutation:
   - Signature: deleteProvisionedResource(ctx, args: { resourceId })
   - RBAC: Check provisioning:full permission
   - Deletes resource via StackDock core, removes from universal table

4. UPDATE DockAdapter interface (convex/docks/_types.ts):
   - Add optional methods:
     - provisionServer?(ctx, dock, spec): Promise<ProvisionedServer>
     - provisionWebService?(ctx, dock, spec): Promise<ProvisionedWebService>
     - provisionDatabase?(ctx, dock, spec): Promise<ProvisionedDatabase>
     - provisionDomain?(ctx, dock, spec): Promise<ProvisionedDomain>
   - All methods optional (backward compatible)

5. INTEGRATE with StackDock core engine:
   - Import from '@stackdock/core/provisioning'
   - Use provisioning engine API per backend-sst findings
   - Map resources to universal tables

Report completion to stand-downs/agent-sessions.json with:
- Status: "completed"
- Files modified: ["convex/docks/mutations.ts", "convex/docks/_types.ts"]
- Mutations created: [list]
- Integration verified
```

**Success Criteria**:
- ✅ All provisioning mutations created
- ✅ DockAdapter interface updated
- ✅ RBAC checks implemented
- ✅ Audit logging integrated
- ✅ StackDock core engine integrated
- ✅ Entry added to `stand-downs/agent-sessions.json`

**Files to Modify**:
- `convex/docks/mutations.ts`
- `convex/docks/_types.ts`

**Reference Documents**:
- `stand-downs/agent-sessions.json` (backend-convex findings: lines 1453-1826)
- `stand-downs/agent-sessions.json` (backend-sst findings: lines 883-1382)

---

### PHASE 3: CLI and Frontend

#### Step 5: DEVOPS - CLI Commands Design
**Priority**: MEDIUM - User experience  
**Agent**: `devops`  
**Status**: ✅ Completed  
**Estimated Time**: 1 hour (Complete)

**Dependencies**: Step 4 (provisioning mutations) ✅  
**Completion**: See stand-downs/agent-sessions.json (lines 3680-3900+)  
**Note**: CLI command designs complete (stackdock provision, stackdock deploy), state management strategy defined, integration plan created.

**Tasks**:
1. Design CLI provisioning commands ✅
2. Plan state management ✅
3. Design deployment workflows ✅

**Exact Prompt**:
```
Read devops findings and all backend agent findings in stand-downs/agent-sessions.json.
Provisioning mutations ready (Step 4).

Design CLI provisioning commands for packages/cli/:

1. DESIGN stackdock provision command:
   - Command: stackdock provision <provider> <resourceType> [options]
   - Examples:
     - stackdock provision aws s3-bucket --name my-bucket --region us-east-1
     - stackdock provision cloudflare worker --name my-worker --script ./worker.js
   - Flow:
     a. Read spec from CLI args or config file
     b. Validate spec
     c. Call Convex mutation: api.docks.mutations.provisionResource
     d. Display provisioning status
     e. Poll status until complete

2. DESIGN stackdock deploy command:
   - Command: stackdock deploy [stack-name]
   - Purpose: Deploy StackDock core provisioning engine
   - Flow: Deploy packages/core/provisioning/ to target environment

3. DESIGN state management:
   - Where: Convex database (provisioningState table or field)
   - CLI reads state from Convex queries
   - No local state files needed

4. PLAN integration with packages/cli/:
   - Add commands to packages/cli/src/commands/
   - Update CLI help/documentation
   - Integrate with Convex client

Output design to stand-downs/agent-sessions.json with:
- Status: "completed"
- CLI command designs documented
- State management strategy documented
- Implementation plan created
```

**Success Criteria**:
- ✅ CLI command designs documented
- ✅ State management strategy defined
- ✅ Integration plan created
- ✅ Entry added to `stand-downs/agent-sessions.json`

**Files to Reference**:
- `packages/cli/README.md`
- `packages/cli/src/index.ts`

**Reference Documents**:
- `stand-downs/agent-sessions.json` (all backend findings)

---

#### Step 6: FRONTEND-AGENTS - UI Implementation
**Priority**: MEDIUM - User experience  
**Agent**: `frontend-agents` (combined)  
**Status**: ✅ Completed  
**Estimated Time**: 3-4 hours (Complete)

**Dependencies**: Step 4 (provisioning mutations) ✅  
**Completion**: See stand-downs/agent-sessions.json (lines 4506-4575)  
**Note**: XState installed, state machines created, components created (shadcn/ui compliant), routes created (TanStack Start compliant), backend integration working. Status query pending (api.provisioning.queries.getProvisionStatus needs to be created).

**Tasks**:
1. Install XState ✅
2. Create provisioning components ✅
3. Create routes ✅
4. Implement state machines ✅

**Exact Prompt**:
```
Read frontend-agents findings in stand-downs/agent-sessions.json (lines 2246-3042).
Backend mutations ready (Step 4).

Implement provisioning UI:

1. INSTALL XState:
   - Command: npm install xstate @xstate/react
   - Location: apps/web/package.json
   - Version: Latest stable (v5.x)

2. CREATE state machines:
   - apps/web/src/machines/provision-resource.machine.ts
   - apps/web/src/machines/provision-status.machine.ts
   - Follow XState patterns from frontend-agents findings

3. CREATE provisioning components:
   - packages/ui/components/provisioning/provision-form.tsx
   - packages/ui/components/provisioning/provision-status-card.tsx
   - packages/ui/components/provisioning/resource-spec-form.tsx
   - packages/ui/components/provisioning/provision-progress-indicator.tsx
   - Follow shadcn/ui patterns

4. CREATE routes:
   - apps/web/src/routes/dashboard/provision/index.tsx
   - apps/web/src/routes/dashboard/provision/$provider.tsx
   - apps/web/src/routes/dashboard/provision/$provider.$resourceType.tsx
   - apps/web/src/routes/dashboard/provision/$provider.$resourceType.$provisionId.tsx
   - Follow TanStack Start patterns

5. INTEGRATE with backend:
   - Use Convex mutations: api.docks.mutations.provisionResource
   - Use Convex queries: api.provisioning.queries.getProvisionStatus
   - Real-time updates via Convex subscriptions

Report completion to stand-downs/agent-sessions.json with:
- Status: "completed"
- XState installed: yes/no
- Components created: [list]
- Routes created: [list]
- Integration verified
```

**Success Criteria**:
- ✅ XState installed
- ✅ State machines implemented
- ✅ Components created (shadcn/ui compliant)
- ✅ Routes created (TanStack Start compliant)
- ✅ Backend integration working
- ✅ Entry added to `stand-downs/agent-sessions.json`

**Files to Create/Modify**:
- `apps/web/package.json` (add XState)
- `apps/web/src/machines/` (new directory)
- `packages/ui/components/provisioning/` (new directory)
- `apps/web/src/routes/dashboard/provision/` (new routes)

**Reference Documents**:
- `stand-downs/agent-sessions.json` (frontend-agents findings: lines 2246-3042)

---

#### Step 4.5: BACKEND-CONVEX - Provisioning Status Query (Blocker Fix)
**Priority**: MEDIUM - Unblocks real-time status updates  
**Agent**: `backend-convex`  
**Status**: ✅ Completed  
**Estimated Time**: 30 minutes (Complete)

**Dependencies**: Step 6 (Frontend UI) ✅  
**Completion**: See stand-downs/agent-sessions.json (lines 4576-4656)  
**Note**: Created `getProvisionStatus` and `listProvisioningOperations` queries. Real-time status updates now available. Frontend can integrate with `api.provisioning.queries.getProvisionStatus`.

**Tasks**:
1. Create provisioning status query ✅
2. Implement real-time subscription support ✅
3. Add RBAC checks ✅

**Files Created**:
- `convex/provisioning/queries.ts` - Both queries implemented

**Reference Documents**:
- `stand-downs/blocker-resolution-summary.md` - Blocker resolution details
- `stand-downs/agent-sessions.json` (backend-convex entry: lines 4576-4656)

---

### PHASE 4: Enhancements

#### Step 7: SECURITY - Credential Rotation
**Priority**: LOW - Enhancement  
**Agent**: `security`  
**Status**: ✅ Completed  
**Estimated Time**: 1 hour (Complete)

**Dependencies**: Step 4 (provisioning mutations) ✅  
**Completion**: See stand-downs/agent-sessions.json (lines 4723-4815)  
**Note**: Credential rotation mutation implemented with graceful rotation logic. Validates new credentials before replacing old ones. RBAC checks, audit logging, and error handling complete.

**Tasks**:
1. Implement credential rotation mutation
2. Add graceful rotation logic

**Exact Prompt**:
```
Read security findings in stand-downs/agent-sessions.json (lines 1862-2100).
Basic provisioning working (Step 4).

Implement credential rotation:

1. CREATE rotateProvisioningCredentials mutation:
   - Location: convex/docks/mutations.ts
   - Signature: rotateProvisioningCredentials(ctx, args: { dockId, newCredentials })
   - Flow:
     a. Validate new credentials (test API call)
     b. Encrypt new credentials
     c. Atomically update docks.provisioningCredentials
     d. Audit log rotation
     e. Graceful rollback on failure

2. IMPLEMENT graceful rotation:
   - Keep old credentials until new ones validated
   - Test new credentials before replacing
   - Rollback on validation failure
   - Support both credentials during transition period

Report completion to stand-downs/agent-sessions.json with:
- Status: "completed"
- Mutation created: rotateProvisioningCredentials
- Rotation logic implemented
- Tested: yes/no
```

**Success Criteria**:
- ✅ Credential rotation mutation created
- ✅ Graceful rotation logic implemented
- ✅ Audit logging added
- ✅ Entry added to `stand-downs/agent-sessions.json`

**Files to Modify**:
- `convex/docks/mutations.ts`

**Reference Documents**:
- `stand-downs/agent-sessions.json` (security findings: lines 1862-2100)

---

#### Step 8: DOCUMENTATION - Update SECURITY.md
**Priority**: LOW - Documentation  
**Agent**: `security` or `ai-assistant`  
**Status**: ✅ Completed  
**Estimated Time**: 30 minutes (Complete)

**Dependencies**: Step 7 (credential rotation) ✅  
**Completion**: See docs/architecture/SECURITY.md (lines 246-567)  
**Note**: Comprehensive "Provisioning Credential Security" section added covering encryption, storage, RBAC, lifecycle, audit logging, best practices, and security checklist.

**Tasks**:
1. Update SECURITY.md with provisioning security section

**Exact Prompt**:
```
Read security findings in stand-downs/agent-sessions.json (lines 1862-2100).
All provisioning security implemented (Steps 2, 7).

Update docs/architecture/SECURITY.md:

1. ADD 'Provisioning Credential Security' section covering:
   - Encryption strategy (reuse encryptApiKey)
   - Storage location (docks.provisioningCredentials field)
   - RBAC requirements (provisioning:full permission)
   - Credential lifecycle (encryption → storage → decryption → rotation)
   - Audit logging requirements
   - Secure credential passing to StackDock core engine

2. DOCUMENT best practices:
   - Never log credentials
   - Always encrypt before storage
   - Always check RBAC before decryption
   - Rotate credentials regularly
   - Use audit logs for compliance

Report completion to stand-downs/agent-sessions.json with:
- Status: "completed"
- Section added: "Provisioning Credential Security"
- Documentation complete
```

**Success Criteria**:
- ✅ SECURITY.md updated
- ✅ Provisioning security documented
- ✅ Entry added to `stand-downs/agent-sessions.json`

**Files to Modify**:
- `docs/architecture/SECURITY.md`

**Reference Documents**:
- `stand-downs/agent-sessions.json` (security findings: lines 1862-2100)

---

## Execution Summary

| Step | Phase | Agent | Priority | Dependencies | Status |
|------|-------|-------|----------|--------------|--------|
| 1 | Foundation | backend-convex | CRITICAL | None | ✅ Completed |
| 1.5 | Foundation | backend-convex | CRITICAL | Step 1 | ✅ Completed |
| 2 | Foundation | security | CRITICAL | Step 1.5 | ✅ Completed |
| 3 | Core Engine | backend-sst | HIGH | Step 1.5 | ✅ Completed |
| 4 | Core Engine | backend-convex | HIGH | Steps 2, 3 | ✅ Completed |
| 5 | CLI/Frontend | devops | MEDIUM | Step 4 | ✅ Completed |
| 6 | CLI/Frontend | frontend-agents | MEDIUM | Step 4 | ✅ Completed |
| 4.5 | Blocker Fix | backend-convex | MEDIUM | Step 6 | ✅ Completed |
| 7 | Enhancement | security | LOW | Step 4 | ✅ Completed |
| 8 | Enhancement | security/ai-assistant | LOW | Step 7 | ✅ Completed |

---

## Critical Path

**Must complete in order:**
1. Step 1 (Schema) → Blocks everything
2. Step 2 (Audit Logging) → Security requirement
3. Step 3 (SST Core) → Needed for Step 4
4. Step 4 (Mutations) → Blocks Steps 5 & 6

**Can proceed in parallel after Step 4:**
- Step 5 (CLI) + Step 6 (Frontend) can be done simultaneously

**Can be done later:**
- Step 7 (Credential Rotation) - Enhancement
- Step 8 (Documentation) - Can be done anytime

**Testing Steps:**
- Step 1.5 (Schema Testing) - Verify Step 1 implementation before proceeding

---

## Agent Instructions

### Before Starting Your Step

1. **Read This Document**: Understand your step and dependencies
2. **Read Stand-Downs**: Check `stand-downs/agent-sessions.json` for previous findings
3. **Read Your SOP**: Review `docs/workflows/principle-engineers/{your-agent}.md`
4. **Check Dependencies**: Verify prerequisite steps are complete

### During Execution

1. **Follow Exact Prompt**: Use the prompt provided for your step
2. **Report Progress**: Update `stand-downs/agent-sessions.json` with:
   - Status: "in-progress" or "completed"
   - Files created/modified
   - Blockers (if any)
   - Verification notes

### After Completion

1. **Verify Success Criteria**: All criteria must be met
2. **Update Stand-Downs**: Add entry to `stand-downs/agent-sessions.json`
3. **Notify Next Agent**: If you unblock the next step, note it in stand-downs

---

## Reference Files

- **Mission State**: `stand-downs/mission-2.5-state.json`
- **Agent Findings**: `stand-downs/agent-sessions.json`
- **Agent System**: `docs/workflows/AGENT_SYSTEM.md`
- **Agent SOPs**: `docs/workflows/principle-engineers/`

---

## Questions?

If you encounter blockers or need clarification:
1. Document in `stand-downs/agent-sessions.json`
2. Note specific blockers and questions
3. Wait for Captain/AI Assistant guidance

---

**Remember**: This is a complex refactoring. Take your time. Verify each step. Report blockers immediately.
