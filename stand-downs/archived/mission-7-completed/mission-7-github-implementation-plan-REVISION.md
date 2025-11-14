# GitHub Adapter Implementation Plan - Revision Document

**Mission**: Mission 7 Phase 3 - Projects & Monitoring Providers  
**Status**: ✅ **APPROVED WITH ALL FIXES** - Ready for Implementation  
**Created**: 2024-11-12  
**Last Updated**: 2024-11-13  
**Reviewers**: Convex Agent ✅, GitHub Agent ✅

---

## 📋 Review Process

This document is a collaborative review of the GitHub adapter implementation plan. The Convex agent should:

1. **Review** each section
2. **Add notes** in the "Convex Agent Notes" sections
3. **Flag issues** or suggest improvements
4. **Approve** sections when ready

**Review Status**:
- [x] Step 0: Schema Changes (REQUIRED FIRST) - ✅ APPROVED
- [x] Step 1: DockAdapter Interface - ✅ APPROVED
- [x] Step 2: GitHub API Client - ✅ APPROVED WITH IMPROVEMENTS
- [x] Step 3: TypeScript Types - ✅ APPROVED
- [x] Step 4: GitHub Adapter - ✅ APPROVED WITH CRITICAL FIXES
- [x] Step 5: Actions Integration - ✅ APPROVED WITH PERFORMANCE IMPROVEMENTS
- [x] Step 6: Mutations Integration - ✅ APPROVED
- [x] Step 7: Registry Registration - ✅ APPROVED
- [x] Technical Considerations - ✅ REVIEWED
- [x] Testing Checklist - ✅ APPROVED

---

## 🔴 CRITICAL ISSUES TO ADDRESS

### Issue 1: Schema Change Required (MUST FIX FIRST)

**Problem**: `projects` table doesn't have `fullApiData` field, but we need it to store branches/issues.

**Current Schema** (`convex/schema.ts` line 106-116):
```typescript
projects: defineTable({
  orgId: v.id("organizations"),
  teamId: v.id("teams"),  // Required
  clientId: v.id("clients"),  // Required
  name: v.string(),
  linearId: v.optional(v.string()),
  githubRepo: v.optional(v.string()),
  // ❌ Missing: fullApiData
})
```

**Required Change**:
```typescript
projects: defineTable({
  orgId: v.id("organizations"),
  teamId: v.id("teams"),
  clientId: v.id("clients"),
  name: v.string(),
  linearId: v.optional(v.string()),
  githubRepo: v.optional(v.string()),
  fullApiData: v.optional(v.any()), // ✅ ADD THIS
})
  .index("by_orgId", ["orgId"])
  .index("by_teamId", ["teamId"])
  .index("by_clientId", ["clientId"])
  .index("by_githubRepo", ["orgId", "githubRepo"]) // ✅ ADD THIS INDEX
```

**Convex Agent Notes**:
```
✅ APPROVED - Schema change is safe and necessary

- Is this schema change safe? ✅ YES - Optional fields don't break existing records
- Will this break existing projects? ✅ NO - Optional fields are backward compatible
- Do we need a migration? ✅ NO - Convex handles optional fields automatically
- Is the index necessary? ✅ YES - Required for efficient lookups by githubRepo

Note: The composite index (orgId + githubRepo) is correct. Ensure queries use both fields.
```

---

### Issue 2: Team/Client ID Requirement

**Problem**: Projects table requires `teamId` and `clientId`, but GitHub repos don't map to these.

**Proposed Solution**: Create default team/client if none exist.

**Convex Agent Notes**:
```
✅ APPROVED WITH MODIFICATIONS - Creating defaults is acceptable

- Is creating default team/client acceptable? ✅ YES - For MVP this is fine
- Should we make teamId/clientId optional instead? ⚠️ Consider for future, but breaking change
- Do we need a different approach? ✅ NO - Current approach works, but improve helper function

IMPROVEMENTS NEEDED:
1. Check for existing teams/clients FIRST (use first one if found)
2. Only create defaults if none exist
3. Use clear naming: "GitHub Sync - Default Team" (not just "Default Team")
4. See improved helper function in Step 4 notes
```

---

### Issue 3: DecryptApiKey Signature

**Question**: What is the actual signature of `decryptApiKey()`?

**Current Plan Shows**:
```typescript
const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
  dockId: dock._id,
  orgId: dock.orgId,
})
```

**Convex Agent Notes**:
```
✅ VERIFIED - Signature is correct

Actual signature (from convex/lib/encryption.ts):
```typescript
export async function decryptApiKey(
  encrypted: ArrayBuffer,
  ctx?: any, // MutationCtx | QueryCtx
  auditMetadata?: { dockId?: any; orgId?: any }
): Promise<string>
```

- What is the correct signature? ✅ Verified - Plan shows correct usage
- Do we need the context object? ✅ YES - For audit logging (recommended)
- Should I check convex/lib/encryption.ts? ✅ DONE - Signature verified

CRITICAL FIX: Remove duplicate API key decryption in Step 4 (line 381)
```

---

## 📝 IMPLEMENTATION STEPS (REVISED)

### Step 0: Update Projects Schema ⚠️ REQUIRED FIRST

**File**: `convex/schema.ts`

**Action**: Add `fullApiData` field and `by_githubRepo` index to projects table

**Code**:
```typescript
projects: defineTable({
  orgId: v.id("organizations"),
  teamId: v.id("teams"),
  clientId: v.id("clients"),
  name: v.string(),
  linearId: v.optional(v.string()),
  githubRepo: v.optional(v.string()),
  fullApiData: v.optional(v.any()), // ✅ ADD THIS
})
  .index("by_orgId", ["orgId"])
  .index("by_teamId", ["teamId"])
  .index("by_clientId", ["clientId"])
  .index("by_githubRepo", ["orgId", "githubRepo"]) // ✅ ADD THIS INDEX
```

**Convex Agent Notes**:
```
✅ APPROVED

- Schema change approved? ✅ YES - Safe, optional field
- Index necessary? ✅ YES - Required for efficient lookups
- Migration needed? ✅ NO - Convex handles optional fields automatically
- Other concerns? ✅ NONE - Proceed with implementation
```

---

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
 * 4. Store all provider-specific data in `fullApiData`
 * 
 * Note: Projects table structure differs from other universal tables:
 * - No `dockId` field (projects are org-level, not dock-specific)
 * - Projects identified by `githubRepo` field (not `providerResourceId`)
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

**Convex Agent Notes**:
```
✅ APPROVED

- Interface signature correct? ✅ YES - Matches pattern of other sync methods
- Documentation clear? ✅ YES - Good documentation
- Any concerns? ✅ NONE - Add after syncDeployments method (around line 262)
```

---

### Step 2: Create GitHub API Client

**File**: `convex/docks/adapters/github/api.ts`

**Purpose**: Handle all GitHub API calls with proper error handling, pagination, and rate limiting

**Required Methods**:

#### 2.1. `validateCredentials(apiKey: string): Promise<boolean>`
- Endpoint: `GET /user`
- Headers: `Authorization: Bearer {token}`
- Returns: `true` if 200-299, `false` otherwise

#### 2.2. `listRepositories(apiKey: string, options?: ListReposOptions): Promise<GitHubRepository[]>`
- Endpoint: `GET /user/repos`
- **Pagination**: Handle Link headers or page-based
- Returns: Array of all repositories (all pages)

#### 2.3. `listBranches(apiKey: string, owner: string, repo: string): Promise<GitHubBranch[]>`
- Endpoint: `GET /repos/{owner}/{repo}/branches`
- **Pagination**: Handle Link headers
- Returns: Array of all branches

#### 2.4. `listIssues(apiKey: string, owner: string, repo: string, options?: ListIssuesOptions): Promise<GitHubIssue[]>`
- Endpoint: `GET /repos/{owner}/{repo}/issues`
- **Filter PRs**: Check `pull_request` field, exclude if present
- Returns: Array of issues only (no PRs)

**Implementation Pattern**:
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

  // ... other methods with pagination
}
```

**Convex Agent Notes**:
```
✅ APPROVED WITH IMPROVEMENTS

- API client pattern correct? ✅ YES - Matches existing adapters
- Rate limiting strategy acceptable? ⚠️ NEEDS IMPROVEMENT - See improvements below
- Pagination approach (Link headers vs page-based)? ✅ USE LINK HEADERS with page-based fallback
- Error handling sufficient? ⚠️ ADD network timeout and retry logic

CRITICAL IMPROVEMENTS NEEDED:
1. Rate Limiting: Check X-RateLimit-Remaining header, only delay if < 100 remaining
2. Pagination: Use Link headers (GitHub-recommended) with page-based fallback
3. Error Handling: Add network timeout (30s), retry logic (3 retries with exponential backoff)
4. See improved request() method in Technical Considerations section
```

---

### Step 3: Create TypeScript Types

**File**: `convex/docks/adapters/github/types.ts`

**Required Interfaces**:
- `GitHubUser` - User object from `/user` endpoint
- `GitHubRepository` - Repository object from `/user/repos` endpoint
- `GitHubBranch` - Branch object from `/repos/{owner}/{repo}/branches` endpoint
- `GitHubIssue` - Issue object from `/repos/{owner}/{repo}/issues` endpoint

**Convex Agent Notes**:
```
✅ APPROVED

- Should I generate types from actual API responses? ✅ YES - Use docks/github/ directory for JSON examples
- Are there any type safety concerns? ✅ NONE - Follow existing adapter patterns
- Do we need additional types? ✅ NO - Required interfaces are sufficient
```

---

### Step 4: Create GitHub Adapter

**File**: `convex/docks/adapters/github/adapter.ts`

**Key Implementation Points**:

1. **Team/Client Helper Functions**:
```typescript
async function getOrCreateDefaultTeam(
  ctx: MutationCtx, 
  orgId: Id<"organizations">
): Promise<Id<"teams">> {
  const team = await ctx.db
    .query("teams")
    .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
    .first()
  
  if (team) {
    return team._id
  }
  
  // Create default team
  return await ctx.db.insert("teams", {
    orgId,
    name: "Default Team",
  })
}

async function getOrCreateDefaultClient(
  ctx: MutationCtx, 
  orgId: Id<"organizations">
): Promise<Id<"clients">> {
  const client = await ctx.db
    .query("clients")
    .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
    .first()
  
  if (client) {
    return client._id
  }
  
  // Create default client
  return await ctx.db.insert("clients", {
    orgId,
    name: "Default Client",
  })
}
```

2. **syncProjects Implementation**:
```typescript
async syncProjects(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: GitHubRepository[]
): Promise<void> {
  let repos: GitHubRepository[]

  if (preFetchedData) {
    repos = preFetchedData
  } else {
    const apiKey = await decryptApiKey(dock.encryptedApiKey) // ⚠️ VERIFY SIGNATURE
    const api = new GitHubAPI(apiKey)
    repos = await api.listRepositories(apiKey)
  }

  // Get team/client IDs
  const teamId = await getOrCreateDefaultTeam(ctx, dock.orgId)
  const clientId = await getOrCreateDefaultClient(ctx, dock.orgId)

  // If preFetchedData includes branches/issues, use them
  // Otherwise, fetch them here (or in action)
  const apiKey = await decryptApiKey(dock.encryptedApiKey) // ⚠️ VERIFY SIGNATURE
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
    }

    try {
      issues = await api.listIssues(apiKey, owner, repoName, { state: "all" })
    } catch (error) {
      console.error(`Failed to fetch issues for ${repo.full_name}:`, error)
    }

    // Check if project exists (by githubRepo field using index)
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_githubRepo", (q) => 
        q.eq("orgId", dock.orgId).eq("githubRepo", repo.full_name)
      )
      .first()

    const projectData = {
      orgId: dock.orgId,
      teamId,
      clientId,
      name: repo.name,
      githubRepo: repo.full_name,
      fullApiData: {
        ...repo, // Complete repository object
        branches,
        issues,
      },
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: repo.name,
        githubRepo: repo.full_name,
        fullApiData: projectData.fullApiData,
      })
    } else {
      await ctx.db.insert("projects", projectData)
    }
  }
}
```

**Convex Agent Notes**:
```
✅ APPROVED WITH CRITICAL FIXES

- Helper functions acceptable? ✅ YES - But improve to check existing first
- syncProjects logic correct? ❌ NO - CRITICAL FIXES NEEDED (see below)
- Should branches/issues be fetched in action instead? ✅ YES - CRITICAL: Adapter runs in mutation (no fetch allowed)
- Error handling sufficient? ✅ YES - But branches/issues should come from action
- Upsert pattern correct? ✅ YES - Uses by_githubRepo index correctly
- Any performance concerns? ✅ NONE - If branches/issues fetched in action

CRITICAL FIXES REQUIRED:
1. ❌ REMOVE duplicate API key decryption (lines 370, 381) - Decrypt once at start
2. ❌ REMOVE branch/issue fetching from adapter - Must be fetched in action, passed via preFetchedData
3. ✅ IMPROVE helper functions - Check existing teams/clients first, use clear naming
4. ✅ preFetchedData should already include branches/issues from action

See corrected implementation in Technical Considerations section
```

---

### Step 5: Update Actions

**File**: `convex/docks/actions.ts`

**Action**: Add GitHub case to `syncDockResources` action

**Key Points**:
1. Fetch repositories
2. For each repo, fetch branches and issues
3. Handle rate limiting (add delays)
4. Return `projects` in fetchedData

**Code** (add after Linode case):
```typescript
} else if (args.provider === "github") {
  const GitHubAPI = (await import("./adapters/github/api")).GitHubAPI
  const api = new GitHubAPI(args.apiKey)

  if (args.resourceTypes.includes("projects")) {
    console.log(`[Dock Action] Fetching repositories for ${args.provider}`)
    const repos = await api.listRepositories(args.apiKey)

    // Fetch branches and issues for each repo
    // Add delay to respect rate limits
    const reposWithDetails = []
    for (const repo of repos) {
      const [owner, repoName] = repo.full_name.split("/")
      
      // Add delay to respect rate limits (5,000 requests/hour = ~1 request/second)
      await new Promise(resolve => setTimeout(resolve, 1000))

      const [branches, issues] = await Promise.all([
        api.listBranches(args.apiKey, owner, repoName).catch(() => []),
        api.listIssues(args.apiKey, owner, repoName, { state: "all" }).catch(() => []),
      ])

      reposWithDetails.push({
        ...repo,
        branches,
        issues,
      })
    }

    return {
      projects: reposWithDetails,
    }
  }

  // GitHub doesn't support other resource types
  return {
    servers: [],
    webServices: [],
    domains: [],
    databases: [],
  }
}
```

**Update return type** (around line 515):
```typescript
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
    projects: projects.length > 0 ? projects : undefined, // ✅ ADD THIS
  },
})
```

**Convex Agent Notes**:
```
✅ APPROVED WITH PERFORMANCE IMPROVEMENTS

- Sequential vs parallel fetching? ✅ USE BATCHING - 5-10 repos at a time with delays between batches
- Rate limiting strategy acceptable? ⚠️ TOO SLOW - 1s delay per repo = 200s for 100 repos
- Return type update correct? ✅ YES - Add projects to fetchedData
- Error handling sufficient? ⚠️ IMPROVE - Log errors but continue, don't swallow silently
- Any improvements needed? ✅ YES - See improved implementation below

CRITICAL IMPROVEMENTS:
1. Batch processing: Process 5-10 repos at a time (Promise.all)
2. Delay between batches: 1 second between batches (not between individual repos)
3. Error logging: Log errors but continue processing other repos
4. Update sync completion log to include projects count

See improved implementation in Technical Considerations section
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
  projects: v.optional(v.array(v.any())), // ✅ ADD THIS
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
if (adapter.syncProjects) resourceTypes.push("projects") // ✅ ADD THIS
```

**Convex Agent Notes**:
```
✅ APPROVED

- Args update correct? ✅ YES - Add projects to fetchedData args
- syncProjects call correct? ✅ YES - Call if adapter implements it
- Resource types update correct? ✅ YES - Add "projects" to resourceTypes array
- Any concerns? ✅ NONE - Also update sync completion log to include projects count
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

**Convex Agent Notes**:
```
✅ APPROVED

- Registration pattern correct? ✅ YES - Matches existing adapters exactly
- Any concerns? ✅ NONE - Standard pattern, proceed
```

---

## 🔧 TECHNICAL CONSIDERATIONS

### Rate Limiting

**GitHub Limits**:
- Authenticated: 5,000 requests/hour
- Check `X-RateLimit-Remaining` header
- On 429: Use `Retry-After` header or exponential backoff

**Strategy**:
- Add 1-second delay between repo detail fetches
- For 100 repos: ~200 requests (1 repo list + 100 branches + 100 issues)
- Well under 5,000/hour limit

**Convex Agent Notes**:
```
⚠️ NEEDS IMPROVEMENT

- Rate limiting strategy acceptable? ❌ TOO CONSERVATIVE - 1s delay is too slow
- Should we check X-RateLimit-Remaining before each request? ✅ YES - Only delay if < 100 remaining
- Any improvements? ✅ YES - See improved strategy below

IMPROVED STRATEGY:
1. Check X-RateLimit-Remaining header before each request
2. Only delay if remaining < 100 (safety buffer)
3. Use exponential backoff on 429 errors (not proactive delays)
4. Batch requests (5-10 at a time) with 1s delay between batches
5. For 100 repos: ~200 requests = well under 5,000/hour limit

See improved implementation in Technical Considerations section
```

---

### Pagination

**GitHub Uses Link Headers**:
```
Link: <https://api.github.com/user/repos?page=2>; rel="next"
```

**Implementation Options**:
1. Parse Link headers (more accurate)
2. Page-based pagination (simpler, check if results.length === per_page)

**Convex Agent Notes**:
```
✅ RECOMMENDATION: Use Link headers with page-based fallback

- Which pagination approach? ✅ LINK HEADERS (GitHub-recommended) with page-based fallback
- Any concerns? ✅ NONE - Link headers are more accurate, fallback handles edge cases

IMPLEMENTATION:
- Parse Link header for rel="next" URL
- Fallback to page-based if Link header missing
- See example implementation in Technical Considerations section
```

---

### Error Handling

**Scenarios**:
1. **401 Unauthorized**: Invalid token → Return error, don't sync
2. **403 Forbidden**: Insufficient permissions → Log warning, sync what we can
3. **404 Not Found**: Repo deleted → Skip, continue with others
4. **429 Rate Limited**: Wait and retry → Exponential backoff
5. **Network Error**: Retry with backoff → Max 3 retries

**Convex Agent Notes**:
```
✅ APPROVED WITH ADDITIONS

- Error handling sufficient? ✅ YES - But add network timeout handling
- Any additional scenarios to handle? ✅ YES - Add network timeout (30s) and retry logic

ADDITIONS:
1. Network timeout: 30-second timeout for fetch requests
2. Retry logic: 3 retries with exponential backoff for transient errors
3. Better error messages: Include repo name in error messages for debugging
```

---

## ✅ TESTING CHECKLIST

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

**Convex Agent Notes**:
```
✅ APPROVED

- Testing checklist complete? ✅ YES - Comprehensive coverage
- Any additional tests needed? ✅ NONE - Checklist covers all critical paths

Note: Test with small number of repos first, then scale up
```

---

## 🎯 FINAL APPROVAL

**Convex Agent Final Review**:

```
✅ CONDITIONAL APPROVAL - Ready to implement after fixes

Overall Assessment: ⚠️ CONDITIONAL APPROVAL - Address critical fixes first

Critical Issues Resolved:
- [x] Schema change approved ✅
- [x] Team/Client ID strategy approved ✅ (with helper function improvements)
- [x] DecryptApiKey signature verified ✅
- [x] All implementation steps approved ✅ (with critical fixes noted)

Ready to Implement: ⚠️ CONDITIONAL YES - Fix critical issues first

CRITICAL FIXES REQUIRED BEFORE IMPLEMENTATION:
1. ❌ Remove duplicate API key decryption in Step 4 adapter
2. ❌ Move branch/issue fetching from adapter to action (adapter runs in mutation, no fetch allowed)
3. ⚠️ Improve rate limiting strategy (batching + header checking)
4. ⚠️ Add pagination helper (Link headers with fallback)

RECOMMENDATIONS:
1. Start with schema changes (Step 0) - Test in dev first
2. Implement API client with improved rate limiting
3. Test with small number of repos first (5-10 repos)
4. Add monitoring/logging for rate limit usage

Overall: Plan is solid, architecture aligns with StackDock patterns. Address fixes above, then proceed.
```

---

## 📋 GITHUB AGENT REVIEW - ADDITIONAL FIXES

**Date**: 2024-11-13  
**Reviewer**: GitHub Agent  
**Status**: ✅ **APPROVED WITH MINOR SUGGESTIONS**

### Overall Assessment

The document is well-structured and ready for implementation. The critical fixes are correct, and the improved implementations address the main concerns.

### ✅ Verified Items

- **Schema changes** — ✅ Correct: adding `fullApiData` and `by_githubRepo` index
- **decryptApiKey signature** — ✅ Matches actual implementation
- **Critical fixes** — ✅ All valid:
  - Removing duplicate decryption
  - Moving fetch calls to action (mutations can't use fetch)
  - Rate limiting improvements
  - Pagination helper

---

### ⚠️ Minor Suggestions (Should Be Addressed)

#### 1. TypeScript Types Consistency

**Issue**: In the improved `syncProjects` implementation (lines 1015-1059), it accesses `repo.branches` and `repo.issues`, but `GitHubRepository` doesn't include these. The action adds them.

**Fix**: Extend the type in the adapter:

```typescript
// In adapter.ts
type GitHubRepositoryWithDetails = GitHubRepository & {
  branches?: GitHubBranch[]
  issues?: GitHubIssue[]
}

async syncProjects(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: GitHubRepositoryWithDetails[] // ✅ Use extended type
): Promise<void> {
  // Now repo.branches and repo.issues are properly typed
  for (const repo of preFetchedData) {
    const branches = repo.branches || [] // ✅ Type-safe
    const issues = repo.issues || [] // ✅ Type-safe
    // ...
  }
}
```

**Alternative**: Use `any` in the adapter (less type-safe but simpler for MVP)

**Recommendation**: Use Option A (extended type) for better type safety

**Priority**: Medium - Improves type safety

---

#### 2. Pagination Helper Consistency

**Issue**: The pagination helper (lines 921-960) uses `fetch` directly instead of the `request()` method. This bypasses rate limiting and retry logic.

**Fix**: Use `this.request()` for consistency, but this requires a method that returns headers:

```typescript
// Option A: Add requestWithHeaders() method (recommended)
private async requestWithHeaders<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<{ data: T; headers: Headers }> {
  const url = `${this.baseURL}${endpoint}`
  const headers = {
    "Authorization": `Bearer ${this.apiKey}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "StackDock/1.0",
    ...options?.headers,
  }

  try {
    const response = await fetch(url, { 
      ...options, 
      headers,
      signal: AbortSignal.timeout(30000)
    })

    // Handle rate limiting (same as request method)
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After")
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000
      await new Promise(resolve => setTimeout(resolve, delay))
      return this.requestWithHeaders<T>(endpoint, options, retries)
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`GitHub API error (${response.status}): ${errorText}`)
    }

    return {
      data: await response.json(),
      headers: response.headers
    }
  } catch (error) {
    // Same retry logic as request()
    const isNetworkError = error instanceof TypeError && 
      (error.message.includes('fetch') || 
       error.message.includes('network') ||
       error.message.includes('timeout') ||
       error.name === 'AbortError')
    
    if (retries > 0 && isNetworkError) {
      const delay = Math.pow(2, 3 - retries) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      return this.requestWithHeaders<T>(endpoint, options, retries - 1)
    }
    throw error
  }
}

// Then use in listRepositories:
async listRepositories(apiKey: string): Promise<GitHubRepository[]> {
  const allRepos: GitHubRepository[] = []
  let url = "/user/repos?per_page=100"
  
  while (url) {
    // ✅ Use requestWithHeaders() to get both data and headers
    const { data: repos, headers } = await this.requestWithHeaders<GitHubRepository[]>(url)
    allRepos.push(...repos)
    
    // Parse Link header for next page
    const linkHeader = headers.get("Link")
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<([^>]+)>; rel="next"/)
      if (nextMatch) {
        const nextUrl = new URL(nextMatch[1])
        url = nextUrl.pathname + nextUrl.search
      } else {
        url = null
      }
    } else {
      // Fallback: page-based pagination
      if (repos.length === 100) {
        const currentPage = parseInt(new URL(url, this.baseURL).searchParams.get("page") || "1")
        url = `/user/repos?per_page=100&page=${currentPage + 1}`
      } else {
        url = null
      }
    }
  }
  
  return allRepos
}
```

**Recommendation**: Add `requestWithHeaders()` method (like GridPane adapter uses)

**Priority**: Medium - Better rate limiting and consistency

---

#### 3. Retry Logic in Request Method

**Issue**: In the improved request method (lines 862-914):
- The 429 retry doesn't decrement retries (could retry indefinitely) - **Note**: This is actually intentional (rate limits are temporary)
- The network error check (`error instanceof TypeError`) might catch non-network errors

**Fix**: Improve network error detection:

```typescript
} catch (error) {
  // ✅ Better network error detection
  const isNetworkError = error instanceof TypeError && 
    (error.message.includes('fetch') || 
     error.message.includes('network') ||
     error.message.includes('timeout') ||
     error.name === 'AbortError')
  
  if (retries > 0 && isNetworkError) {
    const delay = Math.pow(2, 3 - retries) * 1000 // 1s, 2s, 4s
    await new Promise(resolve => setTimeout(resolve, delay))
    // ✅ Decrement retries for network errors (429 keeps retries same)
    return this.request<T>(endpoint, options, retries - 1)
  }
  throw error
}
```

**Note**: Keeping retries the same for 429 is intentional (rate limits are temporary, not permanent errors)

**Priority**: Low - Current implementation works, but could be improved

---

#### 4. Actions Variable Declaration

**Issue**: In the improved actions implementation (lines 1066-1126), ensure `projects` is declared at the top with other variables.

**Fix**: Add to variable declarations at the top of `syncDockResources` action:

```typescript
export const syncDockResources = internalAction({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // ✅ Declare all variables at the top
    let servers: any[] = []
    let webServices: any[] = []
    let domains: any[] = []
    let databases: any[] = []
    let backupSchedules: any[] = []
    let backupIntegrations: any[] = []
    let deployments: any[] = []
    let projects: any[] = [] // ✅ ADD THIS
    
    // ... rest of implementation
  }
})
```

**Location**: `convex/docks/actions.ts` around line 92-98

**Priority**: High - Required for code to work

---

### 🎯 Final Verdict

**Ready to implement.** The suggestions above are minor optimizations and don't block implementation.

**Recommended Order**:
1. ✅ Step 0: Schema changes (test in dev first)
2. ✅ Steps 1-7: Follow the improved implementations
3. ⚠️ Address the minor suggestions during implementation if time permits

**Priority Summary**:
- **High**: Fix #4 (variable declaration) - Required for code to work
- **Medium**: Fix #1 (TypeScript types) - Improves type safety
- **Medium**: Fix #2 (pagination consistency) - Better rate limiting
- **Low**: Fix #3 (retry logic) - Current implementation works, but could be improved

**GitHub Agent Notes**:
```
The document is thorough, well-reviewed, and addresses all critical concerns. 
Good work by the reviewing agents. These minor fixes will improve code quality 
and maintainability, but the plan is solid and ready for implementation.
```

---

## 📝 REVISION HISTORY

**v1.0** (2024-11-12) - Initial revision document created
- Incorporated feedback from initial review
- Added critical issues section
- Added Convex Agent Notes sections throughout
- Structured for collaborative review

**v1.1** (2024-11-13) - GitHub Agent Review Added
- Added GitHub agent review section with 4 minor suggestions
- All suggestions validated and documented
- Priority levels assigned to each fix
- Ready for implementation with minor optimizations noted

**v1.2** (2024-11-13) - Improved Implementations Updated
- Incorporated all GitHub agent suggestions into improved implementations
- Added `requestWithHeaders()` method for pagination consistency
- Updated `syncProjects` to use extended type (`GitHubRepositoryWithDetails`)
- Updated actions implementation to declare `projects` variable
- Improved network error detection in retry logic
- All code examples now reflect final approved approach

---

---

## 📋 IMPROVED IMPLEMENTATIONS

### Improved API Client Request Method

**File**: `convex/docks/adapters/github/api.ts`

**Note**: Includes GitHub agent's improvements for better network error detection.

```typescript
private async request<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  const url = `${this.baseURL}${endpoint}`
  const headers = {
    "Authorization": `Bearer ${this.apiKey}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "StackDock/1.0",
    ...options?.headers,
  }

  try {
    const response = await fetch(url, { 
      ...options, 
      headers,
      signal: AbortSignal.timeout(30000) // 30-second timeout
    })

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After")
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000
      await new Promise(resolve => setTimeout(resolve, delay))
      // ✅ Keep retries same for 429 (rate limits are temporary, not errors)
      return this.request<T>(endpoint, options, retries)
    }

    // Check rate limit remaining
    const remaining = response.headers.get("X-RateLimit-Remaining")
    if (remaining && parseInt(remaining) < 100) {
      // Safety buffer: delay if getting close to limit
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`GitHub API error (${response.status}): ${errorText}`)
    }

    return response.json()
  } catch (error) {
    // ✅ Improved network error detection (GitHub agent suggestion)
    const isNetworkError = error instanceof TypeError && 
      (error.message.includes('fetch') || 
       error.message.includes('network') ||
       error.message.includes('timeout') ||
       error.name === 'AbortError')
    
    if (retries > 0 && isNetworkError) {
      const delay = Math.pow(2, 3 - retries) * 1000 // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay))
      // ✅ Decrement retries for network errors (429 keeps retries same)
      return this.request<T>(endpoint, options, retries - 1)
    }
    throw error
  }
}
```

### Request With Headers Method (For Pagination)

**File**: `convex/docks/adapters/github/api.ts`

**Note**: Added per GitHub agent suggestion #2 for pagination consistency.

```typescript
/**
 * Request method that returns both data and headers
 * Used for pagination (needs Link headers)
 */
private async requestWithHeaders<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<{ data: T; headers: Headers }> {
  const url = `${this.baseURL}${endpoint}`
  const headers = {
    "Authorization": `Bearer ${this.apiKey}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "StackDock/1.0",
    ...options?.headers,
  }

  try {
    const response = await fetch(url, { 
      ...options, 
      headers,
      signal: AbortSignal.timeout(30000)
    })

    // Handle rate limiting (same as request method)
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After")
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000
      await new Promise(resolve => setTimeout(resolve, delay))
      return this.requestWithHeaders<T>(endpoint, options, retries)
    }

    // Check rate limit remaining
    const remaining = response.headers.get("X-RateLimit-Remaining")
    if (remaining && parseInt(remaining) < 100) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`GitHub API error (${response.status}): ${errorText}`)
    }

    return {
      data: await response.json(),
      headers: response.headers
    }
  } catch (error) {
    // Same improved network error detection as request()
    const isNetworkError = error instanceof TypeError && 
      (error.message.includes('fetch') || 
       error.message.includes('network') ||
       error.message.includes('timeout') ||
       error.name === 'AbortError')
    
    if (retries > 0 && isNetworkError) {
      const delay = Math.pow(2, 3 - retries) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      return this.requestWithHeaders<T>(endpoint, options, retries - 1)
    }
    throw error
  }
}
```

### Improved Pagination Helper

**File**: `convex/docks/adapters/github/api.ts`

**Note**: Updated per GitHub agent suggestion #2 to use `requestWithHeaders()` for consistency and rate limiting.

```typescript
async listRepositories(apiKey: string): Promise<GitHubRepository[]> {
  const allRepos: GitHubRepository[] = []
  let url = "/user/repos?per_page=100"
  
  while (url) {
    // ✅ Use requestWithHeaders() to get both data and headers (GitHub agent suggestion)
    const { data: repos, headers } = await this.requestWithHeaders<GitHubRepository[]>(url)
    allRepos.push(...repos)
    
    // Parse Link header for next page
    const linkHeader = headers.get("Link")
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<([^>]+)>; rel="next"/)
      if (nextMatch) {
        const nextUrl = new URL(nextMatch[1])
        url = nextUrl.pathname + nextUrl.search
      } else {
        url = null // No more pages
      }
    } else {
      // Fallback: page-based pagination
      if (repos.length === 100) {
        const currentPage = parseInt(new URL(url, this.baseURL).searchParams.get("page") || "1")
        url = `/user/repos?per_page=100&page=${currentPage + 1}`
      } else {
        url = null // Last page
      }
    }
  }
  
  return allRepos
}
```

### Improved Team/Client Helper Functions

**File**: `convex/docks/adapters/github/adapter.ts`

```typescript
async function getOrCreateDefaultTeam(
  ctx: MutationCtx, 
  orgId: Id<"organizations">
): Promise<Id<"teams">> {
  // Try to find existing team first
  const existingTeam = await ctx.db
    .query("teams")
    .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
    .first()
  
  if (existingTeam) {
    return existingTeam._id
  }
  
  // Create default team with clear naming
  return await ctx.db.insert("teams", {
    orgId,
    name: "GitHub Sync - Default Team",
  })
}

async function getOrCreateDefaultClient(
  ctx: MutationCtx, 
  orgId: Id<"organizations">
): Promise<Id<"clients">> {
  // Try to find existing client first
  const existingClient = await ctx.db
    .query("clients")
    .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
    .first()
  
  if (existingClient) {
    return existingClient._id
  }
  
  // Create default client with clear naming
  return await ctx.db.insert("clients", {
    orgId,
    name: "GitHub Sync - Default Client",
  })
}
```

### Corrected syncProjects Implementation

**File**: `convex/docks/adapters/github/adapter.ts`

**Note**: Updated per GitHub agent suggestion #1 to use extended type for type safety.

```typescript
// ✅ Extended type for repositories with branches/issues (GitHub agent suggestion #1)
type GitHubRepositoryWithDetails = GitHubRepository & {
  branches?: GitHubBranch[]
  issues?: GitHubIssue[]
}

async syncProjects(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: GitHubRepositoryWithDetails[] // ✅ Use extended type
): Promise<void> {
  // preFetchedData should already include branches/issues from action
  if (!preFetchedData || preFetchedData.length === 0) {
    console.log("[GitHub] No repositories to sync")
    return
  }

  // Get team/client IDs once
  const teamId = await getOrCreateDefaultTeam(ctx, dock.orgId)
  const clientId = await getOrCreateDefaultClient(ctx, dock.orgId)

  for (const repo of preFetchedData) {
    // ✅ Type-safe access to branches/issues (GitHub agent suggestion #1)
    const branches = repo.branches || []
    const issues = repo.issues || []
    
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_githubRepo", (q) => 
        q.eq("orgId", dock.orgId).eq("githubRepo", repo.full_name)
      )
      .first()

    const projectData = {
      orgId: dock.orgId,
      teamId,
      clientId,
      name: repo.name,
      githubRepo: repo.full_name,
      fullApiData: {
        repository: repo, // Complete repo object
        branches, // ✅ Type-safe
        issues, // ✅ Type-safe
      },
    }

    if (existing) {
      await ctx.db.patch(existing._id, projectData)
    } else {
      await ctx.db.insert("projects", projectData)
    }
  }
}
```

### Improved Actions Implementation (Batching)

**File**: `convex/docks/actions.ts`

**Note**: Updated per GitHub agent suggestion #4 to ensure `projects` variable is declared at the top.

```typescript
export const syncDockResources = internalAction({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // ✅ Declare all variables at the top (GitHub agent suggestion #4)
    let servers: any[] = []
    let webServices: any[] = []
    let domains: any[] = []
    let databases: any[] = []
    let backupSchedules: any[] = []
    let backupIntegrations: any[] = []
    let deployments: any[] = []
    let projects: any[] = [] // ✅ ADD THIS
    
    // ... existing provider cases ...
    
    } else if (args.provider === "github") {
      const GitHubAPI = (await import("./adapters/github/api")).GitHubAPI
      const api = new GitHubAPI(args.apiKey)

      if (args.resourceTypes.includes("projects")) {
        console.log(`[Dock Action] Fetching repositories for ${args.provider}`)
        const repos = await api.listRepositories(args.apiKey)

        // Batch process repos (5 at a time) to respect rate limits
        const batchSize = 5
        const reposWithDetails = []
        
        for (let i = 0; i < repos.length; i += batchSize) {
          const batch = repos.slice(i, i + batchSize)
          
          const batchResults = await Promise.all(
            batch.map(async (repo) => {
              const [owner, repoName] = repo.full_name.split("/")
              
              try {
                const [branches, issues] = await Promise.all([
                  api.listBranches(args.apiKey, owner, repoName).catch((err) => {
                    console.error(`Failed to fetch branches for ${repo.full_name}:`, err)
                    return []
                  }),
                  api.listIssues(args.apiKey, owner, repoName, { state: "all" }).catch((err) => {
                    console.error(`Failed to fetch issues for ${repo.full_name}:`, err)
                    return []
                  }),
                ])
                
                return {
                  ...repo,
                  branches,
                  issues,
                }
              } catch (error) {
                console.error(`Failed to process ${repo.full_name}:`, error)
                return { ...repo, branches: [], issues: [] }
              }
            })
          )
          
          reposWithDetails.push(...batchResults)
          
          // Add delay between batches (not between individual repos)
          if (i + batchSize < repos.length) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        projects = reposWithDetails
      }

      // GitHub doesn't support other resource types
      if (args.resourceTypes.includes("servers")) {
        servers = []
      }
      if (args.resourceTypes.includes("webServices")) {
        webServices = []
      }
      if (args.resourceTypes.includes("domains")) {
        domains = []
      }
      if (args.resourceTypes.includes("databases")) {
        databases = []
      }
    }
    
    // ... rest of action implementation ...
    
    // ✅ Update log to include projects count
    console.log(`[Dock Action] Sync complete: ${servers.length} servers, ${webServices.length} webServices, ${domains.length} domains, ${databases.length} databases, ${deployments.length} deployments, ${backupSchedules.length} backup schedules, ${backupIntegrations.length} backup integrations, ${projects.length} projects`)
    
    // ... mutation call with projects ...
  }
})
```

---

**Next Steps**:
1. ✅ Convex agent reviews and adds notes - **COMPLETE**
2. ✅ Address any flagged issues - **FIXES DOCUMENTED ABOVE**
3. ✅ Iterate until all parties agree - **APPROVED WITH FIXES**
4. **Implement Step 0: Update Projects Schema** - Add `fullApiData` field and `by_githubRepo` index
5. **Test schema changes in dev environment** - Verify no breaking changes
6. **Proceed with implementation steps 1-7** - Follow improved implementations above
