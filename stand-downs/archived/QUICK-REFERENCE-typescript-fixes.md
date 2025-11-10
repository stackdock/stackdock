# Quick Reference: TypeScript Error Fixes

> **For**: Backend-Convex Agent  
> **Priority Order**: Category 1 → 2 → 3 → 5 → 4

---

## Category 1: Mutation → Action (CRITICAL)

**Problem**: `ctx.runAction()` doesn't exist on `MutationCtx`

**Investigation First**:
```bash
# Check Convex version
cat package.json | grep convex

# Check generated types
grep -A 20 "MutationCtx" convex/_generated/server.d.ts

# Search for existing patterns
grep -r "runAction\|scheduler" convex/
```

**Files**: `convex/docks/mutations.ts:55, 742`

**Solution Options** (choose best after investigation):
- Check Convex docs for mutation→action pattern
- Use `ctx.scheduler.runAfter(0, ...)` if supported
- Refactor to async validation (create dock first, validate in background)

---

## Category 2: Audit Log Context (HIGH)

**Problem**: `QueryCtx` can't call `ctx.db.insert()`

**Fix**:
```typescript
// convex/lib/audit.ts:110
if ("insert" in ctx.db) {
  await ctx.db.insert("auditLogs", auditEntry)
} else {
  console.warn("[Audit Log] Cannot write from query context")
}
```

---

## Category 3: Type Narrowing (MEDIUM - 14 errors)

**Problem**: `ctx.db.get()` returns union type, TypeScript can't narrow

**Fix Pattern** (use everywhere):
```typescript
const resource = await ctx.db.get(args.resourceId)
if (!resource) throw new ConvexError("Resource not found")

// Type guard
if ("orgId" in resource && "dockId" in resource && "provider" in resource) {
  // Now TypeScript knows it's a resource table
  resource.orgId // ✅ Works
  resource.dockId // ✅ Works
} else {
  throw new ConvexError("Invalid resource type")
}
```

**Files**:
- `convex/docks/mutations.ts:495, 509, 515, 597, 611, 617`
- `convex/projects/mutations.ts:103, 104, 111, 112, 119, 120, 127, 128`

---

## Category 4: Index Queries (LOW)

**Problem**: Composite indexes require all fields, code only provides one

**Fix**:
```typescript
// Instead of index query:
const resources = await ctx.db.query(tableType).collect()
const found = resources.find(r => r.sstResourceId === args.provisionId)
```

**Files**: `convex/provisioning/queries.ts:113, 137`

---

## Category 5: Domain Name (LOW)

**Problem**: `provisionDomain` returns `domainName`, code expects `name`

**Fix**:
```typescript
// convex/docks/mutations.ts:366
const domainResource = await adapter.provisionDomain(ctx, dock, args.spec)
provisionedResource = {
  ...domainResource,
  name: domainResource.domainName, // Add name
}
```

---

## Testing Command

```bash
# Test compilation
npx convex dev

# Should see: "Convex functions ready!" without TypeScript errors
```

---

## File Summary

| File | Errors | Priority |
|------|--------|----------|
| `convex/docks/mutations.ts` | 9 | CRITICAL (2), MEDIUM (6), LOW (1) |
| `convex/lib/audit.ts` | 1 | HIGH |
| `convex/projects/mutations.ts` | 8 | MEDIUM |
| `convex/provisioning/queries.ts` | 2 | LOW |

**Total**: 20 errors

---

## Success

✅ `npx convex dev` runs without errors  
✅ Convex dev server starts  
✅ All 20 errors fixed
