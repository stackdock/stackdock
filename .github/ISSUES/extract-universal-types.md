---
title: Extract Universal Types to packages/shared/src/schema.ts
labels: priority:high,category:foundation,type:refactor
assignees: 
milestone: Phase 1 - Foundation
---

## Goal

Create shared TypeScript types for universal resources that can be imported by adapters, UI, and Convex functions.

## Current State

- Types exist only in `convex/schema.ts` (Convex schema definitions)
- Adapters use `Doc<"webServices">` from Convex generated types
- No shared type definitions
- `packages/shared/` exists but is empty

## Implementation Steps

1. Create `packages/shared/src/schema.ts`
   - Extract universal resource types (Server, WebService, Domain, Database, etc.)
   - Define types that match Convex schema but are provider-agnostic
   - Export enums for provider IDs, resource status, auth types

2. Create `packages/shared/src/index.ts`
   - Re-export all types from `schema.ts`
   - Export shared constants (provider IDs, status values)

3. Update `packages/shared/package.json`
   - Add TypeScript build configuration
   - Set up proper exports

4. Create `packages/shared/tsconfig.json`
   - Configure for library compilation
   - Set up proper module resolution

5. Update Convex schema to reference shared types (optional, for validation)
   - Keep Convex schema as source of truth
   - Use shared types for TypeScript type checking

6. Update adapters to import from `@stackdock/shared`
   - Replace `Doc<"webServices">` with `WebService` from shared
   - Update all 16 adapters

7. Update UI components to import from `@stackdock/shared`
   - Replace Convex Doc types with shared types where appropriate

## Files to Create

- `packages/shared/src/schema.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tsconfig.json`

## Files to Update

- `packages/shared/package.json`
- All adapter files in `convex/docks/adapters/*/adapter.ts` (16 files)
- UI components that use resource types

## Success Criteria

- [ ] Universal types extracted to `packages/shared/src/schema.ts`
- [ ] All adapters import from `@stackdock/shared`
- [ ] UI components use shared types
- [ ] TypeScript compilation passes
- [ ] No breaking changes to existing functionality

## Estimated Effort

4-6 hours

## Related

- Part of Critical Gaps Implementation Plan
- See: `docs/stand-downs/active/working/critical-gaps-implementation-plan.md`
- Related Gap: #1 - No Shared Universal Types
