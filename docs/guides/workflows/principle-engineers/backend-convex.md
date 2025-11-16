# Convex DB Principle Engineer SOP

> **Location**: `docs/workflows/principle-engineers/backend-convex.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/principle-engineers/backend-convex.md`

## Agent Identity

**Agent ID**: `backend-convex`  
**Domain**: Convex database, queries, mutations, real-time patterns

## Responsibilities

- Review database schema changes
- Validate query/mutation patterns
- Ensure RBAC enforcement
- Verify real-time patterns
- Check data model consistency

## Scope

**Files Reviewed**:
- `convex/schema.ts` - Database schema
- `convex/**/*.ts` - All Convex functions
- `convex/lib/rbac.ts` - RBAC middleware

**Absolute Paths**:
- Schema: `{REPO_ROOT}/convex/schema.ts`
- Functions: `{REPO_ROOT}/convex/**/*.ts`
- RBAC: `{REPO_ROOT}/convex/lib/rbac.ts`

## Code Review Checkpoints

### 1. Schema Design

**Required Pattern**:
```typescript
// File: {REPO_ROOT}/convex/schema.ts
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  webServices: defineTable({
    provider: v.string(),
    providerResourceId: v.string(),
    name: v.string(),
    productionUrl: v.optional(v.string()),
    fullApiData: v.any(),
    organizationId: v.id("organizations"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_provider", ["provider", "organizationId"]),
})
```

**Violations**:
- ❌ Provider-specific tables (use universal tables)
- ❌ Missing indexes
- ❌ Missing organizationId (for multi-tenancy)

### 2. Query Patterns

**Required Pattern**:
```typescript
// File: {REPO_ROOT}/convex/resources/queries.ts
import { query } from "./_generated/server"
import { withRBAC } from "../lib/rbac"

export const listWebServices = query({
  handler: withRBAC("resources:read")(async (ctx, args) => {
    const orgId = await ctx.getCurrentOrgId()
    
    return await ctx.db
      .query("webServices")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect()
  }),
})
```

**Violations**:
- ❌ Missing RBAC check
- ❌ Not filtering by organizationId
- ❌ Not using indexes
- ❌ Direct database access without auth

### 3. Mutation Patterns

**Required Pattern**:
```typescript
// File: {REPO_ROOT}/convex/docks/mutations.ts
import { mutation } from "./_generated/server"
import { withRBAC } from "../lib/rbac"
import { encryptApiKey } from "../lib/encryption"

export const createDock = mutation({
  handler: withRBAC("docks:full")(async (ctx, args) => {
    const orgId = await ctx.getCurrentOrgId()
    const encrypted = await encryptApiKey(args.apiKey)
    
    return await ctx.db.insert("docks", {
      organizationId: orgId,
      provider: args.provider,
      encryptedApiKey: encrypted,
      createdAt: Date.now(),
    })
  }),
})
```

**Violations**:
- ❌ Missing RBAC check
- ❌ Not encrypting sensitive data
- ❌ Missing organizationId
- ❌ Not using withRBAC middleware

### 4. RBAC Enforcement

**Required**:
- ✅ All queries/mutations use `withRBAC()`
- ✅ Permission checks before data access
- ✅ Organization-level isolation
- ✅ No direct database access

**Pattern**:
```typescript
export const myMutation = mutation({
  handler: withRBAC("resource:full")(async (ctx, args) => {
    // RBAC already checked, proceed safely
  }),
})
```

**Violations**:
- ❌ Missing `withRBAC()` wrapper
- ❌ Direct `ctx.db` access without RBAC
- ❌ No permission checking

### 5. Universal Table Pattern

**Required**:
- ✅ Use universal tables (`webServices`, `servers`, `domains`)
- ✅ Provider-specific data in `fullApiData`
- ✅ `provider` field identifies source
- ✅ NO provider-specific tables

**Violations**:
- ❌ Creating `gridPaneSites` table (use `webServices` with `provider: "gridpane"`)
- ❌ Provider-specific tables
- ❌ Not using universal schema

### 6. Real-Time Patterns

**Required**:
- ✅ Queries automatically real-time
- ✅ Use `useQuery` on client for real-time updates
- ✅ Proper subscription patterns

**Pattern**:
```typescript
// Client-side
const webServices = useQuery(api.resources.listWebServices)
// Automatically updates in real-time
```

## Testing Requirements

**Test Location**: `convex/**/*.test.ts`  
**Absolute Path**: `{REPO_ROOT}/convex/**/*.test.ts`

**Required Tests**:
- ✅ Query returns correct data
- ✅ Mutation updates correctly
- ✅ RBAC enforcement works
- ✅ Organization isolation

## Approval Criteria

**Approve** if:
- ✅ Uses universal table pattern
- ✅ RBAC enforced on all functions
- ✅ Proper schema design
- ✅ Encryption for sensitive data
- ✅ Tests pass

**Block** if:
- ❌ db provider-specific tables
- ❌ Missing RBAC checks
- ❌ Unencrypted sensitive data
- ❌ Schema violations
- ❌ Tests missing or failing

## Common Violations & Fixes

### Violation: Provider-Specific Table

**Wrong**:
```typescript
gridPaneSites: defineTable({
  siteId: v.string(),
  name: v.string(),
})
```

**Fix**:
```typescript
webServices: defineTable({
  provider: v.string(), // "gridpane"
  providerResourceId: v.string(), // siteId
  name: v.string(),
  fullApiData: v.any(), // All GridPane-specific fields
})
```

### Violation: Missing RBAC

**Wrong**:
```typescript
export const listResources = query({
  handler: async (ctx) => {
    return await ctx.db.query("resources").collect()
  },
})
```

**Fix**:
```typescript
export const listResources = query({
  handler: withRBAC("resources:read")(async (ctx) => {
    const orgId = await ctx.getCurrentOrgId()
    return await ctx.db
      .query("resources")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect()
  }),
})
```

### Violation: Unencrypted API Keys

**Wrong**:
```typescript
await ctx.db.insert("docks", {
  apiKey: args.apiKey, // Unencrypted!
})
```

**Fix**:
```typescript
const encrypted = await encryptApiKey(args.apiKey)
await ctx.db.insert("docks", {
  encryptedApiKey: encrypted,
})
```

## Stand-Downs Format

When reporting findings:

```json
{
  "agentId": "backend-convex",
  "findings": [
    {
      "type": "violation",
      "severity": "error",
      "file": "{REPO_ROOT}/convex/docks/mutations.ts",
      "line": 25,
      "issue": "Missing RBAC check on mutation",
      "recommendation": "Wrap handler with withRBAC('docks:full')"
    }
  ]
}
```

## Quick Reference

**Schema Location**: `{REPO_ROOT}/convex/schema.ts`  
**Functions Location**: `{REPO_ROOT}/convex/**/*.ts`  
**RBAC Location**: `{REPO_ROOT}/convex/lib/rbac.ts`

**Check Schema**:
```bash
# From {REPO_ROOT}
cat convex/schema.ts
```

---

**Remember**: Universal tables only. RBAC always. Encryption mandatory. The schema IS the app.
