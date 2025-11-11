/**
 * Cloudflare API Types
 * 
 * Generated from actual API responses in docks/cloudflare/
 * 
 * @see docks/cloudflare/zones/listZones.json
 * @see docks/cloudflare/pages/getProjects.json
 * @see docks/cloudflare/workers/getWorkersList.json
 * @see docks/cloudflare/dns/records/getDNSRecordsbyZoneID.json
 */

/**
 * Cloudflare Zones Response
 */
export interface CloudflareZonesResponse {
  result: CloudflareZone[]
  result_info: {
    page: number
    per_page: number
    total_pages: number
    count: number
    total_count: number
  }
  success: boolean
  errors: any[]
  messages: any[]
}

/**
 * Cloudflare Zone
 */
export interface CloudflareZone {
  id: string
  name: string
  status: "active" | "pending" | "initializing" | "moved" | "deleted" | "read_only"
  paused: boolean
  type: "full" | "partial"
  account: {
    id: string
    name: string
  }
  plan: {
    id: string
    name: string
    price: number
    currency: string
  }
  created_on: string // ISO 8601
  modified_on: string // ISO 8601
  activated_on: string // ISO 8601
  name_servers: string[]
  dnsRecords?: CloudflareDNSRecord[] // Optional - added by action when fetching DNS records
  [key: string]: any // All other fields go to fullApiData
}

/**
 * Cloudflare Pages Response
 */
export interface CloudflarePagesResponse {
  result: CloudflarePage[]
  success: boolean
  errors: any[]
  messages: any[]
  result_info: {
    page: number
    per_page: number
    count: number
    total_count: number
    total_pages: number
  }
}

/**
 * Cloudflare Page
 */
export interface CloudflarePage {
  id: string
  name: string
  subdomain: string
  domains: string[]
  source: {
    type: "github" | "gitlab" | "bitbucket"
    config: {
      owner: string
      repo_name: string
      production_branch: string
    }
  }
  canonical_deployment?: {
    id: string
    url: string
    environment: "production" | "preview"
    latest_stage: {
      status: "success" | "failure" | "idle"
    }
  }
  latest_deployment?: {
    id: string
    url: string
    environment: "production" | "preview"
    latest_stage: {
      status: "success" | "failure" | "idle"
    }
  }
  created_on: string
  production_branch: string
  [key: string]: any
}

/**
 * Cloudflare Workers Response
 */
export interface CloudflareWorkersResponse {
  result: CloudflareWorker[]
  success: boolean
  errors: any[]
  messages: any[]
  result_info: {
    page: number
    per_page: number
    count: number
    total_count: number
  }
}

/**
 * Cloudflare Worker
 * 
 * Note: Cloudflare Workers API uses 'id' as the script name (string)
 * and 'tag' as the deployment ID (hash). Some endpoints may return
 * different structures, so we handle both.
 */
export interface CloudflareWorker {
  id: string // Script name (e.g., "cloudflare-workers-next-template")
  name?: string // May be missing, use 'id' as fallback
  tag?: string // Deployment ID hash (e.g., "620112e7b94345d0a16e8c5bdb539067")
  subdomain: {
    enabled: boolean
    previews_enabled: boolean
  }
  created_on: string
  updated_on: string
  [key: string]: any
}

/**
 * Cloudflare DNS Records Response
 */
export interface CloudflareDNSRecordsResponse {
  result: CloudflareDNSRecord[]
  success: boolean
  errors: any[]
  messages: any[]
  result_info: {
    page: number
    per_page: number
    count: number
    total_count: number
    total_pages: number
  }
}

/**
 * Cloudflare DNS Record
 */
export interface CloudflareDNSRecord {
  id: string
  name: string
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA"
  content: string
  proxied: boolean
  proxiable: boolean
  ttl: number
  created_on: string
  modified_on: string
  [key: string]: any
}

/**
 * Cloudflare User Response (for validation)
 */
export interface CloudflareUserResponse {
  result: {
    id: string
    email: string
    [key: string]: any
  }
  success: boolean
}
