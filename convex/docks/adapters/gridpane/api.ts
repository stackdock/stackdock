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
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/oauth/api/v1${endpoint}`
    
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
        `GridPane API error (${response.status}): ${errorText}`
      )
    }

    return response.json()
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
   * Get all servers
   * GET /oauth/api/v1/server
   */
  async getServers(): Promise<GridPaneServer[]> {
    const response = await this.request<GridPaneResponse<GridPaneServer>>(
      "/server"
    )
    return response.data
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
   * Get all sites
   * GET /oauth/api/v1/site
   */
  async getSites(): Promise<GridPaneSite[]> {
    const response = await this.request<GridPaneResponse<GridPaneSite>>(
      "/site"
    )
    return response.data
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
   * Get all domains
   * GET /oauth/api/v1/domain
   * Note: This endpoint returns { data: { domains: [...] } } structure
   */
  async getDomains(): Promise<GridPaneDomain[]> {
    const response = await this.request<GridPaneDomainResponse>("/domain")
    return response.data.domains
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
   * Get all sites backup schedules
   * GET /oauth/api/v1/backups/schedules
   * Response: { success: true, data: GridPaneSiteBackupSchedules[] }
   * 
   * Flattens the nested structure: each site can have multiple schedules
   * Returns flattened array with one schedule per row
   */
  async getAllBackupSchedules(): Promise<GridPaneBackupSchedule[]> {
    const response = await this.request<{
      success: boolean
      data: GridPaneSiteBackupSchedules[]
    }>("/backups/schedules")
    
    if (!response.success || !Array.isArray(response.data)) {
      return []
    }
    
    // Flatten: each site's schedule_backups becomes separate rows
    const flattened: GridPaneBackupSchedule[] = []
    
    for (const site of response.data) {
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
