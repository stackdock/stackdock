# Stackdock Cleanup Plan

## Goal
Clean up technical debt accumulated from multiple LLM iterations before proceeding with new features.

## Timeline: 2 Weeks

---

## Week 1: Core Infrastructure Cleanup

### Monday - Remove Debug Logging
**Time:** 2-3 hours

```bash
# Find all console.logs
grep -rn "console.log" src/lib/gridpane/

# Files to clean:
- src/lib/gridpane/utils.ts
- src/lib/gridpane/rate-limiter.ts
- src/lib/gridpane/sites/updateSitePhpVersion.ts
- src/lib/gridpane/sites/getGridpaneSite.ts
```

**Keep only:**
- `console.error()` for errors
- `console.warn()` for warnings

**Remove:**
- Debug status logs
- Request/response logs
- "Starting/Completed" messages

**Test:** Verify PHP version updates still work

---

### Tuesday - Consolidate Types
**Time:** 2-3 hours

**Current Issues:**
- Types scattered across multiple files
- Some duplicate definitions
- Inconsistent naming

**Action:**
1. Create central `src/lib/gridpane/sites/types.ts` (already exists)
2. Move ALL site-related types there
3. Update imports across codebase
4. Remove `php-version-types.ts` (already done)

**Verify:**
- `npm run build` succeeds
- No type errors

---

### Wednesday - Standardize Error Handling
**Time:** 2-3 hours

**Ensure:**
- All GridPane functions use `GridPaneApiError`
- Consistent error messages
- User-friendly error text
- No stack traces in UI

**Files:**
- All functions in `src/lib/gridpane/sites/`
- `src/components/sites/php-version-selector.tsx`

---

### Thursday - Code Review
**Time:** 3-4 hours

**Read through each file:**
1. `src/lib/gridpane/config.ts` - Verify config logic
2. `src/lib/gridpane/utils.ts` - Check fetch wrapper
3. `src/lib/gridpane/rate-limiter.ts` - Review rate limiting
4. All `src/lib/gridpane/sites/*.ts` - Check patterns

**Look for:**
- Duplicate code
- Overly complex logic
- Missing comments
- Potential bugs

---

### Friday - Testing & Documentation
**Time:** 2-3 hours

**Test:**
- [ ] Load sites list
- [ ] View single site
- [ ] Update PHP version (success case)
- [ ] Update PHP version (rate limit case)
- [ ] Update PHP version (error case)

**Document:**
- Add JSDoc to exported functions
- Update any unclear variable names
- Add comments for complex logic

---

## Week 2: Components & Polish

### Monday - Component Cleanup
**Time:** 2-3 hours

**Files:**
- `src/components/sites/php-version-selector.tsx`
- Any other custom components

**Tasks:**
- Remove debug logs
- Verify error states render properly
- Check loading states
- Ensure accessibility

---

### Tuesday - Route Cleanup
**Time:** 2-3 hours

**Files:**
- `src/app/dashboard/sites/[siteDomain]/page.tsx`
- Any other route files

**Tasks:**
- Remove debug logs
- Add loading skeletons
- Improve error boundaries
- Check for hardcoded values

---

### Wednesday - Styling Audit
**Time:** 2-3 hours

**Search for:**
```bash
grep -r "bg-.*-[0-9]" src/
grep -r "text-.*-[0-9]" src/
```

**Replace with design tokens:**
- `bg-blue-500` → `bg-primary`
- `text-red-600` → `text-destructive`
- etc.

**Verify:**
- Light/dark mode both work
- No visual regressions

---

### Thursday - Final Audit
**Time:** 3-4 hours

**Run all checks:**
```bash
npm run lint
npm run build
npx unimported
```

**Manual review:**
- Check AUDIT.md checklist
- Verify all conventions followed
- Test all features manually

---

### Friday - Documentation & Git Cleanup
**Time:** 2-3 hours

**Tasks:**
- [ ] Update AUDIT.md with results
- [ ] Mark completed items in CONVENTIONS.md
- [ ] Create git commit per logical change
- [ ] Squash/rebase if needed
- [ ] Update todo.md

**Git Strategy:**
```bash
# Create cleanup branch
git checkout -b cleanup/technical-debt

# Small, focused commits
git add src/lib/gridpane/utils.ts
git commit -m "refactor(gridpane): remove debug logging from utils"

git add src/lib/gridpane/rate-limiter.ts
git commit -m "refactor(gridpane): remove debug logging from rate limiter"

# etc.
```

---

## Success Criteria

### Before Cleanup
- ❌ Console full of debug logs
- ❌ Types scattered across files
- ❌ Hardcoded colors in components
- ❌ Inconsistent error handling
- ❌ Some commented-out code

### After Cleanup
- ✅ Clean console (errors/warns only)
- ✅ Types consolidated in `types.ts` files
- ✅ All styling uses design tokens
- ✅ Consistent error handling pattern
- ✅ No dead code
- ✅ All features tested and working
- ✅ Ready for new features

---

## Post-Cleanup: Resume Feature Development

Once cleanup is complete:
1. ✅ Continue with GridPane POST endpoints
2. ✅ Add more PUT endpoints
3. ✅ Implement DELETE endpoints
4. Foundation work (auth, database)

---

## Notes

- **Don't rush:** Quality over speed
- **Test frequently:** After each day's work
- **Commit often:** Small, focused commits
- **Ask questions:** If unsure about a pattern
- **Document decisions:** Why you kept/removed something

---

## Emergency Rollback

If cleanup breaks something:
```bash
# Revert to last working state
git reset --hard HEAD~1

# Or revert specific commit
git revert <commit-hash>
```

Keep `main` branch stable, do all work in `cleanup/*` branches.
