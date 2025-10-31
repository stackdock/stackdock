/**
 * GridPane API Client
 * 
 * Handles all HTTP requests to GridPane OAuth API
 * 
 * @see docks/gridpane/gp oauth api documentation.postman_collection.json
 */

import type {
  GridPaneServer,
  GridPaneSite,
  GridPaneDomain,
  GridPaneUser,
  GridPaneResponse,
  GridPaneDomainResponse,
} from "./types"

export class GridPaneAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://my.gridpane.com") {
    this.apiKey = apiKey.trim() // Remove any whitespace
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to GridPane API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/oauth/api/v1${endpoint}`
    
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
        `GridPane API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /user endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/oauth/api/v1/user`
      console.log(`[GridPane] Validating credentials against: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[GridPane] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[GridPane] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[GridPane] API error (${response.status}): ${errorText}`)
        throw new Error(
          `GridPane API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[GridPane] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[GridPane] Validation error:`, error)
      if (error instanceof Error) {
        // Re-throw with more context for debugging
        throw new Error(
          `Failed to validate GridPane credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * Get all servers
   * GET /oauth/api/v1/server
   */
  async getServers(): Promise<GridPaneServer[]> {
    const response = await this.request<GridPaneResponse<GridPaneServer>>(
      "/server"
    )
    return response.data
  }

  /**
   * Get single server by ID
   * GET /oauth/api/v1/server/{id}
   */
  async getServer(serverId: number): Promise<GridPaneServer> {
    const response = await this.request<GridPaneResponse<GridPaneServer>>(
      `/server/${serverId}`
    )
    // Single server returns as array with one item
    return response.data[0]
  }

  /**
   * Get all sites
   * GET /oauth/api/v1/site
   */
  async getSites(): Promise<GridPaneSite[]> {
    const response = await this.request<GridPaneResponse<GridPaneSite>>(
      "/site"
    )
    return response.data
  }

  /**
   * Get single site by ID
   * GET /oauth/api/v1/site/{id}
   */
  async getSite(siteId: number): Promise<GridPaneSite> {
    const response = await this.request<GridPaneResponse<GridPaneSite>>(
      `/site/${siteId}`
    )
    // Single site returns as array with one item
    return response.data[0]
  }

  /**
   * Get all domains
   * GET /oauth/api/v1/domain
   * Note: This endpoint returns { data: { domains: [...] } } structure
   */
  async getDomains(): Promise<GridPaneDomain[]> {
    const response = await this.request<GridPaneDomainResponse>("/domain")
    return response.data.domains
  }

  /**
   * Get single domain by ID
   * GET /oauth/api/v1/domain/{id}
   */
  async getDomain(domainId: number): Promise<GridPaneDomain> {
    const response = await this.request<GridPaneDomainResponse>(
      `/domain/${domainId}`
    )
    // Single domain returns in domains array
    return response.data.domains[0]
  }
}
