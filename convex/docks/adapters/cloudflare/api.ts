/**
 * Cloudflare API Client
 * 
 * Handles all HTTP requests to Cloudflare API
 * 
 * @see docks/cloudflare/ for API response examples
 */

import type {
  CloudflareZonesResponse,
  CloudflareZone,
  CloudflarePagesResponse,
  CloudflarePage,
  CloudflareWorkersResponse,
  CloudflareWorker,
  CloudflareDNSRecordsResponse,
  CloudflareDNSRecord,
  CloudflareUserResponse,
} from "./types"

export class CloudflareAPI {
  private baseUrl: string = "https://api.cloudflare.com/client/v4"
  private apiToken: string
  private accountId?: string // Optional, can be extracted from zones

  constructor(apiToken: string, accountId?: string) {
    this.apiToken = apiToken.trim() // Remove any whitespace
    this.accountId = accountId
  }

  /**
   * Make authenticated request to Cloudflare API
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
      const error = await response.json().catch(() => ({ 
        errors: [{ message: "Unknown error" }] 
      }))
      const errorMessage = error.errors?.[0]?.message || response.statusText
      throw new Error(`Cloudflare API error (${response.status}): ${errorMessage}`)
    }

    return response.json()
  }

  /**
   * Validate API token
   * GET /user/tokens/verify (for API tokens)
   * OR GET /user (for API key + email)
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // Try token verification first (preferred method)
      const response = await this.request<CloudflareUserResponse>("/user/tokens/verify")
      return response.success === true
    } catch (error) {
      // Fall back to user endpoint
      try {
        const response = await this.request<CloudflareUserResponse>("/user")
        return response.success === true
      } catch {
        console.error("[Cloudflare] Credential validation failed:", error)
        return false
      }
    }
  }

  /**
   * Get all DNS zones
   * GET /zones
   */
  async getZones(): Promise<CloudflareZone[]> {
    const response = await this.request<CloudflareZonesResponse>("/zones")
    return response.result || []
  }

  /**
   * Get DNS records for a zone
   * GET /zones/{zone_id}/dns_records
   */
  async getDNSRecords(zoneId: string): Promise<CloudflareDNSRecord[]> {
    const response = await this.request<CloudflareDNSRecordsResponse>(
      `/zones/${zoneId}/dns_records`
    )
    return response.result || []
  }

  /**
   * Get Pages projects
   * GET /accounts/{account_id}/pages/projects
   * 
   * Requires account ID (extract from zones or store in dock)
   */
  async getPages(accountId: string): Promise<CloudflarePage[]> {
    const response = await this.request<CloudflarePagesResponse>(
      `/accounts/${accountId}/pages/projects`
    )
    return response.result || []
  }

  /**
   * Get Workers scripts
   * GET /accounts/{account_id}/workers/scripts
   * 
   * Requires account ID (extract from zones or store in dock)
   */
  async getWorkers(accountId: string): Promise<CloudflareWorker[]> {
    const response = await this.request<CloudflareWorkersResponse>(
      `/accounts/${accountId}/workers/scripts`
    )
    return response.result || []
  }
}
