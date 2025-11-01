# StackDock Schema Design & Evolution

> **Status**: MVP Schema (v1) - Designed for GridPane adapter + encryption system

## Overview

This document tracks the schema design decisions, MVP requirements, and future enhancements. The schema follows a **universal provider pattern** where provider-specific data is stored in `fullApiData` while common fields are standardized across all providers.

## Schema Location

- **Current Schema**: `convex/schema.ts`
- **Schema Analysis**: This document
- **Architecture Principles**: `docs/architecture/ARCHITECTURE.md`
- **Security Model**: `docs/architecture/SECURITY.md`

---

## Core Design Principles

### 1. Universal Provider Pattern
- **No provider-specific tables** (e.g., `gridPaneSites`, `vercelDeployments`)
- Universal tables accept ANY provider: `webServices`, `servers`, `domains`, `databases`
- Provider identified by `provider` field (e.g., `"gridpane"`, `"vercel"`)
- Provider-specific data stored in `fullApiData: v.any()`

### 2. Multi-Tenant Isolation
- Every table includes `orgId: v.id("organizations")`
- All queries MUST filter by `orgId` (enforced in application logic)
- RBAC layer ensures users only access their org's data

### 3. Polymorphic Resource Linking
- `projectResources` table links projects to ANY resource type
- Uses `resourceTable` union + `resourceId` string
- Denormalized fields (`denormalized_name`, `denormalized_status`) for performance

### 4. Encryption-First Security
- API keys: `encryptedApiKey: v.bytes()` in `docks` table
- Operation configs: `encryptedConfig: v.bytes()` in `operationServices`
- Encryption handled in `convex/lib/encryption.ts` (AES-256-GCM)

---

## MVP Schema (Current - v1)

### Tables Implemented

#### **Core Identity & RBAC**
- `organizations` - Multi-tenant orgs
- `users` - Clerk-synced users
- `memberships` - User → Org relationships
- `teams` - Teams within orgs
- `clients` - Client accounts
- `roles` - Permission definitions
- `teamMemberships` - User → Team → Role
- `clientMemberships` - User → Client → Role

#### **Docks & Permissions**
- `docks` - Provider connection credentials
- `dockPermissions` - Team/Client access to docks

#### **Resources (Universal Provider Pattern)**
- `servers` - IaaS instances (Vultr, AWS, DigitalOcean, etc.)
- `webServices` - PaaS deployments (Vercel, Netlify, GridPane sites, etc.)
- `domains` - Domain registrations
- `databases` - Database instances

#### **Projects & Linking**
- `projects` - Client projects
- `projectResources` - Polymorphic links (projects ↔ resources)

#### **Operations**
- `operationServices` - Backup buckets, CDN configs, etc.
- `operationPermissions` - Team access to operations

#### **Audit & Tracking**
- `auditLogs` - Action audit trail (MVP: RBAC events, dock syncs)

---

## MVP Schema Changes (Implemented)

### ✅ **Critical Fixes**

1. **Added `databases` table**
   - Referenced in `projectResources` union but missing
   - Matches pattern of `servers`, `webServices`, `domains`

2. **Enhanced `docks` table**
   - Added `lastSyncError: v.optional(v.string())` - Error message for failed syncs
   - Added `syncInProgress: v.optional(v.boolean())` - Prevent concurrent syncs
   - Added `updatedAt: v.optional(v.number())` - Track modification time

3. **Improved `servers` table**
   - Changed `ipAddress: v.string()` → `primaryIpAddress: v.optional(v.string())`
   - Added `region: v.optional(v.string())` - "us-east-1", "nyc1", etc.
   - Rationale: Servers can have multiple IPs (stored in `fullApiData`), need primary for display

4. **Improved `webServices` table**
   - Changed `productionUrl: v.string()` → `productionUrl: v.optional(v.string())`
   - Added `environment: v.optional(v.string())` - "production", "staging", "development"
   - Rationale: Some services might not have URLs yet (e.g., building)

5. **Added `auditLogs` table**
   - Documented in `SECURITY.md` but missing from schema
   - Tracks: RBAC decisions, dock syncs, mutations

6. **Added compound indexes**
   - `by_dock_resource` on resource tables - Prevents duplicate syncs
   - Indexes `[dockId, providerResourceId]` for uniqueness enforcement

7. **Added `updatedAt` timestamps**
   - Added to: `docks`, `servers`, `webServices`, `domains`, `databases`
   - Rationale: Track when resources change (syncs, updates)
   - Note: Convex provides `_creationTime` automatically, we track `updatedAt` manually

---

## Future Enhancements (Post-MVP)

### 🔮 **Planned But Not Urgent**

#### **Soft Deletes**
- Add `deletedAt: v.optional(v.number())` to:
  - `organizations`, `teams`, `clients`, `docks`, `projects`
- Rationale: Preserve audit trails without cascading deletions
- Status: Can be added later without breaking changes

#### **User Preferences**
- New table: `userSettings`
- Fields: `theme`, `notificationsEnabled`, `dashboardLayout`, etc.
- Rationale: User customization
- Status: Nice-to-have, not blocking

#### **Enhanced Indexes**
- Compound index: `by_org_provider` on `docks` table
- Rationale: Query optimization for "all GridPane docks in org"
- Status: Add when query performance data shows need

#### **Per-Resource Permissions**
- Extend `dockPermissions` to resource-level
- Rationale: Granular access control (e.g., "Team A can only see servers, not domains")
- Status: Current dock-level permissions sufficient for MVP

#### **Resource Metadata**
- Add `tags: v.array(v.string())` to resource tables
- Add `metadata: v.optional(v.object({...}))` for custom fields
- Rationale: User-defined organization and filtering
- Status: Can be stored in `fullApiData` for now

#### **Sync History**
- New table: `syncHistory`
- Track: sync start/end times, resources synced, errors encountered
- Rationale: Better debugging and monitoring
- Status: `lastSyncAt` + `lastSyncError` sufficient for MVP

#### **Rate Limiting Tracking**
- Add `rateLimitRemaining: v.optional(v.number())` to `docks`
- Add `rateLimitResetAt: v.optional(v.number())` to `docks`
- Rationale: Respect provider API rate limits
- Status: Can be tracked in adapter layer, add to schema if needed

---

## Schema Constraints & Validation

### **Uniqueness Enforcement** (Application Logic)

Convex doesn't enforce unique constraints at schema level. Enforce in mutations:

```typescript
// Example: Prevent duplicate (dockId, providerResourceId)
const existing = await ctx.db
  .query("webServices")
  .withIndex("by_dock_resource", (q) => 
    q.eq("dockId", dockId).eq("providerResourceId", resourceId)
  )
  .first()

if (existing) {
  // Update existing instead of creating duplicate
}
```

**Uniqueness Rules**:
- `users.clerkId` - Globally unique
- `users.email` - Globally unique (if email auth enabled)
- `(orgId, name)` pairs: `clients`, `teams`, `docks`, `projects`
- `(dockId, providerResourceId)` pairs: All resource tables

### **fullApiData Validation**

- **Schema**: `v.any()` (intentional flexibility)
- **Validation**: Happens in adapter layer, not schema
- **Documentation**: Each adapter documents expected shape in `packages/docks/{provider}/README.md`
- **Registry Location**: `packages/docks/` (source code, copy/paste/own)
- **Runtime Location**: `convex/docks/adapters/` (execution, copied from registry)
- **Registry Documentation**: [packages/docks/README.md](../../packages/docks/README.md)
- **Rationale**: Providers have vastly different APIs, strict validation would break extensibility

---

## Migration Strategy

### **Adding New Provider Types**

1. **No schema changes needed** - Universal tables accept any provider
2. **Create adapter** - Registry: `packages/docks/{provider}/`, Runtime: `convex/docks/adapters/{provider}/`
3. **Register adapter** - Add to `convex/docks/registry.ts` (runtime) and `packages/docks/registry.json` (registry)
4. **Test sync** - Verify resources map correctly
5. **See**: [packages/docks/README.md](../../packages/docks/README.md) for registry details

### **Adding New Resource Types**

1. **Create table** - Follow universal pattern
2. **Add to `projectResources` union** - Update `resourceTable` union
3. **Update adapter interface** - Add `sync{ResourceType}()` method
4. **Create migrations** - If needed (Convex handles schema changes automatically)

### **Breaking Changes**

- **Avoid**: Changing field types (e.g., `v.string()` → `v.number()`)
- **Safe**: Adding optional fields, adding tables, adding indexes
- **Strategy**: Use `v.optional()` for new fields, deprecate old fields gradually

---

## Known Limitations & Trade-offs

### **Denormalization in `projectResources`**

- **Trade-off**: `denormalized_name` and `denormalized_status` can drift from source
- **Mitigation**: Update denormalized fields on resource updates
- **Benefit**: Fast project dashboard queries without joins

### **No Built-in Soft Deletes**

- **Current**: Physical deletion (with audit log)
- **Future**: Add `deletedAt` fields when needed
- **Workaround**: Use `status: "archived"` for now

### **Timestamps**

- **Convex Provides**: `_creationTime` (automatic)
- **We Track**: `updatedAt` (manual, optional)
- **Rationale**: Convex doesn't auto-track updates, but we can add it where needed

---

## References

- **Current Schema**: `convex/schema.ts`
- **Adapter Guide**: `docs/guides/DOCK_ADAPTER_GUIDE.md`
- **Registry Documentation**: [packages/docks/README.md](../../packages/docks/README.md)
- **Architecture**: `docs/architecture/ARCHITECTURE.md`
- **Security**: `docs/architecture/SECURITY.md`
- **RBAC**: `convex/lib/rbac.ts`

---

## Version History

- **v1 (MVP)**: GridPane adapter + encryption system
  - Universal provider pattern established
  - Core RBAC and multi-tenancy
  - Resource tables: servers, webServices, domains, databases
  - Audit logging foundation

---

**Last Updated**: 2025-01-XX (MVP Implementation)
