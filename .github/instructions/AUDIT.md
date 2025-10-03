# Code Audit Checklist

## Current Status
Last Updated: October 3, 2025
Status: 🔴 Cleanup Required

## Quick Audit Commands
```bash
# Find debug logging
grep -r "console.log" src/ | grep -v "console.error" | grep -v "console.warn"

# Find hardcoded colors
grep -r "bg-.*-[0-9]" src/

# Find 'any' types
grep -r ": any" src/

# Check for commented code
grep -r "// TODO\|// FIXME\|/\*" src/
```

## Files to Review

### GridPane Implementation
- [ ] `src/lib/gridpane/config.ts`
  - [ ] Remove excess logging
  - [ ] Verify environment variables
  - [ ] Check validation logic

- [ ] `src/lib/gridpane/utils.ts`
  - [ ] Remove debug console.logs
  - [ ] Verify error handling
  - [ ] Check retry logic (currently disabled)
  - [ ] Simplify rate limit logging

- [ ] `src/lib/gridpane/rate-limiter.ts`
  - [ ] Remove verbose logging
  - [ ] Verify memory management
  - [ ] Document reset estimation logic

- [ ] `src/lib/gridpane/sites/`
  - [ ] Check for duplicate code
  - [ ] Verify all use same patterns
  - [ ] Remove unused functions
  - [ ] Consolidate types

### Components
- [ ] `src/components/sites/php-version-selector.tsx`
  - [ ] Remove console.logs
  - [ ] Verify state management
  - [ ] Check error handling UI

- [ ] `src/components/ui/`
  - [ ] Don't modify shadcn components
  - [ ] Document any customizations

### App Routes
- [ ] `src/app/dashboard/sites/[siteDomain]/page.tsx`
  - [ ] Remove console.logs
  - [ ] Check error boundaries
  - [ ] Verify loading states

## Anti-Patterns to Find & Fix

### 1. Excessive Logging
**Search for:** `console.log`, `console.debug`
```typescript
// ❌ Remove
console.log('[DEBUG]', data);
console.log('=== RATE LIMIT STATUS ===');

// ✅ Keep (production errors)
console.error('[GridPane API Error]', error);
```

### 2. Mixed Paradigms
**Look for:**
- Mix of `async/await` and `.then()`
- Mix of `function` and `const fn = () =>`
- Inconsistent error handling

**Fix:** Choose one pattern per context

### 3. Hardcoded Values
**Search for:** `'http'`, colors in JSX
```typescript
// ❌ Bad
<div className="bg-blue-500 text-white">

// ✅ Good
<div className="bg-primary text-primary-foreground">
```

### 4. Commented Code
**Search for:** `/* ... */`, `// TODO`, `// FIXME`
- Remove dead code
- Convert TODOs to GitHub issues
- Remove commented-out experiments

### 5. Duplicate Code
**Look for:**
- Similar fetch patterns across files
- Repeated validation logic
- Copy-pasted type definitions

**Fix:** Extract to shared utilities

### 6. Type Issues
**Search for:** `any`, `as unknown as`
```typescript
// ❌ Bad
const data: any = response.json();

// ✅ Good
const data: SiteResponse = await response.json();
```

### 7. Unused Imports/Exports
**Use:** `npx eslint . --fix` to catch unused imports

### 8. Inconsistent Naming
- Check file names match exports
- Verify type names are descriptive
- Ensure function names are verbs

## Cleanup Progress Tracking

### Week 1: GridPane Cleanup
- [ ] Day 1: Remove all debug logging
- [ ] Day 2: Consolidate types
- [ ] Day 3: Standardize error handling
- [ ] Day 4: Code review & refactor
- [ ] Day 5: Test everything

### Week 2: Components & Routes
- [ ] Day 1: Component cleanup
- [ ] Day 2: Route cleanup
- [ ] Day 3: Utilities review
- [ ] Day 4: Types consolidation
- [ ] Day 5: Final audit

## Definition of Done

A file is "clean" when:
- ✅ No `console.log` (except errors/warnings)
- ✅ No hardcoded colors
- ✅ No `any` types
- ✅ Follows naming conventions
- ✅ Has JSDoc comments on exported functions
- ✅ No commented-out code
- ✅ Types are consolidated
- ✅ Passes `npm run lint`

## Notes
- Rate limiting infrastructure is solid, just needs logging cleanup
- PHP version update feature is working correctly
- Focus on removing debug artifacts before adding new features
