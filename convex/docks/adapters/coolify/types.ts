/**
 * Coolify API Types
 * 
 * Generated from Coolify API v1 documentation
 * 
 * @see https://coolify.io/docs/api
 * @see docks/coolify/ for API response examples
 */

/**
 * Coolify Server
 * Maps to universal `servers` table
 * 
 * @see docks/coolify/listServers.json for actual API response
 */
export interface CoolifyServer {
  uuid: string // Server UUID
  name: string // Server name
  description: string // Server description
  ip: string // Server IP address
  port: number // SSH port (usually 22)
  user: string // SSH user (usually "root")
  is_coolify_host: boolean // Whether this is the Coolify host server
  is_reachable: boolean // Whether server is reachable
  is_usable: boolean // Whether server is usable
  proxy: {
    redirect_enabled: boolean
    // ... other proxy fields
  }
  settings: {
    id: number
    concurrent_builds: number
    delete_unused_networks: boolean
    delete_unused_volumes: boolean
    docker_cleanup_frequency: string
    docker_cleanup_threshold: number
    dynamic_timeout: number
    force_disabled: boolean
    force_docker_cleanup: boolean
    generate_exact_labels: boolean
    is_build_server: boolean
    is_cloudflare_tunnel: boolean
    is_jump_server: boolean
    is_logdrain_axiom_enabled: boolean
    is_logdrain_custom_enabled: boolean
    is_logdrain_highlight_enabled: boolean
    is_logdrain_newrelic_enabled: boolean
    is_metrics_enabled: boolean
    is_reachable: boolean
    is_sentinel_debug_enabled: boolean
    is_sentinel_enabled: boolean
    is_swarm_manager: boolean
    is_swarm_worker: boolean
    is_terminal_enabled: boolean
    is_usable: boolean
    logdrain_axiom_api_key: string | null
    logdrain_axiom_dataset_name: string | null
    logdrain_custom_config: string | null
    logdrain_custom_config_parser: string | null
    logdrain_highlight_project_id: string | null
    logdrain_newrelic_base_uri: string | null
    logdrain_newrelic_license_key: string | null
    sentinel_custom_url: string
    sentinel_metrics_history_days: number
    sentinel_metrics_refresh_rate_seconds: number
    sentinel_push_interval_seconds: number
    server_disk_usage_check_frequency: string
    server_disk_usage_notification_threshold: number
    server_id: number
    server_timezone: string
    wildcard_domain: string | null
    created_at: string
    updated_at: string
  }
}

/**
 * Coolify Application
 * Nested in services, represents a deployed application
 */
export interface CoolifyApplication {
  id: number
  uuid: string
  name: string
  human_name: string | null
  description: string | null
  fqdn: string // Fully qualified domain name (URL)
  ports: string
  exposes: string | null
  status: string // "running (healthy)", etc.
  service_id: number
  created_at: string
  updated_at: string
  exclude_from_status: boolean
  required_fqdn: boolean
  image: string // Docker image
  is_log_drain_enabled: boolean
  is_include_timestamps: boolean
  deleted_at: string | null
  is_gzip_enabled: boolean
  is_stripprefix_enabled: boolean
  last_online_at: string
  is_migrated: boolean
}

/**
 * Coolify Database
 * Nested in services, represents a database instance
 */
export interface CoolifyDatabase {
  id: number
  uuid: string
  name: string
  human_name: string | null
  description: string | null
  ports: string
  exposes: string | null
  status: string // "running (healthy)", etc.
  service_id: number
  created_at: string
  updated_at: string
  exclude_from_status: boolean
  image: string // Docker image (e.g., "mariadb:11")
  public_port: number | null
  is_public: boolean
  is_log_drain_enabled: boolean
  is_include_timestamps: boolean
  deleted_at: string | null
  is_gzip_enabled: boolean
  is_stripprefix_enabled: boolean
  last_online_at: string
  is_migrated: boolean
  custom_type: string | null
}

/**
 * Coolify Service
 * Maps to universal `webServices` table
 * Contains applications and databases
 * 
 * @see docks/coolify/getServices.json for actual API response
 */
export interface CoolifyService {
  uuid: string // Service UUID
  name: string // Service name
  environment_id: number
  created_at: string
  updated_at: string
  server_id: number
  description: string
  destination_type: string // e.g., "App\\Models\\StandaloneDocker"
  destination_id: number
  deleted_at: string | null
  connect_to_docker_network: boolean
  config_hash: string
  service_type: string // e.g., "wordpress-with-mariadb"
  is_container_label_escape_enabled: boolean
  compose_parsing_version: string
  laravel_through_key: number
  server_status: boolean
  status: string // "running:healthy", "stopped", etc.
  server: {
    id: number
    uuid: string
    name: string
    description: string
    ip: string
    port: number
    user: string
    team_id: number
    private_key_id: number
    proxy: {
      redirect_enabled: boolean
      status?: string
      type?: string
      last_saved_settings?: string
      last_applied_settings?: string
      force_stop?: boolean
    }
    created_at: string
    updated_at: string
    unreachable_notification_sent: boolean
    unreachable_count: number
    high_disk_usage_notification_sent: boolean
    log_drain_notification_sent: boolean
    swarm_cluster: any | null
    validation_logs: any | null
    sentinel_updated_at: string
    deleted_at: string | null
    ip_previous: string | null
    is_coolify_host: boolean
    settings: any // Server settings object
  }
  applications: CoolifyApplication[]
  databases: CoolifyDatabase[]
}

/**
 * Coolify Project
 * Maps to universal `projects` table (optional)
 * 
 * @see docks/coolify/listProjects.json for actual API response
 */
export interface CoolifyProject {
  id: number
  uuid: string
  name: string
  description: string
}
