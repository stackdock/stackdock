# Mission 4 Frontend Review: Table Template Alignment

> **Date**: November 11, 2025  
> **Agent**: `frontend-shadcn` / `frontend-tailwind-v4`  
> **Mission**: Mission 4 - Days 1-2 (UI Polish)  
> **Priority**: CRITICAL  
> **Status**: Ready for Agent Assignment  
> **Template Reference**: User-provided HTML template (shadcn/ui admin dashboard)

---

## Mission Overview

**Objective**: Fix table bugs and align all 4 resource tables (Servers, Web Services, Domains, Databases) with the provided HTML template for visual and functional consistency.

**Context**: 
- Tables are functional but visually inconsistent with template
- Template shows shadcn/ui admin dashboard styling
- Need to match exact styling, spacing, and behavior
- Critical blocker for Mission 4 (must complete before provider integration)

**Impact**: UI polish is critical path blocker. All tables must match template before proceeding with multi-provider integration.

---

## Template Analysis

### Key Template Patterns Identified

1. **Filter Bar**: Search input + filter buttons (Status, Role) + View button
2. **Table Headers**: `h-10` height, `px-2` padding, sort indicators with chevrons
3. **Table Rows**: `p-2` cell padding, sticky checkbox column, `group/row` hover states
4. **Badges**: Specific color schemes with borders, capitalize text
5. **Pagination**: Rows per page selector + page range + navigation buttons

---

## Critical Issues Found

### 1. Table Cell Padding (HIGH PRIORITY)

**Current**: `p-4` (16px padding)  
**Template**: `p-2` (8px padding)  
**Files Affected**: All table components

**Fix Location**: `apps/web/src/components/ui/table.tsx`

```typescript
// Current:
className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}

// Should be:
className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0", className)}
```

---

### 2. Table Header Height (HIGH PRIORITY)

**Current**: `h-12` (48px height)  
**Template**: `h-10` (40px height)  
**Files Affected**: All table components

**Fix Location**: `apps/web/src/components/ui/table.tsx`

```typescript
// Current:
className={cn("h-12 px-4 text-left align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0 dark:text-slate-400", className)}

// Should be:
className={cn("h-10 px-2 text-left align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0 dark:text-slate-400", className)}
```

---

### 3. Missing Sticky Checkbox Column (MEDIUM PRIORITY)

**Current**: Checkbox column not sticky on mobile  
**Template**: Checkbox column sticky on mobile with `sticky md:table-cell left-0 z-10`  
**Files Affected**: All table components

**Fix Location**: All table component files

```typescript
// In checkbox column header:
<TableHead
  className="sticky md:table-cell left-0 z-10 rounded-tl bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted pr-2! md:pr-0"
>

// In checkbox column cell:
<TableCell className="sticky md:table-cell left-0 z-10 rounded-tl bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted pr-2! md:pr-0">
```

---

### 4. Row Hover States (MEDIUM PRIORITY)

**Current**: Basic hover state  
**Template**: `group/row` with `hover:bg-muted/50` and `data-state` attributes  
**Files Affected**: All table components

**Fix Location**: All table component files

```typescript
// Update TableRow:
<TableRow 
  key={row.id} 
  className="group/row hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
  data-state={row.getIsSelected() ? "selected" : "false"}
>
```

---

### 5. Status Badge Colors (MEDIUM PRIORITY)

**Current**: Generic badge colors  
**Template**: Specific color schemes matching template  
**Files Affected**: `apps/web/src/components/resources/shared/status-badge.tsx`

**Template Color Patterns**:
- `active`: `bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200`
- `suspended`: `bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10`
- `inactive`: `bg-neutral-300/40 text-foreground border-neutral-300`
- `invited`: `bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300`

**Fix Required**: Update `StatusBadge` component to match template colors exactly.

---

### 6. Filter Bar Layout (LOW PRIORITY)

**Current**: Filter buttons use Popovers  
**Template**: Inline filter buttons with `border-dashed` styling  
**Files Affected**: All table components

**Template Pattern**:
```html
<div class="flex items-center justify-between">
  <div class="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
    <input class="h-8 w-[150px] lg:w-[250px]" />
    <div class="flex gap-x-2">
      <button class="h-8 border-dashed">Status</button>
    </div>
  </div>
  <button class="ml-auto hidden h-8 lg:flex">View</button>
</div>
```

**Fix Required**: Update filter bar structure to match template (can keep Popovers for functionality, but match visual styling).

---

## Files to Modify

### Priority 1 (Base Components)
1. `apps/web/src/components/ui/table.tsx` - Fix cell padding and header height

### Priority 2 (Table Components)
2. `apps/web/src/components/resources/servers-table.tsx`
3. `apps/web/src/components/resources/web-services-table.tsx`
4. `apps/web/src/components/resources/domains-table.tsx`
5. `apps/web/src/components/resources/databases-table.tsx`

### Priority 3 (Shared Components)
6. `apps/web/src/components/resources/shared/status-badge.tsx` - Update colors
7. `apps/web/src/components/resources/shared/provider-badge.tsx` - Verify styling (if needed)

---

## Testing Checklist

After implementing fixes:

- [ ] All tables visually match template
- [ ] Table headers are `h-10` (not `h-12`)
- [ ] Table cells have `p-2` padding (not `p-4`)
- [ ] Checkbox column is sticky on mobile
- [ ] Row hover states work with `group/row`
- [ ] Status badges match template colors exactly
- [ ] Filter bar layout matches template
- [ ] Pagination layout matches template
- [ ] Responsive on mobile (test checkbox sticky behavior)
- [ ] No console errors
- [ ] All functionality works (filtering, sorting, pagination, row selection)

---

## Reference Materials

### Template HTML Structure
The user provided a complete HTML template showing:
- Filter bar with search + filter buttons + view button
- Table with sticky checkbox column
- Row hover states and selection states
- Badge color schemes
- Pagination layout

### shadcn/ui Documentation
- Table component: https://ui.shadcn.com/docs/components/table
- Badge component: https://ui.shadcn.com/docs/components/badge
- Button component: https://ui.shadcn.com/docs/components/button

### TanStack Table Documentation
- Table docs: https://tanstack.com/table/latest
- Column visibility: https://tanstack.com/table/latest/docs/guide/column-visibility
- Row selection: https://tanstack.com/table/latest/docs/guide/row-selection

---

## Implementation Order

1. **Fix base table component** (`table.tsx`) - This affects all tables
2. **Fix status badge colors** - Visual consistency
3. **Update all table components** - Apply sticky checkbox, row classes
4. **Update filter bar layout** - Match template styling
5. **Test all tables** - Verify visual match and functionality

---

## Success Criteria

✅ **Visual Match**: All tables match template exactly (spacing, colors, layout)  
✅ **Functional**: All features work (filtering, sorting, pagination, selection)  
✅ **Responsive**: Mobile behavior matches template (sticky checkbox)  
✅ **No Errors**: No console errors or warnings  
✅ **Consistent**: All 4 tables have identical styling

---

## Notes

- **Keep Popovers**: The template shows filter buttons, but current implementation uses Popovers for filter dropdowns. Keep Popovers for functionality, but match button styling.
- **Badge Capitalization**: Template shows `capitalize` class on badges - ensure all badges are capitalized.
- **Dark Mode**: Template shows dark mode color variants - ensure dark mode matches template.
- **Accessibility**: Maintain accessibility features (ARIA labels, keyboard navigation) while matching template.

---

**Status**: Ready for frontend agent assignment  
**Estimated Time**: 2 days  
**Dependencies**: None (can start immediately)  
**Blocks**: Mission 4 provider integration (Days 3-7)
