/**
 * Sentry API Client
 * 
 * Handles all HTTP requests to Sentry API
 * 
 * @see https://docs.sentry.io/api/
 */

import type { SentryProject, SentryIssue } from "./types"

export class SentryAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://sentry.io/api/0") {
    this.apiKey = apiKey.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Sentry API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(
        `Sentry API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /projects/ endpoint (first page only)
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/projects/`
      console.log(`[Sentry] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Sentry] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Sentry] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Sentry] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Sentry API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Sentry] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Sentry] Validation error:`, error)
      if (error instanceof Error) {
        throw new Error(
          `Failed to validate Sentry credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all projects
   * Returns array of projects
   */
  async listProjects(): Promise<SentryProject[]> {
    const response = await this.request<SentryProject[]>(`/projects/`)
    return response || []
  }

  /**
   * List issues for a project
   * Returns array of issues
   * 
   * @param organizationSlug Organization slug
   * @param projectSlug Project slug
   */
  async listIssues(organizationSlug: string, projectSlug: string): Promise<SentryIssue[]> {
    const allIssues: SentryIssue[] = []
    let cursor: string | null = null

    // Sentry uses cursor-based pagination
    do {
      const params = new URLSearchParams()
      if (cursor) {
        params.set("cursor", cursor)
      }
      params.set("per_page", "100")

      const response = await this.request<{
        data: SentryIssue[]
        next_cursor: string | null
        prev_cursor: string | null
      }>(`/projects/${organizationSlug}/${projectSlug}/issues/?${params.toString()}`)

      if (response.data && response.data.length > 0) {
        allIssues.push(...response.data)
      }

      cursor = response.next_cursor || null
    } while (cursor)

    return allIssues
  }

  /**
   * List all issues for an organization
   * Uses organization-level endpoint which is more efficient
   * Handles both response formats: direct array or wrapped in { data: [...] }
   */
  async listOrgIssues(organizationSlug: string): Promise<SentryIssue[]> {
    const allIssues: SentryIssue[] = []
    let cursor: string | null = null

    // Sentry uses cursor-based pagination
    do {
      const params = new URLSearchParams()
      if (cursor) {
        params.set("cursor", cursor)
      }
      params.set("per_page", "100")

      // Organization-level endpoint - handle both response formats
      const response = await this.request<any>(`/organizations/${organizationSlug}/issues/?${params.toString()}`)

      // Handle both formats: direct array or wrapped in { data: [...] }
      let issues: SentryIssue[] = []
      let nextCursor: string | null = null

      if (Array.isArray(response)) {
        // Direct array format (from listOrgIssues.json)
        issues = response
        // Note: Direct array format might not have cursor info in response
        // We'll need to check if there are more pages differently
      } else if (response.data && Array.isArray(response.data)) {
        // Wrapped format: { data: [...], next_cursor: ... }
        issues = response.data
        nextCursor = response.next_cursor || null
      } else {
        console.warn(`[Sentry API] Unexpected response format from org issues endpoint:`, typeof response)
        break
      }

      if (issues.length > 0) {
        allIssues.push(...issues)
      }

      // If we got less than per_page items, we're done (for direct array format)
      if (Array.isArray(response) && issues.length < 100) {
        break
      }

      cursor = nextCursor
    } while (cursor)

    return allIssues
  }

  /**
   * List all issues across all projects
   * Uses organization-level endpoint for efficiency, then groups by project
   */
  async listAllIssues(): Promise<Array<{ project: SentryProject; issues: SentryIssue[] }>> {
    const projects = await this.listProjects()
    
    // Get organization slug from first project (all projects in same org)
    if (projects.length === 0) {
      return []
    }
    
    const organizationSlug = projects[0].organization.slug
    console.log(`[Sentry API] Fetching organization-level issues for org: ${organizationSlug}`)
    
    // Fetch all issues at organization level (more efficient)
    let allIssues: SentryIssue[]
    try {
      allIssues = await this.listOrgIssues(organizationSlug)
      console.log(`[Sentry API] Fetched ${allIssues.length} issues from organization endpoint`)
    } catch (error) {
      console.error(`[Sentry] Failed to fetch organization issues:`, error)
      // Fallback to per-project fetching
      console.log(`[Sentry API] Falling back to per-project fetching`)
      const results: Array<{ project: SentryProject; issues: SentryIssue[] }> = []
      for (const project of projects) {
        try {
          const issues = await this.listIssues(project.organization.slug, project.slug)
          results.push({ project, issues })
        } catch (err) {
          console.error(`[Sentry] Failed to fetch issues for project ${project.slug}:`, err)
          results.push({ project, issues: [] })
        }
      }
      return results
    }

    // Group issues by project slug
    const projectMap = new Map<string, SentryProject>()
    projects.forEach(p => {
      projectMap.set(p.slug, p)
    })

    const results: Array<{ project: SentryProject; issues: SentryIssue[] }> = []
    const issuesByProject = new Map<string, SentryIssue[]>()

    // Group issues by project
    for (const issue of allIssues) {
      const projectSlug = issue.project.slug
      if (!issuesByProject.has(projectSlug)) {
        issuesByProject.set(projectSlug, [])
      }
      issuesByProject.get(projectSlug)!.push(issue)
    }

    // Create results array with project info
    for (const [projectSlug, issues] of issuesByProject.entries()) {
      const project = projectMap.get(projectSlug)
      if (project) {
        results.push({ project, issues })
      } else {
        // Project not in projects list, but has issues - create minimal project from issue data
        // Use first issue's project data and fill in required fields with defaults
        const firstIssue = issues[0]
        const minimalProject: SentryProject = {
          id: firstIssue.project.id,
          slug: firstIssue.project.slug,
          name: firstIssue.project.name,
          platform: firstIssue.platform || null,
          dateCreated: new Date().toISOString(), // Not available, use current time
          firstEvent: null,
          features: [],
          status: "active",
          isBookmarked: false,
          organization: {
            slug: organizationSlug,
            id: "", // Not available in issue response
            name: "", // Not available in issue response
          },
          isMember: true,
          color: "",
        }
        results.push({ project: minimalProject, issues })
      }
    }

    // Add projects with no issues
    for (const project of projects) {
      if (!issuesByProject.has(project.slug)) {
        results.push({ project, issues: [] })
      }
    }

    return results
  }
}
