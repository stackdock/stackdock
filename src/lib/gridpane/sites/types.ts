// Types for the nested 'server' object within each site
export interface SiteServer {
    id: number;
    label: string;
    ip: string;
    user_id: number;
    provider_id: number;
    provisioned_at: string;
    is_preemptive_support_on: number;
    is_multisite_preemptive_support_on: number;
    region: string;
    region_label: string;
    status: string;
    is_plaid: number;
    is_experimental: number;
    is_busy: number;
    os: string;
    vps_os_version_id: number;
    webserver: string;
    server_key: string;
    us_enabled: boolean;
    update_backups: boolean;
    subdomain: string;
    service_user_id: number | null;
    created_at: string;
    beta_server: number;
    is_paired: boolean;
    is_failover_server: boolean;
    is_git_configured: boolean;
    is_peak_freq: boolean;
    os_state: string;
    relay: string | null;
    server_timezone: string;
}

// Types for VPS services (new for single site)
export interface VpsServicePivot {
    site_id: number;
    service_id: number;
    id: number;
    status: string;
    service_user_id: number;
}

export interface VpsService {
    id: number;
    name: string;
    pivot: VpsServicePivot;
}

// Types for scheduled backups (new for single site)
export interface ScheduleBackup {
    id: number;
    site_id: number;
    type: string;
    service_id: number | null;
    bup_schedule: string;
    hour: string;
    minute: string;
    day: string;
    created_at: string;
    updated_at: string;
}

// Types for the nested 'site_security_settings' object
export interface SiteSecuritySettings {
    site_id: number;
    six_g_bad_bots: boolean;
    six_g_bad_methods: boolean;
    six_g_bad_query_strings: boolean;
    six_g_bad_referers: boolean;
    six_g_bad_requests: boolean;
    seven_g_bad_bots: boolean;
    seven_g_bad_methods: boolean;
    seven_g_bad_query_strings: boolean;
    seven_g_bad_referers: boolean;
    seven_g_bad_requests: boolean;
    seven_g_bad_remote_hosts: boolean;
    mod_sec_anomaly: number;
    mod_sec_paranoia: number;
    wp_f2b: boolean;
    wp_f2b_usernames: boolean;
    wp_f2b_user_enumeration: boolean;
    wp_f2b_spam: boolean;
    wp_f2b_comments: boolean;
    wp_f2b_passwords: boolean;
    wp_f2b_pingbacks: boolean;
    disable_xmlrpc: boolean;
    disable_emoji: boolean;
    disable_rss: boolean;
    disable_username_enumaration: boolean;
    disable_wpscan_agent: boolean;
    disable_wpversion: boolean;
    block_wpcontent_php: boolean;
    block_install_php: boolean;
    block_upgrade_php: boolean;
    block_load_scripts: boolean;
    block_comments: boolean;
    block_trackbacks: boolean;
    block_opml_links: boolean;
    suspend_site: boolean;
    six_g_synced: string;
    seven_g_synced: string;
    modsec_synced: string;
    wpfail2ban_synced: string;
    additional_settings_synced: string;
    access_settings_synced: string | null;
}

// Types for the nested 'sites_git' object (can be null)
export interface SitesGit {
    [key: string]: unknown;
}

// Types for the nested 'site_customizer' object
export interface SiteCustomizer {
    id: number;
    site_id: number;
    smtp_service_user_id: number | null;
    brotli: boolean;
    http2_push: boolean;
    elasticpress: boolean;
    csf_policy: boolean;
    server_cron: boolean;
    concatenation_disabled: boolean;
    modsec_honeypot: boolean;
    modsec_dos_protection: boolean;
    modsec_ip_rep_block: boolean;
    modsec_geoip_block: boolean;
    modsec_geoip_block_country_codes: string;
    nginx_max_body_size: number | null;
    nginx_zone_one_burst: number | null;
    nginx_zone_wp_burst: number | null;
    nginx_redis_cache_valid: number | null;
    nginx_proxy_cache_valid: number | null;
    nginx_fcgi_cache_valid: number | null;
    is_creating_local_backups_started: boolean;
    us_report_only: boolean;
    us_user_urls_only: boolean;
    us_delay: number;
    us_limit_urls: number;
    us_threshold: number;
    us_viewport_width: number;
    us_viewport_height: number;
    us_async_capture: number;
    us_async_compare: number;
    target_url_list: string | null;
    blocklist: string | null;
    is_php_slowlog: boolean;
    php_slowlog_timeout: number;
    php_slowlog_trace_depth: number;
    nginx_cache_settings_synced: boolean;
    object_cache_settings_synced: boolean;
    nginx_caching_ttl: number;
    object_caching: boolean;
    application_token: string;
    remote_prune_schedule: number;
    remote_retain_days: number;
    local_prune_schedule: number;
    local_retain_days: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

// Main Site interface (for list view)
export interface Site {
    id: number;
    url: string;
    is_wsod: boolean;
    is_sso: boolean;
    is_ssl: boolean;
    ssl_status: string | null;
    server_id: number;
    user_id: number;
    system_user_id: number;
    bundle_id: number | null;
    domain_id: number | null;
    resolved_at: string;
    failover_set_at: string | null;
    auto_update_status: string | null;
    auto_update_result_link: string | null;
    multisites: number;
    php_version: string;
    www: string | null;
    root: string | null;
    waf: string | null;
    remote_bup: boolean;
    local_bup: boolean;
    local_bup_threshold: number | null;
    automatic_updates: boolean;
    http_auth: boolean;
    dbport_open: boolean;
    nginx_caching: string | null;
    subdirectory_multi_user: boolean;
    subdomain_multi_user: boolean;
    sendgrid_provider: boolean;
    wp_config: string | null;
    is_debug: boolean;
    built_at: string;
    clickjacking_protection: boolean;
    gp_ultimo: boolean;
    staging_site_built_at: string | null;
    update_site_built_at: string | null;
    type: string;
    is_monitored: boolean;
    monitor_status: string | null;
    wp_vulns_found: boolean;
    pm: string;
    date_timezone: string | null;
    max_execution_time: number;
    max_file_uploads: number;
    max_input_time: number;
    max_input_vars: number;
    memory_limit: number;
    post_max_size: number;
    default_socket_timeout: number;
    session_cookie_lifetime: number;
    session_gc_maxlifetime: number;
    short_open_tag: boolean;
    upload_max_filesize: number;
    pm_max_children: number;
    pm_start_servers: number;
    pm_max_spare_servers: number;
    pm_min_spare_servers: number;
    pm_max_requests: number;
    pm_process_idle_timeout: number;
    lsapi: string | null;
    lsapi_max_connections: number | null;
    lsapi_children: number | null;
    lsapi_initial_request_timeout: number | null;
    lsapi_retry_timeout: number | null;
    lsapi_app_instances: number | null;
    lsapi_max_reqs: number | null;
    lsapi_max_idle: number | null;
    ls_page_caching: boolean;
    ls_redis_object_caching: boolean;
    grace_period_up_to: string | null;
    php_settings_synced_at: string;
    is_git_configured: boolean;
    is_git_full_configured: boolean;
    fortress: boolean | null;
    fortress_was_enabled: boolean | null;
    object_cache_pro: boolean | null;
    object_cache_pro_was_enabled: boolean | null;
    object_cache_pro_unlicensed: boolean | null;
    ephemeral_duration: number | null;
    ephemeral_build_date: string | null;
    server: SiteServer;
    site_security_settings: SiteSecuritySettings;
    sites_git: SitesGit | null;
    site_customizer: SiteCustomizer;
}

// Extended Site interface for detailed single site view (adds the extra properties)
export interface SiteDetailed extends Site {
    vpsServices: VpsService[];
    schedule_backups: ScheduleBackup[];
}

// Enhanced SingleSiteResponse with API response metadata
export interface SingleSiteResponse extends SiteDetailed {
    _metadata?: {
        fetched_at: string;
        cached_until?: string;
        request_duration_ms: number;
        api_version?: string;
    };
}

// Standardized meta link structure
export interface MetaLink {
    url: string | null;
    label: string;
    active: boolean;
}

// Meta structure
export interface SitesMeta {
    current_page: number;
    from: number;
    last_page: number;
    links: MetaLink[];
    path: string;
    per_page: number;
    to: number;
    total: number;
}

// Error response type
export interface GridPaneErrorResponse {
    message: string;
    errors?: Record<string, string[]>;
    status?: number;
}

// Overall response structure for sites list
export interface SitesResponse {
    data: Site[];
    meta: SitesMeta;
}

// Response structure for single site (wraps site in data object)
export interface SingleSiteApiResponse {
    data: SiteDetailed;
}

export const GRIDPANE_SITES_TAG = 'gridpane-sites';
export const GRIDPANE_SINGLE_SITE_TAG = 'gridpane-single-site';

// ===== PHP Version Update Types =====

// Available PHP versions (expand based on GridPane's supported versions)
export const AVAILABLE_PHP_VERSIONS = [
  '7.4',
  '8.0',
  '8.1',
  '8.2',
  '8.3',
  '8.4'
] as const;

export type PhpVersion = typeof AVAILABLE_PHP_VERSIONS[number];

// Response type for the mutation
export interface UpdatePhpVersionResponse {
  success: boolean;
  message: string;
  site_id: number;
  new_php_version: string;
  updated_at: string;
}

export interface UpdatePhpVersionApiResponse {
  site?: SiteDetailed;
  success?: boolean;
  message?: string;
  site_id?: number;
  new_php_version?: string;
  updated_at?: string;
}

export interface UpdatePhpVersionResult {
  success: boolean;
  message: string;
  data?: SiteDetailed;
  error?: string;
    waitSeconds?: number;
}
