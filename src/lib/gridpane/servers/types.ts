// Site interface 
export interface Site {
    id: number;
    url: string;
}

// System user interface 
export interface SystemUser {
    id: number;
    username: string;
}

// SSH key interface 
export interface SshKey {
    id: number;
    name: string;
}

// Provider interface
export interface Provider {
    id: number;
    name: string;
    full_name: string;
    logo_path: string;
}

// Main Server interface
export interface Server {
    id: number;
    label: string;
    ip: string;
    region: string;
    sub_id: string;
    subdomain: string;
    database: string;
    webserver: string;
    os_version: string;
    status: string;
    cpu: string | null;
    ram: string | null;
    region_label: string;
    user_id: number;
    provider_id: number;
    failover_id: number | null;
    high_availability_sync_interval: number;
    temp_pass: string | null;
    callback_token: string | null;
    is_wsod: boolean;
    record_id: string;
    high_avaibility_synced_at: string | null;
    high_avaibility_sync_status: string | null;
    uuid: string;
    us_enabled: boolean;
    us_frequency: number;
    is_mysql_slow_query_log: boolean;
    mysql_long_query_time: number;
    is_mysql_restarted_after_changing_params: boolean;
    is_health_check_running: boolean;
    is_paired: boolean;
    is_preemptive_support_on: number;
    is_multisite_preemptive_support_on: number;
    server_key: string;
    update_backups: boolean;
    beta_server: number;
    sites: Site[];
    system_users: SystemUser[];
    ssh_keys: SshKey[];
    provider: Provider;
}

// Links structure
export interface Links {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
}

// Standardized meta link structure 
export interface MetaLink {
    url: string | null;
    label: string;
    active: boolean;
}

// Meta structure 
export interface Meta {
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

// Overall response structure
export interface ServersResponse {
    data: Server[];
    links: Links;
    meta: Meta;
}

export const GRIDPANE_SERVERS_TAG = 'gridpane-servers';
