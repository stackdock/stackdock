/**
 * Vultr API Client
 * 
 * Handles all HTTP requests to Vultr API v2
 * 
 * @see https://docs.vultr.com/api/
 * @see docks/vultr/api-routes.md
 */

import type { VultrInstance, VultrAccount } from "./types"

export class VultrAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://api.vultr.com/v2") {
    this.apiKey = apiKey.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Vultr API
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
        `Vultr API error (${response.status}): ${errorText}`
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
      console.log(`[Vultr] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Vultr] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Vultr] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Vultr] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Vultr API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Vultr] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Vultr] Validation error:`, error)
      if (error instanceof Error) {
        throw new Error(
          `Failed to validate Vultr credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all instances
   * Returns array of instances (servers)
   * 
   * @see docks/vultr/getInstances.json for actual API response
   */
  async listInstances(): Promise<VultrInstance[]> {
    const response = await this.request<{
      instances: VultrInstance[]
      meta: {
        total: number
        links: {
          next: string
          prev: string
        }
      }
    }>("/instances")
    // Response format: { instances: [...], meta: {...} }
    return response.instances || []
  }

  /**
   * Get account information
   * Used for credential validation
   */
  async getAccount(): Promise<VultrAccount> {
    return await this.request<VultrAccount>("/account")
  }
}
