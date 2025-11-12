# Blocker: TypeScript Errors Preventing Convex Dev Server

> **Date**: November 11, 2025  
> **Priority**: CRITICAL  
> **Status**: Active Blocker  
> **Assigned Agent**: `backend-convex`  
> **Mission**: Mission 3 (Fix GridPane Auth) - Blocked by TypeScript errors

---

## Executive Summary

The Convex dev server cannot start due to **20 TypeScript errors** across 4 files. These errors are preventing all development work, including troubleshooting the GridPane API authentication issue. The errors fall into 5 categories:

1. **Mutation → Action Calls** (2 errors) - CRITICAL
2. **Audit Log Context Type** (1 error) - HIGH
3. **Type Narrowing Issues** (14 errors) - MEDIUM
4. **Index Query Errors** (2 errors) - LOW
5. **Domain Name Property** (1 error) - LOW

**Impact**: Cannot run `npx convex dev`, cannot test GridPane auth, cannot proceed with Mission 3.

---

## Error Details

### Full Error Output

```
✖ TypeScript typecheck via `tsc` failed.

convex/docks/mutations.ts:55:42 - error TS2339: Property 'runAction' does not exist on type 'GenericMutationCtx'
convex/docks/mutations.ts:366:13 - error TS2741: Property 'name' is missing in type '{ providerResourceId: string; domainName: string; status: string; fullApiData: any; }'
convex/docks/mutations.ts:495:16 - error TS2339: Property 'orgId' does not exist on union type
convex/docks/mutations.ts:509:46 - error TS2339: Property 'dockId' does not exist on union type
convex/docks/mutations.ts:515:43 - error TS2339: Property 'provisioningSource' does not exist on union type
convex/docks/mutations.ts:597:16 - error TS2339: Property 'orgId' does not exist on union type
convex/docks/mutations.ts:611:46 - error TS2339: Property 'dockId' does not exist on union type
convex/docks/mutations.ts:617:43 - error TS2339: Property 'provisioningSource' does not exist on union type
convex/docks/mutations.ts:742:38 - error TS2339: Property 'runAction' does not exist on type 'GenericMutationCtx'
convex/lib/audit.ts:110:18 - error TS2339: Property 'insert' does not exist on type 'GenericDatabaseReader'
convex/projects/mutations.ts:103:37 - error TS2339: Property 'name' does not exist on union type
convex/projects/mutations.ts:104:39 - error TS2339: Property 'status' does not exist on union type
convex/projects/mutations.ts:111:41 - error TS2339: Property 'name' does not exist on union type
convex/projects/mutations.ts:112:43 - error TS2339: Property 'status' does not exist on union type
convex/projects/mutations.ts:119:37 - error TS2339: Property 'domainName' does not exist on union type
convex/projects/mutations.ts:120:39 - error TS2339: Property 'status' does not exist on union type
convex/projects/mutations.ts:127:39 - error TS2339: Property 'name' does not exist on union type
convex/projects/mutations.ts:128:41 - error TS2339: Property 'status' does not exist on union type
convex/provisioning/queries.ts:113:18 - error TS2345: Argument of type '"sstResourceId"' is not assignable to parameter of type '"sstStackName"'
convex/provisioning/queries.ts:137:20 - error TS2345: Argument of type '"providerResourceId"' is not assignable to parameter of type '"dockId"'

Found 20 errors in 4 files.
```

---

## Category 1: Mutation → Action Calls (CRITICAL - 2 errors)

### Error Locations
- `convex/docks/mutations.ts:55` - `createDock` mutation
- `convex/docks/mutations.ts:742` - `rotateProvisioningCredentials` mutation

### Root Cause
Mutations **cannot directly call actions synchronously** in Convex. The code assumes `ctx.runAction()` exists, but it does not exist on `MutationCtx`.

### Current Code (Broken)
```typescript
// Line 55 - createDock mutation
const validationResult = await ctx.runAction(
  internal.docks.actions.validateCredentials,
  {
    provider: args.provider,
    apiKey: args.apiKey,
  }
)

// Line 742 - rotateProvisioningCredentials mutation
validationResult = await ctx.runAction(
  internal.docks.actions.validateCredentials,
  {
    provider: dock.provider,
    apiKey: args.newCredentials,
  }
)
```

### Why This Happened
The code was written assuming mutations could call actions directly (a common pattern in other frameworks). However, Convex has a strict separation:
- **Mutations**: Deterministic database operations (no fetch, no side effects)
- **Actions**: Non-deterministic operations (fetch, external APIs, etc.)

### Investigation Needed
1. **Check Convex Documentation**: Search for "calling actions from mutations" or "mutation action communication"
2. **Review Generated Types**: Check `convex/_generated/server.d.ts` for available methods on `MutationCtx`
3. **Check Convex Version**: Verify current Convex version and API compatibility
4. **Review Existing Patterns**: Search codebase for other mutation→action patterns

### Possible Solutions

#### Option A: Use Scheduler (Immediate Async)
```typescript
// Schedule action immediately (0ms delay)
const actionId = await ctx.scheduler.runAfter(
  0,
  internal.docks.actions.validateCredentials,
  { provider: args.provider, apiKey: args.apiKey }
)
// But this doesn't return the result synchronously - need different pattern
```

#### Option B: Client Calls Action First
```typescript
// Client calls action, then mutation
// This requires frontend changes - not ideal
```

#### Option C: Accept Async Validation
```typescript
// Create dock first, validate in background
// Mark dock as "validating" status
// Update status after validation completes
```

#### Option D: Check for Newer Convex API
```typescript
// Verify if Convex has added mutation→action support in newer versions
// Check if there's a different method name or pattern
```

### Recommendation
**Investigate Option D first** - Check Convex docs for latest patterns. If not available, implement **Option C** (async validation) as it maintains the current UX flow.

---

## Category 2: Audit Log Context Type (HIGH - 1 error)

### Error Location
- `convex/lib/audit.ts:110`

### Root Cause
`auditLog()` accepts `MutationCtx | QueryCtx`, but tries to call `ctx.db.insert()` which only exists on `MutationCtx`. `QueryCtx` has `DatabaseReader` (read-only).

### Current Code (Broken)
```typescript
export async function auditLog(
  ctx: MutationCtx | QueryCtx, // ❌ Union type
  action: string,
  result: "success" | "error",
  metadata?: AuditLogMetadata
): Promise<void> {
  // ... code ...
  await ctx.db.insert("auditLogs", auditEntry) // ❌ Fails for QueryCtx
}
```

### Solution Options

#### Option A: Type Guard
```typescript
export async function auditLog(
  ctx: MutationCtx | QueryCtx,
  action: string,
  result: "success" | "error",
  metadata?: AuditLogMetadata
): Promise<void> {
  // Check if we can write
  if ("insert" in ctx.db) {
    // MutationCtx - can write directly
    await ctx.db.insert("auditLogs", auditEntry)
  } else {
    // QueryCtx - schedule mutation for audit logging
    // Use scheduler to call internal mutation
    // Note: This requires creating an internal mutation for audit logging
  }
}
```

#### Option B: Split Functions
```typescript
export async function auditLogMutation(
  ctx: MutationCtx,
  action: string,
  result: "success" | "error",
  metadata?: AuditLogMetadata
): Promise<void> {
  await ctx.db.insert("auditLogs", auditEntry)
}

export async function auditLogQuery(
  ctx: QueryCtx,
  action: string,
  result: "success" | "error",
  metadata?: AuditLogMetadata
): Promise<void> {
  // Schedule mutation for audit logging
  await ctx.scheduler.runAfter(0, internal.audit.log, { action, result, metadata })
}
```

#### Option C: Restrict to MutationCtx Only
```typescript
export async function auditLog(
  ctx: MutationCtx, // ❌ Only MutationCtx
  ...
): Promise<void> {
  await ctx.db.insert("auditLogs", auditEntry)
}
// But this breaks existing usage in queries - need to update all callers
```

### Recommendation
**Option A (Type Guard)** - Maintains backward compatibility and handles both contexts gracefully.

---

## Category 3: Type Narrowing Issues (MEDIUM - 14 errors)

### Error Locations
- `convex/docks/mutations.ts:495, 509, 515, 597, 611, 617` - `updateProvisionedResource` and `deleteProvisionedResource`
- `convex/projects/mutations.ts:103, 104, 111, 112, 119, 120, 127, 128` - `linkResourceToProject`

### Root Cause
`ctx.db.get()` returns a union type of **all table documents**. TypeScript cannot narrow the type without type guards. Code accesses properties that don't exist on all union members (e.g., `users` table doesn't have `orgId`).

### Example Error
```typescript
// Line 495 - updateProvisionedResource
const resource = await ctx.db.get(args.resourceId) // Union: users | memberships | servers | webServices | ...
const hasPermission = await checkPermission(
  ctx,
  user._id,
  resource.orgId, // ❌ Error: orgId doesn't exist on 'users' table
  "provisioning:full"
)
```

### Solution: Type Guards

#### Pattern 1: Property-Based Type Guard
```typescript
const resource = await ctx.db.get(args.resourceId)
if (!resource) {
  throw new ConvexError("Resource not found")
}

// Type guard: Check for resource table properties
if ("orgId" in resource && "dockId" in resource && "provider" in resource) {
  // Now TypeScript knows it's a resource table (servers | webServices | domains | databases)
  const hasPermission = await checkPermission(
    ctx,
    user._id,
    resource.orgId, // ✅ Now works
    "provisioning:full"
  )
} else {
  throw new ConvexError("Invalid resource type")
}
```

#### Pattern 2: Type Assertion (Less Safe)
```typescript
const resource = await ctx.db.get(args.resourceId) as 
  | Doc<"servers">
  | Doc<"webServices">
  | Doc<"domains">
  | Doc<"databases">
// Use with caution - TypeScript won't catch mismatches
```

#### Pattern 3: Separate Queries (Most Verbose)
```typescript
// Check each table type separately
const server = await ctx.db.get(args.resourceId as Id<"servers">)
if (server && "orgId" in server) {
  // Handle server
} else {
  const webService = await ctx.db.get(args.resourceId as Id<"webServices">)
  // ...
}
```

### Recommendation
**Pattern 1 (Property-Based Type Guard)** - Safest and most maintainable.

### Files to Fix
1. `convex/docks/mutations.ts` - Lines 495, 509, 515, 597, 611, 617
2. `convex/projects/mutations.ts` - Lines 103, 104, 111, 112, 119, 120, 127, 128

---

## Category 4: Index Query Errors (LOW - 2 errors)

### Error Locations
- `convex/provisioning/queries.ts:113` - `by_sst_resource` index
- `convex/provisioning/queries.ts:137` - `by_dock_resource` index

### Root Cause
Composite indexes require **all fields** in the correct order. The code tries to query with only one field.

### Schema Definition
```typescript
// From convex/schema.ts
.index("by_sst_resource", ["sstStackName", "sstResourceId"]) // Requires BOTH fields
.index("by_dock_resource", ["dockId", "providerResourceId"]) // Requires BOTH fields
```

### Current Code (Broken)
```typescript
// Line 113 - Wrong: Only providing sstResourceId
const bySstResource = await ctx.db
  .query(tableType)
  .withIndex("by_sst_resource", (q) =>
    q.eq("sstResourceId", args.provisionId) // ❌ Missing sstStackName
  )
  .first()

// Line 137 - Wrong: Only providing providerResourceId
const byProviderResource = await ctx.db
  .query(tableType)
  .withIndex("by_dock_resource", (q) =>
    q.eq("providerResourceId", args.provisionId) // ❌ Missing dockId
  )
  .first()
```

### Solution Options

#### Option A: Query Without Index (Works but Slower)
```typescript
// Query all resources and filter in memory
const resources = await ctx.db.query(tableType).collect()
const found = resources.find(r => r.sstResourceId === args.provisionId)
```

#### Option B: Add Single-Field Indexes (Requires Schema Migration)
```typescript
// Add to schema.ts
.index("by_sst_resource_id", ["sstResourceId"])
.index("by_provider_resource_id", ["providerResourceId"])
```

#### Option C: Require Both Fields (May Need Caller Refactor)
```typescript
// Update query to require both fields
// But caller may not have sstStackName or dockId available
```

### Recommendation
**Option A** for immediate fix (works, may be slower). **Option B** for long-term optimization (add indexes to schema).

---

## Category 5: Domain Name Property (LOW - 1 error)

### Error Location
- `convex/docks/mutations.ts:366` - `provisionResource` mutation

### Root Cause
`provisionDomain()` returns `{ domainName: string, ... }` (no `name` property), but the code expects `{ name: string, ... }` to match other resource types.

### Current Code (Broken)
```typescript
// Line 366
provisionedResource = await adapter.provisionDomain(ctx, dock, args.spec)
// provisionedResource has domainName but code expects name
```

### DockAdapter Interface
```typescript
// From convex/docks/_types.ts
provisionDomain?(...): Promise<{
  providerResourceId: string
  domainName: string  // ❌ No 'name' property
  status: string
  fullApiData: any
}>
```

### Solution Options

#### Option A: Handle Domains Differently in Mutation
```typescript
case "domain":
  if (!adapter.provisionDomain) {
    throw new ConvexError("Provider does not support domain provisioning")
  }
  const domainResource = await adapter.provisionDomain(ctx, dock, args.spec)
  // Map domainName to name for consistency
  provisionedResource = {
    ...domainResource,
    name: domainResource.domainName, // Add name property
  }
  break
```

#### Option B: Update DockAdapter Interface
```typescript
// Make provisionDomain return both domainName and name
provisionDomain?(...): Promise<{
  providerResourceId: string
  domainName: string
  name: string  // Add name (map from domainName)
  status: string
  fullApiData: any
}>
```

### Recommendation
**Option A** - Handle domains in mutation logic (simpler, doesn't require adapter changes).

---

## Priority Fix Order

1. **Category 1** (Mutation→Action) - **CRITICAL** - Blocks all credential validation
2. **Category 2** (Audit Log) - **HIGH** - Blocks query-side audit logging
3. **Category 3** (Type Narrowing) - **MEDIUM** - Multiple mutations broken
4. **Category 5** (Domain Name) - **LOW** - Only affects domain provisioning
5. **Category 4** (Index Queries) - **LOW** - Works but may be slower

---

## Files to Modify

### 1. `convex/docks/mutations.ts` (9 errors)
- **Line 55**: Fix `ctx.runAction()` call in `createDock`
- **Line 366**: Fix `provisionDomain` name handling
- **Lines 495, 509, 515**: Fix type narrowing in `updateProvisionedResource`
- **Lines 597, 611, 617**: Fix type narrowing in `deleteProvisionedResource`
- **Line 742**: Fix `ctx.runAction()` call in `rotateProvisioningCredentials`

### 2. `convex/lib/audit.ts` (1 error)
- **Line 110**: Fix `ctx.db.insert()` for QueryCtx context

### 3. `convex/projects/mutations.ts` (8 errors)
- **Lines 103, 104**: Fix type narrowing for servers
- **Lines 111, 112**: Fix type narrowing for webServices
- **Lines 119, 120**: Fix type narrowing for domains
- **Lines 127, 128**: Fix type narrowing for databases

### 4. `convex/provisioning/queries.ts` (2 errors)
- **Line 113**: Fix `by_sst_resource` index query
- **Line 137**: Fix `by_dock_resource` index query

---

## Investigation Checklist

Before implementing fixes, investigate:

- [ ] **Convex Documentation**: Search for "calling actions from mutations" or "mutation action communication"
- [ ] **Generated Types**: Review `convex/_generated/server.d.ts` for available methods on `MutationCtx`
- [ ] **Convex Version**: Check `package.json` for Convex version, verify API compatibility
- [ ] **Existing Patterns**: Search codebase for other mutation→action patterns
- [ ] **Convex Community**: Check Convex Discord/forum for mutation→action solutions
- [ ] **Test Scheduler Pattern**: Verify if `ctx.scheduler.runAfter(0, ...)` works for immediate async

---

## Testing Plan

After fixes are implemented:

1. **TypeScript Compilation**: Run `npx convex dev` - should pass typecheck
2. **Convex Dev Server**: Verify server starts without errors
3. **Create Dock**: Test `createDock` mutation with real API key
4. **Credential Validation**: Verify credential validation works (after Category 1 fix)
5. **Audit Logging**: Test audit logging from both mutations and queries
6. **Resource Updates**: Test `updateProvisionedResource` with different resource types
7. **Resource Deletion**: Test `deleteProvisionedResource` with different resource types
8. **Project Linking**: Test `linkResourceToProject` with different resource types
9. **Provisioning Queries**: Test `getProvisionStatus` query with different IDs

---

## Related Documentation

- **Convex Mutations**: https://docs.convex.dev/functions/mutations
- **Convex Actions**: https://docs.convex.dev/functions/actions
- **Convex Scheduler**: https://docs.convex.dev/scheduling/overview
- **Type Narrowing**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- **Schema Definition**: `convex/schema.ts`
- **DockAdapter Interface**: `convex/docks/_types.ts`

---

## Success Criteria

✅ **Blocker Resolved When**:
- [ ] `npx convex dev` runs without TypeScript errors
- [ ] Convex dev server starts successfully
- [ ] All 20 TypeScript errors are fixed
- [ ] Credential validation works (can test GridPane auth)
- [ ] Audit logging works from both mutations and queries
- [ ] All resource operations (create, update, delete) work correctly
- [ ] Project linking works for all resource types

---

## Notes

- These errors were introduced during Mission 2.5 (SST Core → StackDock Core Refactoring)
- The code was written assuming certain Convex API patterns that don't exist
- All errors are TypeScript type errors, not runtime errors (but still block development)
- Once fixed, Mission 3 (Fix GridPane Auth) can proceed

---

**Last Updated**: November 11, 2025  
**Next Steps**: Backend-convex agent should investigate Category 1 first, then proceed through priorities systematically.
