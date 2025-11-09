# Frontend Agent Prompt: Table Template Alignment

> **Copy this prompt and provide it to your frontend agent**

---

## Mission Assignment

You are assigned to **Mission 4, Days 1-2: UI Polish** - fixing table bugs and aligning all resource tables with the provided HTML template.

**Priority**: CRITICAL (blocks provider integration)  
**Timeline**: 2 days  
**Status**: Ready to start

---

## Your Task

Fix all 4 resource tables (Servers, Web Services, Domains, Databases) to visually and functionally match the provided HTML template. The tables are currently functional but have visual inconsistencies.

---

## Detailed Brief

**Read this document first**: `stand-downs/mission-4-frontend-table-review.md`

This document contains:
- Complete template analysis
- All critical issues found
- Specific code fixes with line numbers
- Testing checklist
- Reference materials

---

## Key Issues to Fix

1. **Table Cell Padding**: Change from `p-4` to `p-2` (affects all tables)
2. **Table Header Height**: Change from `h-12` to `h-10` (affects all tables)
3. **Sticky Checkbox Column**: Add sticky positioning on mobile
4. **Row Hover States**: Add `group/row` classes and `data-state` attributes
5. **Status Badge Colors**: Match template color schemes exactly
6. **Filter Bar Layout**: Match template styling (keep Popovers for functionality)

---

## Files to Modify

### Priority 1 (Base Components)
- `apps/web/src/components/ui/table.tsx` - Fix cell padding and header height

### Priority 2 (Table Components)
- `apps/web/src/components/resources/servers-table.tsx`
- `apps/web/src/components/resources/web-services-table.tsx`
- `apps/web/src/components/resources/domains-table.tsx`
- `apps/web/src/components/resources/databases-table.tsx`

### Priority 3 (Shared Components)
- `apps/web/src/components/resources/shared/status-badge.tsx` - Update colors
- `apps/web/src/components/resources/shared/provider-badge.tsx` - Verify styling

---

## Template Reference

The user provided a complete HTML template showing the exact styling needed. Key patterns:

- **Filter Bar**: Search input (`h-8 w-[150px] lg:w-[250px]`) + filter buttons (`h-8 border-dashed`) + View button
- **Table Headers**: `h-10 px-2` with sort indicators
- **Table Rows**: `p-2` padding, sticky checkbox column, `group/row` hover states
- **Badges**: Specific color schemes (see review document)
- **Pagination**: Rows per page + page range + navigation buttons

---

## Implementation Steps

1. **Read the review document**: `stand-downs/mission-4-frontend-table-review.md`
2. **Fix base table component**: Update `table.tsx` (cell padding, header height)
3. **Fix status badges**: Update colors to match template
4. **Update all table components**: Apply sticky checkbox, row classes, filter bar styling
5. **Test all tables**: Verify visual match and functionality

---

## Success Criteria

✅ All tables visually match template exactly  
✅ All functionality works (filtering, sorting, pagination, selection)  
✅ Responsive on mobile (sticky checkbox works)  
✅ No console errors  
✅ All 4 tables have identical styling

---

## Questions?

- **Review document**: `stand-downs/mission-4-frontend-table-review.md`
- **Mission plan**: `stand-downs/mission-4-execution-plan.md`
- **shadcn/ui docs**: https://ui.shadcn.com/docs/components/table
- **TanStack Table docs**: https://tanstack.com/table/latest

---

## Start Here

1. Read `stand-downs/mission-4-frontend-table-review.md` completely
2. Review the current table implementations
3. Compare with template patterns
4. Implement fixes in priority order
5. Test each table after fixes
6. Verify all success criteria met

**Good luck! This is critical path work - take your time and get it right.**
