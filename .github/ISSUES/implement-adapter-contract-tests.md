---
title: Implement Basic Test Suite (Adapter Contract Tests)
labels: priority:high,category:testing,type:enhancement
assignees: 
milestone: Phase 1 - Foundation
---

## Goal

Create a test suite that verifies adapter implementations conform to the DockAdapter interface and correctly map provider data to universal schema.

## Current State

- Vitest configured in `apps/web/package.json`
- Testing Library dependencies installed
- No actual test files
- Root test script is placeholder

## Implementation Steps

1. Create test infrastructure
   - Set up Vitest config at root or in `packages/docks`
   - Create test utilities for mocking Convex context
   - Create fixture data for each provider

2. Create `packages/docks/src/__tests__/adapter-contract.test.ts`
   - Test that all adapters implement DockAdapter interface
   - Test `validateCredentials` method signature
   - Test sync methods exist and have correct signatures

3. Create adapter-specific tests
   - `packages/docks/src/__tests__/adapters/gridpane.test.ts`
   - Test GridPane → universal schema mapping
   - Use fixture data (no real API calls)
   - Verify required fields are present
   - Verify `fullApiData` contains provider-specific data

4. Create test for at least 2-3 adapters (start with simple ones)
   - GridPane (most complex, good test case)
   - Vercel (simpler, good baseline)
   - DigitalOcean (IaaS, different resource types)

5. Update root `package.json` test script
   - Change from placeholder to actual test command
   - `"test": "vitest run"` or `"test": "vitest run --workspace=packages/docks"`

6. Create test fixtures
   - `packages/docks/src/__tests__/fixtures/gridpane-sites.json`
   - `packages/docks/src/__tests__/fixtures/vercel-deployments.json`
   - Real API response examples (from `docs/local/docks/`)

## Files to Create

- `packages/docks/src/__tests__/adapter-contract.test.ts`
- `packages/docks/src/__tests__/adapters/gridpane.test.ts`
- `packages/docks/src/__tests__/adapters/vercel.test.ts`
- `packages/docks/src/__tests__/adapters/digitalocean.test.ts`
- `packages/docks/src/__tests__/fixtures/` (directory with JSON files)
- `packages/docks/vitest.config.ts` (if needed)

## Files to Update

- `package.json` (root test script)
- `packages/docks/package.json` (add vitest if needed)

## Success Criteria

- [ ] Adapter contract test passes for all adapters
- [ ] At least 3 adapter-specific tests passing
- [ ] Test fixtures created from real API responses
- [ ] Root test script runs actual tests
- [ ] Tests use fixture data (no real API calls)

## Estimated Effort

6-8 hours

## Related

- Part of Critical Gaps Implementation Plan
- See: `docs/stand-downs/active/working/critical-gaps-implementation-plan.md`
- Related Gap: #3 - No Test Suite
