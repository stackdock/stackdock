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
   * Handles multiple organizations by fetching issues from each org separately
   * Uses organization-level endpoint for efficiency, then groups by project
   */
  async listAllIssues(): Promise<Array<{ project: SentryProject; issues: SentryIssue[] }>> {
    const projects = await this.listProjects()
    
    if (projects.length === 0) {
      return []
    }
    
    // Collect distinct organization slugs from all projects
    const orgSlugs = new Set<string>()
    const projectsByOrg = new Map<string, SentryProject[]>()
    
    for (const project of projects) {
      const orgSlug = project.organization.slug
      orgSlugs.add(orgSlug)
      if (!projectsByOrg.has(orgSlug)) {
        projectsByOrg.set(orgSlug, [])
      }
      projectsByOrg.get(orgSlug)!.push(project)
    }
    
    console.log(`[Sentry API] Found ${orgSlugs.size} organization(s) across ${projects.length} project(s)`)
    
    // Fetch issues from each organization and track which org they belong to
    const issuesByOrgSlug = new Map<string, SentryIssue[]>()
    const issueToOrgMap = new Map<string, string>() // Map issue ID to org slug
    
    for (const orgSlug of orgSlugs) {
      try {
        console.log(`[Sentry API] Fetching issues for organization: ${orgSlug}`)
        const orgIssues = await this.listOrgIssues(orgSlug)
        console.log(`[Sentry API] Fetched ${orgIssues.length} issues from org ${orgSlug}`)
        issuesByOrgSlug.set(orgSlug, orgIssues)
        // Track which org each issue belongs to
        for (const issue of orgIssues) {
          issueToOrgMap.set(issue.id, orgSlug)
        }
      } catch (error) {
        console.error(`[Sentry API] Failed to fetch issues for org ${orgSlug}:`, error)
        
        // Fallback: try per-project fetching for this org
        console.log(`[Sentry API] Falling back to per-project fetching for org ${orgSlug}`)
        const orgProjects = projectsByOrg.get(orgSlug) || []
        const fallbackIssues: SentryIssue[] = []
        for (const project of orgProjects) {
          try {
            const projectIssues = await this.listIssues(orgSlug, project.slug)
            fallbackIssues.push(...projectIssues)
            // Track which org each issue belongs to
            for (const issue of projectIssues) {
              issueToOrgMap.set(issue.id, orgSlug)
            }
          } catch (err) {
            console.error(`[Sentry API] Failed to fetch issues for project ${project.slug} in org ${orgSlug}:`, err)
          }
        }
        issuesByOrgSlug.set(orgSlug, fallbackIssues)
      }
    }
    
    // Aggregate all issues (deduplicated by ID)
    const allIssues: SentryIssue[] = []
    const seenIssueIds = new Set<string>()
    for (const orgIssues of issuesByOrgSlug.values()) {
      for (const issue of orgIssues) {
        if (!seenIssueIds.has(issue.id)) {
          seenIssueIds.add(issue.id)
          allIssues.push(issue)
        }
      }
    }
    
    console.log(`[Sentry API] Total unique issues fetched across all organizations: ${allIssues.length}`)

    // Create project map: key is `${orgSlug}/${projectSlug}` to handle same slug across orgs
    const projectMap = new Map<string, SentryProject>()
    for (const project of projects) {
      const key = `${project.organization.slug}/${project.slug}`
      projectMap.set(key, project)
    }

    const results: Array<{ project: SentryProject; issues: SentryIssue[] }> = []
    const issuesByProject = new Map<string, SentryIssue[]>()

    // Group issues by project (using org/project key)
    for (const issue of allIssues) {
      const projectSlug = issue.project.slug
      // Get org from our tracking map
      const orgSlug = issueToOrgMap.get(issue.id)
      
      if (!orgSlug) {
        // Fallback: try to infer from project slug (less reliable)
        for (const project of projects) {
          if (project.slug === projectSlug) {
            issueToOrgMap.set(issue.id, project.organization.slug)
            break
          }
        }
        const fallbackOrg = issueToOrgMap.get(issue.id)
        if (!fallbackOrg) {
          console.warn(`[Sentry API] Could not determine org for issue ${issue.id} in project ${projectSlug}, skipping`)
          continue
        }
      }
      
      const finalOrgSlug = orgSlug || issueToOrgMap.get(issue.id)!
      const key = `${finalOrgSlug}/${projectSlug}`
      if (!issuesByProject.has(key)) {
        issuesByProject.set(key, [])
      }
      issuesByProject.get(key)!.push(issue)
    }

    // Create results array with project info
    for (const [key, issues] of issuesByProject.entries()) {
      const project = projectMap.get(key)
      if (project) {
        results.push({ project, issues })
      } else {
        // Project not in projects list, but has issues - create minimal project from issue data
        const [orgSlug, projectSlug] = key.split("/")
        const firstIssue = issues[0]
        const issueIds = issues.map(i => i.id).join(", ")
        
        // Log warning for orphaned project
        console.warn(
          `[Sentry API] ⚠️  Creating minimal project fallback - project not found in projects list. ` +
          `Issue IDs: [${issueIds}], Project: ${firstIssue.project.name} (${firstIssue.project.slug}, id: ${firstIssue.project.id}), ` +
          `Organization: ${orgSlug || "unknown"}`
        )
        
        const minimalProject: SentryProject = {
          id: firstIssue.project.id,
          slug: firstIssue.project.slug,
          name: firstIssue.project.name,
          platform: firstIssue.platform || null,
          dateCreated: new Date().toISOString(),
          firstEvent: null,
          features: [],
          status: "active",
          isBookmarked: false,
          organization: {
            slug: orgSlug || "unknown",
            id: orgSlug || "unknown", // Use orgSlug as placeholder (not available in issue response)
            name: `Unknown (${orgSlug || "unknown"})`, // Derived placeholder from orgSlug
          },
          isMember: true,
          color: "",
        }
        results.push({ project: minimalProject, issues })
      }
    }

    // Add projects with no issues
    for (const project of projects) {
      const key = `${project.organization.slug}/${project.slug}`
      if (!issuesByProject.has(key)) {
        results.push({ project, issues: [] })
      }
    }

    return results
  }
}
