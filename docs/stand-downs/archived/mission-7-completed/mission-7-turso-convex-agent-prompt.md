# Convex Agent Prompt - Turso Adapter Implementation

**Copy this prompt and provide to Convex Agent:**

---

## Mission 7: Implement Turso Adapter

Implement the Turso database provider adapter following the established adapter pattern. Turso is the first database provider in Mission 7 (Read-Only Infrastructure MVP).

### 📋 Implementation Guide

**Full guide**: `stand-downs/active/mission-7-turso-adapter-convex-guide.md`

### 🎯 Key Decisions

1. **One dock per org**: Each Turso organization gets its own dock entry
2. **Groups**: Store group name in `fullApiData.group` (NOT a separate resource)
3. **Regions**: Store `regions` and `primaryRegion` in `fullApiData` (metadata)
4. **Status mapping**: Priority order - `archived` → `sleeping` → `blocked` → `active`

### 📁 Files to Create

1. `convex/docks/adapters/turso/types.ts` - TypeScript interfaces from JSON files
2. `convex/docks/adapters/turso/api.ts` - TursoAPI class (HTTP client)
3. `convex/docks/adapters/turso/adapter.ts` - tursoAdapter implementation
4. `convex/docks/adapters/turso/index.ts` - Exports

### 📝 Files to Update

1. `convex/docks/actions.ts` - Add Turso case in `syncDockResources` and `validateCredentials`
2. `convex/docks/registry.ts` - Register Turso adapter and metadata

### 🔗 Reference Files

**API Response Examples:**
- `docks/turso/org/listOrgs.json`
- `docks/turso/database/listDatabases.json`
- `docks/turso/group/listGroups.json`
- `docks/turso/api-routes.md`

**Pattern References:**
- `convex/docks/adapters/vercel/` - Follow this pattern exactly

### ✅ Requirements

- Follow the Vercel adapter pattern exactly
- Map Turso databases to universal `databases` table
- Status mapping: archived → sleeping → blocked → active
- Store all Turso fields in `fullApiData`
- Register adapter in `registry.ts`
- Update actions to handle Turso provider
- No TypeScript errors
- Convex functions deploy successfully

### 🧪 Testing

- Test API client authentication
- Test `listOrgs()` and `listDatabases()`
- Test `validateCredentials()`
- Test adapter syncs databases correctly
- Verify provider appears in `listAvailableProviders` query

**Read the full guide for complete implementation details**: `stand-downs/active/mission-7-turso-adapter-convex-guide.md`
