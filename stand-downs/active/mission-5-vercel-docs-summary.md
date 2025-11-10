# Vercel Adapter Documentation Summary

> **Created**: January 11, 2025  
> **Agent**: `backend-convex`  
> **Status**: Ready for Implementation

---

## Documentation Files Created

All documentation is in `stand-downs/active/`:

1. **`mission-5-vercel-adapter-implementation-guide.md`**
   - Complete implementation guide
   - Field mappings with examples
   - Code snippets for all files
   - Edge case handling
   - Testing checklist

2. **`mission-5-vercel-agent-prompt.md`**
   - Agent prompt ready to send
   - Step-by-step instructions
   - Reference files listed
   - Success criteria

3. **`mission-5-vercel-field-mapping-reference.md`**
   - Quick reference table
   - Status mapping function
   - Edge case code snippets
   - Example mapping

---

## Key Points for Agent

### Critical Clarification
- **Vercel Projects** ≠ **StackDock Projects**
- Vercel projects → `webServices` table (provider resources)
- StackDock projects → `projects` table (user-created, NOT synced)
- Adapter should NOT create StackDock projects automatically

### Files to Create
1. `convex/docks/adapters/vercel/api.ts` - API client
2. `convex/docks/adapters/vercel/types.ts` - TypeScript types
3. `convex/docks/adapters/vercel/adapter.ts` - Adapter implementation
4. `convex/docks/adapters/vercel/index.ts` - Export adapter
5. `convex/docks/adapters/vercel/README.md` - Documentation

### Files to Modify
1. `convex/docks/registry.ts` - Register vercel adapter

### Reference Implementation
- `convex/docks/adapters/gridpane/` - Follow this pattern exactly

### API Response Examples
- `docks/vercel/projects/retrievealistofprojects.json` - Project structure

---

## Field Mappings

| Universal Field | Vercel Source | Example |
|----------------|---------------|---------|
| `providerResourceId` | `project.id` | `"prj_8kpgj4jqKA28AHdtuidFVW7lij1U"` |
| `name` | `project.name` | `"vapr-ballistics-js-client"` |
| `productionUrl` | `targets.production.url` | `"https://..."` (add https://) |
| `environment` | `targets.production.target` | `"production"` |
| `gitRepo` | `link.org + "/" + link.repo` | `"robsdevcraft/vapr-ballistics"` |
| `status` | `targets.production.readyState` | `"READY"` → `"running"` |
| `fullApiData` | `project` (entire object) | `{ ... }` |

---

## Status Mapping

```typescript
READY → running
BUILDING → pending
ERROR → error
QUEUED → pending
CANCELED → stopped
```

---

## Next Steps

1. Send `mission-5-vercel-agent-prompt.md` to `backend-convex` agent
2. Agent implements adapter following GridPane pattern
3. Test with real Vercel API key
4. Verify data displays in UI tables
5. Move to next provider (Netlify)

---

**All documentation is ready. Agent can proceed with implementation.**
