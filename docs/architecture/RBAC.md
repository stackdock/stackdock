# RBAC Documentation

> Role-Based Access Control (RBAC) is the security foundation of StackDock. Every operation is permission-checked.

## Table of Contents

1. [Overview](#overview)
2. [Permission Model](#permission-model)
3. [RBAC Schema](#rbac-schema)
4. [Enforcement Architecture](#enforcement-architecture)
5. [Common Scenarios](#common-scenarios)
6. [API Reference](#api-reference)
7. [Opt-In Permission Behavior](#opt-in-permission-behavior)
8. [Testing RBAC](#testing-rbac)

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
    // Optional permissions (added over time, opt-in for existing roles)
    provisioning: v.optional(v.union(v.literal("full"), v.literal("read"), v.literal("none"))),
    monitoring: v.optional(v.union(v.literal("full"), v.literal("read"), v.literal("none"))),
  }),
}).index("by_orgId", ["orgId"])
```

**Note**: Optional permissions (`provisioning`, `monitoring`) are opt-in. Existing roles without these fields will be denied access to related features until explicitly updated. See [Opt-In Permission Behavior](#opt-in-permission-behavior) below.

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
export function withRBAC(permission: Permission) {
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

**Usage (Type-Safe)**:

```typescript
import { Permissions } from "../lib/rbac"

export const createProject = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
  },
  handler: withRBAC(Permissions.PROJECTS_FULL)(async (ctx, args, user) => {
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

**Usage (Backward Compatible)**:

```typescript
export const createProject = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
  },
  handler: withRBAC("projects:full")(async (ctx, args, user) => {
    // Still works with string literal
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
// src/components/auth/RequirePermission.tsx
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
  
  // Handle undefined permissions (e.g., "provisioning" may be undefined for old roles)
  if (rolePermission === undefined) {
    // Default behavior: if permission doesn't exist, deny access
    // This ensures new permissions (like "provisioning", "monitoring") are opt-in
    return false
  }
  
  if (rolePermission === "none") return false
  if (rolePermission === "full") return true
  if (rolePermission === "read" && level === "read") return true
  
  return false
}
```

**Important: Opt-In Permission Behavior**

When a permission field is `undefined` (not set in the role), `checkPermission` returns `false` (denies access). This is **intentional** and ensures backward compatibility:

- **New permissions** (like `provisioning`, `monitoring`) are added as optional fields
- **Existing roles** without these permissions will be denied access to new features
- **Users must explicitly update roles** to grant new permissions
- **New organizations** automatically get all permissions in the default Admin role

**Example**:
```typescript
// Old role (created before "monitoring" permission existed)
const oldRole = {
  permissions: {
    projects: "full",
    resources: "full",
    // monitoring is undefined
  }
}

// This will return false (denied)
checkPermission(ctx, userId, orgId, "monitoring:read") // false

// User must update role to include monitoring
const updatedRole = {
  permissions: {
    projects: "full",
    resources: "full",
    monitoring: "full", // Explicitly added
  }
}

// Now returns true (granted)
checkPermission(ctx, userId, orgId, "monitoring:read") // true
```

**Migration Path**:
1. New permission added to schema as optional
2. Existing roles continue to work (denied new features)
3. Admins can update roles to grant new permissions
4. New organizations get full permissions by default

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

## Opt-In Permission Behavior

### How Undefined Permissions Work

When a permission field is `undefined` in a role (not set), `checkPermission` returns `false` (denies access). This ensures **backward compatibility** when new permissions are added to the system.

### Why This Design?

1. **Backward Compatibility**: Existing roles continue to work without modification
2. **Security**: New features are denied by default (principle of least privilege)
3. **Explicit Opt-In**: Admins must consciously grant new permissions
4. **Migration Path**: Clear upgrade path for existing organizations

### Example: Adding "monitoring" Permission

**Before** (old role):
```typescript
{
  permissions: {
    projects: "full",
    resources: "full",
    // monitoring doesn't exist
  }
}

// User tries to access monitoring feature
checkPermission(ctx, userId, orgId, "monitoring:read") // false (denied)
```

**After** (updated role):
```typescript
{
  permissions: {
    projects: "full",
    resources: "full",
    monitoring: "full", // Explicitly added
  }
}

// User tries to access monitoring feature
checkPermission(ctx, userId, orgId, "monitoring:read") // true (granted)
```

### Migration Strategy

When adding a new optional permission:

1. **Add to Schema**: Add as `v.optional(...)` in `roles` table
2. **Update Default Roles**: New organizations get the permission in Admin role
3. **Document Behavior**: Explain opt-in behavior to users
4. **Provide Migration Script**: Optional script to update existing roles

**Example Migration Script**:
```typescript
// convex/migrations/addMonitoringPermission.ts
export const addMonitoringToAdminRoles = internalMutation({
  handler: async (ctx) => {
    const adminRoles = await ctx.db
      .query("roles")
      .filter(q => q.eq(q.field("name"), "Admin"))
      .collect()
    
    for (const role of adminRoles) {
      if (role.permissions.monitoring === undefined) {
        await ctx.db.patch(role._id, {
          permissions: {
            ...role.permissions,
            monitoring: "full",
          },
        })
      }
    }
  },
})
```

### Current Optional Permissions

- `provisioning`: Infrastructure provisioning features (optional)
- `monitoring`: Monitoring and alerting features (optional)

### Best Practices

1. **Always check for undefined**: Use `rolePermission === undefined` check
2. **Document new permissions**: Update this doc when adding permissions
3. **Provide migration path**: Give admins a way to update roles
4. **Default to deny**: Undefined = denied (secure by default)

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

## Type-Level Enforcement

### Type-Safe Permissions

StackDock uses **typed permissions** to prevent typos and enforce correct permission usage at compile time.

#### Permission Type

```typescript
// convex/lib/rbac.ts

/**
 * Resource types in the RBAC system
 */
export type RBACResource = 
  | "projects"
  | "resources"
  | "docks"
  | "operations"
  | "settings"
  | "provisioning"
  | "monitoring"

/**
 * Permission levels
 */
export type RBACLevel = "none" | "read" | "full"

/**
 * Permission string format: "resource:level"
 */
export type Permission = `${RBACResource}:${RBACLevel}`
```

#### Using Type-Safe Permissions

**1. With Permission constants (recommended)**:
```typescript
import { Permissions } from "../lib/rbac"

export const createDock = mutation({
  handler: withRBAC(Permissions.DOCKS_FULL)(async (ctx, args, user) => {
    // TypeScript ensures permission is valid
    // IDE provides autocomplete
  })
})
```

**2. With typed string literals**:
```typescript
const permission: Permission = "docks:full" // OK
const badPermission: Permission = "invalid:permission" // Type error!

export const createDock = mutation({
  handler: withRBAC(permission)(async (ctx, args, user) => {
    // ...
  })
})
```

**3. Backward compatible (untyped)**:
```typescript
// Still works with plain strings
export const createDock = mutation({
  handler: withRBAC("docks:full")(async (ctx, args, user) => {
    // ...
  })
})
```

#### Permission Constants

Use predefined constants for consistency and autocomplete:

```typescript
// convex/lib/rbac.ts
export const Permissions = {
  PROJECTS_FULL: "projects:full" as const,
  PROJECTS_READ: "projects:read" as const,
  
  RESOURCES_FULL: "resources:full" as const,
  RESOURCES_READ: "resources:read" as const,
  
  DOCKS_FULL: "docks:full" as const,
  DOCKS_READ: "docks:read" as const,
  
  OPERATIONS_FULL: "operations:full" as const,
  OPERATIONS_READ: "operations:read" as const,
  
  SETTINGS_FULL: "settings:full" as const,
  SETTINGS_READ: "settings:read" as const,
  
  PROVISIONING_FULL: "provisioning:full" as const,
  PROVISIONING_READ: "provisioning:read" as const,
  
  MONITORING_FULL: "monitoring:full" as const,
  MONITORING_READ: "monitoring:read" as const,
}
```

#### Benefits of Type Enforcement

1. **Autocomplete**: IDE suggests valid permission strings
2. **Compile-time errors**: Catch typos before runtime
3. **Refactoring**: Easy to find all usages of a permission
4. **Self-documenting**: Permission format is clear
5. **Type inference**: TypeScript infers permission type in functions

#### Example: Type Error Prevention

```typescript
// ❌ Type error: invalid permission
const badPermission: Permission = "doks:full" // Typo!

// ❌ Type error: invalid level
const badLevel: Permission = "docks:admin" // Not a valid level

// ✅ OK: valid permission
const goodPermission: Permission = "docks:full"

// ✅ OK: using constant
const bestPermission = Permissions.DOCKS_FULL
```

### How RBAC Must Be Used in Every Mutation

**Rule**: Every mutation that modifies organization data MUST use RBAC enforcement.

#### Step-by-Step Guide

**Step 1: Identify required permission**

Determine which permission is needed based on the resource being modified:

| Resource | Permission |
|----------|------------|
| Projects | `Permissions.PROJECTS_FULL` |
| Resources (servers, sites) | `Permissions.RESOURCES_FULL` |
| Docks | `Permissions.DOCKS_FULL` |
| Operations (backup/restore) | `Permissions.OPERATIONS_FULL` |
| Settings (org/team/role) | `Permissions.SETTINGS_FULL` |
| Provisioning | `Permissions.PROVISIONING_FULL` |
| Monitoring | `Permissions.MONITORING_FULL` |

**Step 2: Import RBAC utilities**

```typescript
import { getCurrentUser, checkPermission, withRBAC, Permissions } from "../lib/rbac"
```

**Step 3: Wrap mutation handler with withRBAC**

```typescript
export const createDock = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    provider: v.string(),
    apiKey: v.string(),
  },
  handler: withRBAC(Permissions.DOCKS_FULL)(async (ctx, args, user) => {
    // User is authenticated and authorized
    // Proceed with mutation logic
    
    const encrypted = await encryptApiKey(toPlaintextApiKey(args.apiKey))
    
    return await ctx.db.insert("docks", {
      orgId: args.orgId,
      name: args.name,
      provider: args.provider,
      encryptedApiKey: encrypted,
    })
  })
})
```

**Step 4: Manual RBAC check (if not using withRBAC)**

For complex mutations where `withRBAC` doesn't fit:

```typescript
export const complexMutation = mutation({
  args: {
    orgId: v.id("organizations"),
    // ...
  },
  handler: async (ctx, args) => {
    // Manual authentication
    const user = await getCurrentUser(ctx)
    
    // Manual authorization
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      args.orgId,
      Permissions.DOCKS_FULL
    )
    
    if (!hasPermission) {
      throw new ConvexError(`Permission denied: ${Permissions.DOCKS_FULL}`)
    }
    
    // Proceed with mutation logic
    // ...
  }
})
```

#### RBAC Enforcement Checklist

When adding a new mutation:

- [ ] Identify required permission level (read vs full)
- [ ] Import RBAC utilities (`withRBAC`, `Permissions`)
- [ ] Wrap handler with `withRBAC(permission)`
- [ ] Verify mutation requires `orgId` in args (for permission check)
- [ ] Test permission enforcement (unit test)
- [ ] Test permission denial (integration test)
- [ ] Document permission requirement in mutation docstring

#### Common Mistakes to Avoid

**❌ Forgetting RBAC check**:
```typescript
export const createDock = mutation({
  handler: async (ctx, args) => {
    // NO RBAC CHECK! Anyone can create docks!
    return await ctx.db.insert("docks", { ... })
  }
})
```

**❌ Using wrong permission**:
```typescript
export const deleteDock = mutation({
  handler: withRBAC(Permissions.DOCKS_READ)(async (ctx, args, user) => {
    // Using READ permission for DELETE operation!
    await ctx.db.delete(args.dockId)
  })
})
```

**❌ Skipping orgId validation**:
```typescript
export const getDock = query({
  handler: async (ctx, args) => {
    const dock = await ctx.db.get(args.dockId)
    // No check that user belongs to dock's org!
    return dock
  }
})
```

**✅ Correct implementation**:
```typescript
export const deleteDock = mutation({
  args: {
    dockId: v.id("docks"),
  },
  handler: async (ctx, args) => {
    // Get dock to access orgId
    const dock = await ctx.db.get(args.dockId)
    if (!dock) throw new ConvexError("Dock not found")
    
    // Check permission with dock's orgId
    const user = await getCurrentUser(ctx)
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      dock.orgId,
      Permissions.DOCKS_FULL
    )
    
    if (!hasPermission) {
      throw new ConvexError("Permission denied")
    }
    
    // Proceed with deletion
    await ctx.db.delete(args.dockId)
  }
})
```

### External Package: @stackdock/shared

For non-Convex code (CLI, web app, etc.), use the `@stackdock/shared` package:

```typescript
// Install
npm install @stackdock/shared

// Import
import {
  Permission,
  Permissions,
  isValidPermission,
  parsePermission,
} from '@stackdock/shared'

// Use
const permission: Permission = Permissions.DOCKS_FULL
if (isValidPermission(userInput)) {
  const { resource, level } = parsePermission(userInput as Permission)
}
```

---

## Best Practices

1. **Always use withRBAC** on mutations
2. **Use Permission type** for compile-time safety (use `Permissions` constants)
3. **Check permissions** in queries (data leakage prevention)
4. **Log RBAC decisions** (audit trail)
5. **Test permission boundaries** (unit + integration tests)
6. **Principle of least privilege** (default to minimal permissions)
7. **Separate concerns** (org role vs team role vs client role)
8. **Opt-in new permissions** (undefined = denied, ensures backward compatibility)
9. **Update existing roles** when adding new permissions (migration scripts)
10. **Document permission requirements** in mutation docstrings

---

**Questions?** See [SECURITY.md](./SECURITY.md) or contact dev@stackdock.dev
