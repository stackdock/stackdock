/**
 * DigitalOcean API Client
 * 
 * Handles all HTTP requests to DigitalOcean API v2
 * 
 * @see https://docs.digitalocean.com/reference/api/api-reference/
 * @see docks/digitalocean/api-routes.md
 */

import type { DigitalOceanDroplet, DigitalOceanAccount, DigitalOceanVolume } from "./types"

export class DigitalOceanAPI {
  private baseUrl: string
  private apiToken: string

  constructor(apiToken: string, baseUrl: string = "https://api.digitalocean.com/v2") {
    this.apiToken = apiToken.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to DigitalOcean API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(
        `DigitalOcean API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /account endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/account`
      console.log(`[DigitalOcean] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[DigitalOcean] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[DigitalOcean] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[DigitalOcean] API error (${response.status}): ${errorText}`)
        throw new Error(
          `DigitalOcean API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[DigitalOcean] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[DigitalOcean] Validation error:`, error)
      if (error instanceof Error) {
        throw new Error(
          `Failed to validate DigitalOcean credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all droplets
   * Returns array of droplets (servers)
   * 
   * @see docks/digitalocean/getDroplets.json for actual API response
   */
  async listDroplets(): Promise<DigitalOceanDroplet[]> {
    const response = await this.request<{
      droplets: DigitalOceanDroplet[]
      links: Record<string, any>
      meta: {
        total: number
      }
    }>("/droplets")
    // Response format: { droplets: [...], links: {}, meta: { total: number } }
    return response.droplets || []
  }

  /**
   * List all volumes (block storage)
   * Returns array of volumes
   * 
   * @see docks/digitalocean/getVolumes.json for actual API response
   */
  async listVolumes(): Promise<DigitalOceanVolume[]> {
    const response = await this.request<{
      volumes: DigitalOceanVolume[]
      links: Record<string, any>
      meta: {
        total: number
      }
    }>("/volumes")
    // Response format: { volumes: [...], links: {}, meta: { total: number } }
    return response.volumes || []
  }

  /**
   * Get account information
   * Used for credential validation
   */
  async getAccount(): Promise<DigitalOceanAccount> {
    return await this.request<DigitalOceanAccount>("/account")
  }
}
