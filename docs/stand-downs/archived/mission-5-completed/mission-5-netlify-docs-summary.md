# Netlify Adapter Documentation Summary

> **Created**: January 11, 2025  
> **Agent**: `backend-convex`  
> **Status**: Ready for Implementation

---

## Documentation Files Created

All documentation is in `stand-downs/active/`:

1. **`mission-5-netlify-adapter-implementation-guide.md`**
   - Complete implementation guide
   - Field mappings with examples
   - Code snippets for all files
   - Edge case handling
   - Testing checklist

2. **`mission-5-netlify-agent-prompt.md`**
   - Agent prompt ready to send
   - Step-by-step instructions
   - Reference files listed
   - Success criteria

3. **`mission-5-netlify-field-mapping-reference.md`**
   - Quick reference table
   - Status mapping function
   - Edge case code snippets
   - Example mapping

---

## Key Points for Agent

### Critical Clarification
- **Netlify Sites** ≠ **StackDock Projects**
- Netlify sites → `webServices` table (provider resources)
- StackDock projects → `projects` table (user-created, NOT synced)
- Adapter should NOT create StackDock projects automatically

### Files to Create
1. `convex/docks/adapters/netlify/api.ts` - API client
2. `convex/docks/adapters/netlify/types.ts` - TypeScript types
3. `convex/docks/adapters/netlify/adapter.ts` - Adapter implementation
4. `convex/docks/adapters/netlify/index.ts` - Export adapter
5. `convex/docks/adapters/netlify/README.md` - Documentation

### Files to Modify
1. `convex/docks/registry.ts` - Register netlify adapter and metadata
2. `convex/docks/actions.ts` - Add Netlify case to fetch sites

### Reference Implementation
- `convex/docks/adapters/vercel/` - Follow this pattern exactly

### API Response Examples
- `docks/netlify/site/listSites.json` - Site structure

---

## Field Mappings

| Universal Field | Netlify Source | Example |
|----------------|---------------|---------|
| `providerResourceId` | `site.id` | `"fc7cd4a9-6639-4a6a-907b-844526a43b87"` |
| `name` | `site.name` | `"stackdock-docs"` |
| `productionUrl` | `site.ssl_url` (prefer) | `"https://stackdock-docs.netlify.app"` |
| `environment` | Always `"production"` | `"production"` |
| `gitRepo` | `build_settings.repo_path` | `"stackdock/docs"` |
| `status` | `lifecycle_state` | `"active"` → `"running"` |
| `fullApiData` | `site` (entire object) | `{ ... }` |

---

## Status Mapping

```typescript
active → running
inactive → stopped
suspended → stopped
deleted → stopped
current (state) → running (fallback)
```

---

## Next Steps

1. Send `mission-5-netlify-agent-prompt.md` to `backend-convex` agent
2. Agent implements adapter following Vercel pattern
3. Test with real Netlify API key
4. Verify data displays in UI tables
5. Move to next provider (DigitalOcean or Cloudflare)

---

**All documentation is ready. Agent can proceed with implementation.**
