---
title: Leverage TanStack Start Advanced Features
labels: post-mvp,quality-review,enhancement,frontend
priority: high
category: frontend
estimated-hours: 10-15
related-plan: docs/stand-downs/active/analysis-post-mvp.md
---

## Goal

Implement TanStack Start advanced features (server functions, route loaders, SSR) to improve performance and leverage Start's full capabilities.

## Current State

**Score**: 6/10

- ✅ File-based routing working
- ✅ Router configuration correct
- ✅ Latest versions installed
- ❌ No server functions (`createServerFn`)
- ❌ No route loaders
- ❌ No SSR/streaming
- ❌ Client-side heavy (all data via `useQuery`)

## Current Architecture

StackDock uses TanStack Start more like **TanStack Router**:
- All data fetching via Convex `useQuery` on client
- No server-side data loading
- No progressive data loading
- No SSR benefits

## Implementation Steps

### 1. Add Route Loaders
**Purpose**: Initial data loading on server

**Implementation**:
- Add `loader:` definitions to route files
- Fetch initial data server-side
- Pass data to components via props

**Example**:
```typescript
export const Route = createFileRoute("/dashboard/")({
  loader: async ({ context }) => {
    // Fetch initial data server-side
    return await fetchInitialData()
  },
  component: InsightsPage,
})
```

### 2. Implement Server Functions
**Purpose**: Data transformations and server-side logic

**Implementation**:
- Use `createServerFn` for data processing
- Move heavy computations server-side
- Reduce client bundle size

**Example**:
```typescript
const processData = createServerFn().handler(async (data) => {
  // Heavy processing server-side
  return processedData
})
```

### 3. Add SSR/Streaming
**Purpose**: Faster initial load and progressive rendering

**Implementation**:
- Enable SSR for critical routes
- Implement streaming for large data sets
- Progressive data loading

## Files to Update

- `apps/web/src/routes/dashboard/index.tsx` - Add loader
- `apps/web/src/routes/dashboard/infrastructure/*` - Add loaders
- `apps/web/src/routes/dashboard/monitoring/*` - Add loaders
- `apps/web/src/lib/server-functions.ts` - Server functions (new)

## Success Criteria

- [ ] Route loaders implemented for initial data
- [ ] Server functions created for data transformations
- [ ] SSR enabled for critical routes
- [ ] Streaming implemented for large datasets
- [ ] Performance improvements measured

## Related Documentation

See `docs/stand-downs/active/analysis-post-mvp.md` for full analysis.

## Priority

**High Priority** - This will significantly improve performance and user experience.
