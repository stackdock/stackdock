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
   * Returns JSON response only (headers discarded)
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
   * Parse Link header to extract pagination cursor
   * Sentry uses Link headers with rel="next" and rel="previous"
   * Format: <url>; rel="next", <url>; rel="previous"
   * Returns the cursor parameter from the next URL, or null if no next link
   */
  private parseLinkHeader(linkHeader: string | null): string | null {
    if (!linkHeader) return null

    // Find rel="next" link
    const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/i)
    if (!nextMatch) return null

    const nextUrl = nextMatch[1]
    
    try {
      // Handle both absolute and relative URLs
      // If relative, resolve against baseUrl
      const url = nextUrl.startsWith("http")
        ? new URL(nextUrl)
        : new URL(nextUrl, this.baseUrl)
      
      const cursor = url.searchParams.get("cursor")
      return cursor
    } catch (error) {
      console.warn(`[Sentry API] Failed to parse Link header URL: ${nextUrl}`, error)
      return null
    }
  }

  /**
   * Fetch paginated data from Sentry API
   * Sentry returns plain JSON arrays and pagination via Link headers
   * This method handles pagination by parsing Link headers
   */
  private async fetchPaginated<T>(
    endpoint: string,
    params: URLSearchParams = new URLSearchParams()
  ): Promise<T[]> {
    const allItems: T[] = []
    let cursor: string | null = null

    do {
      const currentParams = new URLSearchParams(params)
      if (cursor) {
        currentParams.set("cursor", cursor)
      }
      currentParams.set("per_page", "100")

      const url = `${this.baseUrl}${endpoint}?${currentParams.toString()}`
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(
          `Sentry API error (${response.status}): ${errorText}`
        )
      }

      // Sentry returns plain JSON arrays
      const items: T[] = await response.json()
      if (Array.isArray(items) && items.length > 0) {
        allItems.push(...items)
      }

      // Parse Link header for next cursor
      const linkHeader = response.headers.get("Link")
      cursor = this.parseLinkHeader(linkHeader)

      // If we got less than per_page items, we're done (no more pages)
      if (items.length < 100) {
        break
      }
    } while (cursor)

    return allItems
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
   * 
   * Sentry API returns plain JSON arrays (not wrapped objects)
   * Pagination is handled via Link headers (rel="next")
   * 
   * @param organizationSlug Organization slug
   * @param projectSlug Project slug
   */
  async listIssues(organizationSlug: string, projectSlug: string): Promise<SentryIssue[]> {
    return this.fetchPaginated<SentryIssue>(
      `/projects/${organizationSlug}/${projectSlug}/issues/`
    )
  }

  /**
   * List all issues for an organization
   * Uses organization-level endpoint which is more efficient
   * 
   * Sentry API returns plain JSON arrays (not wrapped objects)
   * Pagination is handled via Link headers (rel="next")
   * 
   * @param organizationSlug Organization slug
   */
  async listOrgIssues(organizationSlug: string): Promise<SentryIssue[]> {
    return this.fetchPaginated<SentryIssue>(
      `/organizations/${organizationSlug}/issues/`
    )
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
