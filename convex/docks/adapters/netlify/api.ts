/**
 * Netlify API Client
 * 
 * Handles all HTTP requests to Netlify API
 * 
 * @see docks/netlify/ for API response examples
 */

import type {
  NetlifySite,
  NetlifyUser,
} from "./types"

export class NetlifyAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://api.netlify.com") {
    this.apiKey = apiKey.trim() // Remove any whitespace
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Netlify API
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
        `Netlify API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /api/v1/user endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/v1/user`
      console.log(`[Netlify] Validating credentials against: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Netlify] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Netlify] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Netlify] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Netlify API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Netlify] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Netlify] Validation error:`, error)
      if (error instanceof Error) {
        // Re-throw with more context for debugging
        throw new Error(
          `Failed to validate Netlify credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * Get all sites
   * GET /api/v1/sites
   * 
   * Note: Netlify API returns array directly (not wrapped in object)
   */
  async getSites(): Promise<NetlifySite[]> {
    return await this.request<NetlifySite[]>("/api/v1/sites")
  }

  /**
   * Get single site by ID
   * GET /api/v1/sites/{id}
   */
  async getSite(siteId: string): Promise<NetlifySite> {
    return await this.request<NetlifySite>(`/api/v1/sites/${siteId}`)
  }
}
