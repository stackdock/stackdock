# Projects UI Implementation - Frontend Agent Prompt

**Date**: November 16, 2025  
**Status**: Ready for Implementation  
**Priority**: High (MVP completion)  
**Agent**: Frontend Agent  
**Estimated Time**: 4-6 hours

---

## Overview

Complete the Projects feature UI to enable users to create, edit, and manage projects, and link infrastructure resources to projects. The backend is complete with full RBAC protection. This task focuses on building the frontend UI components and pages.

**Key Requirements**:
- ✅ Backend complete: All mutations/queries exist with RBAC
- ✅ Code page exists: `/dashboard/projects/code` with repositories table
- 🔄 **TODO**: Create/edit forms, project detail pages, resource linking UI

---

## Current State

### Existing Files
- ✅ `apps/web/src/routes/dashboard/projects/code.tsx` - Code page with repositories table
- ✅ `apps/web/src/components/projects/RepositoriesTable.tsx` - Repositories table component
- ✅ `convex/projects/mutations.ts` - Backend mutations (createProject, linkResource, unlinkResource)
- ✅ `convex/projects/queries.ts` - Backend queries (listProjects, getProject, getProjectResources)

### Navigation Structure
Projects is a top-level navigation item with:
- Code (`/dashboard/projects/code`) - ✅ Complete
- Future: Calendar, Content, Social (placeholders)

---

## Required Implementation

### Phase 1: Backend Mutation (Convex Agent - Quick Fix)

**File**: `convex/projects/mutations.ts`

**Task**: Add `updateProject` mutation

```typescript
/**
 * Update an existing project
 * 
 * Requires "projects:full" permission.
 */
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    clientId: v.optional(v.id("clients")),
    linearId: v.optional(v.string()),
    githubRepo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get project to verify org
    const project = await ctx.db.get(args.projectId)
    if (!project) {
      throw new ConvexError("Project not found")
    }

    // Verify user belongs to org and has projects:full permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      project.orgId,
      "projects:full"
    )
    if (!hasPermission) {
      throw new ConvexError(
        "Permission denied: Only organization owners can update projects"
      )
    }

    // Build update object (only include provided fields)
    const updates: any = {}
    if (args.name !== undefined) updates.name = args.name
    if (args.teamId !== undefined) updates.teamId = args.teamId
    if (args.clientId !== undefined) updates.clientId = args.clientId
    if (args.linearId !== undefined) updates.linearId = args.linearId
    if (args.githubRepo !== undefined) updates.githubRepo = args.githubRepo

    // Update project
    await ctx.db.patch(args.projectId, updates)

    return { success: true }
  },
})
```

**Estimated Time**: 15 minutes

---

### Phase 2: Create Project Page

**File**: `apps/web/src/routes/dashboard/projects/new.tsx` (NEW)

**Requirements**:
- Form with fields: name (required), team (select), client (select), linearId (optional), githubRepo (optional)
- Use existing form patterns from `apps/web/src/routes/dashboard/docks/add.tsx`
- Fetch teams and clients from Convex queries (need to check if these exist)
- Use `projects/mutations:createProject`
- Redirect to project detail page after creation
- Show loading states and error handling
- Use `toast` from `sonner` for success/error messages

**Form Fields**:
```typescript
interface ProjectFormData {
  name: string // Required
  teamId: Id<"teams"> // Required - select dropdown
  clientId: Id<"clients"> // Required - select dropdown
  linearId?: string // Optional
  githubRepo?: string // Optional - format: "owner/repo-name"
}
```

**API Calls**:
- `organizations/queries:getCurrentOrgId` - Get current org
- `teams/queries:listTeams` - Get teams (need to verify this exists)
- `clients/queries:listClients` - Get clients (need to verify this exists)
- `projects/mutations:createProject` - Create project

**UI Pattern**: Follow `apps/web/src/routes/dashboard/docks/add.tsx` pattern:
- Page header with title and description
- Form with shadcn/ui components (Input, Select, Label, Button)
- Loading states during submission
- Error handling with toast notifications
- Redirect on success

**Estimated Time**: 1-1.5 hours

---

### Phase 3: Project Detail Page

**File**: `apps/web/src/routes/dashboard/projects/[projectId]/index.tsx` (NEW)

**Requirements**:
- Display project information (name, team, client, linearId, githubRepo)
- Show linked resources in a table
- Actions: Edit project, Link resource, Unlink resource
- Use `projects/queries:getProject` and `projects/queries:getProjectResources`
- Handle loading and error states

**Layout**:
```
┌─────────────────────────────────────┐
│ Project Name                        │
│ [Edit] [Link Resource]              │
├─────────────────────────────────────┤
│ Details:                            │
│ - Team: [Team Name]                 │
│ - Client: [Client Name]             │
│ - Linear ID: [ID or None]           │
│ - GitHub Repo: [repo or None]       │
├─────────────────────────────────────┤
│ Linked Resources:                    │
│ [Table with resources]               │
│ - Server: [Name] [Status] [Unlink]  │
│ - Web Service: [Name] [Status] [...]│
│ - Domain: [Name] [Status] [...]     │
│ - Database: [Name] [Status] [...]    │
└─────────────────────────────────────┘
```

**Resource Table**:
- Columns: Type (badge), Name, Status (badge), Provider (badge), Actions (Unlink button)
- Use TanStack Table pattern (similar to existing resource tables)
- Filter by resource type (servers, webServices, domains, databases)
- Show empty state when no resources linked

**Actions**:
- **Edit**: Opens edit dialog/page
- **Link Resource**: Opens LinkResourceDialog
- **Unlink**: Confirmation dialog, then calls `projects/mutations:unlinkResource`

**API Calls**:
- `projects/queries:getProject` - Get project data
- `projects/queries:getProjectResources` - Get linked resources
- `projects/mutations:unlinkResource` - Unlink resource

**Estimated Time**: 2 hours

---

### Phase 4: Edit Project Page/Dialog

**File**: `apps/web/src/routes/dashboard/projects/[projectId]/edit.tsx` (NEW)  
**OR**  
**File**: `apps/web/src/components/projects/EditProjectDialog.tsx` (NEW)

**Decision**: Use dialog pattern (similar to DockSettingsDialog) for consistency.

**Requirements**:
- Pre-populate form with existing project data
- Same fields as create form
- Use `projects/mutations:updateProject` (needs to be created in Phase 1)
- Close dialog on success
- Show loading states and error handling

**Form Fields**: Same as create form, but pre-populated

**API Calls**:
- `projects/queries:getProject` - Load existing data
- `projects/mutations:updateProject` - Update project
- `teams/queries:listTeams` - Get teams
- `clients/queries:listClients` - Get clients

**UI Pattern**: Follow `apps/web/src/components/docks/dock-settings-dialog.tsx` pattern:
- Dialog component with form
- Pre-populate fields
- Submit button with loading state
- Close on success

**Estimated Time**: 1 hour

---

### Phase 5: Link Resource Dialog

**File**: `apps/web/src/components/projects/LinkResourceDialog.tsx` (NEW)

**Requirements**:
- Resource type selector (servers, webServices, domains, databases)
- Resource selector (filtered by type, shows available resources)
- Multi-select or single-select (start with single-select for MVP)
- Use `projects/mutations:linkResource`
- Show loading states and error handling
- Close dialog on success

**UI Flow**:
1. User clicks "Link Resource" button
2. Dialog opens
3. Select resource type (dropdown)
4. Select resource (dropdown, filtered by type and org)
5. Click "Link" button
6. Show loading state
7. On success: Close dialog, refresh project resources

**Resource Fetching**:
- `resources/queries:listServers` - For servers
- `resources/queries:listWebServices` - For web services
- `resources/queries:listDomains` - For domains
- `resources/queries:listDatabases` - For databases

**Filtering**:
- Only show resources from user's organization (already handled by queries)
- Exclude resources already linked to this project (filter in UI)

**API Calls**:
- `projects/queries:getProjectResources` - Get already-linked resources (to filter)
- `resources/queries:list*` - Get available resources
- `projects/mutations:linkResource` - Link resource

**UI Pattern**: Follow dialog pattern:
- Dialog component
- Two-step selection (type, then resource)
- Submit button with loading state
- Close on success

**Estimated Time**: 1.5-2 hours

---

## File Structure

```
apps/web/src/
├── routes/
│   └── dashboard/
│       └── projects/
│           ├── code.tsx (✅ exists)
│           ├── new.tsx (NEW)
│           └── [projectId]/
│               ├── index.tsx (NEW - detail page)
│               └── edit.tsx (NEW - or use dialog)
└── components/
    └── projects/
        ├── RepositoriesTable.tsx (✅ exists)
        ├── EditProjectDialog.tsx (NEW)
        └── LinkResourceDialog.tsx (NEW)
```

---

## UI Component Patterns

### Form Pattern (from docks/add.tsx)
```typescript
"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { useRouter } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function CreateProjectForm() {
  const router = useRouter()
  const createProject = useMutation(api["projects/mutations"].createProject)
  const orgId = useQuery(api["organizations/queries"].getCurrentOrgId)
  const teams = useQuery(api["teams/queries"].listTeams, orgId ? { orgId } : "skip")
  const clients = useQuery(api["clients/queries"].listClients, orgId ? { orgId } : "skip")
  
  const [name, setName] = useState("")
  const [teamId, setTeamId] = useState("")
  const [clientId, setClientId] = useState("")
  const [linearId, setLinearId] = useState("")
  const [githubRepo, setGithubRepo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId || !teamId || !clientId) return
    
    setIsSubmitting(true)
    try {
      const projectId = await createProject({
        orgId,
        teamId: teamId as Id<"teams">,
        clientId: clientId as Id<"clients">,
        name,
        linearId: linearId || undefined,
        githubRepo: githubRepo || undefined,
      })
      toast.success("Project created successfully")
      router.navigate({ to: "/dashboard/projects/$projectId", params: { projectId } })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
    </form>
  )
}
```

### Dialog Pattern (from dock-settings-dialog.tsx)
```typescript
"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function EditProjectDialog({ projectId, open, onOpenChange }: Props) {
  const project = useQuery(api["projects/queries"].getProject, { projectId })
  const updateProject = useMutation(api["projects/mutations"].updateProject)
  
  // Form state and handlers
  // Pre-populate from project data
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Form */}
      </DialogContent>
    </Dialog>
  )
}
```

### Table Pattern (from existing resource tables)
- Use TanStack Table
- Columns: Type, Name, Status, Provider, Actions
- Filter by resource type
- Actions column with Unlink button
- Empty state when no resources

---

## Required Queries (Verify Existence)

**Check if these queries exist, create if missing**:

1. `teams/queries:listTeams` - List teams for organization
2. `clients/queries:listClients` - List clients for organization

**If missing, create**:
```typescript
// convex/teams/queries.ts (if doesn't exist)
export const listTeams = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    // Verify user belongs to org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_org_user", (q) => q.eq("orgId", args.orgId).eq("userId", user._id))
      .first()
    if (!membership) {
      throw new ConvexError("Not authorized")
    }
    // Return teams
    return await ctx.db
      .query("teams")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect()
  },
})

// convex/clients/queries.ts (if doesn't exist)
export const listClients = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    // Verify user belongs to org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_org_user", (q) => q.eq("orgId", args.orgId).eq("userId", user._id))
      .first()
    if (!membership) {
      throw new ConvexError("Not authorized")
    }
    // Return clients
    return await ctx.db
      .query("clients")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect()
  },
})
```

---

## RBAC Considerations

**All mutations already have RBAC**:
- `createProject` - Requires `projects:full`
- `updateProject` - Requires `projects:full` (to be created)
- `linkResource` - Requires `projects:full`
- `unlinkResource` - Requires `projects:full`

**Frontend should**:
- Check permissions before showing create/edit buttons (use `useRBAC` hook if exists, or handle errors gracefully)
- Show error messages when permission denied
- Hide UI elements user can't access

---

## Testing Checklist

- [ ] Create project form validates required fields
- [ ] Create project redirects to detail page
- [ ] Project detail page loads and displays data
- [ ] Edit project dialog pre-populates fields
- [ ] Update project saves changes
- [ ] Link resource dialog filters by type
- [ ] Link resource excludes already-linked resources
- [ ] Link resource creates link successfully
- [ ] Unlink resource removes link
- [ ] All mutations show appropriate error messages
- [ ] Loading states work correctly
- [ ] Empty states display correctly

---

## Implementation Order

1. **Phase 1**: Add `updateProject` mutation (15 min)
2. **Phase 2**: Create project page (1-1.5 hours)
3. **Phase 3**: Project detail page (2 hours)
4. **Phase 4**: Edit project dialog (1 hour)
5. **Phase 5**: Link resource dialog (1.5-2 hours)

**Total Estimated Time**: 4-6 hours

---

## Notes

- Follow existing UI patterns (TanStack Table, shadcn/ui components)
- Use `toast` from `sonner` for notifications
- Handle loading and error states consistently
- Verify teams/clients queries exist before using
- All backend mutations have RBAC - handle permission errors gracefully
- Use TypeScript types from `convex/_generated/dataModel`

---

## Success Criteria

✅ Users can create projects  
✅ Users can edit projects  
✅ Users can view project details  
✅ Users can link resources to projects  
✅ Users can unlink resources from projects  
✅ All UI follows existing patterns  
✅ All mutations/queries work correctly  
✅ Error handling is comprehensive  
✅ Loading states are shown appropriately  

---

**Ready for implementation. Backend is complete. Focus on UI/UX.**

