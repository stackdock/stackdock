# Convex Agent - Quick Start Prompt

**Mission**: Projects Restructure - Backend Implementation  
**Status**: Ready to Start  
**Created**: November 12, 2025

---

## 🎯 Your Task

Ensure the Convex backend supports Projects as a scalable, multi-feature section with GitHub integration.

---

## 📋 Detailed Plan

**Read**: `stand-downs/active/mission-7-projects-restructure-convex-plan.md`

---

## ✅ Quick Checklist

1. **Update Schema** (`convex/schema.ts`)
   - Add `fullApiData: v.optional(v.any())` to projects table
   - Add `.index("by_githubRepo", ["orgId", "githubRepo"])`

2. **Verify GitHub Adapter**
   - Check `convex/docks/adapters/github/adapter.ts` (if exists)
   - Ensure it populates `fullApiData` with GitHub repo data
   - Verify `githubRepo` field is set correctly

3. **Create/Update Queries** (`convex/projects.ts`)
   - `list` - List all projects for org
   - `getByGitHubRepo` - Get project by GitHub repo
   - `getById` - Get project with full details

4. **Test**
   - Schema compiles
   - GitHub adapter syncs projects
   - Queries return correct data

---

## 🚨 Critical Notes

- **Schema changes are backward compatible** (optional fields)
- **No migration needed** - Convex handles optional fields automatically
- **Index is required** for efficient GitHub repo lookups
- **Verify RBAC** on all queries

---

## 📝 Expected Data Structure

Projects with GitHub repos should have:
```typescript
{
  githubRepo: "owner/repo-name",
  fullApiData: {
    // GitHub repo object
    branches: [...],
    issues: [...],
    pulls: [...],
    commits: [...],
    contributors: [...]
  }
}
```

---

**Start Here**: Read the detailed plan, then implement schema changes first.
