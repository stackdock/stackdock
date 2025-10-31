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

