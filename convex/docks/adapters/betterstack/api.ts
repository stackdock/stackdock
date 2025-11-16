/**
 * Better Stack Better Uptime API Client
 * 
 * Handles all HTTP requests to Better Stack Better Uptime API v2/v3
 * 
 * @see https://betterstack.com/docs/uptime/api/
 */

import type { BetterStackMonitor, BetterStackMonitorGroup, BetterStackResponse } from "./types"

export class BetterStackAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://uptime.betterstack.com/api/v2") {
    this.apiKey = apiKey.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Better Stack API
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
        `Better Stack API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /monitors endpoint (first page only)
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/monitors?page=1&per_page=1`
      console.log(`[Better Stack] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Better Stack] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Better Stack] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Better Stack] API error (${response.status}): ${errorText}`)
        throw new Error(
          `Better Stack API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[Better Stack] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Better Stack] Validation error:`, error)
      if (error instanceof Error) {
        throw new Error(
          `Failed to validate Better Stack credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * List all monitors
   * Returns array of monitors
   * 
   * @see docks/better-stack/better-uptime/ListMonitors.json for actual API response
   */
  async listMonitors(): Promise<BetterStackMonitor[]> {
    const allMonitors: BetterStackMonitor[] = []
    let currentPage = 1
    let hasMore = true

    while (hasMore) {
      const response = await this.request<BetterStackResponse<BetterStackMonitor>>(
        `/monitors?page=${currentPage}&per_page=100`
      )

      if (response.data && response.data.length > 0) {
        allMonitors.push(...response.data)
      }

      // Check if there's a next page
      hasMore = response.pagination.next !== null
      currentPage++
    }

    return allMonitors
  }

  /**
   * List all monitor groups
   * Returns array of monitor groups
   * 
   * @see docks/better-stack/better-uptime/listMonitorGroups.json for actual API response
   */
  async listMonitorGroups(): Promise<BetterStackMonitorGroup[]> {
    const response = await this.request<BetterStackResponse<BetterStackMonitorGroup>>(
      "/monitor-groups"
    )
    return response.data || []
  }
}
