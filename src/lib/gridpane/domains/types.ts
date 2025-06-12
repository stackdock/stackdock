// Types for the nested 'user_dns' object within each domain
export interface UserDns {
  id: number;
  user_id: number;
  dns_provider_id: number;
  name: string | null;
  token: string;
  secret: string;
  integration_name: string;
  nameserver: string | null;
  challenge_domain: string | null;
  is_available: boolean;
  number: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  last_active_at: string;
  provider: DnsProvider;
}

// Types for the DNS provider within user_dns
export interface DnsProvider {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

// Main Domain interface (in exact order as API response)
export interface Domain {
  id: number;
  url: string;
  route: string;
  type: string;
  dns_management_id: number | null;
  creds_need_updating: boolean;
  is_ssl: boolean;
  ssl_status: string | null;
  dns_connection_type: string;
  site_id: number;
  user_id: number;
  identify_code: string | null;
  server_id: number;
  resolved_at: string | null;
  status: string | null;
  is_wildcard: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  primary_is_staging: boolean;
  primary_staging_enabled: boolean;
  primary_canary_enabled: boolean;
  user_dns: UserDns | null;
}

// Types for constants section
export interface TypeConstant {
  text: string;
  value: string;
}

export interface RoutingConstant {
  text: string;
  value: string;
}

export interface IntegrationConstants {
  none: string;
  dnsmefull: string;
  dnsme: string;
  cloudflarefull: string;
  cloudflare: string;
}

export interface DnsConstant {
  id: number;
  user_id: number;
  dns_provider_id: number;
  name: string | null;
  token: string;
  secret: string;
  integration_name: string;
  nameserver: string | null;
  challenge_domain: string | null;
  is_available: boolean;
  number: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  last_active_at: string;
  provider: DnsProvider;
}

export interface DomainsConstants {
  type: TypeConstant[];
  routing: RoutingConstant[];
  integration: IntegrationConstants;
  dns: DnsConstant[];
}

// Types for the nested data structure
export interface DomainsData {
  domains: Domain[];
  constants: DomainsConstants;
}

// Links structure (as seen in domains response)
export interface Links {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

// Standardized meta link structure (matching sites/servers)
export interface MetaLink {
  url: string | null;
  label: string;
  active: boolean;
}

// Meta structure (as seen in domains response)
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

// Error response type (matching sites/servers)
export interface GridPaneErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Overall response structure for the domains API
export interface DomainsResponse {
  data: DomainsData;
  links: Links;
  meta: Meta;
}

export const GRIDPANE_DOMAINS_TAG = 'gridpane-domains';
