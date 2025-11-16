# Mission 5 Refactor: Quick Summary

> **Quick Reference** for refactoring dock sync to use adapter methods directly

---

## The Problem

- ✅ Adapter methods exist (`syncWebServices()`, etc.) with complete implementation
- ❌ But they're NOT being used
- ❌ Provider-specific code duplicated in `actions.ts` and `mutations.ts`
- ❌ Adding new providers requires changes in 3 places

---

## The Solution

**Refactor to use adapter methods directly:**

1. **Update adapter methods** to accept optional `preFetchedData` parameter
2. **Create generic mutation** that calls adapter methods
3. **Update action** to call new mutation
4. **Remove provider-specific code** from mutations

**Result**: Single source of truth (adapters), no duplication, easier to add providers

---

## Key Changes

| File | Change |
|------|--------|
| `_types.ts` | Add `preFetchedData?` parameter to sync methods |
| `gridpane/adapter.ts` | Accept optional pre-fetched data |
| `vercel/adapter.ts` | Accept optional pre-fetched data |
| `mutations.ts` | Add `syncDockResourcesMutation`, remove `insertSyncResults` |
| `actions.ts` | Call new mutation instead of old one |

---

## Implementation Time

**Estimated**: 1-2 hours

**Steps**: 9 steps (see detailed doc)

---

## Full Documentation

**See**: `stand-downs/active/mission-5-refactor-adapter-pattern.md`

---

## Status

- [ ] Not started
- [ ] In progress
- [ ] Complete
- [ ] Tested

---

**Ready to implement when you have time.**
