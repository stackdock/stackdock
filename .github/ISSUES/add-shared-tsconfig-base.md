---
title: Add Shared TypeScript Base Config (tsconfig.base.json)
labels: priority:high,category:foundation,type:infrastructure
assignees: 
milestone: Phase 1 - Foundation
---

## Goal

Create a base TypeScript configuration that all workspaces extend from, ensuring consistent TypeScript behavior.

## Current State

- Each workspace has its own `tsconfig.json`
- No shared base configuration
- Potential for divergent TypeScript settings

## Implementation Steps

1. Create `tsconfig.base.json` at root
   - Set strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
   - Define common compiler options
   - Set target and module settings

2. Update workspace `tsconfig.json` files to extend base
   - `apps/web/tsconfig.json`
   - `apps/marketing/tsconfig.json`
   - `convex/tsconfig.json`
   - `packages/shared/tsconfig.json`
   - `packages/cli/tsconfig.json`
   - `packages/core/provisioning/tsconfig.json`

## Files to Create

- `tsconfig.base.json`

## Files to Update

- `apps/web/tsconfig.json`
- `apps/marketing/tsconfig.json`
- `convex/tsconfig.json`
- `packages/shared/tsconfig.json`
- `packages/cli/tsconfig.json`
- `packages/core/provisioning/tsconfig.json`

## Success Criteria

- [ ] `tsconfig.base.json` created with strict settings
- [ ] All workspace tsconfig files extend from base
- [ ] TypeScript compilation passes in all workspaces
- [ ] Consistent TypeScript behavior across monorepo

## Estimated Effort

1-2 hours

## Related

- Part of Critical Gaps Implementation Plan
- See: `docs/stand-downs/active/working/critical-gaps-implementation-plan.md`
- Related Gap: #2 - No Shared TypeScript Base Config
