# Frontend Guide: Cloudflare Domains Table Integration

> **Location**: `stand-downs/active/mission-5-cloudflare-frontend-guide.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/active/mission-5-cloudflare-frontend-guide.md`  
> **Last Updated**: January 11, 2025  
> **Status**: Ready for Implementation  
> **Agent**: `frontend-tanstack`  
> **Estimated Time**: 30 minutes  
> **Priority**: MEDIUM

---

## Overview

Cloudflare adapter will populate the `domains` table for the first time. The domains table component already exists, but we need to verify it works correctly with Cloudflare data and ensure proper display of DNS records.

---

## Current State

**Existing Component**: `apps/web/src/components/resources/domains-table.tsx`

**Status**: ✅ Component already exists and is ready to display domains from any provider

**Columns**:
- Domain name
- Provider badge
- Status badge
- Expires (optional)
- Updated timestamp
- Actions menu

---

## Verification Checklist

### 1. Verify Domains Query

**File**: Check where domains are queried (likely in a route component)

**Expected Query**:
```typescript
const domains = useQuery(api["domains/queries"].listDomains, {
  orgId: currentOrgId,
})
```

**Action**: Verify query exists and filters by `orgId`. If missing, create query in `convex/domains/queries.ts`.

---

### 2. Verify Provider Badge

**File**: `apps/web/src/components/resources/shared/provider-badge.tsx`

**Check**: Does it handle `"cloudflare"` provider?

**Expected**: Should display "Cloudflare" badge (may need to add if missing)

**Action**: Add Cloudflare to provider badge mapping if needed:
```typescript
const providerColors: Record<string, string> = {
  cloudflare: "bg-orange-100 text-orange-800", // Or appropriate color
  // ... other providers
}
```

---

### 3. Verify Status Badge

**File**: Check status badge component (likely in shared components)

**Check**: Does it handle Cloudflare zone statuses?
- `"active"` → Green badge
- `"pending"` → Yellow badge
- `"stopped"` → Gray badge

**Expected**: Status badge should already handle these (universal statuses)

**Action**: Verify status badge component handles all universal statuses.

---

### 4. DNS Records Display (Optional Enhancement)

**Current**: DNS records stored in `domains.fullApiData.dnsRecords`

**Enhancement**: Add expandable row to show DNS records

**File**: `apps/web/src/components/resources/domains-table.tsx`

**Optional Addition**:
```typescript
{
  id: "dnsRecords",
  header: "DNS Records",
  cell: ({ row }) => {
    const records = row.original.fullApiData?.dnsRecords as CloudflareDNSRecord[] | undefined
    if (!records || records.length === 0) return <span className="text-muted-foreground">None</span>
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm">
            {records.length} records
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="space-y-2">
            {records.map((record) => (
              <div key={record.id} className="text-sm">
                <span className="font-mono">{record.type}</span>{" "}
                <span className="font-medium">{record.name}</span> → {record.content}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    )
  },
}
```

**Note**: This is optional. Can be added later if needed.

---

### 5. Verify Routes

**File**: Check route files (likely `apps/web/src/routes/dashboard/infrastructure.tsx` or similar)

**Check**: Is domains table displayed in infrastructure/dashboard view?

**Expected**: Should have tabs or sections for:
- Servers
- Web Services
- Domains ← **This should display Cloudflare zones**
- Databases

**Action**: Verify domains table is rendered in appropriate route.

---

## Testing Checklist

After backend implementation:

- [ ] Cloudflare zones appear in domains table
- [ ] Provider badge shows "Cloudflare"
- [ ] Status badges display correctly (active/pending/stopped)
- [ ] Domain names display correctly
- [ ] Updated timestamps display correctly
- [ ] Expires column shows "N/A" or empty (DNS zones don't expire)
- [ ] Actions menu works (if implemented)
- [ ] Filtering by provider works (Cloudflare filter)
- [ ] Filtering by status works
- [ ] Search by domain name works

---

## Cloudflare-Specific Features (Future)

### DNS Records View
- Expandable row showing DNS records
- Filter by record type (A, AAAA, CNAME, MX, etc.)
- Show proxied status

### Zone Details
- Show zone plan (Free, Pro, Business, Enterprise)
- Show name servers
- Show account name

### Pages/Workers Integration
- Link domains to Pages projects (if custom domain)
- Show which Pages/Workers use which domains

---

## Files to Check/Modify

1. **`apps/web/src/components/resources/domains-table.tsx`** - Main table component (already exists)
2. **`apps/web/src/components/resources/shared/provider-badge.tsx`** - Provider badge component
3. **`apps/web/src/components/resources/shared/status-badge.tsx`** - Status badge component
4. **`convex/domains/queries.ts`** - Domains queries (may need to create)
5. **Route files** - Where domains table is displayed

---

## Expected Behavior

### After Cloudflare Adapter Implementation

1. **User adds Cloudflare dock** → API token validated
2. **User syncs dock** → Zones sync to `domains` table
3. **Domains table updates** → Cloudflare zones appear with provider badge
4. **DNS records stored** → Available in `fullApiData.dnsRecords` (for future use)

### Display Example

```
Domain                Provider    Status    Expires    Updated
─────────────────────────────────────────────────────────────
apexoutdoorsman.com   Cloudflare  Active    N/A        2020-11-16
blackrifle.dev        Cloudflare  Active    N/A        2025-11-01
```

---

## No Changes Required (If Already Working)

If the domains table component already:
- ✅ Queries domains from Convex
- ✅ Filters by `orgId`
- ✅ Displays provider badges
- ✅ Displays status badges
- ✅ Handles universal statuses

Then **no changes are needed**. The Cloudflare adapter will automatically populate the table.

---

## Summary

**Status**: Domains table component already exists and should work with Cloudflare data.

**Action Required**: 
1. Verify domains query exists
2. Verify provider badge handles "cloudflare"
3. Test with real Cloudflare data after backend implementation

**Optional Enhancement**: Add DNS records display (can be done later)

---

**The frontend should work automatically once backend adapter is implemented. Just verify and test.**

