# @stackdock/shared

Shared utilities and types across StackDock packages.

## Purpose

This package will contain:
- Shared TypeScript types
- Common utilities
- Shared constants
- Cross-package helpers

## Status

**Currently empty** - Reserved for future shared code.

## Usage

When shared code is needed across multiple packages, add it here:

```typescript
// packages/shared/src/types.ts
export type UniversalResource = {
  // Shared types
}

// packages/shared/src/utils.ts
export function formatResourceName(name: string) {
  // Shared utilities
}
```

---

**Note**: This package is reserved for future use. Currently, shared code lives in `apps/web/src/lib/` or `convex/lib/`.
