# Frontend Refactor: Dynamic Provider Dropdown

> **Location**: `stand-downs/active/mission-5-frontend-dynamic-providers-guide.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/active/mission-5-frontend-dynamic-providers-guide.md`  
> **Last Updated**: January 11, 2025  
> **Status**: Ready for Implementation  
> **Agent**: `frontend-tanstack`  
> **Estimated Time**: 30 minutes  
> **Priority**: HIGH

---

## Problem Statement

Currently, the provider dropdown in the dock creation form is **hardcoded** with only GridPane:

```tsx
<SelectContent>
  <SelectItem value="gridpane">GridPane</SelectItem>
</SelectContent>
```

**Issues:**
- Vercel adapter exists but can't be selected in UI
- Adding new providers requires frontend code changes
- Not scalable - will need manual updates for each provider
- Violates single source of truth principle

---

## Solution: Dynamic Provider List from Backend

**Goal**: Make the provider dropdown populate dynamically from the backend registry.

**Benefits:**
- ✅ Single source of truth (backend registry)
- ✅ New adapters automatically appear in UI
- ✅ No frontend changes needed when adding providers
- ✅ Scales to unlimited providers

---

## Implementation Steps

### Step 1: Add Provider Metadata to Registry

**File**: `convex/docks/registry.ts`

**Action**: Add provider metadata map and helper function

**Add this code** after the `adapterRegistry` definition (around line 27):

```typescript
/**
 * Provider display metadata
 * Maps provider ID to display name for UI
 * 
 * Add entries here as new adapters are added.
 */
const providerMetadata: Record<string, { displayName: string }> = {
  gridpane: { displayName: "GridPane" },
  vercel: { displayName: "Vercel" },
  // Add more as adapters are added:
  // digitalocean: { displayName: "DigitalOcean" },
  // netlify: { displayName: "Netlify" },
}

/**
 * List all available providers with metadata
 * 
 * Returns array of providers with display names for UI consumption.
 */
export function listProvidersWithMetadata(): Array<{ id: string; displayName: string }> {
  return Object.keys(adapterRegistry).map(id => ({
    id,
    displayName: providerMetadata[id]?.displayName || id.charAt(0).toUpperCase() + id.slice(1),
  }))
}
```

**Placement**: Add after `listProviders()` function (around line 51), before `registerAdapter()`.

---

### Step 2: Create Provider Query

**File**: `convex/docks/queries.ts`

**Action**: Add new query to expose available providers to frontend

**Add this code** at the end of the file:

```typescript
/**
 * List all available providers (for UI dropdown)
 * 
 * Returns providers with display names for the dock creation form.
 */
export const listAvailableProviders = query({
  handler: async () => {
    const { listProvidersWithMetadata } = await import("./registry")
    return listProvidersWithMetadata()
  },
})
```

**Note**: Use dynamic import to avoid circular dependencies.

---

### Step 3: Update Frontend to Use Dynamic Providers

**File**: `apps/web/src/routes/dashboard/settings/docks.tsx`

**Changes needed:**

#### 3a. Add Query Hook

**Find** (around line 29-30):
```tsx
const docks = useQuery(api["docks/queries"].listDocks)
const currentOrgId = useQuery(api.organizations.getCurrentOrgId)
```

**Add after**:
```tsx
const availableProviders = useQuery(api["docks/queries"].listAvailableProviders)
```

#### 3b. Update Default Provider State

**Find** (around line 33):
```tsx
const [provider, setProvider] = useState("gridpane")
```

**Change to**:
```tsx
const [provider, setProvider] = useState("")
```

**Why**: Empty string allows Select to show placeholder until providers load.

#### 3c. Replace Hardcoded Provider List

**Find** (around lines 157-164):
```tsx
<Select value={provider} onValueChange={setProvider}>
  <SelectTrigger id="provider">
    <SelectValue placeholder="Select provider" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="gridpane">GridPane</SelectItem>
  </SelectContent>
</Select>
```

**Replace with**:
```tsx
<Select value={provider} onValueChange={setProvider} disabled={!availableProviders}>
  <SelectTrigger id="provider">
    <SelectValue placeholder={availableProviders ? "Select provider" : "Loading providers..."} />
  </SelectTrigger>
  <SelectContent>
    {availableProviders?.map((p) => (
      <SelectItem key={p.id} value={p.id}>
        {p.displayName}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Key changes:**
- `disabled={!availableProviders}` - Disable until providers load
- Dynamic `placeholder` - Shows loading state
- `.map()` over `availableProviders` - Renders all providers dynamically
- Uses `p.id` for value and `p.displayName` for label

#### 3d. Add Loading State Handling (Optional but Recommended)

**Find** the form submit handler (around line 43):

**Add validation** at the start of `handleCreateDock`:

```tsx
const handleCreateDock = async (e: React.FormEvent) => {
  e.preventDefault()
  setError(null)
  setIsSubmitting(true)

  if (!currentOrgId) {
    setError("No organization found. Please create an organization first.")
    setIsSubmitting(false)
    return
  }

  if (!provider) {
    setError("Please select a provider")
    setIsSubmitting(false)
    return
  }

  // ... rest of handler
}
```

---

### Step 4: Update Placeholder Text (Optional)

**File**: `apps/web/src/routes/dashboard/settings/docks.tsx`

**Find** (around line 171):
```tsx
placeholder="e.g., Production GridPane"
```

**Change to**:
```tsx
placeholder="e.g., Production Vercel"
```

**Or make it dynamic**:
```tsx
placeholder={provider ? `e.g., Production ${availableProviders?.find(p => p.id === provider)?.displayName || ''}` : "e.g., Production Dock"}
```

---

## Testing Checklist

After implementation, verify:

- [ ] **Provider dropdown loads**
  - [ ] Shows "Loading providers..." while fetching
  - [ ] Displays GridPane option
  - [ ] Displays Vercel option
  - [ ] Options are clickable

- [ ] **Form validation**
  - [ ] Can't submit without selecting provider
  - [ ] Error message shows if provider not selected
  - [ ] Form submits successfully with provider selected

- [ ] **Dock creation**
  - [ ] Can create GridPane dock
  - [ ] Can create Vercel dock
  - [ ] Provider name displays correctly in dock list
  - [ ] Sync works for both providers

- [ ] **Edge cases**
  - [ ] Handles empty provider list gracefully
  - [ ] Handles query loading state
  - [ ] Handles query error state

- [ ] **Future-proof**
  - [ ] Adding new adapter to registry automatically shows in UI
  - [ ] Display names are correct (capitalization, etc.)

---

## Code Review Checklist

- [ ] No hardcoded provider values remain
- [ ] Query is properly typed
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Form validation includes provider check
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser

---

## Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `convex/docks/registry.ts` | Add | Provider metadata map and `listProvidersWithMetadata()` function |
| `convex/docks/queries.ts` | Add | `listAvailableProviders` query |
| `apps/web/src/routes/dashboard/settings/docks.tsx` | Modify | Use dynamic provider list instead of hardcoded |

---

## Expected Behavior After Implementation

**Before:**
- Dropdown shows only "GridPane"
- Vercel not selectable
- Adding providers requires frontend changes

**After:**
- Dropdown shows all registered providers (GridPane, Vercel, etc.)
- New adapters automatically appear
- No frontend changes needed for new providers

---

## Rollback Plan

If issues arise:

1. **Revert frontend changes** - Restore hardcoded provider list
2. **Keep backend changes** - Metadata map is harmless
3. **Test** - Verify GridPane still works
4. **Fix issues** - Debug query/loading states
5. **Re-apply** - Once fixed

---

## Future Enhancements (Not Required Now)

These can be added later:

1. **Provider icons** - Add icon URLs to metadata
2. **Provider descriptions** - Add help text for each provider
3. **Provider categories** - Group by type (IaaS, PaaS, DNS, etc.)
4. **Provider status** - Show if provider is beta/stable
5. **Provider requirements** - Show what API keys are needed

---

## Notes

- **Dynamic import**: Query uses dynamic import to avoid circular dependencies
- **Fallback display name**: If metadata missing, capitalizes first letter
- **Loading state**: Dropdown disabled until providers load
- **Type safety**: TypeScript ensures correct structure

---

## Success Criteria

- ✅ Provider dropdown populated from backend
- ✅ GridPane and Vercel both selectable
- ✅ No hardcoded provider values
- ✅ New adapters automatically appear
- ✅ Form validation works
- ✅ No TypeScript errors
- ✅ No console errors

---

**Ready for implementation. Follow steps in order, test after each major change.**
