export interface Site {
  id: number;
  url: string;
}

export interface SystemUser {
  id: number;
  username: string;
}

export interface SshKey {
  id: number;
  name: string;
}

export interface Provider {
  id: number;
  name: string;
  full_name: string;
  logo_path: string;
}

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
  cpu: string | null; // Assuming it can be a descriptive string or null
  ram: string | null;  // Assuming it can be a descriptive string or null
  region_label: string;
  user_id: number;
  provider_id: number;
  failover_id: number | string | null; // Can be number or string based on usage, or null
  high_availability_sync_interval: number;
  temp_pass: string | null;
  callback_token: string | null;
  is_wsod: boolean;
  record_id: string;
  high_avaibility_synced_at: string | null; // Likely a date-time string
  high_avaibility_sync_status: string | null;
  uuid: string;
  us_enabled: boolean;
  us_frequency: number;
  is_mysql_slow_query_log: boolean;
  mysql_long_query_time: number;
  is_mysql_restarted_after_changing_params: boolean;
  is_health_check_running: boolean;
  is_paired: boolean;
  is_preemptive_support_on: number; // 0 or 1
  is_multisite_preemptive_support_on: number; // 0 or 1
  server_key: string;
  update_backups: boolean;
  beta_server: number; // 0 or 1
  sites: Site[];
  system_users: SystemUser[];
  ssh_keys: SshKey[];
  provider: Provider;
}

export interface Links {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface MetaLink {
  url: string | null;
  label: string;
  active: boolean;
}

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

export interface ServerResponse {
  data: Server[];
  links: Links;
  meta: Meta;
}

// Tags for cache validation
export const GRIDPANE_SERVERS_TAG = 'gridpane-servers';
