# Polymorphic Resource Deduplication - MVP (Read-Only)

## Problem Statement

The universal resource tables (`servers`, `domains`) contain duplicate entries representing the same physical resource managed by multiple providers. This creates confusion and clutter in the UI.

### Current Duplication Examples

**Servers:**
- GridPane server (Hetzner) + Coolify server (Hetzner) = Same physical server
- GridPane server (Hetzner) + GridPane server (Hetzner) = Same server, different views
- Coolify server (Linode) + Coolify server (Hetzner) = Different servers (should NOT deduplicate)

**Domains:**
- GridPane site domain + Cloudflare domain = Same domain, different providers
- Example: `example.com` managed by GridPane AND Cloudflare DNS

### Root Cause

The universal table pattern stores each provider's view of a resource as a separate row. This is correct at the database level (preserves provider-specific data), but creates a poor UX when the same physical resource appears multiple times.

## Solution: Client-Side Deduplication (MVP)

**Scope:** Read-only UI deduplication. No schema changes. No backend changes.

### Matching Criteria

**Servers:**
- Match when **name OR IP address** are identical
- Case-insensitive name matching
- Exact IP address matching (IPv4/IPv6)

**Domains:**
- Match when **domainName** is identical
- Case-insensitive matching
- Normalize to lowercase for comparison

### Display Logic

1. **Group duplicates** by matching criteria
2. **Show single row** per unique resource
3. **Combine provider badges** with "+" separator
   - Example: `GridPane + Hetzner`
   - Example: `Cloudflare + GridPane`
4. **Preserve all data** - merge `fullApiData` or show primary + indicators

## Implementation Approach

### 1. Create Deduplication Utilities

**File:** `apps/web/src/lib/resource-deduplication.ts`

```typescript
/**
 * Deduplicate servers by name or IP address
 */
export function deduplicateServers(servers: Doc<"servers">[]): DeduplicatedServer[] {
  // Group by name (normalized) OR IP address
  // Return merged records with combined providers
}

/**
 * Deduplicate domains by domainName
 */
export function deduplicateDomains(domains: Doc<"domains">[]): DeduplicatedDomain[] {
  // Group by domainName (normalized)
  // Return merged records with combined providers
}

interface DeduplicatedServer {
  // Primary server data (use most recent or first)
  ...Server
  providers: string[] // ["gridpane", "hetzner"]
  originalIds: string[] // Track original _id values
  mergedData: Server[] // All original records
}

interface DeduplicatedDomain {
  // Primary domain data
  ...Domain
  providers: string[]
  originalIds: string[]
  mergedData: Domain[]
}
```

### 2. Update ProviderBadge Component

**File:** `apps/web/src/components/resources/shared/provider-badge.tsx`

Add support for multiple providers:

```typescript
export interface ProviderBadgeProps {
  provider: string | string[] // Support single or multiple
  className?: string
}

// Render multiple badges with "+" separator
// Or single badge with combined text: "GridPane + Hetzner"
```

### 3. Update Table Components

**Files:**
- `apps/web/src/components/resources/servers-table.tsx`
- `apps/web/src/components/resources/domains-table.tsx`

**Changes:**
- Apply deduplication in `useMemo` before passing to table
- Update Provider column to handle `providers: string[]`
- Update row selection to handle `originalIds: string[]` (if needed)

### 4. Handle Edge Cases

- **Name matches but IP differs**: Don't deduplicate (different servers)
- **IP matches but name differs**: Deduplicate (same server, different names)
- **Both match**: Deduplicate
- **Neither matches**: Keep separate

## Success Criteria (MVP)

- [ ] Servers with matching name OR IP are shown as single row
- [ ] Domains with matching domainName are shown as single row
- [ ] Provider badges show combined providers: "GridPane + Hetzner"
- [ ] No duplicate rows in tables
- [ ] All original data preserved (accessible via mergedData)
- [ ] No schema changes
- [ ] No backend changes
- [ ] Read-only (no mutation/deletion changes)

## Example Output

### Before:
```
| Name          | Provider  | IP Address    |
|---------------|-----------|---------------|
| web-server-1  | GridPane  | 1.2.3.4      |
| web-server-1  | Hetzner   | 1.2.3.4      |
| web-server-1  | Coolify   | 1.2.3.4      |
```

### After:
```
| Name          | Provider                    | IP Address    |
|---------------|-----------------------------|---------------|
| web-server-1  | GridPane + Hetzner + Coolify | 1.2.3.4      |
```

## Out of Scope (Future Enhancements)

- **Project Linking**: Linking deduplicated resources to projects (separate issue)
- **Write Operations**: Updating/deleting deduplicated resources (requires schema changes)
- **Automatic Merging**: Backend-level deduplication (requires schema redesign)
- **Conflict Resolution**: UI for resolving provider conflicts
- **Provider Priority**: Choosing which provider's data is "primary"

## Technical Notes

- **Performance**: Deduplication runs client-side on each render. Consider memoization.
- **Data Loss**: None - all original records preserved in `mergedData`
- **Backward Compatibility**: 100% - existing queries unchanged
- **Testing**: Test with real-world scenarios (GridPane + Hetzner, Cloudflare + GridPane)

## Related Architecture

This aligns with StackDock's universal table pattern:
- Database stores provider-specific views (correct)
- UI presents unified view (this issue)
- Future: Projects link to unified resources (separate issue)

## Acceptance Criteria

1. ✅ No duplicate servers in servers table (by name OR IP)
2. ✅ No duplicate domains in domains table (by domainName)
3. ✅ Provider badges show combined providers with "+"
4. ✅ All original data accessible (no data loss)
5. ✅ No schema changes
6. ✅ No backend changes
7. ✅ Read-only MVP complete

---

**Labels:** `enhancement`, `ui`, `mvp`, `client-side`, `polymorphism`
**Priority:** Medium
**Estimated Effort:** 4-6 hours
**Branch:** `feature/polymorphic-resource-deduplication-mvp`
