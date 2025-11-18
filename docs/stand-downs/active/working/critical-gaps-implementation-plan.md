# Critical Gaps Implementation Plan

**Created**: November 17, 2025  
**Status**: Planning  
**Priority**: High

## Overview

This plan addresses the 6 critical gaps identified in the third-party agent code review, prioritizing high-priority items that will improve code quality, maintainability, and developer experience.

---

## Phase 1: Foundation (High Priority)

### 1.1 Extract Universal Types to `packages/shared/src/schema.ts`

**Goal**: Create shared TypeScript types for universal resources that can be imported by adapters, UI, and Convex functions.

**Current State**:
- Types exist only in `convex/schema.ts` (Convex schema definitions)
- Adapters use `Doc<"webServices">` from Convex generated types
- No shared type definitions

**Implementation Steps**:

1. **Create `packages/shared/src/schema.ts`**
   - Extract universal resource types (Server, WebService, Domain, Database, etc.)
   - Define types that match Convex schema but are provider-agnostic
   - Export enums for provider IDs, resource status, auth types

2. **Create `packages/shared/src/index.ts`**
   - Re-export all types from `schema.ts`
   - Export shared constants (provider IDs, status values)

3. **Update `packages/shared/package.json`**
   - Add TypeScript build configuration
   - Set up proper exports

4. **Create `packages/shared/tsconfig.json`**
   - Configure for library compilation
   - Set up proper module resolution

5. **Update Convex schema to reference shared types** (optional, for validation)
   - Keep Convex schema as source of truth
   - Use shared types for TypeScript type checking

6. **Update adapters to import from `@stackdock/shared`**
   - Replace `Doc<"webServices">` with `WebService` from shared
   - Update all 16 adapters

7. **Update UI components to import from `@stackdock/shared`**
   - Replace Convex Doc types with shared types where appropriate

**Files to Create**:
- `packages/shared/src/schema.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tsconfig.json`

**Files to Update**:
- `packages/shared/package.json`
- All adapter files in `convex/docks/adapters/*/adapter.ts`
- UI components that use resource types

**Estimated Effort**: 4-6 hours

---

### 1.2 Add Shared `tsconfig.base.json`

**Goal**: Create a base TypeScript configuration that all workspaces extend from, ensuring consistent TypeScript behavior.

**Current State**:
- Each workspace has its own `tsconfig.json`
- No shared base configuration
- Potential for divergent TypeScript settings

**Implementation Steps**:

1. **Create `tsconfig.base.json` at root**
   - Set strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
   - Define common compiler options
   - Set target and module settings

2. **Update workspace `tsconfig.json` files to extend base**
   - `apps/web/tsconfig.json`
   - `apps/marketing/tsconfig.json`
   - `convex/tsconfig.json`
   - `packages/shared/tsconfig.json`
   - `packages/cli/tsconfig.json`
   - `packages/core/provisioning/tsconfig.json`

**Files to Create**:
- `tsconfig.base.json`

**Files to Update**:
- All workspace `tsconfig.json` files

**Estimated Effort**: 1-2 hours

---

### 1.3 Implement Basic Test Suite (Adapter Contract Tests)

**Goal**: Create a test suite that verifies adapter implementations conform to the DockAdapter interface and correctly map provider data to universal schema.

**Current State**:
- Vitest configured in `apps/web/package.json`
- Testing Library dependencies installed
- No actual test files
- Root test script is placeholder

**Implementation Steps**:

1. **Create test infrastructure**
   - Set up Vitest config at root or in `packages/docks`
   - Create test utilities for mocking Convex context
   - Create fixture data for each provider

2. **Create `packages/docks/src/__tests__/adapter-contract.test.ts`**
   - Test that all adapters implement DockAdapter interface
   - Test `validateCredentials` method signature
   - Test sync methods exist and have correct signatures

3. **Create adapter-specific tests**
   - `packages/docks/src/__tests__/adapters/gridpane.test.ts`
   - Test GridPane → universal schema mapping
   - Use fixture data (no real API calls)
   - Verify required fields are present
   - Verify `fullApiData` contains provider-specific data

4. **Create test for at least 2-3 adapters** (start with simple ones)
   - GridPane (most complex, good test case)
   - Vercel (simpler, good baseline)
   - DigitalOcean (IaaS, different resource types)

5. **Update root `package.json` test script**
   - Change from placeholder to actual test command
   - `"test": "vitest run"` or `"test": "vitest run --workspace=packages/docks"`

6. **Create test fixtures**
   - `packages/docks/src/__tests__/fixtures/gridpane-sites.json`
   - `packages/docks/src/__tests__/fixtures/vercel-deployments.json`
   - Real API response examples (from `docs/local/docks/`)

**Files to Create**:
- `packages/docks/src/__tests__/adapter-contract.test.ts`
- `packages/docks/src/__tests__/adapters/gridpane.test.ts`
- `packages/docks/src/__tests__/adapters/vercel.test.ts`
- `packages/docks/src/__tests__/fixtures/` (directory with JSON files)
- `packages/docks/vitest.config.ts` (if needed)

**Files to Update**:
- `package.json` (root test script)
- `packages/docks/package.json` (add vitest if needed)

**Estimated Effort**: 6-8 hours

---

### 1.4 Wire Pipeline Scripts to GitHub Actions CI

**Goal**: Automate code quality checks, tests, and builds via GitHub Actions on every push and PR.

**Current State**:
- Pipeline scripts exist in `scripts/pipeline/`
- Scripts are functional but not automated
- No `.github/workflows/` directory

**Implementation Steps**:

1. **Create `.github/workflows/ci.yml`**
   - Trigger on push to main and PRs
   - Run lint/type-check job
   - Run test job
   - Run build job
   - Run security scan job (optional)

2. **Set up job dependencies**
   - Lint job runs first
   - Test job runs after lint (if lint passes)
   - Build job runs after tests (if tests pass)

3. **Configure caching**
   - Cache `node_modules` for faster runs
   - Cache Convex generated files if possible

4. **Add status badges to README**
   - Show CI status badge
   - Show test coverage badge (if added)

5. **Test the workflow**
   - Push a test commit
   - Verify all checks run
   - Fix any issues

**Files to Create**:
- `.github/workflows/ci.yml`

**Files to Update**:
- `README.md` (add CI badges)

**Estimated Effort**: 2-3 hours

---

### 1.5 Add TypeScript/Lint Enforcement for Encryption and RBAC

**Goal**: Make it impossible (or very difficult) to accidentally bypass encryption or RBAC checks.

**Current State**:
- Encryption functions exist but usage is manual
- RBAC middleware exists but usage is manual
- No type-level or lint-level enforcement

**Implementation Steps**:

1. **Create branded types for encrypted data**
   - `packages/shared/src/encryption.ts`
   - `type EncryptedApiKey = string & { __brand: 'EncryptedApiKey' }`
   - `type PlaintextApiKey = string & { __brand: 'PlaintextApiKey' }`
   - Force type conversions through encryption functions

2. **Update `convex/lib/encryption.ts`**
   - Return `EncryptedApiKey` from `encryptApiKey()`
   - Accept `PlaintextApiKey` in `encryptApiKey()`
   - Accept `EncryptedApiKey` in `decryptApiKey()`
   - Return `PlaintextApiKey` from `decryptApiKey()`

3. **Update schema to use branded types**
   - `docks.encryptedApiKey: EncryptedApiKey` (if possible with Convex)
   - Or document that `v.bytes()` should only contain `EncryptedApiKey`

4. **Create RBAC helper types**
   - `packages/shared/src/rbac.ts`
   - `type Permission = "resources:read" | "resources:write" | ...`
   - `type RBACProtected<T> = T & { __rbac: true }`

5. **Create ESLint rule (optional, advanced)**
   - Rule: "convex-mutations-must-use-rbac"
   - Detect mutations without `withRBAC()` wrapper
   - Or create a codemod to add RBAC

6. **Update documentation**
   - Add to `SECURITY.md`: "How to add a new secret field safely"
   - Add to `RBAC.md`: "How RBAC must be used in every mutation"

**Files to Create**:
- `packages/shared/src/encryption.ts` (types)
- `packages/shared/src/rbac.ts` (types)
- `.eslintrc.js` (if creating custom rule)

**Files to Update**:
- `convex/lib/encryption.ts`
- `convex/lib/rbac.ts`
- `docs/architecture/SECURITY.md`
- `docs/architecture/RBAC.md`
- All dock mutations to use branded types

**Estimated Effort**: 4-6 hours

---

## Phase 2: Medium Priority

### 2.1 Create Provider Capability Matrix Table

**Goal**: Document which providers support which universal tables and operations.

**Implementation Steps**:

1. **Create `docs/architecture/PROVIDERS.md`**
   - Table showing provider → universal table mappings
   - Columns: Provider | Servers | Web Services | Domains | Databases | Projects | Issues | Monitors | Mode
   - Mark with ✅/❌ for each resource type

2. **Generate from code (optional)**
   - Script to scan adapters and generate table
   - Or manually maintain (simpler for MVP)

**Files to Create**:
- `docs/architecture/PROVIDERS.md`

**Estimated Effort**: 1-2 hours

---

### 2.2 Implement Audit Log UI Page

**Goal**: Allow users to view audit logs in the dashboard.

**Implementation Steps**:

1. **Create Convex query for audit logs**
   - `convex/audit/queries.ts`
   - `listAuditLogs` query with filtering (by org, user, action type, date range)
   - Use RBAC to ensure users only see their org's logs

2. **Create UI page**
   - `apps/web/src/routes/dashboard/settings/audit.tsx`
   - Table showing: timestamp, user, action, resource, result
   - Filters: date range, action type, user
   - Pagination

3. **Add navigation link**
   - Add to Settings sidebar
   - Or create separate "Audit" section

**Files to Create**:
- `convex/audit/queries.ts`
- `apps/web/src/routes/dashboard/settings/audit.tsx`
- `apps/web/src/components/audit/audit-log-table.tsx`

**Files to Update**:
- Settings navigation/routing

**Estimated Effort**: 4-6 hours

---

### 2.3 Create Fake Provider Adapter

**Goal**: Create a mock provider adapter for testing, demos, and onboarding.

**Implementation Steps**:

1. **Create `convex/docks/adapters/fake/adapter.ts`**
   - Implement DockAdapter interface
   - Return deterministic fixture data
   - No real API calls

2. **Create fixture data**
   - 3 servers
   - 2 web services
   - 1 domain
   - 1 database

3. **Add to registry**
   - Register in `convex/docks/registry.ts`
   - Provider ID: "fake"

4. **Update UI to allow fake provider**
   - Add "Demo Provider" option in dock creation
   - Label clearly as "Demo/Testing Only"

5. **Use in E2E tests**
   - Connect fake provider in Playwright tests
   - Verify resources appear in tables

**Files to Create**:
- `convex/docks/adapters/fake/adapter.ts`
- `convex/docks/adapters/fake/types.ts`
- `convex/docks/adapters/fake/fixtures.ts`

**Files to Update**:
- `convex/docks/registry.ts`
- Dock creation UI

**Estimated Effort**: 3-4 hours

---

## Phase 3: Low Priority (Post-MVP)

### 3.1 Plugin/Extension Format

**Goal**: Define how third-party dock adapters can be packaged and discovered.

**Status**: Deferred to post-MVP

---

### 3.2 Onboarding Flow

**Goal**: Create guided first-run experience.

**Status**: Deferred to post-MVP

---

### 3.3 Developer Observability Tools

**Goal**: Add debug logging and tracing for adapter calls.

**Status**: Deferred to post-MVP

---

## Implementation Order

**Week 1** (Foundation):
1. Extract universal types (1.1)
2. Add shared tsconfig (1.2)
3. Wire CI/CD (1.4) - can be done in parallel

**Week 2** (Testing & Enforcement):
4. Implement test suite (1.3)
5. Add type/lint enforcement (1.5)

**Week 3** (Medium Priority):
6. Create provider matrix (2.1)
7. Implement audit UI (2.2)
8. Create fake provider (2.3)

---

## Success Criteria

- [ ] Universal types extracted and used by all adapters
- [ ] Shared tsconfig.base.json created and all workspaces extend it
- [ ] At least 3 adapter contract tests passing
- [ ] GitHub Actions CI running on every PR
- [ ] Encryption and RBAC usage enforced via types
- [ ] Provider capability matrix documented
- [ ] Audit log UI accessible in dashboard
- [ ] Fake provider adapter available for testing

---

## Notes

- This plan assumes MVP is complete and we're now improving code quality
- Each phase builds on the previous one
- Some items can be done in parallel (e.g., CI/CD setup while working on tests)
- Focus on high-priority items first, defer low-priority to post-MVP
