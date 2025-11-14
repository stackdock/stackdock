# Frontend Agent - Quick Start Prompt

**Mission**: Projects Restructure - Frontend Implementation  
**Status**: Ready to Start (after Convex schema changes)  
**Created**: November 12, 2025

---

## 🎯 Your Task

Restructure Projects from nested Dashboard item to top-level navigation with Code sub-page displaying GitHub repos, branches, and issues.

---

## 📋 Detailed Plan

**Read**: `stand-downs/active/mission-7-projects-restructure-frontend-plan.md`

---

## ✅ Quick Checklist

1. **Update Navigation** (`apps/web/src/components/dashboard/sidebar-data.tsx`)
   - Remove Projects from Dashboard group
   - Add Projects as new top-level collapsible group
   - Add Code sub-item under Projects
   - Import `Code` icon from lucide-react

2. **Create Code Route** (`apps/web/src/routes/dashboard/projects/code.tsx`)
   - Create new route file
   - Query projects from Convex
   - Filter GitHub projects
   - Display repositories table

3. **Create Table Components**
   - `RepositoriesTable.tsx` - List GitHub repos
   - `BranchesTable.tsx` - Show branches for selected repo
   - `IssuesTable.tsx` - Show issues for selected repo

4. **Add Repo Selection**
   - Allow clicking repo to view branches/issues
   - Show selected state
   - Display branches and issues tables when repo selected

5. **Update Projects Index** (`apps/web/src/routes/dashboard/projects.tsx`)
   - Show projects overview or redirect to Code
   - Add future placeholder cards (commented)

---

## 🎨 Icons Needed

```typescript
import {
  Code,        // ✅ For Code sub-page
  GitBranch,   // ✅ For branches
  AlertCircle, // ✅ For issues
  // Future:
  // Calendar, CalendarDays, FileText, Users
} from "lucide-react"
```

---

## 📐 Navigation Structure

**Before**:
```
Dashboard ▼
├── Insights
└── Projects
```

**After**:
```
Dashboard ▼
└── Insights

Projects ▼
└── Code
```

---

## 🚨 Critical Notes

- **Wait for Convex schema changes** before querying `fullApiData`
- **Use TypeScript types** - `Doc<"projects">` from Convex
- **Handle empty states** - Show helpful messages when no data
- **External links** - Open GitHub links in new tab
- **Future placeholders** - Comment out Calendar/Content/Social for now

---

## 📝 Data Access Pattern

```typescript
const projects = useQuery(api.projects.list)
const githubProjects = projects?.filter(p => p.githubRepo) || []

// Access GitHub data:
const repo = project.fullApiData as any
const branches = repo?.branches || []
const issues = repo?.issues || []
```

---

**Start Here**: Read the detailed plan, then implement navigation changes first (can work in parallel with Convex after schema is done).
