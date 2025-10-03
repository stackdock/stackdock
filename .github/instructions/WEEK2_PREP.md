# Week 2 Cleanup Preparation Notes

**Created:** October 3, 2025  
**Status:** Ready for Week 2 execution  
**Based on:** Comprehensive codebase review after Week 1 completion

---

## Overview

Week 1 cleaned up core infrastructure (utils, error handling, types, debug logging).  
Week 2 will focus on **components, routes, and styling** - the user-facing layer.

**Good News:** Components and routes are already quite clean! Week 2 will be lighter than Week 1.

---

## Monday - Component Cleanup

### Files to Review
1. `src/components/sites/php-version-selector.tsx` ✅ Already clean from Week 1
2. `src/components/sidebar/*.tsx` - Review for consistency
3. `src/components/command/*.tsx` - Review command palette
4. `src/components/settings/*.tsx` - Review settings components

### What to Check
- ✅ No console.logs found in any components
- Check for unused props
- Verify error states render properly
- Check loading states
- Ensure accessibility (aria-labels, etc.)

### Expected Time
**1-2 hours** (lighter than planned since no console.logs exist)

---

## Tuesday - Route Cleanup

### Files with Hardcoded Colors (Priority)

**Error Display Patterns:**
All following files use hardcoded red colors for errors:
```tsx
<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
```

**Should be:** 
```tsx
<div className="border border-destructive text-destructive px-4 py-3 rounded mb-4">
```
Or use the Alert component from shadcn/ui.

**Files to Update:**
1. `src/app/dashboard/sites/page.tsx` (line 43)
2. `src/app/dashboard/sites/bundles/page.tsx` (line 28)
3. `src/app/dashboard/servers/page.tsx` (line 43)
4. `src/app/dashboard/servers/system-users/page.tsx` (line 41)
5. `src/app/dashboard/domains/page.tsx` (line 41)
6. `src/app/dashboard/backups/schedules/page.tsx` (line 38)
7. `src/app/dashboard/backups/integrations/page.tsx` (line 28)

**Status Badge Colors:**
- `src/app/dashboard/servers/system-users/page.tsx` (line 118):
  ```tsx
  user.status === 'succeed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  ```
  **Should use Badge component** with appropriate variants

- `src/app/dashboard/backups/integrations/page.tsx` (lines 73, 145):
  ```tsx
  color: 'bg-gray-100 text-gray-800'
  ```
  **Should use Badge component** with secondary/outline variant

### Routes Already Clean ✅
- `src/app/dashboard/sites/[siteDomain]/page.tsx` - Uses design tokens correctly!

### Expected Time
**2-3 hours** (replace 11 hardcoded color instances)

---

## Wednesday - Styling Audit

### Search Commands
```bash
# Find all color patterns (run from project root)
grep -rn "bg-red-" src/app/
grep -rn "bg-green-" src/app/
grep -rn "bg-blue-" src/app/
grep -rn "bg-yellow-" src/app/
grep -rn "text-red-" src/app/
grep -rn "text-green-" src/app/
```

### Design Token Reference
From CONVENTIONS.md:
```tsx
// ✅ Use design tokens
bg-background, bg-foreground, bg-card, bg-card-foreground
bg-popover, bg-popover-foreground
bg-primary, bg-primary-foreground
bg-secondary, bg-secondary-foreground
bg-muted, bg-muted-foreground
bg-accent, bg-accent-foreground
bg-destructive, bg-destructive-foreground
bg-border, bg-input, bg-ring
```

### Shadcn/UI Components Available
- `Alert` - For error/warning messages (use instead of hardcoded red divs)
- `Badge` - For status indicators (use instead of hardcoded color classes)
- `Card` - For content containers
- `Button` - With proper variants (destructive, secondary, etc.)

### Expected Time
**2 hours** (most work done on Tuesday, this is verification)

---

## Thursday - Final Code Audit

### Automated Checks
```bash
npm run lint                # Check for linting errors
npm run build               # Verify builds successfully
npx unimported              # Find unused files/exports (optional)
```

### Manual Checks from AUDIT.md
- [X] No console.log (except errors/warnings) ✅ Already verified
- [ ] No hardcoded colors - Will fix Tuesday/Wednesday
- [X] No `any` types ✅ Already clean from Week 1
- [X] Follows naming conventions ✅ Verified in Week 1
- [X] Types are consolidated ✅ Done in Week 1 Day 2
- [X] Passes `npm run lint` ✅ Verified

### Files Requiring JSDoc Comments
Review and add JSDoc comments to:
1. Complex utility functions
2. Exported helper functions
3. Non-obvious logic sections

### Expected Time
**2-3 hours** (thorough manual testing + documentation)

---

## Friday - Documentation & Git

### Documentation Updates
1. Update `AUDIT.md`:
   - Mark Week 2 complete
   - Update "Current Status" to 🟢 Cleanup Complete
   - Document final metrics

2. Update `CONVENTIONS.md` (if needed):
   - Add any new patterns discovered
   - Document Alert/Badge usage patterns

3. Update `CLEANUP_PLAN.md`:
   - Add Week 2 completion summary
   - Document final outcomes
   - Add "What's Next" section

### Git Commits Strategy
Follow same pattern as Week 1 - one commit per logical change:

```bash
# Tuesday's work
git add src/app/dashboard/sites/page.tsx
git add src/app/dashboard/servers/page.tsx
git add src/app/dashboard/domains/page.tsx
git commit -m "refactor(routes): replace hardcoded error colors with design tokens"

git add src/app/dashboard/servers/system-users/page.tsx
git commit -m "refactor(routes): replace status badge colors with Badge component"

git add src/app/dashboard/backups/integrations/page.tsx
git commit -m "refactor(routes): use Badge component for integration status"

# Friday's work
git add .github/instructions/
git commit -m "docs: complete Week 2 cleanup documentation"
```

### Expected Time
**1-2 hours** (documentation + git cleanup)

---

## Week 2 Summary Estimate

| Day | Task | Estimated Time | Complexity |
|-----|------|---------------|-----------|
| Monday | Component cleanup | 1-2 hours | Low |
| Tuesday | Route color fixes | 2-3 hours | Medium |
| Wednesday | Styling verification | 2 hours | Low |
| Thursday | Final audit & testing | 2-3 hours | Medium |
| Friday | Documentation & git | 1-2 hours | Low |
| **Total** | | **8-12 hours** | **Easy** |

**Much lighter than Week 1's 10-12 hours!** Most work is find/replace for colors.

---

## Risks & Blockers

### Low Risk ✅
- No console.logs to remove (already done)
- No complex refactoring needed
- Error handling already standardized
- Types already consolidated

### Medium Risk ⚠️
- Hardcoded colors might be harder to find than grep suggests
- Need to verify dark mode works after color changes
- Badge component styling might need tweaking

### Mitigation
- Test in both light and dark mode after each change
- Take screenshots before/after for comparison
- Use storybook or manual testing for component changes

---

## Success Criteria

Week 2 is complete when:
- ✅ All routes use design tokens (no hardcoded colors)
- ✅ Status indicators use Badge component
- ✅ Error messages use Alert component
- ✅ Build passes
- ✅ Lint passes
- ✅ Dark mode works correctly
- ✅ No visual regressions
- ✅ Documentation updated
- ✅ Git history clean with focused commits

---

## Quick Reference: Common Replacements

### Error Messages
```tsx
// ❌ Before
<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
  <strong>Error:</strong> {error}
</div>

// ✅ After (Option 1: Design tokens)
<div className="border border-destructive text-destructive px-4 py-3 rounded mb-4">
  <strong>Error:</strong> {error}
</div>

// ✅ After (Option 2: Alert component - preferred)
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>{error}</AlertDescription>
</Alert>
```

### Status Badges
```tsx
// ❌ Before
<span className={user.status === 'succeed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
  {user.status}
</span>

// ✅ After
<Badge variant={user.status === 'succeed' ? 'default' : 'destructive'}>
  {user.status}
</Badge>
```

### Generic Badges
```tsx
// ❌ Before
<span className="bg-gray-100 text-gray-800">{type}</span>

// ✅ After
<Badge variant="secondary">{type}</Badge>
```

---

## Notes for AI Assistants

When executing Week 2:

1. **Start with Tuesday** - Color fixes are the main work
2. **Test after each file** - Run build, check visually
3. **Use Alert component** - Don't just replace colors, use proper components
4. **Check dark mode** - Verify colors work in both themes
5. **Keep commits small** - One file or one logical change per commit
6. **Document as you go** - Update AUDIT.md after each day
7. **Take screenshots** - Before/after comparisons helpful for user

**Week 2 should be smooth sailing!** The foundation from Week 1 is solid.
