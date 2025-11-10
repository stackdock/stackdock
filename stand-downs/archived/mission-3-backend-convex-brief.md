# Mission 3 Brief: Fix TypeScript Errors (Backend-Convex Agent)

> **Date**: November 11, 2025  
> **Agent**: `backend-convex`  
> **Mission**: Mission 3 (Fix GridPane Auth) - **BLOCKED**  
> **Priority**: CRITICAL  
> **Status**: Ready for Agent Assignment

---

## Mission Overview

**Objective**: Fix 20 TypeScript errors preventing Convex dev server from starting, blocking all development work including GridPane API authentication troubleshooting.

**Blocker Document**: `stand-downs/blocker-typescript-errors-mission-3.md` (comprehensive analysis)

**Impact**: Cannot run `npx convex dev`, cannot test GridPane auth, cannot proceed with Mission 3.

---

## Your Task

Fix all 20 TypeScript errors across 4 files, prioritized by impact:

1. **Category 1** (CRITICAL): Fix mutation→action calls - 2 errors
2. **Category 2** (HIGH): Fix audit log context type - 1 error  
3. **Category 3** (MEDIUM): Fix type narrowing issues - 14 errors
4. **Category 4** (LOW): Fix index query errors - 2 errors
5. **Category 5** (LOW): Fix domain name property - 1 error

---

## Critical Investigation Needed

### Category 1: Mutation → Action Calls

**THE KEY QUESTION**: How do mutations call actions in Convex?

**Current Broken Code**:
```typescript
const validationResult = await ctx.runAction(
  internal.docks.actions.validateCredentials,
  { provider: args.provider, apiKey: args.apiKey }
)
```

**What You Need to Find**:
1. Check Convex documentation for mutation→action patterns
2. Review `convex/_generated/server.d.ts` for available methods
3. Check Convex version in `package.json`
4. Search codebase for existing mutation→action examples
5. Check Convex Discord/forum for solutions

**Possible Solutions** (investigate and choose best):
- Option A: Use `ctx.scheduler.runAfter(0, ...)` for immediate async
- Option B: Refactor to client calling action first
- Option C: Accept async validation (create dock, validate in background)
- Option D: Check for newer Convex API pattern

**Recommendation**: Start with Option D (check docs), then Option C (async validation) if needed.

---

## Files to Fix

### 1. `convex/docks/mutations.ts` (9 errors)
- **Line 55**: `ctx.runAction()` in `createDock` - **CRITICAL**
- **Line 366**: `provisionDomain` name handling - LOW
- **Lines 495, 509, 515**: Type narrowing in `updateProvisionedResource` - MEDIUM
- **Lines 597, 611, 617**: Type narrowing in `deleteProvisionedResource` - MEDIUM
- **Line 742**: `ctx.runAction()` in `rotateProvisioningCredentials` - **CRITICAL**

### 2. `convex/lib/audit.ts` (1 error)
- **Line 110**: `ctx.db.insert()` for QueryCtx - HIGH

### 3. `convex/projects/mutations.ts` (8 errors)
- **Lines 103, 104**: Type narrowing for servers - MEDIUM
- **Lines 111, 112**: Type narrowing for webServices - MEDIUM
- **Lines 119, 120**: Type narrowing for domains - MEDIUM
- **Lines 127, 128**: Type narrowing for databases - MEDIUM

### 4. `convex/provisioning/queries.ts` (2 errors)
- **Line 113**: `by_sst_resource` index query - LOW
- **Line 137**: `by_dock_resource` index query - LOW

---

## Type Narrowing Pattern (Category 3)

**Use this pattern** for all type narrowing fixes:

```typescript
const resource = await ctx.db.get(args.resourceId)
if (!resource) {
  throw new ConvexError("Resource not found")
}

// Type guard: Check for resource table properties
if ("orgId" in resource && "dockId" in resource && "provider" in resource) {
  // Now TypeScript knows it's a resource table
  // (servers | webServices | domains | databases)
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

---

## Audit Log Fix (Category 2)

**Use type guard pattern**:

```typescript
export async function auditLog(
  ctx: MutationCtx | QueryCtx,
  action: string,
  result: "success" | "error",
  metadata?: AuditLogMetadata
): Promise<void> {
  // ... existing code ...
  
  // Check if we can write
  if ("insert" in ctx.db) {
    // MutationCtx - can write directly
    await ctx.db.insert("auditLogs", auditEntry)
  } else {
    // QueryCtx - schedule mutation for audit logging
    // TODO: Create internal mutation for audit logging if needed
    // For now, just log to console if in query context
    console.warn("[Audit Log] Cannot write audit log from query context")
  }
}
```

---

## Index Query Fixes (Category 4)

**Use query without index** (works but slower):

```typescript
// Instead of:
const bySstResource = await ctx.db
  .query(tableType)
  .withIndex("by_sst_resource", (q) =>
    q.eq("sstResourceId", args.provisionId) // ❌ Wrong
  )
  .first()

// Use:
const resources = await ctx.db.query(tableType).collect()
const found = resources.find(r => r.sstResourceId === args.provisionId)
```

---

## Domain Name Fix (Category 5)

**Add name property mapping**:

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

---

## Testing Checklist

After fixes:

- [ ] Run `npx convex dev` - should pass typecheck
- [ ] Convex dev server starts without errors
- [ ] Test `createDock` mutation (after Category 1 fix)
- [ ] Test credential validation (after Category 1 fix)
- [ ] Test audit logging from mutations
- [ ] Test audit logging from queries (after Category 2 fix)
- [ ] Test `updateProvisionedResource` with different resource types
- [ ] Test `deleteProvisionedResource` with different resource types
- [ ] Test `linkResourceToProject` with different resource types
- [ ] Test `getProvisionStatus` query (after Category 4 fix)

---

## Success Criteria

✅ **Mission Complete When**:
- [ ] All 20 TypeScript errors fixed
- [ ] `npx convex dev` runs without errors
- [ ] Convex dev server starts successfully
- [ ] All tests pass (or at least compile)
- [ ] No regressions introduced

---

## Resources

- **Blocker Document**: `stand-downs/blocker-typescript-errors-mission-3.md` (full analysis)
- **Convex Docs**: https://docs.convex.dev
- **Schema**: `convex/schema.ts`
- **DockAdapter Interface**: `convex/docks/_types.ts`
- **Generated Types**: `convex/_generated/server.d.ts`

---

## Workflow

1. **Read blocker document** (`stand-downs/blocker-typescript-errors-mission-3.md`)
2. **Investigate Category 1** first (mutation→action pattern)
3. **Fix errors in priority order** (Category 1 → 2 → 3 → 5 → 4)
4. **Test after each category** (verify compilation)
5. **Update stand-downs** when complete
6. **Report findings** to user

---

## Notes

- These errors were introduced during Mission 2.5
- Code was written assuming Convex API patterns that don't exist
- All errors are TypeScript type errors (not runtime)
- Once fixed, Mission 3 (Fix GridPane Auth) can proceed

---

**Good luck! Fix these errors systematically and test thoroughly.**
