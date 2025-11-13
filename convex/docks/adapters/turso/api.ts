/**
 * Turso API Client
 * 
 * Handles all HTTP requests to Turso API
 * 
 * @see docks/turso/ for API response examples
 */

import type {
  TursoOrg,
  TursoDatabase,
  TursoGroup,
} from "./types"

export class TursoAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://api.turso.tech/v1") {
    this.apiKey = apiKey.trim() // Remove any whitespace
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Turso API
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
        `Turso API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /organizations endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/organizations`
      console.log(`[Turso] Validating credentials against: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Turso] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Turso] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Turso] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Turso API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Turso] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Turso] Validation error:`, error)
      if (error instanceof Error) {
        // Re-throw with more context for debugging
        throw new Error(
          `Failed to validate Turso credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all organizations
   * Returns array of orgs with slugs
   * 
   * @see docks/turso/org/listOrgs.json
   */
  async listOrgs(): Promise<TursoOrg[]> {
    const response = await this.request<TursoOrg[]>("/organizations")
    // Response is array directly (not wrapped)
    return Array.isArray(response) ? response : []
  }

  /**
   * List databases for an organization
   * Requires org slug from listOrgs()
   * 
   * @param orgSlug - Organization slug (e.g., "wpoperator")
   * @see docks/turso/database/listDatabases.json
   */
  async listDatabases(orgSlug: string): Promise<TursoDatabase[]> {
    const response = await this.request<{ databases: TursoDatabase[] }>(
      `/organizations/${orgSlug}/databases`
    )
    // Response is { databases: [...] } - extract databases array
    return response.databases || []
  }

  /**
   * List groups for an organization (optional, for metadata)
   * 
   * @param orgSlug - Organization slug
   * @see docks/turso/group/listGroups.json
   */
  async listGroups(orgSlug: string): Promise<TursoGroup[]> {
    const response = await this.request<{ groups: TursoGroup[] }>(
      `/organizations/${orgSlug}/groups`
    )
    // Response is { groups: [...] } - extract groups array
    return response.groups || []
  }
}
