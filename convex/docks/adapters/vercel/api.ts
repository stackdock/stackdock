/**
 * Vercel API Client
 * 
 * Handles all HTTP requests to Vercel API
 * 
 * @see docks/vercel/ for API response examples
 */

import type {
  VercelProjectsResponse,
  VercelProject,
  VercelUser,
} from "./types"

export class VercelAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://api.vercel.com") {
    this.apiKey = apiKey.trim() // Remove any whitespace
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Vercel API
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
        `Vercel API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /v2/user endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/v2/user`
      console.log(`[Vercel] Validating credentials against: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Vercel] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Vercel] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Vercel] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Vercel API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Vercel] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Vercel] Validation error:`, error)
      if (error instanceof Error) {
        // Re-throw with more context for debugging
        throw new Error(
          `Failed to validate Vercel credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * Get all projects
   * GET /v9/projects
   * 
   * Note: Vercel API uses pagination. For MVP, fetch first page only.
   * Can add pagination support later if needed.
   */
  async getProjects(): Promise<VercelProject[]> {
    const response = await this.request<VercelProjectsResponse>(
      "/v9/projects"
    )
    return response.projects
  }

  /**
   * Get single project by ID
   * GET /v9/projects/{id}
   */
  async getProject(projectId: string): Promise<VercelProject> {
    return await this.request<VercelProject>(`/v9/projects/${projectId}`)
  }
}
