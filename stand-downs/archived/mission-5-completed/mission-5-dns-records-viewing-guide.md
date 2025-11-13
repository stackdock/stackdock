# DNS Records Viewing Guide

> **Location**: `stand-downs/active/mission-5-dns-records-viewing-guide.md`  
> **Last Updated**: January 11, 2025  
> **Status**: Complete

---

## How to View DNS Records

### Step 1: Navigate to Domains Table

**Route**: `/dashboard/infrastructure/networking`

**Navigation Path**:
1. Click **Infrastructure** in sidebar
2. Click **Networking** (shows domains table)

---

### Step 2: Find DNS Records Column

**Column Location**: The **"DNS Records"** column is now **always visible** (cannot be hidden)

**Column Position**: After "Updated" column, before "Actions" column

**What You'll See**:
- **"None"** - If no DNS records synced yet
- **"X records"** button - If DNS records exist (clickable)

---

### Step 3: View DNS Records Details

**If you see a button** (e.g., "9 records"):
1. Click the button
2. Popover opens showing all DNS records for that domain
3. Each record shows:
   - **Type badge** (A, AAAA, CNAME, MX, TXT, etc.)
   - **Proxied badge** (if Cloudflare-proxied)
   - **Record name** → **content** (e.g., `deltaninemedia.com → 5.161.51.86`)

---

## Troubleshooting

### If You See "None" for All Domains

**Possible Causes**:
1. **DNS records not synced yet**
   - Cloudflare adapter needs to sync domains first
   - DNS records are fetched per-zone after zones are synced
   - Check dock sync status

2. **Cloudflare dock not added**
   - Add Cloudflare dock in Settings > Docks
   - Sync the dock to fetch zones and DNS records

3. **DNS records fetch failed**
   - Check Convex logs for errors
   - Adapter continues syncing other zones even if one fails

### If DNS Records Column Not Visible

**Check**:
- ✅ Column is now **always visible** (cannot be hidden)
- ✅ Refresh page if column was previously hidden
- ✅ Check horizontal scroll - column might be off-screen on small viewports
- ✅ Column header should say "DNS Records"

---

## Data Structure

**DNS Records are stored in**:
```typescript
domain.fullApiData.dnsRecords = [
  {
    id: "b0906a37b6a35540314a8f71d39aabab",
    name: "deltaninemedia.com",
    type: "A",
    content: "5.161.51.86",
    proxied: false,
    ttl: 600,
    // ... other fields
  }
]
```

**Source**: Cloudflare API `GET /zones/{zone_id}/dns_records`

---

## Expected Behavior

### After Cloudflare Dock Sync

1. **Zones sync** → Domains appear in table
2. **DNS records fetch** → Stored in `domains.fullApiData.dnsRecords`
3. **DNS Records column** → Shows record count button
4. **Click button** → Popover shows all DNS records

### Display Example

```
Domain                Provider    Status    DNS Records    Updated
─────────────────────────────────────────────────────────────
apexoutdoorsman.com   Cloudflare  Active    5 records      2020-11-16
blackrifle.dev        Cloudflare  Active    12 records     2025-11-01
```

**Clicking "5 records"** opens popover:
```
DNS Records
─────────────────────────
[A] deltaninemedia.com → 5.161.51.86
[A] staging.deltaninemedia.com → 5.161.51.86
[CNAME] www.deltaninemedia.com → deltaninemedia.com
[MX] mail.deltaninemedia.com → feedback-smtp.us-east-1.amazonses.com
[TXT] mail.deltaninemedia.com → "v=spf1 include:amazonses.com ~all"
```

---

## Column Features

✅ **Always Visible** - Cannot be hidden via View dropdown  
✅ **Clickable** - Shows record count, click to view details  
✅ **Popover Display** - Scrollable list of all DNS records  
✅ **Type Badges** - Visual indicators for record types  
✅ **Proxied Badge** - Shows Cloudflare proxy status  
✅ **Monospace Content** - Easy to read IP addresses and domains

---

## Next Steps

1. **Verify Cloudflare dock is synced** - Check Settings > Docks
2. **Check domains table** - Should see Cloudflare zones
3. **Check DNS Records column** - Should show record counts
4. **Click record count** - Should open popover with DNS records

---

**DNS Records column is now always visible and ready to use!**
