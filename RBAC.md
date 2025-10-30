# RBAC Documentation

> Role-Based Access Control (RBAC) is the security foundation of StackDock. Every operation is permission-checked.

## Table of Contents

1. [Overview](#overview)
2. [Permission Model](#permission-model)
3. [RBAC Schema](#rbac-schema)
4. [Enforcement Architecture](#enforcement-architecture)
5. [Common Scenarios](#common-scenarios)
6. [API Reference](#api-reference)
7. [Testing RBAC](#testing-rbac)

---

## Overview

### What is RBAC?

**Role-Based Access Control** assigns permissions to roles, and roles to users.

```
User → Role → Permissions → Resources
```

**Example**:
```
Alice (user)
  → Developer (role)
    → projects:full, resources:read (permissions)
      → Can create projects, view servers (actions)
```

### Why RBAC?

1. **Security**: Principle of least privilege
2. **Scalability**: Add users without custom permissions
3. **Flexibility**: Change role permissions without touching users
4. **Auditability**: Know who can do what
5. **Compliance**: Meet regulatory requirements

---

## Permission Model

### Permission Format

```
<resource>:<level>
```

**Resources**:
- `projects`: Project management
- `resources`: Infrastructure (servers, sites, domains)
- `docks`: Provider connections
- `operations`: Backup/restore operations
- `settings`: Organization/team/role management

**Levels**:
- `none`: No access
- `read`: View only
- `full`: Read + write (create, update, delete)

### Permission Matrix

| Role | Projects | Resources | Docks | Operations | Settings |
|------|----------|-----------|-------|------------|----------|
| **Owner** | full | full | full | full | full |
| **Admin** | full | full | full | full | full |
| **Developer** | full | read | none | read | none |
| **Support** | read | read | none | read | none |
| **Client** | read | read | none | none | none |

### Hierarchical Permissions

```
full > read > none
```

**Examples**:
- User with `projects:full` can do everything (create, edit, delete, view)
- User with `projects:read` can only view
- User with `projects:none` cannot access projects at all

---

## RBAC Schema

### Core Tables

#### organizations

```typescript
organizations: defineTable({
  name: v.string(),
  ownerId: v.id("users"),
})
```

**The top-level tenant**. All resources belong to an organization.

#### users

```typescript
users: defineTable({
  name: v.string(),
  email: v.string(),
  clerkId: v.string(),
  defaultOrgId: v.optional(v.id("organizations")),
}).index("by_clerkId", ["clerkId"])
```

**People who can log in**. Synced from Clerk via webhook.

#### memberships

```typescript
memberships: defineTable({
  orgId: v.id("organizations"),
  userId: v.id("users"),
  orgRole: v.string(),              // Changed to roleId in implementation
}).index("by_orgId", ["orgId"])
  .index("by_userId", ["userId"])
  .index("by_org_user", ["orgId", "userId"])
```

**Links users to organizations** with a role.

#### roles

```typescript
roles: defineTable({
  orgId: v.id("organizations"),
  name: v.string(),                 // "Admin", "Developer", "Client"
  permissions: v.object({
    projects: v.union(v.literal("full"), v.literal("read"), v.literal("none")),
    resources: v.union(v.literal("full"), v.literal("read"), v.literal("none")),
    docks: v.union(v.literal("full"), v.literal("read"), v.literal("none")),
    operations: v.union(v.literal("full"), v.literal("read"), v.literal("none")),
    settings: v.union(v.literal("full"), v.literal("read"), v.literal("none")),
  }),
}).index("by_orgId", ["orgId"])
```

**Permission sets** that can be assigned to users.

#### teams

```typescript
teams: defineTable({
  orgId: v.id("organizations"),
  name: v.string(),                 // "Dev Team Alpha", "Support Team"
}).index("by_orgId", ["orgId"])
```

**Groups within an organization**. Users can belong to multiple teams.

#### teamMemberships

```typescript
teamMemberships: defineTable({
  orgId: v.id("organizations"),
  teamId: v.id("teams"),
  userId: v.id("users"),
  roleId: v.id("roles"),
}).index("by_teamId", ["teamId"])
  .index("by_userId", ["userId"])
  .index("by_team_user", ["teamId", "userId"])
```

**Links users to teams** with a role (can be different from org role).

#### clients

```typescript
clients: defineTable({
  orgId: v.id("organizations"),
  name: v.string(),                 // "Client A Inc."
}).index("by_orgId", ["orgId"])
```

**External groups** (for agencies managing client infrastructure).

#### clientMemberships

```typescript
clientMemberships: defineTable({
  orgId: v.id("organizations"),
  clientId: v.id("clients"),
  userId: v.id("users"),
  roleId: v.id("roles"),
}).index("by_clientId", ["clientId"])
  .index("by_userId", ["userId"])
```

**Links users to clients** with a role (usually read-only).

---

## Enforcement Architecture

### Three Layers of Enforcement

```
1. Convex Middleware (Backend)
   └─> RBAC checks on every mutation/query

2. React Hooks (Frontend)
   └─> Conditionally render UI elements

3. Client-Side Guards (Frontend)
   └─> Redirect unauthorized users
```

**Critical**: Only Layer 1 is security. Layers 2-3 are UX.

### Layer 1: Convex Middleware

**The withRBAC Function**:

```typescript
// convex/lib/rbac.ts
export function withRBAC(permission: string) {
  return (handler: any) => async (ctx: MutationCtx, args: any) => {
    // 1. Authenticate: Get current user
    const user = await getCurrentUser(ctx)
    if (!user) throw new ConvexError("Not authenticated")
    
    // 2. Authorize: Check permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      args.orgId,
      permission
    )
    
    if (!hasPermission) {
      await auditLog(ctx, "rbac.deny", "error", { permission, userId: user._id })
      throw new ConvexError(`Permission denied: ${permission}`)
    }
    
    // 3. Log success
    await auditLog(ctx, "rbac.grant", "success", { permission })
    
    // 4. Execute handler
    return handler(ctx, args, user)
  }
}
```

**Usage**:

```typescript
export const createProject = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
  },
  handler: withRBAC("projects:full")(async (ctx, args, user) => {
    // User has been validated
    // Permission has been checked
    // Safe to proceed
    
    return await ctx.db.insert("projects", {
      orgId: args.orgId,
      name: args.name,
      createdBy: user._id,
    })
  }),
})
```

### Layer 2: React Hooks

**useRBAC Hook**:

```typescript
// app/hooks/useRBAC.ts
import { useQuery } from 'convex/react'
import { useOrganization } from '@clerk/tanstack-start'
import { api } from '../../convex/_generated/api'

export function useRBAC() {
  const { organization } = useOrganization()
  const role = useQuery(
    api.roles.getMyRole,
    organization ? { orgId: organization.id } : "skip"
  )
  
  return {
    hasPermission: (permission: string) => {
      if (!role) return false
      
      const [resource, level] = permission.split(":") as [string, "read" | "full"]
      const rolePermission = role.permissions[resource]
      
      if (rolePermission === "none") return false
      if (rolePermission === "full") return true
      if (rolePermission === "read" && level === "read") return true
      
      return false
    },
    role,
    isLoading: role === undefined,
  }
}
```

**Usage**:

```typescript
export function CreateProjectButton() {
  const { hasPermission } = useRBAC()
  
  if (!hasPermission("projects:full")) {
    return null // Hide button
  }
  
  return <Button onClick={createProject}>Create Project</Button>
}
```

### Layer 3: Client-Side Guards

**RequirePermission Component**:

```typescript
// app/components/auth/RequirePermission.tsx
import { ReactNode } from 'react'
import { useRBAC } from '../../hooks/useRBAC'

export function RequirePermission({
  permission,
  children,
  fallback = null,
}: {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { hasPermission } = useRBAC()
  
  return hasPermission(permission) ? children : fallback
}
```

**Usage**:

```typescript
<RequirePermission permission="docks:full">
  <ConnectDockButton />
</RequirePermission>
```

---

## Common Scenarios

### Scenario 1: New User Joins Organization

```typescript
export const inviteUser = mutation({
  args: {
    orgId: v.id("organizations"),
    email: v.string(),
    roleId: v.id("roles"),
  },
  handler: withRBAC("settings:full")(async (ctx, args, inviter) => {
    // 1. Create user (or get existing)
    let user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), args.email))
      .first()
    
    if (!user) {
      user = await ctx.db.insert("users", {
        email: args.email,
        name: "",
        clerkId: "", // Will be set by Clerk webhook
      })
    }
    
    // 2. Add to organization
    await ctx.db.insert("memberships", {
      orgId: args.orgId,
      userId: user._id,
      orgRole: args.roleId,
    })
    
    // 3. Send invitation email (Clerk)
    // ...
    
    await auditLog(ctx, "user.invite", "success", {
      invitedUserId: user._id,
      roleId: args.roleId,
    })
  }),
})
```

### Scenario 2: User Accesses Resource

```typescript
export const getServer = query({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    // 1. Get server
    const server = await ctx.db.get(args.serverId)
    if (!server) throw new ConvexError("Server not found")
    
    // 2. Get current user
    const user = await getCurrentUser(ctx)
    
    // 3. Check user has access to org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_org_user", q =>
        q.eq("orgId", server.orgId).eq("userId", user._id)
      )
      .first()
    
    if (!membership) {
      throw new ConvexError("No access to server")
    }
    
    // 4. Check permission level
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      server.orgId,
      "resources:read"
    )
    
    if (!hasPermission) {
      throw new ConvexError("Permission denied")
    }
    
    // 5. Return server
    return server
  },
})
```

### Scenario 3: Client Portal Access

```typescript
export const listClientResources = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // 1. Verify user is member of client
    const clientMembership = await ctx.db
      .query("clientMemberships")
      .withIndex("by_clientId", q => q.eq("clientId", args.clientId))
      .filter(q => q.eq(q.field("userId"), user._id))
      .first()
    
    if (!clientMembership) {
      throw new ConvexError("Not a member of this client")
    }
    
    // 2. Get docks accessible to client
    const dockPermissions = await ctx.db
      .query("dockPermissions")
      .withIndex("by_clientId", q => q.eq("clientId", args.clientId))
      .collect()
    
    const dockIds = dockPermissions.map(p => p.dockId)
    
    // 3. Get resources from those docks
    const resources = []
    
    for (const dockId of dockIds) {
      const servers = await ctx.db
        .query("servers")
        .withIndex("by_dockId", q => q.eq("dockId", dockId))
        .collect()
      
      const webServices = await ctx.db
        .query("webServices")
        .withIndex("by_dockId", q => q.eq("dockId", dockId))
        .collect()
      
      resources.push(...servers, ...webServices)
    }
    
    return resources
  },
})
```

### Scenario 4: Team-Scoped Access

```typescript
export const listTeamProjects = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // 1. Verify user is member of team
    const teamMembership = await ctx.db
      .query("teamMemberships")
      .withIndex("by_team_user", q =>
        q.eq("teamId", args.teamId).eq("userId", user._id)
      )
      .first()
    
    if (!teamMembership) {
      throw new ConvexError("Not a member of this team")
    }
    
    // 2. Check permission (team role)
    const role = await ctx.db.get(teamMembership.roleId)
    
    if (role.permissions.projects === "none") {
      throw new ConvexError("No access to projects")
    }
    
    // 3. Get team's projects
    return await ctx.db
      .query("projects")
      .withIndex("by_teamId", q => q.eq("teamId", args.teamId))
      .collect()
  },
})
```

---

## API Reference

### getCurrentUser

**Get the authenticated user**:

```typescript
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError("Not authenticated")
  
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
    .first()
  
  if (!user) throw new ConvexError("User not found")
  return user
}
```

### checkPermission

**Check if user has permission**:

```typescript
export async function checkPermission(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">,
  permission: string
): Promise<boolean> {
  // 1. Get user's membership
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_org_user", q => q.eq("orgId", orgId).eq("userId", userId))
    .first()
  
  if (!membership) return false
  
  // 2. Get role
  const role = await ctx.db.get(membership.orgRole as Id<"roles">)
  if (!role) return false
  
  // 3. Check permission
  const [resource, level] = permission.split(":") as [string, "read" | "full"]
  const rolePermission = role.permissions[resource]
  
  if (rolePermission === "none") return false
  if (rolePermission === "full") return true
  if (rolePermission === "read" && level === "read") return true
  
  return false
}
```

### withRBAC

**Middleware for mutations/queries**:

```typescript
export function withRBAC(permission: string) {
  return (handler: any) => async (ctx: MutationCtx, args: any) => {
    const user = await getCurrentUser(ctx)
    const hasPermission = await checkPermission(ctx, user._id, args.orgId, permission)
    
    if (!hasPermission) {
      throw new ConvexError(`Permission denied: ${permission}`)
    }
    
    return handler(ctx, args, user)
  }
}
```

### useRBAC

**React hook for permission checks**:

```typescript
export function useRBAC() {
  const { organization } = useOrganization()
  const role = useQuery(api.roles.getMyRole, { orgId: organization?.id })
  
  return {
    hasPermission: (permission: string) => { /* ... */ },
    role,
    isLoading: role === undefined,
  }
}
```

---

## Testing RBAC

### Unit Tests

```typescript
describe('RBAC', () => {
  it('grants permission when user has role', async () => {
    const user = await createTestUser()
    const org = await createTestOrg()
    const role = await createRole(org._id, { projects: "full" })
    await addMembership(user._id, org._id, role._id)
    
    const result = await checkPermission(ctx, user._id, org._id, "projects:full")
    expect(result).toBe(true)
  })
  
  it('denies permission when user lacks role', async () => {
    const user = await createTestUser()
    const org = await createTestOrg()
    const role = await createRole(org._id, { projects: "read" })
    await addMembership(user._id, org._id, role._id)
    
    const result = await checkPermission(ctx, user._id, org._id, "projects:full")
    expect(result).toBe(false)
  })
})
```

### Integration Tests

```typescript
describe('Project Creation', () => {
  it('allows users with projects:full', async () => {
    const { user, org, role } = await setupUser({ projects: "full" })
    
    const projectId = await ctx.mutation(api.projects.create, {
      orgId: org._id,
      name: "Test Project",
    })
    
    expect(projectId).toBeDefined()
  })
  
  it('denies users with projects:read', async () => {
    const { user, org, role } = await setupUser({ projects: "read" })
    
    await expect(
      ctx.mutation(api.projects.create, {
        orgId: org._id,
        name: "Test Project",
      })
    ).rejects.toThrow("Permission denied")
  })
})
```

---

## Best Practices

1. **Always use withRBAC** on mutations
2. **Check permissions** in queries (data leakage prevention)
3. **Log RBAC decisions** (audit trail)
4. **Test permission boundaries** (unit + integration tests)
5. **Principle of least privilege** (default to minimal permissions)
6. **Separate concerns** (org role vs team role vs client role)

---

**Questions?** See [SECURITY.md](./SECURITY.md) or contact dev@stackdock.dev
