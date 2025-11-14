# Mission 7: Projects Restructure - Frontend Agent Plan

**Mission**: Restructure Projects as Top-Level Navigation with Code Sub-Page  
**Status**: Ready for Implementation  
**Created**: November 12, 2025  
**Agent**: Frontend Agent

---

## 🎯 Objective

Restructure Projects from a nested Dashboard item to its own top-level collapsible navigation section with:
- **Code** (current focus - GitHub integration with repos, branches, issues tables)
- **Calendar/Charts/Planner** (future - placeholder)
- **Content** (future - placeholder)
- **Social** (future - placeholder)

---

## 📋 Current State

### Navigation Structure
**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

**Current** (Projects nested under Dashboard):
```typescript
{
  title: "Dashboard",
  icon: LayoutDashboard,
  items: [
    { title: "Insights", url: "/dashboard", icon: LayoutDashboard },
    { title: "Projects", url: "/dashboard/projects", icon: FolderKanban },
  ],
}
```

**Desired** (Projects as top-level):
```typescript
// Dashboard (only Insights)
{
  title: "Dashboard",
  icon: LayoutDashboard,
  items: [
    { title: "Insights", url: "/dashboard", icon: LayoutDashboard },
  ],
}

// Projects (new top-level)
{
  title: "Projects",
  icon: FolderKanban,
  items: [
    { title: "Code", url: "/dashboard/projects/code", icon: Code },
    // Future: Calendar, Content, Social
  ],
}
```

### Current Routes
- `/dashboard/projects` - Simple projects list page (placeholder)

### Required Routes
- `/dashboard/projects` - Projects list/overview (redirects to Code or shows list)
- `/dashboard/projects/code` - Code page with GitHub repos, branches, issues tables

---

## ✅ Required Changes

### Step 1: Update Navigation Structure

**File**: `apps/web/src/components/dashboard/sidebar-data.tsx`

**Action**: 
1. Remove Projects from Dashboard group
2. Add Projects as new top-level collapsible group
3. Add Code sub-item under Projects
4. Import new icons

**Changes**:

```typescript
import {
  LayoutDashboard,
  FolderKanban,
  Server,
  Database,
  HardDrive,
  Network,
  Workflow,
  Settings,
  Building2,
  User,
  Palette,
  Plug,
  Code, // ✅ ADD - for Code sub-page
  // Future icons:
  // Calendar, // for Calendar/Planner
  // FileText, // for Content
  // Users, // for Social
} from "lucide-react"
```

**Update navGroups**:

```typescript
navGroups: [
  {
    title: "",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        items: [
          {
            title: "Insights",
            url: "/dashboard",
            icon: LayoutDashboard,
          },
          // ❌ REMOVE Projects from here
        ],
      },
    ],
  },
  {
    title: "",
    items: [
      {
        title: "Projects", // ✅ NEW - Top-level collapsible
        icon: FolderKanban,
        items: [
          {
            title: "Code",
            url: "/dashboard/projects/code",
            icon: Code,
          },
          // Future placeholders (commented out for now):
          // {
          //   title: "Calendar",
          //   url: "/dashboard/projects/calendar",
          //   icon: Calendar,
          // },
          // {
          //   title: "Content",
          //   url: "/dashboard/projects/content",
          //   icon: FileText,
          // },
          // {
          //   title: "Social",
          //   url: "/dashboard/projects/social",
          //   icon: Users,
          // },
        ],
      },
    ],
  },
  // ... rest of navigation (Infrastructure, Operations, Settings)
]
```

**Update both**:
- `useSidebarData()` function (lines ~54-163)
- `sidebarData` static export (lines ~166-280)

**Verification**:
- [ ] Navigation shows Projects as top-level collapsible
- [ ] Dashboard only shows Insights
- [ ] Projects expands to show Code sub-item
- [ ] Code link navigates correctly

---

### Step 2: Create Projects Code Route

**File**: `apps/web/src/routes/dashboard/projects/code.tsx` (create new)

**Action**: Create the Code page with tables for GitHub repositories, branches, and issues.

**Structure**:
```typescript
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Code, GitBranch, AlertCircle } from "lucide-react"
// Import table components (create if needed)

export const Route = createFileRoute("/dashboard/projects/code")({
  component: ProjectsCodePage,
})

function ProjectsCodePage() {
  // Query projects with GitHub repos
  const projects = useQuery(api.projects.list)
  
  // Filter projects that have GitHub repos
  const githubProjects = projects?.filter(p => p.githubRepo) || []
  
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Code
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Manage your GitHub repositories, branches, and issues.
        </p>
      </div>
      
      {/* Repositories Table */}
      <div className="rounded-lg border border-border bg-card p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Code className="h-5 w-5" />
          Repositories
        </h2>
        <RepositoriesTable projects={githubProjects} />
      </div>
      
      {/* Branches Table (for selected repo) */}
      {/* Issues Table (for selected repo) */}
    </main>
  )
}
```

**Verification**:
- [ ] Route compiles without errors
- [ ] Page loads at `/dashboard/projects/code`
- [ ] Projects data loads from Convex
- [ ] GitHub projects are filtered correctly

---

### Step 3: Create Table Components

**Files**: 
- `apps/web/src/components/projects/RepositoriesTable.tsx` (create new)
- `apps/web/src/components/projects/BranchesTable.tsx` (create new)
- `apps/web/src/components/projects/IssuesTable.tsx` (create new)

**Action**: Create reusable table components for displaying GitHub data.

#### RepositoriesTable Component

**File**: `apps/web/src/components/projects/RepositoriesTable.tsx`

```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import type { Doc } from "convex/_generated/dataModel"

interface RepositoriesTableProps {
  projects: Doc<"projects">[]
}

export function RepositoriesTable({ projects }: RepositoriesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Repository</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Language</TableHead>
          <TableHead>Branches</TableHead>
          <TableHead>Issues</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => {
          const repo = project.fullApiData as any
          const branches = repo?.branches || []
          const issues = repo?.issues || []
          
          return (
            <TableRow key={project._id}>
              <TableCell className="font-medium">
                {repo?.full_name || project.name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {repo?.description || "—"}
              </TableCell>
              <TableCell>
                {repo?.language ? (
                  <Badge variant="outline">{repo.language}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{branches.length}</TableCell>
              <TableCell>{issues.length}</TableCell>
              <TableCell>
                {repo?.updated_at
                  ? new Date(repo.updated_at).toLocaleDateString()
                  : "—"}
              </TableCell>
              <TableCell>
                {repo?.html_url && (
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
```

#### BranchesTable Component

**File**: `apps/web/src/components/projects/BranchesTable.tsx`

```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { GitBranch, Lock } from "lucide-react"

interface BranchesTableProps {
  branches: Array<{
    name: string
    commit: { sha: string; url: string }
    protected?: boolean
  }>
}

export function BranchesTable({ branches }: BranchesTableProps) {
  if (branches.length === 0) {
    return <p className="text-muted-foreground text-sm">No branches found.</p>
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Branch</TableHead>
          <TableHead>Commit</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {branches.map((branch) => (
          <TableRow key={branch.name}>
            <TableCell className="font-medium flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              {branch.name}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {branch.commit.sha.substring(0, 7)}
            </TableCell>
            <TableCell>
              {branch.protected && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Protected
                </Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

#### IssuesTable Component

**File**: `apps/web/src/components/projects/IssuesTable.tsx`

```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ExternalLink } from "lucide-react"

interface IssuesTableProps {
  issues: Array<{
    number: number
    title: string
    state: "open" | "closed"
    html_url: string
    labels?: Array<{ name: string; color: string }>
  }>
}

export function IssuesTable({ issues }: IssuesTableProps) {
  if (issues.length === 0) {
    return <p className="text-muted-foreground text-sm">No issues found.</p>
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Labels</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map((issue) => (
          <TableRow key={issue.number}>
            <TableCell className="font-medium">#{issue.number}</TableCell>
            <TableCell className="font-medium">{issue.title}</TableCell>
            <TableCell>
              <Badge variant={issue.state === "open" ? "default" : "secondary"}>
                {issue.state}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1 flex-wrap">
                {issue.labels?.map((label) => (
                  <Badge
                    key={label.name}
                    variant="outline"
                    style={{ borderColor: `#${label.color}` }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <a
                href={issue.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

**Verification**:
- [ ] Tables render correctly
- [ ] Data displays from `fullApiData`
- [ ] Links work (external GitHub links)
- [ ] Empty states show when no data

---

### Step 4: Update Projects Index Route

**File**: `apps/web/src/routes/dashboard/projects.tsx`

**Action**: Update to redirect to Code or show projects overview.

**Options**:

**Option A**: Redirect to Code (simpler)
```typescript
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/projects")({
  beforeLoad: () => {
    throw redirect({
      to: "/dashboard/projects/code",
    })
  },
})
```

**Option B**: Show projects overview (more flexible)
```typescript
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Link } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/projects")({
  component: ProjectsPage,
})

function ProjectsPage() {
  const projects = useQuery(api.projects.list)
  
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Projects
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Manage your projects across all platforms.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/dashboard/projects/code"
          className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors"
        >
          <h2 className="font-semibold mb-2">Code</h2>
          <p className="text-sm text-muted-foreground">
            GitHub repositories, branches, and issues
          </p>
        </Link>
        {/* Future: Calendar, Content, Social cards */}
      </div>
    </main>
  )
}
```

**Recommendation**: Use Option B for better UX and future extensibility.

**Verification**:
- [ ] Route works correctly
- [ ] Navigation flows properly
- [ ] Links work

---

### Step 5: Enhance Code Page with Repo Selection

**File**: `apps/web/src/routes/dashboard/projects/code.tsx` (update)

**Action**: Add ability to select a repository and view its branches/issues.

**Enhancement**:
```typescript
import { useState } from "react"

function ProjectsCodePage() {
  const projects = useQuery(api.projects.list)
  const githubProjects = projects?.filter(p => p.githubRepo) || []
  
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null)
  
  const selectedProject = githubProjects.find(p => p._id === selectedRepo)
  const repo = selectedProject?.fullApiData as any
  const branches = repo?.branches || []
  const issues = repo?.issues || []
  
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      {/* ... header ... */}
      
      {/* Repositories Table */}
      <RepositoriesTable 
        projects={githubProjects}
        onSelectRepo={(projectId) => setSelectedRepo(projectId)}
        selectedRepo={selectedRepo}
      />
      
      {/* Branches and Issues (shown when repo selected) */}
      {selectedRepo && (
        <>
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Branches
            </h2>
            <BranchesTable branches={branches} />
          </div>
          
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Issues
            </h2>
            <IssuesTable issues={issues} />
          </div>
        </>
      )}
    </main>
  )
}
```

**Update RepositoriesTable** to support selection:
```typescript
interface RepositoriesTableProps {
  projects: Doc<"projects">[]
  onSelectRepo?: (projectId: string) => void
  selectedRepo?: string | null
}

// Add onClick to TableRow:
<TableRow 
  key={project._id}
  onClick={() => onSelectRepo?.(project._id)}
  className={selectedRepo === project._id ? "bg-accent" : "cursor-pointer"}
>
```

**Verification**:
- [ ] Repo selection works
- [ ] Branches table shows when repo selected
- [ ] Issues table shows when repo selected
- [ ] Visual feedback for selected repo

---

## 🎨 Design Considerations

### Icons
- **Projects (parent)**: `FolderKanban` ✅
- **Code**: `Code` ✅
- **Calendar** (future): `Calendar` or `CalendarDays`
- **Content** (future): `FileText` or `FileCode`
- **Social** (future): `Users` or `MessageCircle`

### Layout
- Use consistent spacing (`gap-4`, `p-4 md:p-6 lg:p-8`)
- Tables should be responsive
- Empty states should be clear and helpful

### Future Placeholders
- Comment out future navigation items (don't create routes yet)
- Add TODO comments for future implementation
- Keep structure scalable

---

## 🧪 Testing Checklist

### Navigation
- [ ] Projects appears as top-level collapsible item
- [ ] Dashboard only shows Insights
- [ ] Projects expands to show Code
- [ ] Code link navigates to `/dashboard/projects/code`
- [ ] Navigation highlights active route

### Routes
- [ ] `/dashboard/projects` loads correctly
- [ ] `/dashboard/projects/code` loads correctly
- [ ] Routes compile without errors

### Data Display
- [ ] Projects load from Convex
- [ ] GitHub projects are filtered correctly
- [ ] Repositories table displays data
- [ ] Branches table displays when repo selected
- [ ] Issues table displays when repo selected
- [ ] Empty states show when no data

### Interactions
- [ ] Repo selection works
- [ ] External links open correctly
- [ ] Tables are responsive
- [ ] Loading states work

---

## 📝 Notes

### Future Enhancements
1. **Calendar/Planner**: Add calendar view, task management
2. **Content**: Add content management, blog posts, docs
3. **Social**: Add social media integration, posts, analytics

### Scalability
- Navigation structure supports easy addition of new sub-pages
- Table components are reusable
- Data structure (`fullApiData`) is flexible

### Performance
- Consider pagination for large repos
- Lazy load branches/issues when repo selected
- Cache GitHub data appropriately

---

## ✅ Completion Criteria

- [ ] Navigation restructured (Projects top-level)
- [ ] Code route created (`/dashboard/projects/code`)
- [ ] Table components created (Repositories, Branches, Issues)
- [ ] Data displays from Convex
- [ ] Repo selection works
- [ ] All routes compile and work
- [ ] Navigation highlights correctly
- [ ] Future placeholders added (commented)

---

**Ready for Implementation**: ✅  
**Blocks**: None (can work in parallel with Convex agent)  
**Estimated Time**: 3-4 hours
