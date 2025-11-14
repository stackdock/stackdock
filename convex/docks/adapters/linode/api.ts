/**
 * Linode API Client
 * 
 * Handles all HTTP requests to Linode API v4
 * 
 * @see https://www.linode.com/api/v4
 * @see docks/linode/api-routes.md
 */

import type { LinodeInstance, LinodeAccount, LinodeBucket } from "./types"

export class LinodeAPI {
  private baseUrl: string
  private apiToken: string

  constructor(apiToken: string, baseUrl: string = "https://api.linode.com/v4") {
    this.apiToken = apiToken.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Linode API
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
        `Linode API error (${response.status}): ${errorText}`
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
      console.log(`[Linode] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Linode] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Linode] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Linode] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Linode API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Linode] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Linode] Validation error:`, error)
      if (error instanceof Error) {
        throw new Error(
          `Failed to validate Linode credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all linodes
   * Returns array of linodes (servers)
   * 
   * @see docks/linode/getLinodes.json for actual API response
   */
  async listLinodes(): Promise<LinodeInstance[]> {
    const response = await this.request<{
      data: LinodeInstance[]
      page: number
      pages: number
      results: number
    }>("/linode/instances")
    // Response format: { data: [...], page: number, pages: number, results: number }
    return response.data || []
  }

  /**
   * List all buckets (object storage)
   * Returns array of buckets
   * 
   * @see docks/linode/getBuckets.json for actual API response
   */
  async listBuckets(): Promise<LinodeBucket[]> {
    const response = await this.request<{
      data: LinodeBucket[]
      page: number
      pages: number
      results: number
    }>("/object-storage/buckets")
    // Response format: { data: [...], page: 1, pages: 1, results: 1 }
    return response.data || []
  }

  /**
   * Get account information
   * Used for credential validation
   */
  async getAccount(): Promise<LinodeAccount> {
    return await this.request<LinodeAccount>("/account")
  }
}
