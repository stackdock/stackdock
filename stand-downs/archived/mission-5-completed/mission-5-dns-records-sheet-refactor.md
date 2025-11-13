# Mission 5: Refactor DNS Records Display to Use shadcn Sheet

## Objective
Replace the current Popover-based DNS records display in the domains table with a shadcn Sheet component for better UX and more space to display DNS record details.

## Current Implementation

**File**: `apps/web/src/components/resources/domains-table.tsx`

**Current Behavior** (lines 182-234):
- DNS Records column shows a button with record count
- Clicking the button opens a Popover with DNS records
- Popover has limited space (`w-[400px] max-h-[300px]`)
- Records are displayed in a compact list format

**Current Code**:
```typescript
{
  id: "dnsRecords",
  header: "DNS Records",
  cell: ({ row }) => {
    const records = row.original.fullApiData?.dnsRecords as Array<{
      id: string
      type: string
      name: string
      content: string
      proxied?: boolean
    }> | undefined
    
    if (!records || records.length === 0) {
      return <span className="text-muted-foreground text-xs">None</span>
    }
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            {records.length} {records.length === 1 ? "record" : "records"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] max-h-[300px] overflow-y-auto">
          <div className="space-y-2">
            <div className="font-medium text-sm mb-2">DNS Records</div>
            {records.map((record) => (
              <div key={record.id} className="text-xs border-b border-border pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-muted/30 text-muted-foreground font-mono text-[10px]">
                    {record.type}
                  </Badge>
                  {record.proxied && (
                    <Badge variant="outline" className="bg-muted/50 text-muted-foreground text-[10px]">
                      Proxied
                    </Badge>
                  )}
                </div>
                <div className="mt-1">
                  <span className="font-medium">{record.name}</span>
                  <span className="text-muted-foreground mx-1">→</span>
                  <span className="font-mono">{record.content}</span>
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    )
  },
  size: 120,
  enableHiding: false,
}
```

## Desired Implementation

**Requirements**:
1. Replace `Popover` with `Sheet` component from `@/components/ui/sheet`
2. Sheet should slide in from the right side
3. Sheet should have a proper header with domain name and record count
4. Sheet should have better spacing and layout for DNS records
5. Sheet should be scrollable if there are many records
6. Maintain the same button trigger in the table cell
7. Keep the "None" state for domains without DNS records

## Technical Specifications

### Sheet Component API
**Location**: `apps/web/src/components/ui/sheet.tsx`

**Available Components**:
- `Sheet` - Root component (controlled via `open` prop)
- `SheetTrigger` - Trigger button (wraps button)
- `SheetContent` - Main content area (supports `side` prop: "top" | "bottom" | "left" | "right")
- `SheetHeader` - Header container
- `SheetTitle` - Title text
- `SheetDescription` - Optional description
- `SheetFooter` - Footer container (if needed)

**Example Usage**:
```typescript
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger asChild>
    <Button>Open</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Title</SheetTitle>
      <SheetDescription>Description</SheetDescription>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>
```

## Implementation Steps

### Step 1: Update Imports
**File**: `apps/web/src/components/resources/domains-table.tsx`

**Remove**:
```typescript
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
```

**Add**:
```typescript
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
```

### Step 2: Refactor DNS Records Cell Component

**Create a new component** (outside the columns array, before `DomainsTable`):

```typescript
function DNSRecordsCell({ row }: { row: Row<Domain> }) {
  const [open, setOpen] = useState(false)
  const records = row.original.fullApiData?.dnsRecords as Array<{
    id: string
    type: string
    name: string
    content: string
    proxied?: boolean
    ttl?: number
  }> | undefined
  
  if (!records || records.length === 0) {
    return <span className="text-muted-foreground text-xs">None</span>
  }
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          {records.length} {records.length === 1 ? "record" : "records"}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>DNS Records</SheetTitle>
          <SheetDescription>
            {row.original.domainName} • {records.length} {records.length === 1 ? "record" : "records"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {records.map((record) => (
            <div 
              key={record.id} 
              className="rounded-lg border bg-card p-4 space-y-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono">
                  {record.type}
                </Badge>
                {record.proxied && (
                  <Badge variant="secondary" className="text-xs">
                    Proxied
                  </Badge>
                )}
                {record.ttl && (
                  <Badge variant="outline" className="text-xs">
                    TTL: {record.ttl}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Name</div>
                <div className="font-mono text-sm break-all">{record.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Content</div>
                <div className="font-mono text-sm break-all">{record.content}</div>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

### Step 3: Update Column Definition

**Replace the DNS Records column** in the `columns` array:

```typescript
{
  id: "dnsRecords",
  header: "DNS Records",
  cell: ({ row }) => <DNSRecordsCell row={row} />,
  size: 120,
  enableHiding: false,
}
```

### Step 4: Add useState Import

**Ensure** `useState` is imported from React (should already be there, but verify):

```typescript
import { useId, useMemo, useRef, useState } from "react"
```

## Design Considerations

### Layout
- **Sheet Width**: Use `sm:max-w-2xl` for better readability on larger screens
- **Spacing**: Use `space-y-4` between records for better visual separation
- **Card Style**: Each record should be in a card with border and padding
- **Typography**: Use monospace font for DNS values (name, content)
- **Badges**: Keep type badges, add TTL badge if available

### Responsive Behavior
- Sheet should be full-width on mobile (`w-full`)
- Max width of `2xl` on larger screens
- Content should scroll if records exceed viewport height

### Accessibility
- Sheet should have proper ARIA labels
- Close button should be accessible
- Focus management should work correctly
- Keyboard navigation should work

## Testing Checklist

- [ ] Sheet opens when clicking DNS records button
- [ ] Sheet closes when clicking close button or overlay
- [ ] Sheet displays all DNS records correctly
- [ ] Sheet handles domains with no DNS records (shows "None")
- [ ] Sheet is scrollable when there are many records
- [ ] Sheet works on mobile devices
- [ ] Sheet works on tablet devices
- [ ] Sheet works on desktop devices
- [ ] Badges display correctly (type, proxied, TTL)
- [ ] Long DNS values wrap/break correctly
- [ ] Multiple sheets can be opened/closed independently (if multiple rows)

## Files to Modify

1. **`apps/web/src/components/resources/domains-table.tsx`**
   - Update imports
   - Create `DNSRecordsCell` component
   - Update DNS Records column definition

## Reference Files

- **Sheet Component**: `apps/web/src/components/ui/sheet.tsx`
- **Current Implementation**: `apps/web/src/components/resources/domains-table.tsx` (lines 182-234)
- **Similar Pattern**: `apps/web/src/components/ui/sidebar.tsx` (uses Sheet for mobile sidebar)

## Notes

- The Sheet component is built on Radix UI Dialog primitives
- Sheet slides in from the right by default (`side="right"`)
- Sheet automatically handles overlay and focus management
- Sheet is controlled via `open` and `onOpenChange` props
- Each row should manage its own sheet state independently

## Completion Criteria

### ✅ Sheet Transition - COMPLETED
✅ DNS records display in a Sheet instead of Popover  
✅ Sheet slides in from the right side  
✅ Sheet has proper header with domain name and record count  
✅ DNS records are displayed in a card-based layout  
✅ Sheet is scrollable for many records  
✅ All existing functionality preserved  
✅ Responsive design works on all screen sizes  
✅ Accessibility requirements met  
✅ Code follows project patterns and conventions  

### 🔄 DNS UI - WORK IN PROGRESS
- [ ] Enhanced DNS record display (copy-to-clipboard, search/filter)
- [ ] DNS record editing capabilities (future)
- [ ] DNS record creation (future)
- [ ] DNS record deletion (future)
- [ ] Bulk DNS operations (future)

---

**Priority**: Medium  
**Estimated Time**: 30-45 minutes (Sheet transition completed)  
**Dependencies**: None (Sheet component already exists)  
**Status**: Sheet transition ✅ COMPLETE | DNS UI 🔄 WORK IN PROGRESS
