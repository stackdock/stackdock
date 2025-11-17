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
   * Make authenticated request to Sentry API and return both data and headers
   * Used for pagination when cursor is in Link headers
   */
  private async requestWithHeaders<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; headers: Headers }> {
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

    const data = await response.json()
    return { data, headers: response.headers }
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
   * Parse cursor from Sentry Link header
   * Link header format: <https://sentry.io/api/0/organizations/{org}/issues/?cursor=...>; rel="next"
   */
  private parseCursorFromLinkHeader(linkHeader: string | null): string | null {
    if (!linkHeader) return null

    // Find rel="next" entry
    const nextMatch = linkHeader.match(/<([^>]+)>; rel="next"/)
    if (!nextMatch) return null

    try {
      const nextUrl = new URL(nextMatch[1])
      return nextUrl.searchParams.get("cursor")
    } catch {
      return null
    }
  }

  /**
   * List issues at organization level (more efficient)
   * Returns array of issues directly (each issue has project embedded)
   * 
   * Note: Sentry API returns bare arrays with pagination cursor in Link headers,
   * not in the response body. This method parses Link headers to extract cursor.
   */
  async listOrgIssues(organizationSlug: string): Promise<SentryIssue[]> {
    const allIssues: SentryIssue[] = []
    let cursor: string | null = null

    // Sentry uses cursor-based pagination with Link headers
    do {
      const params = new URLSearchParams()
      if (cursor) {
        params.set("cursor", cursor)
      }
      params.set("per_page", "100")

      const endpoint = `/organizations/${organizationSlug}/issues/?${params.toString()}`
      const { data: response, headers } = await this.requestWithHeaders<
        SentryIssue[] | {
          data?: SentryIssue[]
          next_cursor?: string | null
          prev_cursor?: string | null
        }
      >(endpoint)

      // Handle both formats: direct array or wrapped in { data: [...] }
      let issues: SentryIssue[] = []
      let nextCursor: string | null = null

      if (Array.isArray(response)) {
        // Direct array format - cursor is in Link header
        issues = response
        const linkHeader = headers.get("Link")
        nextCursor = this.parseCursorFromLinkHeader(linkHeader)
      } else if (response.data) {
        // Wrapped format - cursor might be in body or Link header
        issues = response.data
        nextCursor = response.next_cursor || null
        // If no cursor in body, check Link header
        if (!nextCursor) {
          const linkHeader = headers.get("Link")
          nextCursor = this.parseCursorFromLinkHeader(linkHeader)
        }
      }

      if (issues.length > 0) {
        allIssues.push(...issues)
      }

      cursor = nextCursor || null
    } while (cursor)

    return allIssues
  }

  /**
   * List all issues across all projects
   * Uses organization-level endpoint first (more efficient), falls back to per-project if needed
   */
  async listAllIssues(): Promise<Array<{ project: SentryProject; issues: SentryIssue[] }>> {
    const projects = await this.listProjects()
    
    if (projects.length === 0) {
      return []
    }

    // Get organization slug from first project (all projects in same org)
    const organizationSlug = projects[0].organization.slug

    // Try organization-level endpoint first (more efficient)
    try {
      console.log(`[Sentry] Fetching issues at organization level: ${organizationSlug}`)
      const orgIssues = await this.listOrgIssues(organizationSlug)
      console.log(`[Sentry] Fetched ${orgIssues.length} issues from organization endpoint`)

      // Group issues by project
      const projectMap = new Map<string, SentryProject>()
      for (const project of projects) {
        projectMap.set(project.slug, project)
      }

      const results: Array<{ project: SentryProject; issues: SentryIssue[] }> = []
      
      // Group issues by project slug
      const issuesByProject = new Map<string, SentryIssue[]>()
      for (const issue of orgIssues) {
        const projectSlug = issue.project?.slug
        if (projectSlug) {
          if (!issuesByProject.has(projectSlug)) {
            issuesByProject.set(projectSlug, [])
          }
          issuesByProject.get(projectSlug)!.push(issue)
        }
      }

      // Create results array with project info
      for (const project of projects) {
        const issues = issuesByProject.get(project.slug) || []
        results.push({ project, issues })
      }

      console.log(`[Sentry] Grouped ${orgIssues.length} issues into ${results.length} projects`)
      return results
    } catch (error) {
      console.log(`[Sentry] Organization-level fetch failed, falling back to per-project:`, error)
      // Fallback to per-project fetching
      const results: Array<{ project: SentryProject; issues: SentryIssue[] }> = []

      for (const project of projects) {
        try {
          const issues = await this.listIssues(project.organization.slug, project.slug)
          results.push({ project, issues })
        } catch (error) {
          console.error(`[Sentry] Failed to fetch issues for project ${project.slug}:`, error)
          // Continue with other projects even if one fails
          results.push({ project, issues: [] })
        }
      }

      return results
    }
  }
}
