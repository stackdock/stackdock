/**
 * GridPane API Client
 * 
 * Handles all HTTP requests to GridPane OAuth API
 * 
 * @see docks/gridpane/gp oauth api documentation.postman_collection.json
 */

import type {
  GridPaneServer,
  GridPaneSite,
  GridPaneDomain,
  GridPaneUser,
  GridPaneResponse,
  GridPanePaginatedResponse,
  GridPaneDomainResponse,
  GridPaneIntegration,
  GridPaneBackupIntegration,
  GridPaneBackupSchedule,
  GridPaneSiteBackupSchedules,
  GridPanePruneSchedule,
} from "./types"

export class GridPaneAPI {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, baseUrl: string = "https://my.gridpane.com") {
    this.apiKey = apiKey.trim() // Remove any whitespace
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to GridPane API
   * Returns data and headers for rate limit detection
   */
  private async requestWithHeaders<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; headers: Record<string, string | undefined> }> {
    const url = `${this.baseUrl}/oauth/api/v1${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    // Extract rate limit headers (case-insensitive)
    const headers: Record<string, string | undefined> = {}
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      if (
        lowerKey.includes("ratelimit") ||
        lowerKey.includes("rate-limit") ||
        lowerKey === "retry-after" ||
        lowerKey === "x-ratelimit-remaining" ||
        lowerKey === "x-ratelimit-limit" ||
        lowerKey === "x-ratelimit-reset"
      ) {
        headers[lowerKey] = value
      }
    })

    if (!response.ok) {
      // Handle 429 Rate Limit specifically
      if (response.status === 429) {
        const retryAfter = headers["retry-after"] || headers["x-ratelimit-reset"]
        const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 60
        throw new Error(
          `GridPane API rate limit exceeded. Retry after ${waitSeconds} seconds. ` +
          `Rate limit info: ${JSON.stringify(headers)}`
        )
      }
      
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(
        `GridPane API error (${response.status}): ${errorText}`
      )
    }

    const data = await response.json()
    
    // Log rate limit info for debugging
    if (headers["x-ratelimit-remaining"] || headers["ratelimit-remaining"]) {
      console.log(`[GridPane API] Rate limit info for ${endpoint}:`, {
        remaining: headers["x-ratelimit-remaining"] || headers["ratelimit-remaining"],
        total: headers["x-ratelimit-limit"] || headers["ratelimit-limit"],
        reset: headers["x-ratelimit-reset"] || headers["ratelimit-reset"],
      })
    }

    return { data, headers }
  }

  /**
   * Make authenticated request (backward compatible)
   * Use requestWithHeaders internally for pagination support
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { data } = await this.requestWithHeaders<T>(endpoint, options)
    return data
  }

  /**
   * Detect if response has pagination metadata
   * Checks for meta.last_page (most reliable indicator)
   */
  private hasPagination(response: any): response is GridPanePaginatedResponse<any> {
    return (
      response &&
      typeof response === "object" &&
      "meta" in response &&
      response.meta &&
      typeof response.meta === "object" &&
      "last_page" in response.meta &&
      "current_page" in response.meta &&
      "per_page" in response.meta &&
      typeof response.meta.last_page === "number" &&
      response.meta.last_page > 1
    )
  }

  /**
   * Fetch all pages for a paginated endpoint
   * Automatically detects pagination and crawls all pages
   * Respects rate limits by checking headers and adding delays
   * 
   * @param endpoint - API endpoint (e.g., "/site", "/server")
   * @param options - Optional fetch options
   * @returns Array of all items from all pages
   */
  private async fetchAllPages<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T[]> {
    const allItems: T[] = []
    let currentPage = 1
    let hasMorePages = true
    let lastResponseHeaders: Record<string, string | undefined> = {}
    
    // Default delay between requests (ms) - can be adjusted based on rate limits
    let delayBetweenRequests = 500 // 500ms = 2 requests/second max
    
    console.log(`[GridPane API] Starting pagination crawl for ${endpoint}`)
    
    while (hasMorePages) {
      // Build URL with page parameter
      const pageEndpoint = endpoint.includes("?") 
        ? `${endpoint}&page=${currentPage}`
        : `${endpoint}?page=${currentPage}`
      
      try {
        const { data, headers } = await this.requestWithHeaders<GridPaneResponse<T>>(
          pageEndpoint,
          options
        )
        
        lastResponseHeaders = headers
        
        // Extract items from response
        const items = Array.isArray(data) ? data : (data as any).data || []
        allItems.push(...items)
        
        console.log(
          `[GridPane API] Fetched page ${currentPage}: ${items.length} items ` +
          `(total so far: ${allItems.length})`
        )
        
        // Check if response has pagination metadata
        if (this.hasPagination(data)) {
          const meta = (data as GridPanePaginatedResponse<T>).meta!
          console.log(
            `[GridPane API] Pagination detected: page ${meta.current_page}/${meta.last_page}, ` +
            `per_page: ${meta.per_page}, total: ${meta.total}`
          )
          
          hasMorePages = meta.current_page < meta.last_page
          currentPage = meta.current_page + 1
          
          // Adjust delay based on rate limit headers
          if (headers["x-ratelimit-remaining"]) {
            const remaining = parseInt(headers["x-ratelimit-remaining"], 10)
            // If we're getting low on requests, slow down
            if (remaining < 10) {
              delayBetweenRequests = 2000 // 2 seconds between requests
              console.log(`[GridPane API] Rate limit low (${remaining} remaining), slowing down`)
            } else if (remaining < 50) {
              delayBetweenRequests = 1000 // 1 second between requests
            } else {
              delayBetweenRequests = 500 // Normal speed
            }
          }
        } else {
          // No pagination metadata - assume single page
          hasMorePages = false
          console.log(`[GridPane API] No pagination detected, single page response`)
        }
        
        // Wait before next request (unless it's the last page)
        if (hasMorePages) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenRequests))
        }
        
      } catch (error) {
        // Handle rate limit errors specifically
        if (error instanceof Error && error.message.includes("rate limit")) {
          const retryAfterMatch = error.message.match(/Retry after (\d+) seconds/)
          const waitSeconds = retryAfterMatch ? parseInt(retryAfterMatch[1], 10) : 60
          
          console.warn(
            `[GridPane API] Rate limit hit, waiting ${waitSeconds} seconds before retry...`
          )
          
          await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000))
          
          // Retry the same page
          continue
        }
        
        // Re-throw other errors
        throw error
      }
    }
    
    console.log(
      `[GridPane API] Pagination crawl complete for ${endpoint}: ` +
      `${allItems.length} total items across ${currentPage - 1} page(s)`
    )
    
    return allItems
  }

  /**
   * Validate API credentials
   * Uses lightweight GET /user endpoint
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/oauth/api/v1/user`
      console.log(`[GridPane] Validating credentials against: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[GridPane] Response status: ${response.status}`)

      if (response.status === 401) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[GridPane] 401 Unauthorized: ${errorText}`)
        return false
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.log(`[GridPane] API error (${response.status}): ${errorText}`)
        throw new Error(
          `GridPane API error (${response.status}): ${errorText}`
        )
      }

      // If we get here, credentials are valid
      console.log(`[GridPane] Credentials validated successfully`)
      return true
    } catch (error) {
      // Network errors or other issues
      console.error(`[GridPane] Validation error:`, error)
      if (error instanceof Error) {
        // Re-throw with more context for debugging
        throw new Error(
          `Failed to validate GridPane credentials: ${error.message}`
        )
      }
      throw error
    }
  }

  /**
   * Get all servers (with pagination support)
   * GET /oauth/api/v1/server
   */
  async getServers(): Promise<GridPaneServer[]> {
    return this.fetchAllPages<GridPaneServer>("/server")
  }

  /**
   * Get single server by ID
   * GET /oauth/api/v1/server/{id}
   */
  async getServer(serverId: number): Promise<GridPaneServer> {
    const response = await this.request<GridPaneResponse<GridPaneServer>>(
      `/server/${serverId}`
    )
    // Single server returns as array with one item
    return response.data[0]
  }

  /**
   * Get all sites (with pagination support)
   * GET /oauth/api/v1/site
   */
  async getSites(): Promise<GridPaneSite[]> {
    return this.fetchAllPages<GridPaneSite>("/site")
  }

  /**
   * Get single site by ID
   * GET /oauth/api/v1/site/{id}
   */
  async getSite(siteId: number): Promise<GridPaneSite> {
    const response = await this.request<GridPaneResponse<GridPaneSite>>(
      `/site/${siteId}`
    )
    // Single site returns as array with one item
    return response.data[0]
  }

  /**
   * Get all domains (with pagination support)
   * GET /oauth/api/v1/domain
   * Note: This endpoint returns { data: { domains: [...] } } structure
   * May be paginated - handle nested structure with pagination
   */
  async getDomains(): Promise<GridPaneDomain[]> {
    // Domains endpoint uses nested structure: { data: { domains: [...] } }
    // May be paginated - fetch all pages manually
    const allDomains: GridPaneDomain[] = []
    let currentPage = 1
    let hasMorePages = true
    
    while (hasMorePages) {
      const { data } = await this.requestWithHeaders<
        | GridPaneDomainResponse
        | (GridPaneDomainResponse & { meta?: { current_page: number; last_page: number; per_page: number; total: number } })
      >(`/domain?page=${currentPage}`)
      
      // Extract domains from nested structure
      if (data && typeof data === "object" && "data" in data && typeof data.data === "object" && "domains" in data.data) {
        const domains = (data as GridPaneDomainResponse).data.domains
        allDomains.push(...domains)
        
        // Check for pagination in meta
        if (
          "meta" in data &&
          data.meta &&
          typeof data.meta === "object" &&
          "last_page" in data.meta &&
          "current_page" in data.meta
        ) {
          const meta = data.meta as { current_page: number; last_page: number }
          hasMorePages = meta.current_page < meta.last_page
          currentPage = meta.current_page + 1
          
          console.log(
            `[GridPane API] Domains pagination: page ${meta.current_page}/${meta.last_page}, ` +
            `fetched ${domains.length} domains (total so far: ${allDomains.length})`
          )
        } else {
          hasMorePages = false
        }
      } else {
        hasMorePages = false
      }
      
      if (hasMorePages) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    return allDomains
  }

  /**
   * Get single domain by ID
   * GET /oauth/api/v1/domain/{id}
   */
  async getDomain(domainId: number): Promise<GridPaneDomain> {
    const response = await this.request<GridPaneDomainResponse>(
      `/domain/${domainId}`
    )
    // Single domain returns in domains array
    return response.data.domains[0]
  }

  /**
   * Get current user integrations
   * GET /oauth/api/v1/user/integrations
   * Response: { success: boolean, integrations: GridPaneIntegration[] }
   */
  async getIntegrations(): Promise<GridPaneIntegration[]> {
    const response = await this.request<{
      success: boolean
      integrations: GridPaneIntegration[]
    }>("/user/integrations")
    return response.integrations || []
  }

  /**
   * Get all available backup integrations
   * GET /oauth/api/v1/backups/integrations
   * Response: { success: boolean, message: string, integrations: GridPaneBackupIntegration[] }
   */
  async getBackupIntegrations(): Promise<GridPaneBackupIntegration[]> {
    const response = await this.request<{
      success: boolean
      message?: string
      integrations: GridPaneBackupIntegration[]
    }>("/backups/integrations")
    return response.integrations || []
  }

  /**
   * Get site backup integrations
   * GET /oauth/api/v1/backups/integrations/{site.id}
   * Response: { success: boolean, integrations: GridPaneBackupIntegration[] }
   */
  async getSiteBackupIntegrations(
    siteId: number
  ): Promise<GridPaneBackupIntegration[]> {
    const response = await this.request<{
      success: boolean
      integrations: GridPaneBackupIntegration[]
    }>(`/backups/integrations/${siteId}`)
    return response.integrations || []
  }

  /**
   * Get all sites backup schedules (with pagination support)
   * GET /oauth/api/v1/backups/schedules
   * Response: { success: true, data: GridPaneSiteBackupSchedules[] }
   * 
   * Flattens the nested structure: each site can have multiple schedules
   * Returns flattened array with one schedule per row
   * May be paginated - check first page to detect structure
   */
  async getAllBackupSchedules(): Promise<GridPaneBackupSchedule[]> {
    // This endpoint returns { success: true, data: GridPaneSiteBackupSchedules[] }
    // May be paginated - check first page
    const allSites: GridPaneSiteBackupSchedules[] = []
    let currentPage = 1
    let hasMorePages = true
    
    while (hasMorePages) {
      const { data } = await this.requestWithHeaders<{
        success: boolean
        data: GridPaneSiteBackupSchedules[]
        meta?: {
          current_page: number
          last_page: number
          per_page: number
          total: number
        }
      }>(`/backups/schedules?page=${currentPage}`)
      
      if (!data.success || !Array.isArray(data.data)) {
        break
      }
      
      allSites.push(...data.data)
      
      // Check pagination
      if (data.meta) {
        hasMorePages = data.meta.current_page < data.meta.last_page
        currentPage = data.meta.current_page + 1
        
        console.log(
          `[GridPane API] Backup schedules pagination: page ${data.meta.current_page}/${data.meta.last_page}, ` +
          `total sites: ${data.meta.total}`
        )
      } else {
        hasMorePages = false
      }
      
      if (hasMorePages) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    // Flatten: each site's schedule_backups becomes separate rows
    const flattened: GridPaneBackupSchedule[] = []
    
    for (const site of allSites) {
      for (const schedule of site.schedule_backups) {
        // Format time as "HH:mm"
        const time = `${schedule.hour.padStart(2, "0")}:${schedule.minute.padStart(2, "0")}`
        
        // Parse day_of_week (convert string to number or null)
        const dayOfWeek = schedule.day !== null ? parseInt(schedule.day, 10) : null
        
        flattened.push({
          server_id: site.server_id,
          site_id: site.site_id,
          site_url: site.url,
          schedule_id: schedule.id,
          type: schedule.type,
          frequency: schedule.bup_schedule,
          hour: schedule.hour,
          minute: schedule.minute,
          time,
          day_of_week: dayOfWeek,
          service_id: schedule.service_id,
          service_name: schedule.service_name,
          service_user_id: schedule.service_user_id,
          enabled: true, // If schedule exists, it's enabled
          remote_backups_enabled: schedule.type === "remote",
        })
      }
    }
    
    return flattened
  }

  /**
   * Get server backup schedules
   * GET /oauth/api/v1/backups/schedules/server/{server.id}
   * Response: { success: true, data: GridPaneSiteBackupSchedules[] }
   * 
   * Flattens the nested structure same as getAllBackupSchedules
   */
  async getServerBackupSchedules(
    serverId: number
  ): Promise<GridPaneBackupSchedule[]> {
    const response = await this.request<{
      success: boolean
      data: GridPaneSiteBackupSchedules[]
    }>(`/backups/schedules/server/${serverId}`)
    
    if (!response.success || !Array.isArray(response.data)) {
      return []
    }
    
    // Flatten: each site's schedule_backups becomes separate rows
    const flattened: GridPaneBackupSchedule[] = []
    
    for (const site of response.data) {
      for (const schedule of site.schedule_backups) {
        const time = `${schedule.hour.padStart(2, "0")}:${schedule.minute.padStart(2, "0")}`
        const dayOfWeek = schedule.day !== null ? parseInt(schedule.day, 10) : null
        
        flattened.push({
          server_id: site.server_id,
          site_id: site.site_id,
          site_url: site.url,
          schedule_id: schedule.id,
          type: schedule.type,
          frequency: schedule.bup_schedule,
          hour: schedule.hour,
          minute: schedule.minute,
          time,
          day_of_week: dayOfWeek,
          service_id: schedule.service_id,
          service_name: schedule.service_name,
          service_user_id: schedule.service_user_id,
          enabled: true,
          remote_backups_enabled: schedule.type === "remote",
        })
      }
    }
    
    return flattened
  }

  /**
   * Get site backup schedules
   * GET /oauth/api/v1/backups/schedules/site/{site.id}
   * Response: { success: true, data: GridPaneSiteBackupSchedules[] } (single site)
   * 
   * Returns array of schedules for the site (flattened)
   */
  async getSiteBackupSchedules(
    siteId: number
  ): Promise<GridPaneBackupSchedule[]> {
    const response = await this.request<{
      success: boolean
      data: GridPaneSiteBackupSchedules[]
    }>(`/backups/schedules/site/${siteId}`)
    
    if (!response.success || !Array.isArray(response.data) || response.data.length === 0) {
      return []
    }
    
    // Should only be one site in the array
    const site = response.data[0]
    
    // Flatten schedules for this site
    const flattened: GridPaneBackupSchedule[] = []
    
    for (const schedule of site.schedule_backups) {
      const time = `${schedule.hour.padStart(2, "0")}:${schedule.minute.padStart(2, "0")}`
      const dayOfWeek = schedule.day !== null ? parseInt(schedule.day, 10) : null
      
      flattened.push({
        server_id: site.server_id,
        site_id: site.site_id,
        site_url: site.url,
        schedule_id: schedule.id,
        type: schedule.type,
        frequency: schedule.bup_schedule,
        hour: schedule.hour,
        minute: schedule.minute,
        time,
        day_of_week: dayOfWeek,
        service_id: schedule.service_id,
        service_name: schedule.service_name,
        service_user_id: schedule.service_user_id,
        enabled: true,
        remote_backups_enabled: schedule.type === "remote",
      })
    }
    
    return flattened
  }

  /**
   * Get site prune schedule
   * GET /oauth/api/v1/backups/prune-schedule/{site.id}
   * Returns single prune schedule (may be wrapped in array)
   */
  async getSitePruneSchedule(siteId: number): Promise<GridPanePruneSchedule> {
    const response = await this.request<
      | GridPaneResponse<GridPanePruneSchedule>
      | { success: boolean; prune_schedule?: GridPanePruneSchedule; data?: GridPanePruneSchedule[] }
    >(`/backups/prune-schedule/${siteId}`)
    
    if ("data" in response && Array.isArray(response.data) && response.data[0]) {
      return response.data[0]
    }
    if ("prune_schedule" in response && response.prune_schedule) {
      return response.prune_schedule
    }
    
    return {} as GridPanePruneSchedule
  }
}
