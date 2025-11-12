/**
 * GridPane API Types
 * 
 * Generated from actual API responses in docks/gridpane/
 * 
 * @see docks/gridpane/ for response examples
 */

/**
 * GridPane API Response Wrapper
 * All list endpoints return { data: T[] }
 */
export interface GridPaneResponse<T> {
  data: T[]
}

/**
 * GridPane Domain Response (different structure)
 */
export interface GridPaneDomainResponse {
  data: {
    domains: GridPaneDomain[]
  }
}

/**
 * GridPane Server
 * @see docks/gridpane/server/getserverslist.json
 */
export interface GridPaneServer {
  id: number
  label: string
  ip: string
  region: string
  sub_id: string
  subdomain: string
  database: "mariadb" | "percona"
  webserver: "nginx" | "openlitespeed"
  os_version: string
  status: "active" | "inactive" | string
  cpu: number | null
  ram: number | null
  region_label: string
  user_id: number
  provider_id: number
  failover_id: number | null
  sites?: Array<{ id: number; url: string }>
  system_users?: Array<{ id: number; username: string }>
  ssh_keys?: Array<{ id: number; name: string }>
  provider?: {
    id: number
    name: string
  }
  [key: string]: any // All other fields go in fullApiData
}

/**
 * GridPane Site (Web Service)
 * @see docks/gridpane/site/getallsites.json
 */
export interface GridPaneSite {
  id: number
  url: string
  is_wsod: boolean
  is_sso: boolean
  is_ssl: boolean
  ssl_status: "succeed" | "failed" | null
  server_id: number
  user_id: number
  system_user_id: number
  bundle_id: number | null
  domain_id: number | null
  resolved_at: string | null
  type: "primary" | "staging" | "canary" | string
  php_version: string
  status?: string
  server?: {
    id: number
    label: string
    ip: string
    region: string
    status: string
  }
  [key: string]: any // All other fields go in fullApiData
}

/**
 * GridPane Domain
 * @see docks/gridpane/domain/getdomainslist.json
 */
export interface GridPaneDomain {
  id: number
  url: string
  route: string
  type: "primary" | "staging" | "canary" | string
  dns_management_id: number
  creds_need_updating: boolean
  is_ssl: boolean
  ssl_status: "succeed" | "failed" | null
  dns_connection_type: string
  site_id: number
  user_id: number
  server_id: number
  resolved_at: string | null
  status: string | null
  is_wildcard: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  user_dns?: {
    id: number
    dns_provider_id: number
    provider: {
      id: number
      name: string
    }
  }
  [key: string]: any // All other fields go in fullApiData
}

/**
 * GridPane User (for validateCredentials)
 * @see docks/gridpane/user/getcurrentUser.json
 */
export interface GridPaneUser {
  id: number
  name: string
  email: string
  [key: string]: any
}

/**
 * GridPane Integration
 * @see GET /oauth/api/v1/user/integrations
 */
export interface GridPaneIntegration {
  id: number
  name: string
  provider: string // "digitalocean", "aws", "s3", etc.
  type: string // "backup", "dns", etc.
  [key: string]: any
}

/**
 * GridPane Backup Integration
 * @see GET /oauth/api/v1/backups/integrations
 * Note: Actual API response structure may differ - verify with real API
 */
export interface GridPaneBackupIntegration {
  id: number
  integrated_service: string // "aws-s3", etc.
  integration_name: string
  token?: string
  secret_token?: string
  region?: string
  [key: string]: any
}

/**
 * GridPane Backup Schedule Item (nested in site)
 * @see docks/gridpane/backups/getallsitesbackupschedules.json
 */
export interface GridPaneBackupScheduleItem {
  id: number
  type: "local" | "remote"
  bup_schedule: "daily" | "weekly" | "hourly" | string // Frequency
  hour: string // "00" to "23"
  minute: string // "00" to "59"
  day: string | null // "0" to "6" for weekly, null for daily/hourly
  service_id: number | null // Integration ID for remote backups
  service_name: string | null // e.g., "aws-s3"
  service_user_id: number | null // Integration user ID
  [key: string]: any
}

/**
 * GridPane Site with Backup Schedules (API response structure)
 * @see docks/gridpane/backups/getallsitesbackupschedules.json
 * Response: { success: true, data: GridPaneSiteBackupSchedules[] }
 */
export interface GridPaneSiteBackupSchedules {
  server_id: number
  site_id: number
  url: string
  schedule_backups: GridPaneBackupScheduleItem[]
}

/**
 * GridPane Backup Schedule (flattened for frontend)
 * Created by flattening GridPaneSiteBackupSchedules
 */
export interface GridPaneBackupSchedule {
  server_id: number
  site_id: number
  site_url: string
  schedule_id: number
  type: "local" | "remote"
  frequency: string // "daily", "weekly", "hourly"
  hour: string
  minute: string
  time: string // Formatted as "HH:mm"
  day_of_week: number | null // 0-6 for weekly, null otherwise
  service_id: number | null
  service_name: string | null
  service_user_id: number | null
  enabled: boolean // Always true if schedule exists
  remote_backups_enabled: boolean // true if type === "remote"
  [key: string]: any
}

/**
 * GridPane Prune Schedule
 * @see GET /oauth/api/v1/backups/prune-schedule/{site.id}
 * Note: Actual API response structure may differ - verify with real API
 */
export interface GridPanePruneSchedule {
  site_id: number
  keep_daily: number
  keep_weekly: number
  keep_monthly: number
  [key: string]: any
}
