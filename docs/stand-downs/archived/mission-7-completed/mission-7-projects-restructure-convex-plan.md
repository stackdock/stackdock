# Mission 7: Projects Restructure - Convex Agent Plan

**Mission**: Restructure Projects as Top-Level Navigation with Code Sub-Page  
**Status**: Ready for Implementation  
**Created**: November 12, 2025  
**Agent**: Convex Agent

---

## 🎯 Objective

Ensure the Convex backend supports Projects as a scalable, multi-feature section with:
- **Code** (current focus - GitHub integration)
- **Calendar/Charts/Planner** (future)
- **Content** (future)
- **Social** (future)

---

## 📋 Current State

### Projects Table Schema
**File**: `convex/schema.ts`

**Current Schema** (lines ~106-116):
```typescript
projects: defineTable({
  orgId: v.id("organizations"),
  teamId: v.id("teams"),
  clientId: v.id("clients"),
  name: v.string(),
  linearId: v.optional(v.string()),
  githubRepo: v.optional(v.string()),
  // ❌ Missing: fullApiData
})
  .index("by_orgId", ["orgId"])
  .index("by_teamId", ["teamId"])
  .index("by_clientId", ["clientId"])
  // ❌ Missing: by_githubRepo index
```

**Note**: The GitHub adapter plan already includes schema changes. This plan ensures those changes are implemented correctly.

---

## ✅ Required Changes

### Step 1: Update Projects Schema

**File**: `convex/schema.ts`

**Action**: Add `fullApiData` field and `by_githubRepo` index to support GitHub integration and future extensibility.

**Change**:
```typescript
projects: defineTable({
  orgId: v.id("organizations"),
  teamId: v.id("teams"),
  clientId: v.id("clients"),
  name: v.string(),
  linearId: v.optional(v.string()),
  githubRepo: v.optional(v.string()),
  fullApiData: v.optional(v.any()), // ✅ ADD - Stores GitHub repo data, branches, issues, etc.
})
  .index("by_orgId", ["orgId"])
  .index("by_teamId", ["teamId"])
  .index("by_clientId", ["clientId"])
  .index("by_githubRepo", ["orgId", "githubRepo"]) // ✅ ADD - For efficient GitHub repo lookups
```

**Verification**:
- [ ] Schema compiles without errors
- [ ] Existing projects remain valid (optional fields are backward compatible)
- [ ] Index is created successfully

---

### Step 2: Verify GitHub Adapter Integration

**Files**: 
- `convex/docks/adapters/github/adapter.ts` (to be created)
- `convex/docks/actions.ts`
- `convex/docks/mutations.ts`

**Action**: Ensure the GitHub adapter properly populates projects with:
- Repository data in `fullApiData`
- Branches and issues nested in `fullApiData`
- `githubRepo` field populated (format: `owner/repo-name`)

**Verification**:
- [ ] GitHub adapter syncs repositories to projects table
- [ ] `fullApiData` contains complete GitHub repository object
- [ ] `githubRepo` field is correctly formatted
- [ ] Projects can be queried by `githubRepo` using the index

---

### Step 3: Create/Update Projects Queries

**File**: `convex/projects.ts` (create if doesn't exist, or update existing)

**Action**: Ensure queries support:
1. Listing all projects for an organization
2. Filtering projects by GitHub repo
3. Getting project with full API data

**Required Queries**:

```typescript
// List all projects for an organization
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    
    const orgId = await getOrgId(ctx, identity)
    
    return await ctx.db
      .query("projects")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect()
  },
})

// Get project by GitHub repo
export const getByGitHubRepo = query({
  args: {
    orgId: v.id("organizations"),
    githubRepo: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    
    // Verify org access
    await getOrgId(ctx, identity)
    
    return await ctx.db
      .query("projects")
      .withIndex("by_githubRepo", (q) => 
        q.eq("orgId", args.orgId).eq("githubRepo", args.githubRepo)
      )
      .first()
  },
})

// Get project with full details
export const getById = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    
    const project = await ctx.db.get(args.projectId)
    if (!project) return null
    
    // Verify org access
    await getOrgId(ctx, identity)
    
    return project
  },
})
```

**Verification**:
- [ ] Queries compile without errors
- [ ] RBAC checks are in place (verify org access)
- [ ] Queries return correct data structure

---

### Step 4: Verify GitHub Data Structure

**Action**: Ensure `fullApiData` structure supports frontend needs:

**Expected Structure** (for GitHub projects):
```typescript
{
  // GitHub repository data
  id: number,
  name: string,
  full_name: string,
  description: string,
  html_url: string,
  // ... other GitHub repo fields
  
  // Nested data (added by adapter)
  branches?: Array<{
    name: string,
    commit: { sha: string, url: string },
    protected: boolean,
    // ... other branch fields
  }>,
  issues?: Array<{
    number: number,
    title: string,
    state: "open" | "closed",
    // ... other issue fields (no PRs)
  }>,
  pulls?: Array<{
    number: number,
    title: string,
    state: "open" | "closed",
    // ... other PR fields
  }>,
  commits?: Array<{
    sha: string,
    commit: { message: string, author: {...} },
    // ... other commit fields
  }>,
  contributors?: Array<{
    login: string,
    contributions: number,
    // ... other contributor fields
  }>
}
```

**Verification**:
- [ ] GitHub adapter stores data in this structure
- [ ] Frontend can access nested arrays (branches, issues, etc.)
- [ ] Data is properly typed (TypeScript types match)

---

## 🧪 Testing Checklist

### Schema Changes
- [ ] Run `npx convex dev` and verify schema compiles
- [ ] Check Convex dashboard - projects table has new fields
- [ ] Verify index `by_githubRepo` exists

### GitHub Integration
- [ ] Add GitHub dock via UI
- [ ] Sync GitHub resources
- [ ] Verify projects are created in database
- [ ] Check `fullApiData` contains GitHub repository object
- [ ] Verify `githubRepo` field is populated correctly

### Queries
- [ ] Test `list` query returns all projects
- [ ] Test `getByGitHubRepo` finds project by repo name
- [ ] Test `getById` returns project with full data
- [ ] Verify RBAC prevents unauthorized access

### Data Structure
- [ ] Verify `fullApiData.branches` exists and is an array
- [ ] Verify `fullApiData.issues` exists and is an array (no PRs)
- [ ] Verify `fullApiData.pulls` exists (if collected)
- [ ] Verify `fullApiData.commits` exists (if collected)
- [ ] Verify `fullApiData.contributors` exists (if collected)

---

## 📝 Notes

### Future Extensibility
The `fullApiData` field is designed to be flexible:
- **GitHub**: Stores repo, branches, issues, pulls, commits, contributors
- **Linear**: Will store Linear project data (future)
- **Calendar/Planner**: Will store calendar events, tasks (future)
- **Content**: Will store content items (future)
- **Social**: Will store social media data (future)

### Backward Compatibility
- Existing projects without `fullApiData` will work fine (optional field)
- Existing projects without `githubRepo` will work fine (optional field)
- No migration needed - Convex handles optional fields automatically

### Performance Considerations
- The `by_githubRepo` index ensures fast lookups
- `fullApiData` can be large - consider pagination for nested arrays in frontend
- Queries should filter at database level when possible

---

## ✅ Completion Criteria

- [ ] Schema updated with `fullApiData` and `by_githubRepo` index
- [ ] GitHub adapter populates projects correctly
- [ ] Projects queries support GitHub repo lookups
- [ ] `fullApiData` structure matches expected format
- [ ] All tests pass
- [ ] Documentation updated (if needed)

---

**Ready for Implementation**: ✅  
**Blocks Frontend**: Yes - Frontend needs schema changes first  
**Estimated Time**: 1-2 hours (mostly verification of GitHub adapter work)
