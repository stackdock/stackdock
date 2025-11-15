/**
 * Hetzner Cloud API Client
 * 
 * Handles all HTTP requests to Hetzner Cloud API v1
 * 
 * @see https://docs.hetzner.cloud/
 * @see https://api.hetzner.cloud/v1/servers
 */

import type { HetznerServer, HetznerListServersResponse } from "./types"

export class HetznerAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://api.hetzner.cloud/v1") {
    this.apiKey = apiKey.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Hetzner Cloud API
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
        `Hetzner API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /servers endpoint (with limit=1 to minimize data)
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/servers?per_page=1`
      console.log(`[Hetzner] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Hetzner] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Hetzner] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Hetzner] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Hetzner API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Hetzner] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Hetzner] Validation error:`, error)
      if (error instanceof Error) {
        throw new Error(
          `Failed to validate Hetzner credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all servers
   * Returns array of servers
   * 
   * @see docks/hetzner/listServers.json for actual API response
   */
  async listServers(): Promise<HetznerServer[]> {
    const response = await this.request<HetznerListServersResponse>("/servers")
    return response.servers || []
  }
}
