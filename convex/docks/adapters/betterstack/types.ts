/**
 * Better Stack Better Uptime API Types
 * 
 * Generated from Better Stack Better Uptime API v2/v3 documentation
 * 
 * @see https://betterstack.com/docs/uptime/api/
 * @see docks/better-stack/better-uptime/ListMonitors.json for actual API response
 */

/**
 * Better Stack Monitor
 * Maps to universal `monitors` table
 * 
 * @see docks/better-stack/better-uptime/ListMonitors.json for actual API response
 */
export interface BetterStackMonitor {
  id: string // Monitor ID
  type: "monitor"
  attributes: {
    url: string // URL being monitored
    pronounceable_name: string // Display name
    auth_username: string // Basic auth username (empty if not set)
    auth_password: string // Basic auth password (empty if not set)
    monitor_type: string // "status", "ping", "keyword", etc.
    monitor_group_id: number // Monitor group ID
    last_checked_at: string // ISO 8601 timestamp
    status: "up" | "down" | "paused" // Monitor status
    policy_id: number | null // Alert policy ID
    expiration_policy_id: number | null // Expiration policy ID
    team_name: string // Team name
    required_keyword: string | null // Required keyword for keyword monitors
    verify_ssl: boolean // SSL verification enabled
    check_frequency: number // Check frequency in seconds
    call: boolean // Call alerts enabled
    sms: boolean // SMS alerts enabled
    email: boolean // Email alerts enabled
    push: boolean // Push notifications enabled
    critical_alert: boolean // Critical alert enabled
    team_wait: number | null // Team wait time
    http_method: string // HTTP method (e.g., "get")
    request_timeout: number // Request timeout in seconds
    recovery_period: number // Recovery period in seconds
    request_headers: Array<{ name: string; value: string }> // Custom headers
    environment_variables: Record<string, string> // Environment variables
    request_body: string // Request body (empty if not set)
    follow_redirects: boolean // Follow redirects enabled
    remember_cookies: boolean // Remember cookies enabled
    created_at: string // ISO 8601 timestamp
    updated_at: string // ISO 8601 timestamp
    ssl_expiration: number // SSL expiration days
    domain_expiration: number // Domain expiration days
    regions: string[] // Monitoring regions (e.g., ["us"])
    expected_status_codes: number[] // Expected HTTP status codes
    port: number | null // Port number (null for default)
    confirmation_period: number // Confirmation period in seconds
    paused_at: string | null // Paused timestamp (null if not paused)
    paused: boolean // Paused status
    maintenance_from: string | null // Maintenance window start
    maintenance_to: string | null // Maintenance window end
    maintenance_timezone: string // Maintenance timezone
    maintenance_days: string[] // Maintenance days (e.g., ["mon", "tue"])
    playwright_script: string | null // Playwright script (null if not set)
    ip_version: string | null // IP version (null for default)
    checks_version: string // Checks version (e.g., "v2")
  }
  relationships: {
    policy: {
      data: { id: string; type: string } | null
    }
    expiration_policy: {
      data: { id: string; type: string } | null
    }
  }
}

/**
 * Better Stack Monitor Group
 * Used for grouping monitors
 * 
 * @see docks/better-stack/better-uptime/listMonitorGroups.json for actual API response
 */
export interface BetterStackMonitorGroup {
  id: string // Group ID
  type: "monitor_group"
  attributes: {
    name: string // Group name
    created_at: string // ISO 8601 timestamp
    updated_at: string // ISO 8601 timestamp
    team_name: string // Team name
    sort_index: number // Sort index
    paused: boolean // Paused status
  }
}

/**
 * Better Stack API Response Wrapper
 */
export interface BetterStackResponse<T> {
  data: T[]
  pagination: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}
