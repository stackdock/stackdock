/**
 * GitHub API Types
 * 
 * Generated from GitHub API v4 documentation
 * 
 * @see https://docs.github.com/en/rest?apiVersion=2022-11-28
 * @see docks/github/ for API response examples
 */

/**
 * GitHub User
 * Used for credential validation
 * 
 * @see docks/github/user/getAuthenticatedUser.json
 */
export interface GitHubUser {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  type: string
  site_admin: boolean
  name: string | null
  company: string | null
  blog: string | null
  location: string | null
  email: string | null
  bio: string | null
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

/**
 * GitHub Repository
 * Repository object from /user/repos endpoint
 * 
 * @see docks/github/user/getUserRepos.json
 */
export interface GitHubRepository {
  id: number
  node_id: string
  name: string
  full_name: string // Format: "owner/repo-name"
  private: boolean
  owner: {
    login: string
    id: number
    node_id: string
    avatar_url: string
    type: string
    site_admin: boolean
  }
  html_url: string
  description: string | null
  fork: boolean
  url: string
  created_at: string
  updated_at: string
  pushed_at: string
  default_branch: string
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  archived: boolean
  disabled: boolean
  // ... other fields stored in fullApiData
}

/**
 * GitHub Branch
 * Branch object from /repos/{owner}/{repo}/branches endpoint
 * 
 * @see docks/github/repos/getRepoBranches.json
 */
export interface GitHubBranch {
  name: string
  commit: {
    sha: string
    url: string
  }
  protected: boolean
  protection?: {
    enabled: boolean
    required_status_checks: {
      enforcement_level: string
      contexts: string[]
      checks: any[]
    }
  }
  protection_url?: string
}

/**
 * GitHub Issue
 * Issue object from /repos/{owner}/{repo}/issues endpoint
 * Note: This endpoint returns both issues and PRs - filter out PRs using pull_request field
 * 
 * @see docks/github/repos/getRepoIssues.json
 */
export interface GitHubIssue {
  id: number
  node_id: string
  url: string
  repository_url: string
  labels_url: string
  comments_url: string
  events_url: string
  html_url: string
  number: number
  title: string
  user: {
    login: string
    id: number
    avatar_url: string
    type: string
  }
  state: "open" | "closed"
  locked: boolean
  assignee: any | null
  assignees: any[]
  milestone: any | null
  comments: number
  created_at: string
  updated_at: string
  closed_at: string | null
  body: string | null
  labels: Array<{
    id: number
    name: string
    color: string
    description: string | null
  }>
  pull_request?: {
    url: string
    html_url: string
    diff_url: string
    patch_url: string
  } // If present, this is a PR, not an issue
}

/**
 * Extended type for repositories with branches/issues/commits/pullRequests
 * Used in adapter when receiving pre-fetched data from action
 */
export type GitHubRepositoryWithDetails = GitHubRepository & {
  branches?: GitHubBranch[]
  issues?: GitHubIssue[]
  commits?: any[]
  pullRequests?: any[]
}
