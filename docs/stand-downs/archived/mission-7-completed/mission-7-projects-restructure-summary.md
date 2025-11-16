# Mission 7: Projects Restructure - Summary

**Mission**: Restructure Projects as Top-Level Navigation with Code Sub-Page  
**Status**: Ready for Implementation  
**Created**: November 12, 2025

---

## 🎯 Vision

Transform Projects from a simple nested item into a **scalable, multi-feature section** that can grow with the platform:

```
Projects ▼
├── Code (current focus - GitHub integration)
├── Calendar/Charts/Planner (future)
├── Content (future)
└── Social (future)
```

This structure allows Projects to become a comprehensive project management hub, similar to how Infrastructure handles compute/data/networking.

---

## 📋 Agent Plans

### Convex Agent Plan
**File**: `stand-downs/active/mission-7-projects-restructure-convex-plan.md`

**Focus**: Backend data structure and queries
- ✅ Update projects schema (`fullApiData`, `by_githubRepo` index)
- ✅ Verify GitHub adapter integration
- ✅ Create/update projects queries
- ✅ Ensure data structure supports frontend needs

**Status**: Ready for implementation  
**Blocks Frontend**: Yes - Schema changes needed first  
**Estimated Time**: 1-2 hours

---

### Frontend Agent Plan
**File**: `stand-downs/active/mission-7-projects-restructure-frontend-plan.md`

**Focus**: Navigation and UI
- ✅ Restructure navigation (Projects → top-level)
- ✅ Create Code route (`/dashboard/projects/code`)
- ✅ Create table components (Repositories, Branches, Issues)
- ✅ Add repo selection functionality
- ✅ Future placeholders (Calendar, Content, Social)

**Status**: Ready for implementation  
**Blocks**: None (can work in parallel after schema changes)  
**Estimated Time**: 3-4 hours

---

## 🔄 Implementation Order

1. **Convex Agent** (first)
   - Update schema
   - Verify GitHub adapter
   - Test queries

2. **Frontend Agent** (after schema)
   - Restructure navigation
   - Create routes and components
   - Test UI

---

## 📐 Navigation Structure

### Before
```
Dashboard ▼
├── Insights
└── Projects
```

### After
```
Dashboard ▼
└── Insights

Projects ▼
└── Code

Infrastructure ▼
├── Compute
├── Data
└── Networking

Operations ▼
├── Backups
└── Workflows

Settings ▼
├── Organization
├── User
├── Theme
└── Docks
```

---

## 🗂️ Route Structure

```
/dashboard/projects              → Projects overview (or redirect to Code)
/dashboard/projects/code          → Code page (repos, branches, issues)
/dashboard/projects/calendar      → Future
/dashboard/projects/content       → Future
/dashboard/projects/social        → Future
```

---

## 📊 Data Structure

### Projects Table
```typescript
{
  _id: Id<"projects">,
  orgId: Id<"organizations">,
  teamId: Id<"teams">,
  clientId: Id<"clients">,
  name: string,
  githubRepo?: string, // Format: "owner/repo-name"
  fullApiData?: {
    // GitHub repository data
    id: number,
    name: string,
    full_name: string,
    description: string,
    html_url: string,
    language: string,
    // Nested arrays
    branches?: Array<{...}>,
    issues?: Array<{...}>,
    pulls?: Array<{...}>,
    commits?: Array<{...}>,
    contributors?: Array<{...}>
  }
}
```

---

## ✅ Success Criteria

### Convex Agent
- [ ] Schema updated with `fullApiData` and `by_githubRepo` index
- [ ] GitHub adapter populates projects correctly
- [ ] Projects queries work (list, getByGitHubRepo, getById)
- [ ] Data structure matches expected format

### Frontend Agent
- [ ] Navigation restructured (Projects top-level)
- [ ] Code route created and working
- [ ] Tables display GitHub data correctly
- [ ] Repo selection works
- [ ] Future placeholders added

---

## 🚀 Next Steps

1. **Convex Agent**: Start with schema changes
2. **Frontend Agent**: Wait for schema, then implement navigation/UI
3. **Testing**: Both agents test their changes
4. **Integration**: Verify end-to-end flow

---

## 📝 Notes

- **Scalability**: Structure supports easy addition of new sub-pages
- **Backward Compatibility**: Existing projects work fine (optional fields)
- **Future**: Calendar, Content, Social can be added incrementally
- **Performance**: Consider pagination for large repos

---

**Ready for Implementation**: ✅  
**Total Estimated Time**: 4-6 hours (both agents)
