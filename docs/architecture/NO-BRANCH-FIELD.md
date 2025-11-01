# Architectural Decision: No Branch Field in Universal Schema

## Status
**Accepted** - 2025-11-01

## Context
When designing universal tables for multi-provider infrastructure management (e.g., `webServices`, `projects`), there might be a temptation to add Git branch information as a universal field.

## Decision
**We will NOT add a `branch`, `gitBranch`, or similar field to any universal table schemas.**

## Rationale

### 1. Provider-Specific Behavior
Different PaaS providers handle Git branches differently:
- **Vercel**: Each deployment is tied to a specific branch, with preview deployments for non-production branches
- **Netlify**: Similar branch-based deployment model
- **Railway**: Branch-based environments
- **GridPane**: May not use Git at all, or use SVN, or manual deployments
- **Traditional IaaS**: No native Git integration

### 2. One Deployment vs Multiple Branches
A single web service resource might have:
- Production deployment (from `main` branch)
- Staging deployment (from `develop` branch)  
- Multiple preview deployments (from feature branches)

Storing a single `branch` field doesn't capture this complexity.

### 3. Universal Table Philosophy
Per our architecture (ARCHITECTURE.md):
- **Universal fields**: Common to ALL providers (name, status, url)
- **Provider-specific fields**: Stored in `fullApiData`

Branch information is provider-specific and belongs in `fullApiData`.

## Implementation

### Current Schema (Correct)
```typescript
webServices: defineTable({
  orgId: v.id("organizations"),
  dockId: v.id("docks"),
  provider: v.string(),
  providerResourceId: v.string(),
  name: v.string(),
  productionUrl: v.string(),
  gitRepo: v.optional(v.string()), // Repository URL only
  status: v.string(),
  fullApiData: v.any(), // Branch info goes here
})
```

### How to Access Branch Information
If a dock adapter needs to store branch information:

```typescript
// In a Vercel dock adapter
const serviceData = {
  provider: "vercel",
  providerResourceId: deployment.id,
  name: deployment.name,
  productionUrl: deployment.url,
  gitRepo: deployment.gitSource.repo,
  status: deployment.state,
  fullApiData: {
    // Provider-specific fields
    branch: deployment.gitSource.branch,
    commitSha: deployment.gitSource.sha,
    framework: deployment.framework,
    // ... other Vercel-specific data
  },
}
```

### How to Display Branch Information in UI
UI components that need to show branch information should:

1. Query the resource
2. Access `fullApiData.branch` (or equivalent based on provider)
3. Handle cases where branch info doesn't exist

```typescript
// In a deployment widget
const branch = webService.fullApiData?.branch || "N/A"
```

## Consequences

### Positive
- ✅ Schema remains truly universal
- ✅ Scales to any provider (Git-based or not)
- ✅ Supports complex deployment scenarios
- ✅ Maintains architectural consistency

### Negative
- ❌ UI components must handle provider-specific data access
- ❌ No type safety for `fullApiData` fields (it's `any`)

### Mitigation
- Provide TypeScript types for common providers' `fullApiData` structures
- Document `fullApiData` schema in dock adapter guides
- Use TypeScript assertions in UI components when accessing known providers

## References
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Universal Table Architecture section
- [DOCK_ADAPTER_GUIDE.md](../../DOCK_ADAPTER_GUIDE.md) - How to build adapters
- [convex/schema.ts](../../convex/schema.ts) - Current schema implementation
