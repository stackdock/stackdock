/**
 * Convex API Client
 * 
 * Handles all HTTP requests to Convex API
 * 
 * @see docks/convex/ for API response examples
 * 
 */

import type {
  ConvexTokenDetails,
  ConvexProject,
  ConvexDeployment,
} from "./types"

export class ConvexAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://api.convex.dev/v1") {
    this.apiKey = apiKey.trim() // Remove any whitespace
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Convex API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      // Convex API uses Bearer token authentication
      // Add Bearer prefix if not already present
      const authHeader = this.apiKey.startsWith("Bearer ") 
        ? this.apiKey 
        : `Bearer ${this.apiKey}`
      
      // Debug: Log token info without exposing the actual token
      console.log(`[Convex API] Making request to ${url}`)
      console.log(`[Convex API] Token length: ${this.apiKey.length}, starts with Bearer: ${this.apiKey.startsWith("Bearer ")}, first 10 chars: ${this.apiKey.substring(0, 10)}...`)
      
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(
          `Convex API error (${response.status}): ${errorText}`
        )
      }

      return response.json()
    } catch (error) {
      // Handle network errors with more context
      if (error instanceof Error) {
        // Check for tunnel/proxy errors
        if (error.message.includes("tunnel") || error.message.includes("Connect")) {
          throw new Error(
            `Convex API network error: Unable to connect to ${url}. ` +
            `This may be a temporary network issue or Convex runtime restriction. ` +
            `Original error: ${error.message}`
          )
        }
        // Re-throw with context
        throw new Error(`Convex API request failed for ${url}: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /token_details endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/token_details`
      console.log(`[Convex] Validating credentials against: ${url}`)

      // Convex API uses Bearer token authentication
      // Add Bearer prefix if not already present
      const authHeader = this.apiKey.startsWith("Bearer ") 
        ? this.apiKey 
        : `Bearer ${this.apiKey}`

      const response = await fetch(url, {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Convex] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Convex] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Convex] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Convex API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Convex] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Convex] Validation error:`, error)
      if (error instanceof Error) {
        // Re-throw with more context for debugging
        throw new Error(
          `Failed to validate Convex credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * Get token details (returns teamId)
   * 
   * @see docks/convex/getTokenDetails.json
   */
  async getTokenDetails(): Promise<ConvexTokenDetails> {
    return await this.request<ConvexTokenDetails>("/token_details")
  }

  /**
   * List projects for a team
   * 
   * @param teamId - Team ID from token details
   * @see docks/convex/listProjects.json
   */
  async listProjects(teamId: number): Promise<ConvexProject[]> {
    const response = await this.request<ConvexProject[]>(`/teams/${teamId}/list_projects`)
    // Response is array directly
    return Array.isArray(response) ? response : []
  }

  /**
   * List deployments for a project
   * 
   * @param projectId - Project ID
   * @see docks/convex/listDeployments.json
   */
  async listDeployments(projectId: number): Promise<ConvexDeployment[]> {
    const response = await this.request<ConvexDeployment[]>(`/projects/${projectId}/list_deployments`)
    // Response is array directly
    return Array.isArray(response) ? response : []
  }
}
