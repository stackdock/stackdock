# GitHub Adapter Implementation Plan

**Mission**: Mission 7 Phase 3 - Projects & Monitoring Providers  
**Status**: Ready for Implementation  
**Created**: 2024-11-12

---

## 📋 Executive Summary

This document provides a step-by-step implementation plan for the GitHub dock adapter. The adapter will sync GitHub repositories, branches, and issues to StackDock's `projects` table, enabling users to view all their GitHub code in StackDock's unified Projects interface.

**Key Deliverables**:
1. GitHub API client (`api.ts`) with pagination and rate limiting
2. TypeScript types matching GitHub API responses (`types.ts`)
3. DockAdapter implementation (`adapter.ts`) with `syncProjects` method
4. Integration with StackDock's sync system (actions + mutations)
5. Adapter registration in registry

---

## 🏗️ Architecture Overview

### Current State

**DockAdapter Interface** (`convex/docks/_types.ts`):
- Has methods: `syncWebServices`, `syncServers`, `syncDomains`, `syncDatabases`, `syncDeployments`, `syncBackupSchedules`, `syncBackupIntegrations`
- **Missing**: `syncProjects` method (needs to be added)

**Projects Table** (`convex/schema.ts`):
```typescript
projects: defineTable({
  orgId: v.id("organizations"),
  teamId: v.id("teams"),
  clientId: v.id("clients"),
  name: v.string(),
  linearId: v.optional(v.string()),
  githubRepo: v.optional(v.string()), // "owner/repo"
})
```

**Key Difference**: Projects table doesn't have `dockId` or `providerResourceId` like other universal tables. This is intentional - projects are business entities, not infrastructure resources.

### Required Changes

1. **Add `syncProjects` to DockAdapter interface**
2. **Update actions.ts** to handle GitHub projects sync
3. **Update mutations.ts** to call `syncProjects` if adapter implements it
4. **Create GitHub adapter** following existing patterns

---

## 📝 Implementation Steps

### Step 1: Update DockAdapter Interface

**File**: `convex/docks/_types.ts`

**Action**: Add `syncProjects` method to `DockAdapter` interface

**Code**:
```typescript
/**
 * Sync projects (repositories, code projects) to universal `projects` table
 * 
 * Called during dock sync. Should:
 * 1. Use pre-fetched data if provided, otherwise fetch from provider API
 * 2. Upsert into `projects` table
 * 3. Map provider fields to universal schema
 * 4. Store all provider-specific data in `fullApiData` (if projects table supports it)
 * 
 * Note: Projects table structure differs from other universal tables:
 * - No `dockId` field (projects are org-level, not dock-specific)
 * - No `providerResourceId` field (projects identified by `githubRepo`)
 * - Links to teams/clients (business entities)
 * 
 * @param ctx - Convex mutation context (has database access)
 * @param dock - The dock document (contains encrypted API key)
 * @param preFetchedData - Optional: Pre-fetched data from action (if provided, skips fetch)
 */
syncProjects?(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: any[]
): Promise<void>
```

**Location**: Add after `syncDeployments` method (around line 262)

**Note**: Projects sync is different - we need to handle the fact that projects don't have `dockId`. We'll need to:
- Use `orgId` from dock
- Match projects by `githubRepo` field (not `providerResourceId`)
- Handle team/client assignment (may need to be manual or use dock metadata)

---

### Step 2: Create GitHub API Client

**File**: `convex/docks/adapters/github/api.ts`

**Purpose**: Handle all GitHub API calls with proper error handling, pagination, and rate limiting

**Required Methods**:

#### 2.1. `validateCredentials(apiKey: string): Promise<boolean>`
- Endpoint: `GET /user`
- Headers: `Authorization: Bearer {token}`
- Returns: `true` if 200-299, `false` otherwise
- Error handling: Catch and return `false` for 401/403

#### 2.2. `listRepositories(apiKey: string, options?: ListReposOptions): Promise<GitHubRepository[]>`
- Endpoint: `GET /user/repos`
- Query params: `type`, `sort`, `direction`, `per_page`, `page`
- **Pagination**: Handle Link headers (GitHub uses Link header pagination)
- Returns: Array of all repositories (all pages)
- Rate limiting: Check `X-RateLimit-Remaining`, implement exponential backoff on 429

#### 2.3. `listBranches(apiKey: string, owner: string, repo: string): Promise<GitHubBranch[]>`
- Endpoint: `GET /repos/{owner}/{repo}/branches`
- Query params: `per_page`, `page`
- **Pagination**: Handle Link headers
- Returns: Array of all branches (all pages)

#### 2.4. `listIssues(apiKey: string, owner: string, repo: string, options?: ListIssuesOptions): Promise<GitHubIssue[]>`
- Endpoint: `GET /repos/{owner}/{repo}/issues`
- Query params: `state`, `sort`, `direction`, `per_page`, `page`
- **Filter PRs**: Check `pull_request` field, exclude if present
- **Pagination**: Handle Link headers
- Returns: Array of issues only (no PRs)

**Implementation Pattern** (from existing adapters):
```typescript
export class GitHubAPI {
  private apiKey: string
  private baseURL = "https://api.github.com"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "StackDock/1.0",
      ...options?.headers,
    }

    const response = await fetch(url, { ...options, headers })

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After")
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000
      await new Promise(resolve => setTimeout(resolve, delay))
      return this.request<T>(endpoint, options) // Retry
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      await this.request("/user")
      return true
    } catch {
      return false
    }
  }

  async listRepositories(apiKey: string, options?: ListReposOptions): Promise<GitHubRepository[]> {
    // Implementation with pagination
  }

  // ... other methods
}
```

**Pagination Helper**:
```typescript
private async paginate<T>(endpoint: string, options?: RequestInit): Promise<T[]> {
  const allResults: T[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const url = new URL(`${this.baseURL}${endpoint}`)
    url.searchParams.set("page", page.toString())
    url.searchParams.set("per_page", "100") // Max per page

    const results = await this.request<T[]>(url.pathname + url.search, options)
    allResults.push(...results)

    hasMore = results.length === 100 // If we got 100, there might be more
    page++
  }

  return allResults
}
```

---

### Step 3: Create TypeScript Types

**File**: `convex/docks/adapters/github/types.ts`

**Required Interfaces**:

```typescript
export interface GitHubUser {
  login: string
  id: number
  type: "User" | "Organization"
  // ... other fields from /user endpoint
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string // "owner/repo"
  description: string | null
  private: boolean
  fork: boolean
  archived: boolean
  disabled: boolean
  default_branch: string
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
  pushed_at: string | null // ISO 8601
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  owner: {
    login: string
    type: "User" | "Organization"
  }
  // ... other fields from /user/repos endpoint
}

export interface GitHubBranch {
  name: string
  commit: {
    sha: string
    url: string
  }
  protected: boolean
  // ... other fields from /repos/{owner}/{repo}/branches endpoint
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  state: "open" | "closed"
  user: {
    login: string
  }
  assignees: Array<{
    login: string
  }>
  labels: Array<{
    name: string
    color: string
  }>
  comments: number
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
  closed_at: string | null // ISO 8601
  pull_request?: {
    url: string
  } // If present, this is a PR, not an issue
  // ... other fields from /repos/{owner}/{repo}/issues endpoint
}
```

**Source**: Use actual GitHub API responses. Test with:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/vnd.github+json" \
     -H "X-GitHub-Api-Version: 2022-11-28" \
     https://api.github.com/user/repos
```

---

### Step 4: Create GitHub Adapter

**File**: `convex/docks/adapters/github/adapter.ts`

**Implementation**:

```typescript
import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { GitHubAPI } from "./api"
import type { GitHubRepository, GitHubBranch, GitHubIssue } from "./types"

export const githubAdapter: DockAdapter = {
  provider: "github",

  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new GitHubAPI(apiKey)
      return await api.validateCredentials(apiKey)
    } catch (error) {
      console.error("GitHub credential validation failed:", error)
      throw error
    }
  },

  async syncProjects(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: GitHubRepository[]
  ): Promise<void> {
    let repos: GitHubRepository[]

    if (preFetchedData) {
      repos = preFetchedData
    } else {
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })
      const api = new GitHubAPI(apiKey)
      repos = await api.listRepositories(apiKey)
    }

    // For each repository, fetch branches and issues
    // Note: This could be done in the action for better performance
    const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })
    const api = new GitHubAPI(apiKey)

    for (const repo of repos) {
      const [owner, repoName] = repo.full_name.split("/")

      // Fetch branches and issues (with error handling)
      let branches: GitHubBranch[] = []
      let issues: GitHubIssue[] = []

      try {
        branches = await api.listBranches(apiKey, owner, repoName)
      } catch (error) {
        console.error(`Failed to fetch branches for ${repo.full_name}:`, error)
        // Continue without branches
      }

      try {
        issues = await api.listIssues(apiKey, owner, repoName, { state: "all" })
      } catch (error) {
        console.error(`Failed to fetch issues for ${repo.full_name}:`, error)
        // Continue without issues
      }

      // Check if project exists (by githubRepo field)
      const existing = await ctx.db
        .query("projects")
        .withIndex("by_orgId", (q) => q.eq("orgId", dock.orgId))
        .filter((q) => q.eq(q.field("githubRepo"), repo.full_name))
        .first()

      const projectData = {
        orgId: dock.orgId,
        // Note: teamId and clientId are required but we don't have them
        // Options:
        // 1. Use a default team/client (create if doesn't exist)
        // 2. Store in dock metadata
        // 3. Make them optional in schema (breaking change)
        // For MVP: Use first team/client or create default
        teamId: await getOrCreateDefaultTeam(ctx, dock.orgId),
        clientId: await getOrCreateDefaultClient(ctx, dock.orgId),
        name: repo.name,
        githubRepo: repo.full_name,
        // Store branches and issues in a related structure
        // Since projects table doesn't have fullApiData, we might need to:
        // 1. Add fullApiData to projects table (schema change)
        // 2. Create separate tables for branches/issues
        // 3. Store in a JSON field (if Convex supports it)
        // For MVP: Store in a separate structure or add fullApiData field
      }

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: repo.name,
          githubRepo: repo.full_name,
          // Update other fields
        })
      } else {
        await ctx.db.insert("projects", projectData)
      }
    }
  },
}

// Helper function to get or create default team/client
async function getOrCreateDefaultTeam(ctx: MutationCtx, orgId: string) {
  // Implementation: Query for teams, use first one, or create "Default Team"
}
```

**Challenge**: Projects table requires `teamId` and `clientId`, but GitHub repos don't have this mapping. We need a strategy:

**Option A**: Create default team/client per org
**Option B**: Store mapping in dock metadata
**Option C**: Make teamId/clientId optional in schema (requires migration)

**Recommendation**: Option A for MVP, Option B for production.

---

### Step 5: Update Actions

**File**: `convex/docks/actions.ts`

**Action**: Add GitHub case to `syncDockResources` action

**Code** (add after Linode case, around line 509):

```typescript
} else if (args.provider === "github") {
  // GitHub-specific: Use GitHubAPI directly
  const GitHubAPI = (await import("./adapters/github/api")).GitHubAPI
  const api = new GitHubAPI(args.apiKey)

  // GitHub syncs projects (repositories)
  if (args.resourceTypes.includes("projects")) {
    console.log(`[Dock Action] Fetching repositories for ${args.provider}`)
    const repos = await api.listRepositories(args.apiKey)

    // For each repo, fetch branches and issues
    // Note: This could be rate-limited, so we'll do it sequentially with delays
    const reposWithDetails = await Promise.all(
      repos.map(async (repo) => {
        const [owner, repoName] = repo.full_name.split("/")
        
        // Add delay to respect rate limits (5,000 requests/hour = ~1 request/second)
        await new Promise(resolve => setTimeout(resolve, 1000))

        const [branches, issues] = await Promise.all([
          api.listBranches(args.apiKey, owner, repoName).catch(() => []),
          api.listIssues(args.apiKey, owner, repoName, { state: "all" }).catch(() => []),
        ])

        return {
          ...repo,
          branches,
          issues,
        }
      })
    )

    // Pass to mutation as "projects" (not "webServices")
    // We'll need to update the mutation to handle "projects" type
    return {
      projects: reposWithDetails,
    }
  }

  // GitHub doesn't support servers, webServices, domains, or databases
  if (args.resourceTypes.includes("servers")) {
    console.log(`[Dock Action] Servers not supported for ${args.provider}`)
    servers = []
  }
  if (args.resourceTypes.includes("webServices")) {
    console.log(`[Dock Action] Web services not supported for ${args.provider}`)
    webServices = []
  }
  if (args.resourceTypes.includes("domains")) {
    console.log(`[Dock Action] Domains not supported for ${args.provider}`)
    domains = []
  }
  if (args.resourceTypes.includes("databases")) {
    console.log(`[Dock Action] Databases not supported for ${args.provider}`)
    databases = []
  }
}
```

**Note**: The action currently returns `{ servers, webServices, domains, databases, ... }`. We need to add `projects` to the return type and handle it in the mutation.

**Update return type** (around line 515):
```typescript
// Call internal mutation to sync using adapter methods
await ctx.runMutation(internal.docks.mutations.syncDockResourcesMutation, {
  dockId: args.dockId,
  provider: args.provider,
  fetchedData: {
    servers: servers.length > 0 ? servers : undefined,
    webServices: webServices.length > 0 ? webServices : undefined,
    domains: domains.length > 0 ? domains : undefined,
    databases: databases.length > 0 ? databases : undefined,
    deployments: deployments.length > 0 ? deployments : undefined,
    backupSchedules: backupSchedules.length > 0 ? backupSchedules : undefined,
    backupIntegrations: backupIntegrations.length > 0 ? backupIntegrations : undefined,
    projects: projects.length > 0 ? projects : undefined, // ADD THIS
  },
})
```

---

### Step 6: Update Mutations

**File**: `convex/docks/mutations.ts`

**Action 1**: Update `syncDockResourcesMutation` args to include `projects`

**Code** (around line 188):
```typescript
fetchedData: v.object({
  servers: v.optional(v.array(v.any())),
  webServices: v.optional(v.array(v.any())),
  domains: v.optional(v.array(v.any())),
  databases: v.optional(v.array(v.any())),
  deployments: v.optional(v.array(v.any())),
  backupSchedules: v.optional(v.array(v.any())),
  backupIntegrations: v.optional(v.array(v.any())),
  projects: v.optional(v.array(v.any())), // ADD THIS
}),
```

**Action 2**: Call `syncProjects` if adapter implements it

**Code** (add after `syncBackupIntegrations`, around line 240):
```typescript
if (args.fetchedData.backupIntegrations && adapter.syncBackupIntegrations) {
  await adapter.syncBackupIntegrations(ctx, dock, args.fetchedData.backupIntegrations)
}

if (args.fetchedData.projects && adapter.syncProjects) {
  await adapter.syncProjects(ctx, dock, args.fetchedData.projects)
}
```

**Action 3**: Update `syncDock` mutation to include "projects" in resourceTypes

**Code** (around line 139):
```typescript
const resourceTypes: string[] = []
if (adapter.syncServers) resourceTypes.push("servers")
if (adapter.syncWebServices) resourceTypes.push("webServices")
if (adapter.syncDomains) resourceTypes.push("domains")
if (adapter.syncDatabases) resourceTypes.push("databases")
if (adapter.syncProjects) resourceTypes.push("projects") // ADD THIS
```

---

### Step 7: Register Adapter

**File**: `convex/docks/adapters/github/index.ts`

**Create file**:
```typescript
export { githubAdapter } from "./adapter"
export { GitHubAPI } from "./api"
export type { GitHubRepository, GitHubBranch, GitHubIssue } from "./types"
```

**File**: `convex/docks/registry.ts`

**Action 1**: Import adapter (around line 23):
```typescript
import { githubAdapter } from "./adapters/github"
```

**Action 2**: Add to registry (around line 42):
```typescript
const adapterRegistry: Record<string, DockAdapter> = {
  // ... existing adapters
  github: githubAdapter,
}
```

**Action 3**: Add to metadata (around line 88):
```typescript
const providerMetadata: Record<string, { displayName: string }> = {
  // ... existing providers
  github: { displayName: "GitHub" },
}
```

---

## 🔧 Technical Considerations

### Rate Limiting

**GitHub Limits**:
- Authenticated: 5,000 requests/hour
- Check `X-RateLimit-Remaining` header
- On 429: Use `Retry-After` header or exponential backoff

**Strategy**:
- Add 1-second delay between repo detail fetches (branches + issues)
- For 100 repos: ~200 requests (1 repo list + 100 branches + 100 issues)
- Well under 5,000/hour limit

### Pagination

**GitHub Uses Link Headers**:
```
Link: <https://api.github.com/user/repos?page=2>; rel="next", <https://api.github.com/user/repos?page=5>; rel="last"
```

**Implementation**: Parse Link headers or use page-based pagination (simpler)

### Error Handling

**Scenarios**:
1. **401 Unauthorized**: Invalid token → Return error, don't sync
2. **403 Forbidden**: Insufficient permissions → Log warning, sync what we can
3. **404 Not Found**: Repo deleted → Skip, continue with others
4. **429 Rate Limited**: Wait and retry → Exponential backoff
5. **Network Error**: Retry with backoff → Max 3 retries

### Projects Table Challenges

**Problem**: Projects table requires `teamId` and `clientId`, but GitHub repos don't map to these.

**Solutions**:

**Option A - Default Team/Client** (MVP):
```typescript
async function getOrCreateDefaultTeam(ctx: MutationCtx, orgId: string) {
  const teams = await ctx.db
    .query("teams")
    .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
    .collect()
  
  if (teams.length > 0) {
    return teams[0]._id
  }
  
  // Create default team
  return await ctx.db.insert("teams", {
    orgId,
    name: "Default Team",
  })
}
```

**Option B - Dock Metadata** (Production):
- Store team/client mapping in `dock.providerMetadata`
- Allow users to configure mapping in UI

**Option C - Schema Change** (Future):
- Make `teamId` and `clientId` optional
- Requires migration

**Recommendation**: Start with Option A, plan for Option B.

### Storing Branches and Issues

**Problem**: Projects table doesn't have `fullApiData` field like other universal tables.

**Solutions**:

**Option A - Add fullApiData to Projects** (Recommended):
- Update schema to add `fullApiData: v.optional(v.any())`
- Store branches/issues in `fullApiData.branches` and `fullApiData.issues`

**Option B - Separate Tables**:
- Create `projectBranches` and `projectIssues` tables
- More normalized, but more complex queries

**Option C - JSON Field**:
- If Convex supports JSON fields, use that
- Otherwise, store as string and parse

**Recommendation**: Option A - simplest and consistent with other tables.

---

## ✅ Testing Checklist

### Unit Tests

- [ ] `GitHubAPI.validateCredentials()` - Valid token returns true
- [ ] `GitHubAPI.validateCredentials()` - Invalid token returns false
- [ ] `GitHubAPI.listRepositories()` - Fetches all repos (pagination)
- [ ] `GitHubAPI.listBranches()` - Fetches all branches (pagination)
- [ ] `GitHubAPI.listIssues()` - Fetches issues only (filters PRs)
- [ ] `GitHubAPI.listIssues()` - Handles rate limiting (429)
- [ ] `githubAdapter.validateCredentials()` - Calls API correctly
- [ ] `githubAdapter.syncProjects()` - Upserts projects correctly
- [ ] `githubAdapter.syncProjects()` - Handles existing projects
- [ ] `githubAdapter.syncProjects()` - Stores branches/issues in fullApiData

### Integration Tests

- [ ] Can create GitHub dock with PAT token
- [ ] Can sync repositories (all repos appear in projects table)
- [ ] Branches stored in `fullApiData.branches`
- [ ] Issues stored in `fullApiData.issues`
- [ ] Pagination works (handles 100+ repos)
- [ ] Rate limiting handled (doesn't crash on 429)
- [ ] Invalid token shows proper error
- [ ] Concurrent syncs prevented
- [ ] Sync status updates correctly

### Manual Testing

1. **Create GitHub Dock**:
   - Go to Settings → Docks
   - Click "Add Dock"
   - Select "GitHub"
   - Enter PAT token
   - Click "Create"

2. **Sync Repositories**:
   - Click "Sync" on GitHub dock
   - Wait for sync to complete
   - Check Projects page - should see all repos

3. **Verify Data**:
   - Check projects table in Convex dashboard
   - Verify `githubRepo` field matches `owner/repo`
   - Verify `fullApiData.branches` has branch data
   - Verify `fullApiData.issues` has issue data (no PRs)

4. **Test Edge Cases**:
   - Invalid token → Should show error
   - Rate limited → Should retry with backoff
   - Repo with no branches → Should handle gracefully
   - Repo with no issues → Should handle gracefully
   - Private repo → Should sync if token has access

---

## 🚀 Deployment Steps

1. **Update Schema** (if adding `fullApiData` to projects):
   ```bash
   # Update convex/schema.ts
   # Run: npx convex dev (will auto-apply schema changes)
   ```

2. **Deploy Code**:
   ```bash
   # Test locally first
   npm run dev
   
   # Deploy to production
   npm run deploy
   ```

3. **Verify**:
   - Check Convex dashboard for errors
   - Test creating GitHub dock
   - Test syncing repositories
   - Check Projects page

---

## 📚 Reference Files

**Existing Adapters** (for pattern reference):
- `convex/docks/adapters/vercel/` - Good API client pattern
- `convex/docks/adapters/neon/` - Good pagination handling
- `convex/docks/adapters/convex/` - Projects-like sync (databases)

**Key Files**:
- `convex/docks/_types.ts` - DockAdapter interface
- `convex/docks/registry.ts` - Adapter registration
- `convex/docks/actions.ts` - External API calls
- `convex/docks/mutations.ts` - Database operations
- `convex/schema.ts` - Database schema

**Documentation**:
- GitHub REST API: https://docs.github.com/en/rest?apiVersion=2022-11-28
- GitHub Authentication: https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api
- GitHub Rate Limiting: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api

---

## 🎯 Success Criteria

**Adapter is complete when**:
1. ✅ `validateCredentials()` works - Can validate GitHub PAT token
2. ✅ `listRepositories()` works - Fetches all user repositories with pagination
3. ✅ `listBranches()` works - Fetches branches for a repository
4. ✅ `listIssues()` works - Fetches issues for a repository (filters PRs)
5. ✅ `syncProjects()` works - Upserts repositories into `projects` table
6. ✅ Adapter registered in registry
7. ✅ Actions integration complete
8. ✅ Mutations integration complete
9. ✅ Rate limiting handled gracefully
10. ✅ Error handling robust (401, 403, 404, 429)

**MVP Complete When**:
- Users can add GitHub dock with PAT token
- Users can sync repositories
- All repos appear in Projects page
- Branches and issues are stored (even if not displayed yet)

---

## 🔄 Future Enhancements

**Phase 2** (Post-MVP):
- [ ] Display branches in Projects UI
- [ ] Display issues in Projects UI
- [ ] Filter repos by organization
- [ ] Search repos
- [ ] Sync pull requests (separate from issues)

**Phase 3** (Advanced):
- [ ] Sync commits
- [ ] Sync GitHub Actions workflows
- [ ] Sync releases
- [ ] Webhook support for real-time updates
- [ ] Team/client mapping UI

---

## 📝 Notes

- **Schema Change Required**: Projects table needs `fullApiData` field (or separate structure for branches/issues)
- **Team/Client Mapping**: Need strategy for mapping GitHub repos to StackDock teams/clients
- **Rate Limiting**: Be careful with GitHub's 5,000 requests/hour limit
- **Pagination**: GitHub uses Link headers, but page-based is simpler
- **Error Handling**: Handle gracefully - don't fail entire sync if one repo fails

---

**Ready to implement?** Start with Step 1 (Update DockAdapter Interface), then proceed sequentially through each step.
