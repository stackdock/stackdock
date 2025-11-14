/**
 * GitHub API Client
 * 
 * Handles all HTTP requests to GitHub API v4
 * 
 * @see https://docs.github.com/en/rest?apiVersion=2022-11-28
 * @see docks/github/ for API response examples
 */

import type { GitHubUser, GitHubRepository, GitHubBranch, GitHubIssue } from "./types"

export class GitHubAPI {
  private apiKey: string
  private baseURL = "https://api.github.com"

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim()
  }

  /**
   * Make authenticated request to GitHub API
   * Includes rate limiting, retry logic, and error handling
   */
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
        // Keep retries same for 429 (rate limits are temporary, not errors)
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
      // Improved network error detection
      const isNetworkError = error instanceof TypeError && 
        (error.message.includes('fetch') || 
         error.message.includes('network') ||
         error.message.includes('timeout') ||
         error.name === 'AbortError')
      
      if (retries > 0 && isNetworkError) {
        const delay = Math.pow(2, 3 - retries) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
        // Decrement retries for network errors (429 keeps retries same)
        return this.request<T>(endpoint, options, retries - 1)
      }
      throw error
    }
  }

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

  /**
   * Validate API credentials
   * Uses lightweight GET /user endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      await this.request<GitHubUser>("/user")
      return true
    } catch (error) {
      console.error("[GitHub] Credential validation failed:", error)
      return false
    }
  }

  /**
   * List all repositories for the authenticated user
   * Handles pagination using Link headers
   */
  async listRepositories(): Promise<GitHubRepository[]> {
    const allRepos: GitHubRepository[] = []
    let url = "/user/repos?per_page=100"
    
    while (url) {
      // Use requestWithHeaders() to get both data and headers
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
          url = "" // No more pages
        }
      } else {
        // Fallback: page-based pagination
        if (repos.length === 100) {
          const currentPage = parseInt(new URL(url, this.baseURL).searchParams.get("page") || "1")
          url = `/user/repos?per_page=100&page=${currentPage + 1}`
        } else {
          url = "" // Last page
        }
      }
    }
    
    return allRepos
  }

  /**
   * List all branches for a repository
   * Handles pagination
   */
  async listBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    const allBranches: GitHubBranch[] = []
    let url = `/repos/${owner}/${repo}/branches?per_page=100`
    
    while (url) {
      const { data: branches, headers } = await this.requestWithHeaders<GitHubBranch[]>(url)
      allBranches.push(...branches)
      
      // Parse Link header for next page
      const linkHeader = headers.get("Link")
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<([^>]+)>; rel="next"/)
        if (nextMatch) {
          const nextUrl = new URL(nextMatch[1])
          url = nextUrl.pathname + nextUrl.search
        } else {
          url = ""
        }
      } else {
        // Fallback: page-based pagination
        if (branches.length === 100) {
          const currentPage = parseInt(new URL(url, this.baseURL).searchParams.get("page") || "1")
          url = `/repos/${owner}/${repo}/branches?per_page=100&page=${currentPage + 1}`
        } else {
          url = ""
        }
      }
    }
    
    return allBranches
  }

  /**
   * List all issues for a repository
   * Filters out pull requests (checks pull_request field)
   * Handles pagination
   */
  async listIssues(owner: string, repo: string, options?: { state?: "open" | "closed" | "all" }): Promise<GitHubIssue[]> {
    const allIssues: GitHubIssue[] = []
    const state = options?.state || "all"
    let url = `/repos/${owner}/${repo}/issues?state=${state}&per_page=100`
    
    while (url) {
      const { data: items, headers } = await this.requestWithHeaders<GitHubIssue[]>(url)
      
      // Filter out pull requests (they have pull_request field)
      const issues = items.filter(item => !item.pull_request)
      allIssues.push(...issues)
      
      // Parse Link header for next page
      const linkHeader = headers.get("Link")
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<([^>]+)>; rel="next"/)
        if (nextMatch) {
          const nextUrl = new URL(nextMatch[1])
          url = nextUrl.pathname + nextUrl.search
        } else {
          url = ""
        }
      } else {
        // Fallback: page-based pagination
        if (items.length === 100) {
          const currentPage = parseInt(new URL(url, this.baseURL).searchParams.get("page") || "1")
          url = `/repos/${owner}/${repo}/issues?state=${state}&per_page=100&page=${currentPage + 1}`
        } else {
          url = ""
        }
      }
    }
    
    return allIssues
  }

  /**
   * List commits for a repository
   * Supports pagination for on-demand fetching
   * 
   * @param owner - Repository owner (username or org)
   * @param repo - Repository name
   * @param options - Pagination options
   * @param options.limit - Number of commits per page (default: 10)
   * @param options.page - Page number (1-indexed, default: 1)
   * @returns Array of commits for the specified page
   */
  async listCommits(owner: string, repo: string, options?: { limit?: number; page?: number }): Promise<any[]> {
    const limit = options?.limit || 10 // Default to 10 commits per page
    const page = options?.page || 1 // Default to page 1
    const url = `/repos/${owner}/${repo}/commits?per_page=${limit}&page=${page}`
    
    // Fetch specific page of commits
    const { data: commits } = await this.requestWithHeaders<any[]>(url)
    
    return commits || []
  }

  /**
   * List all pull requests for a repository
   * Uses dedicated /pulls endpoint (not /issues)
   * Handles pagination
   * 
   * @param owner - Repository owner (username or org)
   * @param repo - Repository name
   * @param options - Filter options
   * @param options.state - Filter by state: "open", "closed", or "all" (default: "all")
   * @returns Array of pull requests
   */
  async listPullRequests(
    owner: string, 
    repo: string, 
    options?: { state?: "open" | "closed" | "all" }
  ): Promise<any[]> {
    const allPRs: any[] = []
    const state = options?.state || "all"
    let url = `/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`
    
    while (url) {
      const { data: prs, headers } = await this.requestWithHeaders<any[]>(url)
      allPRs.push(...prs)
      
      // Parse Link header for next page
      const linkHeader = headers.get("Link")
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<([^>]+)>; rel="next"/)
        if (nextMatch) {
          const nextUrl = new URL(nextMatch[1])
          url = nextUrl.pathname + nextUrl.search
        } else {
          url = ""
        }
      } else {
        // Fallback: page-based pagination
        if (prs.length === 100) {
          const currentPage = parseInt(new URL(url, this.baseURL).searchParams.get("page") || "1")
          url = `/repos/${owner}/${repo}/pulls?state=${state}&per_page=100&page=${currentPage + 1}`
        } else {
          url = ""
        }
      }
    }
    
    return allPRs
  }
}
