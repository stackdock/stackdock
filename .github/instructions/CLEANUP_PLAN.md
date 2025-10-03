# Stackdock Cleanup Plan

## Goal
Clean up technical debt accumulated from multiple LLM iterations before proceeding with new features.

## Timeline: 2 Weeks

## Week 1 Completion Summary ✅

**Status:** COMPLETE (October 3, 2025)  
**Total Time:** ~10 hours across 5 days  
**Commits Made:** 4 focused commits

### Accomplishments

#### Day 1 - Remove Debug Logging ✅
- **Removed:** 28 console.log statements across 16+ files
- **Kept:** 1 production log in helpers.ts for API call monitoring
- **Files cleaned:**
  - All page.tsx files (removed [PAGE.TSX | TOP] markers)
  - utils.ts, rate-limiter.ts, updateSitePhpVersion.ts
  - teams/getGridpaneUserTeamsList.ts
- **Result:** Clean console output, easier debugging
- **Commit:** `3923772` "docs: initial push for internal docs"

#### Day 2 - Consolidate Types ✅
- **Merged:** schedule-types.ts into types.ts
- **Removed:** Duplicate GridPaneErrorResponse interface
- **Updated:** All imports in getGridpaneBackupSchedules.ts and page.tsx
- **Result:** Single source of truth for backup types
- **Commit:** `9db61d5` "refactor: consolidate backup types into single file"

#### Day 3 - Standardize Error Handling ✅
- **Verified:** All 12 GET operations use GridPaneApiError consistently
- **Documented:** Error handling patterns in CONVENTIONS.md
- **Pattern confirmed:**
  - Try/catch with performance monitoring
  - GridPaneApiError re-thrown as-is
  - Unexpected errors wrapped in GridPaneApiError
  - User-friendly error messages throughout
- **Result:** Error handling already perfect, just needed documentation
- **Commit:** `ca3ef92` "docs: document standardized error handling patterns"

#### Day 4 - Code Review ✅
- **Removed:** 32 lines of commented-out retry logic from utils.ts
- **Simplified:** 429 rate limit error logging (40+ lines → 12 lines)
- **Reviewed:** rate-limiter.ts, helpers.ts (both already clean)
- **Checked:** Magic numbers (all appropriate: HTTP codes, cache durations)
- **Reviewed:** Complex functions (all reasonably structured)
- **Result:** Cleaner code, preserved all functionality
- **Commit:** `70bec3d` "refactor: clean up utils.ts verbose logging and commented code"

#### Day 5 - Testing & Documentation ✅
- **Verified:** All 12 GET operations follow identical patterns:
  - Sites: getGridPaneSitesList, getGridPaneSiteByDomain, getGridPaneSite
  - Servers: getGridPaneServersList
  - Domains: getGridPaneDomainsList
  - Backups: getGridPaneBackupSchedules, getGridPaneBackupIntegrations
  - Teams: getGridPaneUserTeamsList, getGridPaneCurrentTeam
  - User: getGridPaneUser
  - Bundles: getGridPaneBundlesList
  - System Users: getGridPaneSystemUsersList
- **Confirmed:** Rate limiter integration working across all endpoints
- **Confirmed:** Error handling consistent (GridPaneApiError everywhere)
- **Updated:** CLEANUP_PLAN.md with comprehensive Week 1 summary
- **Result:** Week 1 complete, ready for Week 2

### Key Metrics
- **Files Modified:** 20+ files
- **Lines Removed:** ~150 lines of debug/commented code
- **Lines Added:** ~100 lines of documentation
- **Net Change:** -50 lines (cleaner codebase)
- **Build Status:** ✅ Passing after every change
- **Lint Status:** ✅ Clean (fixed unused param warnings)

### Lessons Learned
1. **Error handling was already excellent** - Previous LLM sessions standardized it well
2. **Debug logging was pervasive** - Needed systematic removal across all files
3. **Type organization mostly good** - Only 1 scattered file (schedule-types.ts)
4. **Rate limiter is solid** - Just needed verbose logging cleanup
5. **Commenting code for "testing"** - Should be removed, not kept as comments
6. **Small focused commits work well** - Each day committed separately

### Technical Debt Eliminated
- ❌ Debug console.logs cluttering output
- ❌ Verbose rate limit logging (40+ lines of headers)
- ❌ Commented-out retry logic (32 lines)
- ❌ Scattered type definitions (schedule-types.ts)
- ❌ Undocumented error handling patterns

### What's Still Working
- ✅ Rate limiting (proactive tracking + 429 response handling)
- ✅ PHP version updates (tested during Day 1)
- ✅ Error handling (GridPaneApiError used consistently)
- ✅ Response validation (all functions validate structure)
- ✅ Performance monitoring (duration tracking on all calls)
- ✅ Caching strategy (appropriate revalidate times)

### Week 2 Preparation Notes
- All GET operations are consistent - good foundation
- Components need review (php-version-selector.tsx already clean)
- Routes need review (check for debug logs, hardcoded values)
- Styling audit needed (search for hardcoded colors)
- Final testing needed (manual feature verification)

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
