/**
 * Neon API Client
 * 
 * Handles all HTTP requests to Neon API
 * 
 * @see docks/neon/ for API response examples
 */

import type {
  NeonProject,
  NeonBranch,
  NeonDatabase,
  NeonSnapshot,
} from "./types"

export class NeonAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://console.neon.tech/api/v2") {
    this.apiKey = apiKey.trim() // Remove any whitespace
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Neon API
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
        `Neon API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /projects endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/projects`
      console.log(`[Neon] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Neon] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Neon] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Neon] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Neon API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Neon] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Neon] Validation error:`, error)
      if (error instanceof Error) {
        // Re-throw with more context for debugging
        throw new Error(
          `Failed to validate Neon credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all projects
   * Returns array of projects
   * 
   * @see docks/neon/project/listProjects.json
   */
  async listProjects(): Promise<NeonProject[]> {
    const response = await this.request<{ projects: NeonProject[] }>("/projects")
    // Response is { projects: [...] }
    return response.projects || []
  }

  /**
   * List branches for a project
   * 
   * @param projectId - Project ID
   * @see docks/neon/branch/listBranches.json
   */
  async listBranches(projectId: string): Promise<NeonBranch[]> {
    const response = await this.request<{ branches: NeonBranch[] }>(
      `/projects/${projectId}/branches`
    )
    // Response is { branches: [...] }
    return response.branches || []
  }

  /**
   * List databases for a branch
   * 
   * @param projectId - Project ID
   * @param branchId - Branch ID
   */
  async listDatabases(projectId: string, branchId: string): Promise<NeonDatabase[]> {
    const response = await this.request<{ databases: NeonDatabase[] }>(
      `/projects/${projectId}/branches/${branchId}/databases`
    )
    // Response is { databases: [...] }
    return response.databases || []
  }

  /**
   * List snapshots for a project
   * 
   * @param projectId - Project ID
   * @see docks/neon/snapshot/listSnapshots.json
   */
  async listSnapshots(projectId: string): Promise<NeonSnapshot[]> {
    const response = await this.request<{ snapshots: NeonSnapshot[] }>(
      `/projects/${projectId}/snapshots`
    )
    // Response is { snapshots: [...] }
    return response.snapshots || []
  }
}
