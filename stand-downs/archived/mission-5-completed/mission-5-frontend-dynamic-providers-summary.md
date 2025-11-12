# Frontend Dynamic Providers: Quick Summary

> **Quick Reference** for making provider dropdown dynamic

---

## The Problem

- ❌ Provider dropdown hardcoded (only GridPane)
- ❌ Vercel adapter exists but can't be selected
- ❌ Adding providers requires frontend changes

---

## The Solution

**Make provider dropdown populate from backend registry:**

1. Add provider metadata map to registry
2. Create `listAvailableProviders` query
3. Update frontend to use query instead of hardcoded list

**Result**: New adapters automatically appear in UI, no frontend changes needed

---

## Key Changes

| File | Change |
|------|--------|
| `convex/docks/registry.ts` | Add `providerMetadata` map and `listProvidersWithMetadata()` |
| `convex/docks/queries.ts` | Add `listAvailableProviders` query |
| `apps/web/src/routes/dashboard/settings/docks.tsx` | Replace hardcoded `<SelectItem>` with `.map()` over query results |

---

## Implementation Time

**Estimated**: 30 minutes

**Steps**: 4 steps (see detailed doc)

---

## Full Documentation

**See**: `stand-downs/active/mission-5-frontend-dynamic-providers-guide.md`

---

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete
- [ ] Tested

---

**Ready to implement. Point frontend agent to detailed guide.**
