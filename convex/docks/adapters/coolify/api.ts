/**
 * Coolify API Client
 * 
 * Handles all HTTP requests to Coolify API v1
 * 
 * @see https://coolify.io/docs/api
 * @see docks/coolify/endpoints.md
 */

import type { CoolifyServer, CoolifyService, CoolifyProject } from "./types"

export class CoolifyAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://app.coolify.io/api/v1") {
    this.apiKey = apiKey.trim()
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to Coolify API
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      throw new Error(`Coolify API error (${response.status}): ${errorText}`)
    }

    return response.json()
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /health endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/health`
      console.log(`[Coolify] Validating credentials against: ${url}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[Coolify] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Coolify] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[Coolify] API error (${response.status}): ${errorText}`)
        throw new Error(`Coolify API error (${response.status}): ${errorText}`)
      }

      // If we get here, credentials are valid
      console.log(`[Coolify] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[Coolify] Validation error:`, error)
      if (error instanceof Error) {
        throw new Error(`Failed to validate Coolify credentials: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * List all servers
   * Returns array of servers
   * 
   * @see docks/coolify/listServers.json for actual API response
   */
  async listServers(): Promise<CoolifyServer[]> {
    return this.request<CoolifyServer[]>("/servers")
  }

  /**
   * List all services
   * Returns array of services (contains applications and databases)
   * 
   * @see docks/coolify/getServices.json for actual API response
   */
  async listServices(): Promise<CoolifyService[]> {
    return this.request<CoolifyService[]>("/services")
  }

  /**
   * List all projects
   * Returns array of projects
   * 
   * @see docks/coolify/listProjects.json for actual API response
   */
  async listProjects(): Promise<CoolifyProject[]> {
    return this.request<CoolifyProject[]>("/projects")
  }
}
