# GitHub Adapter Implementation - Expert Prompt

**Purpose**: Create a comprehensive guide for implementing the GitHub adapter for StackDock's Mission 7 Phase 3 (Projects & Monitoring Providers).

**Context**: StackDock is building a read-only infrastructure MVP. We need to integrate GitHub to populate the Projects page with repository data, branches, and issues. This is part of Mission 7 Phase 3, which focuses on simple API key auth providers before tackling complex auth IaaS providers.

---

## 🎯 Objective

Implement a GitHub dock adapter that:
1. **Syncs GitHub repositories** → Maps to StackDock's `projects` table
2. **Syncs repository branches** → Stores in `fullApiData` or related structure
3. **Syncs repository issues** → Stores in `fullApiData` or related structure
4. **Focuses on "Code" section** → Repos, branches, issues (we'll expand later)

**Goal**: Enable users to see all their GitHub repositories, branches, and issues in StackDock's unified Projects interface.

---

## 📚 Reference Documentation

**GitHub REST API Docs**: https://docs.github.com/en/rest?apiVersion=2022-11-28

**Key Endpoints Needed**:
- **Repositories**: https://docs.github.com/en/rest/repos/repos#list-repositories-for-the-authenticated-user
- **Branches**: https://docs.github.com/en/rest/branches/branches#list-branches
- **Issues**: https://docs.github.com/en/rest/issues/issues#list-issues-assigned-to-the-authenticated-user

**Authentication**: Personal Access Token (PAT) with read-only permissions

---

## 🏗️ StackDock Architecture Context

### Adapter Pattern

StackDock uses a **dock adapter pattern** where each provider implements a `DockAdapter` interface. The adapter translates provider-specific APIs into StackDock's universal schema.

**Key Files**:
- `convex/docks/_types.ts` - DockAdapter interface definition
- `convex/docks/adapters/{provider}/` - Provider-specific adapter implementation
- `convex/docks/registry.ts` - Adapter registration
- `convex/docks/actions.ts` - External API calls (actions can use fetch)
- `convex/docks/mutations.ts` - Database operations (mutations cannot use fetch)

### Universal Schema

StackDock uses **universal tables** that accept data from ANY provider:

```typescript
// Projects table (from convex/schema.ts)
projects: defineTable({
  orgId: v.id("organizations"),
  teamId: v.id("teams"),
  clientId: v.id("clients"),
  name: v.string(), // "Client A Website"
  linearId: v.optional(v.string()),
  githubRepo: v.optional(v.string()), // e.g., "owner/repo"
})
  .index("by_orgId", ["orgId"])
  .index("by_teamId", ["teamId"])
  .index("by_clientId", ["clientId"])
```

**Key Principle**: Provider-specific data goes in `fullApiData` field. Universal fields are standardized.

### Existing Adapter Examples

**Reference Adapters** (for pattern consistency):
- `convex/docks/adapters/vercel/` - Vercel adapter (web services)
- `convex/docks/adapters/neon/` - Neon adapter (databases)
- `convex/docks/adapters/convex/` - Convex adapter (projects + deployments)

**Adapter Structure**:
```
convex/docks/adapters/github/
├── api.ts          # GitHub API client (fetch calls)
├── types.ts        # TypeScript interfaces from API responses
├── adapter.ts      # DockAdapter implementation
└── index.ts        # Exports
```

---

## 🔑 Authentication Requirements

### Personal Access Token (PAT)

**Type**: Fine-grained Personal Access Token (recommended) OR Classic PAT

**Required Permissions** (Read-only):
- **Repository permissions**:
  - `metadata: Read` (required)
  - `contents: Read` (for branches)
  - `issues: Read` (for issues)
  - `pull_requests: Read` (optional, for future)

**How to Create**:
1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Generate new token
3. Select repository access (all repositories or specific ones)
4. Grant read-only permissions listed above
5. Copy token (only shown once)

**Authentication Format**:
```typescript
// GitHub API uses Bearer token
Authorization: Bearer <PAT_TOKEN>
```

**Validation Endpoint**:
- `GET /user` - Lightweight endpoint to validate token
- Returns user info if valid, 401 if invalid

---

## 📋 Required Endpoints

### 1. List Repositories

**Endpoint**: `GET /user/repos`  
**Docs**: https://docs.github.com/en/rest/repos/repos#list-repositories-for-the-authenticated-user

**Query Parameters**:
- `type: "all" | "owner" | "member"` - Filter by repository type (default: "all")
- `sort: "created" | "updated" | "pushed" | "full_name"` - Sort order (default: "full_name")
- `direction: "asc" | "desc"` - Sort direction (default: "desc")
- `per_page: number` - Results per page (max: 100, default: 30)
- `page: number` - Page number

**Pagination**: GitHub uses Link headers for pagination. Handle pagination properly.

**Response Fields Needed**:
- `id` - Repository ID (use as `providerResourceId`)
- `name` - Repository name
- `full_name` - Full name (owner/repo) → use for `githubRepo` field
- `description` - Repository description
- `private` - Is private
- `fork` - Is fork
- `archived` - Is archived
- `disabled` - Is disabled
- `default_branch` - Default branch name
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `pushed_at` - Last push timestamp
- `language` - Primary language
- `stargazers_count` - Star count
- `forks_count` - Fork count
- `open_issues_count` - Open issues count
- `owner.login` - Owner username
- `owner.type` - Owner type ("User" or "Organization")

**Mapping to Projects Table**:
```typescript
{
  orgId: dock.orgId,
  dockId: dock._id,
  provider: "github",
  providerResourceId: repo.id.toString(),
  name: repo.name,
  githubRepo: repo.full_name, // "owner/repo"
  // Store all GitHub-specific data in fullApiData
  fullApiData: {
    ...repo, // Complete repository object
    // Add computed fields if needed
  }
}
```

### 2. List Branches (per repository)

**Endpoint**: `GET /repos/{owner}/{repo}/branches`  
**Docs**: https://docs.github.com/en/rest/branches/branches#list-branches

**Query Parameters**:
- `per_page: number` - Results per page (max: 100, default: 30)
- `page: number` - Page number

**Response Fields Needed**:
- `name` - Branch name
- `commit.sha` - Latest commit SHA
- `commit.url` - Commit API URL
- `protected` - Is protected branch
- `commit.commit.author.date` - Last commit date

**Storage Strategy**: Store branches in `fullApiData.branches` array on the project record, or create a separate structure. For MVP, storing in `fullApiData` is acceptable.

**Note**: This endpoint is called per repository. You'll need to iterate through all repos and fetch branches for each.

### 3. List Issues (per repository)

**Endpoint**: `GET /repos/{owner}/{repo}/issues`  
**Docs**: https://docs.github.com/en/rest/issues/issues#list-repository-issues

**Query Parameters**:
- `state: "open" | "closed" | "all"` - Filter by state (default: "open")
- `sort: "created" | "updated" | "comments"` - Sort order (default: "created")
- `direction: "asc" | "desc"` - Sort direction (default: "desc")
- `per_page: number` - Results per page (max: 100, default: 30)
- `page: number` - Page number

**Response Fields Needed**:
- `id` - Issue ID
- `number` - Issue number
- `title` - Issue title
- `body` - Issue body/description
- `state` - Issue state ("open" or "closed")
- `user.login` - Creator username
- `assignees[]` - Array of assignees
- `labels[]` - Array of labels
- `comments` - Comment count
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `closed_at` - Close timestamp (if closed)
- `pull_request` - Pull request info (if PR)

**Storage Strategy**: Store issues in `fullApiData.issues` array on the project record, or create a separate structure. For MVP, storing in `fullApiData` is acceptable.

**Note**: This endpoint returns both issues AND pull requests. Filter out PRs if needed (check `pull_request` field).

---

## 🛠️ Implementation Tasks

### Task 1: Create API Client (`api.ts`)

**File**: `convex/docks/adapters/github/api.ts`

**Required Methods**:
1. `validateCredentials(apiKey: string): Promise<boolean>`
   - Call `GET /user` to validate token
   - Return `true` if 200-299, `false` otherwise

2. `listRepositories(apiKey: string, options?: { type?: string, sort?: string, per_page?: number }): Promise<GitHubRepository[]>`
   - Call `GET /user/repos` with pagination
   - Handle pagination (Link headers or page parameter)
   - Return array of repositories

3. `listBranches(apiKey: string, owner: string, repo: string): Promise<GitHubBranch[]>`
   - Call `GET /repos/{owner}/{repo}/branches`
   - Handle pagination
   - Return array of branches

4. `listIssues(apiKey: string, owner: string, repo: string, options?: { state?: string }): Promise<GitHubIssue[]>`
   - Call `GET /repos/{owner}/{repo}/issues`
   - Handle pagination
   - Filter out pull requests if needed (check `pull_request` field)
   - Return array of issues

**Base URL**: `https://api.github.com`

**Headers**:
```typescript
{
  "Authorization": `Bearer ${apiKey}`,
  "Accept": "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "StackDock/1.0"
}
```

**Error Handling**:
- Handle rate limiting (429 status) - GitHub has strict rate limits
- Handle 401 (invalid token)
- Handle 403 (insufficient permissions)
- Handle 404 (repository not found)

**Rate Limiting**:
- Authenticated requests: 5,000 requests/hour
- Use `X-RateLimit-Remaining` header to track remaining requests
- Implement exponential backoff on 429 errors

### Task 2: Create TypeScript Types (`types.ts`)

**File**: `convex/docks/adapters/github/types.ts`

**Required Interfaces**:
1. `GitHubRepository` - Repository object from API
2. `GitHubBranch` - Branch object from API
3. `GitHubIssue` - Issue object from API
4. `GitHubUser` - User object (for validation)

**Source**: Use actual API responses to generate types. You can test with:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/user/repos
```

### Task 3: Create Adapter Implementation (`adapter.ts`)

**File**: `convex/docks/adapters/github/adapter.ts`

**Required Methods** (from `DockAdapter` interface):

1. `validateCredentials(apiKey: string): Promise<boolean>`
   - Call `GitHubAPI.validateCredentials(apiKey)`

2. `syncProjects(ctx: MutationCtx, dock: Doc<"docks">, preFetchedData?: GitHubRepository[]): Promise<void>`
   - **NEW METHOD** - Not in current interface, but needed for GitHub
   - Fetch repositories (or use preFetchedData)
   - For each repository:
     - Check if exists in `projects` table (by `dockId` + `providerResourceId`)
     - Upsert: Update if exists, insert if new
     - Map GitHub fields to projects table:
       - `providerResourceId`: `repo.id.toString()`
       - `name`: `repo.name`
       - `githubRepo`: `repo.full_name`
       - `fullApiData`: Complete repo object + branches + issues

**Note**: Since `syncProjects` doesn't exist in the interface yet, you may need to:
- Add it to `convex/docks/_types.ts` (DockAdapter interface)
- Update `convex/docks/mutations.ts` to call `syncProjects` if adapter implements it
- Or use a workaround (store in `fullApiData` of a different table temporarily)

**For MVP**: We can add `syncProjects` to the interface, or store repos in a way that can be migrated later.

### Task 4: Register Adapter (`index.ts` + `registry.ts`)

**File**: `convex/docks/adapters/github/index.ts`
```typescript
export { githubAdapter } from "./adapter"
export { GitHubAPI } from "./api"
export type { GitHubRepository, GitHubBranch, GitHubIssue } from "./types"
```

**File**: `convex/docks/registry.ts`
- Import `githubAdapter`
- Add to `adapterRegistry`:
  ```typescript
  github: githubAdapter,
  ```
- Add to `providerMetadata`:
  ```typescript
  github: {
    displayName: "GitHub",
    category: "projects", // or "code"
    authType: "api_key", // PAT token
    supportsProjects: true,
  },
  ```

### Task 5: Update Actions (`actions.ts`)

**File**: `convex/docks/actions.ts`

**Add GitHub case to `syncDockResources` action**:
```typescript
case "github": {
  const GitHubAPI = (await import("./adapters/github/api")).GitHubAPI
  const api = new GitHubAPI(args.apiKey)
  
  // Fetch repositories
  const repos = await api.listRepositories()
  
  // For each repo, fetch branches and issues
  const reposWithDetails = await Promise.all(
    repos.map(async (repo) => {
      const [owner, repoName] = repo.full_name.split("/")
      const [branches, issues] = await Promise.all([
        api.listBranches(owner, repoName).catch(() => []), // Handle errors gracefully
        api.listIssues(owner, repoName, { state: "all" }).catch(() => []),
      ])
      
      return {
        ...repo,
        branches,
        issues,
      }
    })
  )
  
  return {
    projects: reposWithDetails, // Pass to mutation
  }
}
```

**Note**: Handle rate limiting carefully. GitHub has strict limits. Consider:
- Batching requests
- Adding delays between requests
- Caching results

### Task 6: Update Mutations (`mutations.ts`)

**File**: `convex/docks/mutations.ts`

**Add GitHub case to `syncDockResourcesMutation`**:
```typescript
if (args.fetchedData.projects && adapter.syncProjects) {
  await adapter.syncProjects(ctx, dock, args.fetchedData.projects)
}
```

**Note**: This requires adding `syncProjects` to the `DockAdapter` interface first.

---

## 📝 API Response Examples

### Repository Response
```json
{
  "id": 123456789,
  "name": "stackdock",
  "full_name": "stackdock/stackdock",
  "description": "Open Source Multi-Cloud Management Platform",
  "private": false,
  "fork": false,
  "archived": false,
  "disabled": false,
  "default_branch": "main",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-11-12T00:00:00Z",
  "pushed_at": "2024-11-12T00:00:00Z",
  "language": "TypeScript",
  "stargazers_count": 100,
  "forks_count": 10,
  "open_issues_count": 5,
  "owner": {
    "login": "stackdock",
    "type": "Organization"
  }
}
```

### Branch Response
```json
{
  "name": "main",
  "commit": {
    "sha": "abc123...",
    "url": "https://api.github.com/repos/stackdock/stackdock/commits/abc123"
  },
  "protected": true
}
```

### Issue Response
```json
{
  "id": 123456,
  "number": 42,
  "title": "Add GitHub adapter",
  "body": "Implement GitHub adapter for Mission 7 Phase 3",
  "state": "open",
  "user": {
    "login": "username"
  },
  "assignees": [],
  "labels": [
    {
      "name": "enhancement",
      "color": "a2eeef"
    }
  ],
  "comments": 3,
  "created_at": "2024-11-01T00:00:00Z",
  "updated_at": "2024-11-12T00:00:00Z",
  "closed_at": null,
  "pull_request": null
}
```

---

## ✅ Success Criteria

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

**Testing Checklist**:
- [ ] Can add GitHub dock with PAT token
- [ ] Can sync repositories (all repos appear in projects table)
- [ ] Branches stored in `fullApiData.branches`
- [ ] Issues stored in `fullApiData.issues`
- [ ] Pagination works (handles 100+ repos)
- [ ] Rate limiting handled (doesn't crash on 429)
- [ ] Invalid token shows proper error

---

## 🚀 Quick Start Guide

**For the GitHub Expert**:

1. **Review existing adapters**:
   - `convex/docks/adapters/vercel/` - Good example of API client pattern
   - `convex/docks/adapters/neon/` - Good example of pagination handling

2. **Create adapter structure**:
   ```bash
   mkdir -p convex/docks/adapters/github
   touch convex/docks/adapters/github/{api.ts,types.ts,adapter.ts,index.ts}
   ```

3. **Test API endpoints**:
   ```bash
   # Get your PAT token from GitHub
   export GITHUB_TOKEN="your_token_here"
   
   # Test endpoints
   curl -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        https://api.github.com/user/repos
   ```

4. **Implement incrementally**:
   - Start with `validateCredentials()`
   - Then `listRepositories()`
   - Then `listBranches()` and `listIssues()`
   - Finally `syncProjects()`

5. **Follow StackDock patterns**:
   - Use `decryptApiKey()` for API keys
   - Use upsert pattern (check existing, update or insert)
   - Store provider-specific data in `fullApiData`
   - Handle errors gracefully
   - Log important operations

---

## 📚 Additional Resources

- **GitHub REST API Docs**: https://docs.github.com/en/rest?apiVersion=2022-11-28
- **GitHub Authentication**: https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api
- **GitHub Rate Limiting**: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- **GitHub Pagination**: https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api

---

## 🎯 Focus Areas

**For MVP (Mission 7 Phase 3)**:
- ✅ Repositories → Projects table
- ✅ Branches → `fullApiData.branches`
- ✅ Issues → `fullApiData.issues`
- ⏳ Pull Requests → Defer (can add later)
- ⏳ Commits → Defer (can add later)
- ⏳ Actions/Workflows → Defer (can add later)

**Priority**: Get basic repo/branch/issue sync working first. We can expand later.

---

**Questions?** Review existing adapters or check `convex/docks/_types.ts` for interface requirements.

**Ready to start?** Begin with `api.ts` - create the GitHub API client with `validateCredentials()` and `listRepositories()` methods.
