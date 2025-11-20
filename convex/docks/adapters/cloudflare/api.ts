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

  constructor(apiToken: string, _accountId?: string) {
    this.apiToken = apiToken.trim() // Remove any whitespace
    // Note: accountId parameter kept for API compatibility but not stored
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
   * Get all DNS zones (with pagination)
   * GET /zones
   * Cloudflare API v4 uses pagination - fetches all pages
   * Uses per_page=100 to minimize number of requests
   */
  async getZones(): Promise<CloudflareZone[]> {
    const allZones: CloudflareZone[] = []
    let page = 1
    let totalPages = 1
    
    do {
      // Build URL - only add page parameter if > 1 (Cloudflare defaults to page 1)
      const url = page === 1 ? "/zones" : `/zones?page=${page}`
      
      const response = await this.request<CloudflareZonesResponse>(url)
      
      if (response.result && response.result.length > 0) {
        allZones.push(...response.result)
      }
      
      // Update pagination info from response
      if (response.result_info) {
        totalPages = response.result_info.total_pages || 1
        const currentPage = response.result_info.page || page
        
        // Move to next page
        page = currentPage + 1
      } else {
        // No pagination info - assume single page
        break
      }
    } while (page <= totalPages)
    
    return allZones
  }

  /**
   * Get DNS records for a zone (with pagination)
   * GET /zones/{zone_id}/dns_records
   * Cloudflare API v4 uses pagination - fetches all pages
   * Uses per_page=100 to minimize number of requests
   */
  async getDNSRecords(zoneId: string): Promise<CloudflareDNSRecord[]> {
    const allRecords: CloudflareDNSRecord[] = []
    let page = 1
    let totalPages = 1
    
    do {
      // Build URL - only add page parameter if > 1 (Cloudflare defaults to page 1)
      const url = page === 1 
        ? `/zones/${zoneId}/dns_records` 
        : `/zones/${zoneId}/dns_records?page=${page}`
      
      const response = await this.request<CloudflareDNSRecordsResponse>(url)
      
      if (response.result && response.result.length > 0) {
        allRecords.push(...response.result)
      }
      
      // Update pagination info from response
      if (response.result_info) {
        totalPages = response.result_info.total_pages || 1
        const currentPage = response.result_info.page || page
        
        // Move to next page
        page = currentPage + 1
      } else {
        // No pagination info - assume single page
        break
      }
    } while (page <= totalPages)
    
    return allRecords
  }

  /**
   * Get Pages projects (with pagination)
   * GET /accounts/{account_id}/pages/projects
   * 
   * Requires account ID (extract from zones or store in dock)
   * Cloudflare API v4 uses pagination - fetches all pages
   * Uses per_page=100 to minimize number of requests
   */
  async getPages(accountId: string): Promise<CloudflarePage[]> {
    const allPages: CloudflarePage[] = []
    let page = 1
    let totalPages = 1
    
    do {
      // Build URL - only add page parameter if > 1 (Cloudflare defaults to page 1)
      const url = page === 1 
        ? `/accounts/${accountId}/pages/projects` 
        : `/accounts/${accountId}/pages/projects?page=${page}`
      
      const response = await this.request<CloudflarePagesResponse>(url)
      
      if (response.result && response.result.length > 0) {
        allPages.push(...response.result)
      }
      
      // Update pagination info from response
      if (response.result_info) {
        totalPages = response.result_info.total_pages || 1
        const currentPage = response.result_info.page || page
        
        // Move to next page
        page = currentPage + 1
      } else {
        // No pagination info - assume single page
        break
      }
    } while (page <= totalPages)
    
    return allPages
  }

  /**
   * Get Workers scripts (with pagination)
   * GET /accounts/{account_id}/workers/scripts
   * 
   * Requires account ID (extract from zones or store in dock)
   * Cloudflare API v4 uses pagination - fetches all pages
   * Note: Workers API doesn't return total_pages, so we calculate it from total_count
   * Uses per_page=100 to minimize number of requests
   */
  async getWorkers(accountId: string): Promise<CloudflareWorker[]> {
    const allWorkers: CloudflareWorker[] = []
    let page = 1
    let totalPages = 1
    
    do {
      // Build URL - only add page parameter if > 1 (Cloudflare defaults to page 1)
      const url = page === 1 
        ? `/accounts/${accountId}/workers/scripts` 
        : `/accounts/${accountId}/workers/scripts?page=${page}`
      
      const response = await this.request<CloudflareWorkersResponse>(url)
      
      if (response.result && response.result.length > 0) {
        allWorkers.push(...response.result)
      }
      
      // Update pagination info from response
      if (response.result_info) {
        const currentPage = response.result_info.page || page
        const totalCount = response.result_info.total_count || 0
        const perPage = response.result_info.per_page || 20
        
        // Workers API doesn't provide total_pages, calculate from total_count
        totalPages = Math.ceil(totalCount / perPage) || 1
        
        // Move to next page
        page = currentPage + 1
      } else {
        // No pagination info, assume single page
        break
      }
    } while (page <= totalPages)
    
    return allWorkers
  }
}
