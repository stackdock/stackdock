/**
 * PlanetScale API Client
 * 
 * Handles all HTTP requests to PlanetScale API
 * 
 * @see docks/planetscale/ for API response examples
 */

import type {
  PlanetScaleOrganization,
  PlanetScaleDatabase,
} from "./types"

export class PlanetScaleAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://api.planetscale.com/v1") {
    this.apiKey = apiKey.trim() // Remove any whitespace
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to PlanetScale API
   * 
   * PlanetScale supports two authentication formats:
   * 1. Service tokens: Authorization: <SERVICE_TOKEN_ID>:<SERVICE_TOKEN>
   * 2. Personal access tokens: Authorization: Bearer <TOKEN>
   * 
   * This adapter auto-detects the format:
   * - If token contains ":", use as-is (service token format)
   * - Otherwise, use Bearer format (personal access token)
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      // PlanetScale authentication format detection:
      // 1. If token contains ":", it's a service token (TOKEN_ID:TOKEN) - use as-is
      // 2. If token starts with "pscale_", try without Bearer first (service token format)
      // 3. Otherwise, try Bearer format (OAuth/personal access token)
      const isServiceToken = this.apiKey.includes(":")
      const isPlanetScaleToken = this.apiKey.startsWith("pscale_")
      
      let authHeader: string
      if (isServiceToken) {
        // Service token format: TOKEN_ID:TOKEN
        authHeader = this.apiKey
      } else if (isPlanetScaleToken) {
        // PlanetScale token (pscale_*) - try without Bearer (service token might be missing ID)
        // User might need to provide TOKEN_ID:TOKEN format
        authHeader = this.apiKey
      } else {
        // OAuth/personal access token - use Bearer format
        authHeader = this.apiKey.startsWith("Bearer ") 
          ? this.apiKey 
          : `Bearer ${this.apiKey}`
      }

      // Debug: Log token info without exposing the actual token
      console.log(`[PlanetScale API] Making request to ${url}`)
      const formatDesc = isServiceToken 
        ? "service token (TOKEN_ID:TOKEN)" 
        : isPlanetScaleToken 
          ? "PlanetScale token (no Bearer) - WARNING: May need TOKEN_ID:TOKEN format" 
          : "OAuth token (Bearer)"
      console.log(`[PlanetScale API] Token length: ${this.apiKey.length}, format: ${formatDesc}`)
      if (isServiceToken) {
        const parts = this.apiKey.split(":")
        console.log(`[PlanetScale API] Token ID length: ${parts[0]?.length || 0}, Token length: ${parts[1]?.length || 0}`)
      } else {
        console.log(`[PlanetScale API] First 10 chars: ${this.apiKey.substring(0, 10)}...`)
      }
      console.log(`[PlanetScale API] Authorization header format: ${authHeader.substring(0, 20)}...`)

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
          `PlanetScale API error (${response.status}): ${errorText}`
        )
      }

      return response.json()
    } catch (error) {
      // Handle network errors with more context
      if (error instanceof Error) {
        // Check for tunnel/proxy errors
        if (error.message.includes("tunnel") || error.message.includes("Connect")) {
          throw new Error(
            `PlanetScale API network error: Unable to connect to ${url}. ` +
            `This may be a temporary network issue or PlanetScale runtime restriction. ` +
            `Original error: ${error.message}`
          )
        }
        // Re-throw with context
        throw new Error(`PlanetScale API request failed for ${url}: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /organizations endpoint
   * 
   * Supports both service tokens (TOKEN_ID:TOKEN) and personal access tokens (Bearer TOKEN)
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/organizations`
      console.log(`[PlanetScale] Validating credentials against: ${url}`)

      // Auto-detect token format (same logic as request method)
      const isServiceToken = this.apiKey.includes(":")
      const isPlanetScaleToken = this.apiKey.startsWith("pscale_")
      
      let authHeader: string
      if (isServiceToken) {
        authHeader = this.apiKey // Service token: TOKEN_ID:TOKEN
      } else if (isPlanetScaleToken) {
        authHeader = this.apiKey // PlanetScale token - try without Bearer
      } else {
        authHeader = this.apiKey.startsWith("Bearer ") 
          ? this.apiKey 
          : `Bearer ${this.apiKey}` // OAuth token: Bearer TOKEN
      }

      // Debug: Log token info without exposing the actual token
      const formatDesc = isServiceToken 
        ? "service token (TOKEN_ID:TOKEN)" 
        : isPlanetScaleToken 
          ? "PlanetScale token (no Bearer) - WARNING: May need TOKEN_ID:TOKEN format" 
          : "OAuth token (Bearer)"
      console.log(`[PlanetScale] Token length: ${this.apiKey.length}, format: ${formatDesc}`)
      if (isServiceToken) {
        const parts = this.apiKey.split(":")
        console.log(`[PlanetScale] Token ID length: ${parts[0]?.length || 0}, Token length: ${parts[1]?.length || 0}`)
      } else {
        console.log(`[PlanetScale] First 10 chars: ${this.apiKey.substring(0, 10)}...`)
      }
      console.log(`[PlanetScale] Authorization header format: ${authHeader.substring(0, 20)}...`)

      const response = await fetch(url, {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      })

      console.log(`[PlanetScale] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[PlanetScale] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[PlanetScale] API error (${response.status}): ${errorText}`)
        throw new Error(
          `PlanetScale API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[PlanetScale] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[PlanetScale] Validation error:`, error)
      if (error instanceof Error) {
        // Re-throw with more context for debugging
        throw new Error(
          `Failed to validate PlanetScale credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all organizations
   * Returns array of organizations
   * 
   * @see docks/planetscale/listOrganizations.json
   */
  async listOrganizations(): Promise<PlanetScaleOrganization[]> {
    const response = await this.request<{
      type: "list"
      data: PlanetScaleOrganization[]
      current_page: number
      next_page: number | null
      next_page_url: string | null
      prev_page: number | null
      prev_page_url: string | null
    }>("/organizations")
    // Response is wrapped: { type: "list", data: [...] }
    return response.data || []
  }

  /**
   * List databases for an organization
   * Requires organization name from listOrganizations()
   * 
   * @param organizationName - Organization name (e.g., "support-wpoperator")
   * @see docks/planetscale/listDatabases.json
   */
  async listDatabases(organizationName: string): Promise<PlanetScaleDatabase[]> {
    const response = await this.request<{
      type: "list"
      data: PlanetScaleDatabase[]
      current_page: number
      next_page: number | null
      next_page_url: string | null
      prev_page: number | null
      prev_page_url: string | null
    }>(
      `/organizations/${organizationName}/databases`
    )
    // Response is wrapped: { type: "list", data: [...] }
    return response.data || []
  }
}
