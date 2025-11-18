---
title: Create Fake Provider Adapter
labels: priority:medium,category:testing,type:enhancement
assignees: 
milestone: Phase 2 - Medium Priority
---

## Goal

Create a mock provider adapter for testing, demos, and onboarding.

## Current State

- No fake provider adapter exists
- Testing requires real provider credentials
- No easy way to demo StackDock without connecting real providers

## Implementation Steps

1. Create `convex/docks/adapters/fake/adapter.ts`
   - Implement DockAdapter interface
   - Return deterministic fixture data
   - No real API calls

2. Create fixture data
   - 3 servers
   - 2 web services
   - 1 domain
   - 1 database

3. Add to registry
   - Register in `convex/docks/registry.ts`
   - Provider ID: "fake"

4. Update UI to allow fake provider
   - Add "Demo Provider" option in dock creation
   - Label clearly as "Demo/Testing Only"

5. Use in E2E tests
   - Connect fake provider in Playwright tests
   - Verify resources appear in tables

## Files to Create

- `convex/docks/adapters/fake/adapter.ts`
- `convex/docks/adapters/fake/types.ts`
- `convex/docks/adapters/fake/fixtures.ts`

## Files to Update

- `convex/docks/registry.ts`
- Dock creation UI

## Success Criteria

- [ ] Fake provider adapter implements DockAdapter interface
- [ ] Returns deterministic fixture data
- [ ] Registered in adapter registry
- [ ] Available in UI as "Demo Provider"
- [ ] Can be used in E2E tests

## Estimated Effort

3-4 hours

## Related

- Part of Critical Gaps Implementation Plan
- See: `docs/stand-downs/active/working/critical-gaps-implementation-plan.md`
- Related Gap: #8 - No Mock Provider
