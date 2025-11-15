/**
 * Hetzner API Types
 * 
 * Generated from Hetzner Cloud API v1 documentation
 * 
 * @see https://docs.hetzner.cloud/
 * @see docks/hetzner/listServers.json for actual API response
 */

/**
 * Hetzner Server
 * Maps to universal `servers` table
 * 
 * @see docks/hetzner/listServers.json for actual API response
 */
export interface HetznerServer {
  id: number // Server ID
  name: string // Server name
  status: string // "running", "starting", "stopping", "off", "rebooting", "migrating", "rebuilding", "deleting"
  server_type: {
    id: number
    name: string // e.g., "cpx11", "cpx21"
    architecture: string // "x86" or "arm"
    cores: number
    cpu_type: string // "shared" or "dedicated"
    category: string // "regular_purpose", "compute_optimized", etc.
    deprecated: boolean
    deprecation: {
      announced: string // ISO 8601 timestamp
      unavailable_after: string // ISO 8601 timestamp
    } | null
    description: string
    disk: number // Disk in GB
    memory: number // Memory in GB
    prices: Array<{
      location: string
      price_hourly: {
        gross: string
        net: string
      }
      price_monthly: {
        gross: string
        net: string
      }
      included_traffic: number
      price_per_tb_traffic: {
        gross: string
        net: string
      }
    }>
    storage_type: string // "local" or "network"
    locations: Array<{
      id: number
      name: string
      deprecation: {
        announced: string
        unavailable_after: string
      } | null
    }>
  }
  datacenter: {
    id: number
    description: string
    location: {
      id: number
      name: string // e.g., "ash", "fsn1", "nbg1"
      description: string
      city: string
      country: string
      latitude: number
      longitude: number
      network_zone: string // "us-east", "eu-central", etc.
    }
    name: string // e.g., "ash-dc1"
    server_types: {
      available: number[]
      available_for_migration: number[]
      supported: number[]
    }
  }
  image: {
    id: number
    type: string // "system" or "snapshot"
    name: string // e.g., "ubuntu-20.04"
    architecture: string
    bound_to: number | null
    created_from: {
      id: number
      name: string
    } | null
    deprecated: string | null
    description: string
    disk_size: number
    image_size: number | null
    labels: Record<string, string>
    os_flavor: string // "ubuntu", "debian", etc.
    os_version: string // "20.04", "12", etc.
    protection: {
      delete: boolean
    }
    rapid_deploy: boolean
    status: string
    created: string // ISO 8601 timestamp
    deleted: string | null // ISO 8601 timestamp
  }
  iso: {
    id: number
    name: string
    description: string
    type: string // "public" or "private"
    architecture: string | null
  } | null
  primary_disk_size: number // Primary disk size in GB
  labels: Record<string, string>
  protection: {
    delete: boolean
    rebuild: boolean
  }
  backup_window: string | null // e.g., "06-10"
  rescue_enabled: boolean
  locked: boolean
  placement_group: {
    id: number
    name: string
    type: string
    servers: number[]
    labels: Record<string, string>
  } | null
  public_net: {
    firewalls: Array<{
      id: number
      name: string
    }>
    floating_ips: number[]
    ipv4: {
      id: number
      ip: string // Primary IPv4 address
      blocked: boolean
      dns_ptr: string
    }
    ipv6: {
      id: number
      ip: string // IPv6 address (CIDR)
      blocked: boolean
      dns_ptr: string[]
    }
  }
  private_net: Array<{
    id: number
    name: string
    ip: string
    mac_address: string
    alias_ips: string[]
  }>
  load_balancers: number[]
  volumes: number[]
  included_traffic: number // Included traffic in bytes
  ingoing_traffic: number // Ingoing traffic in bytes
  outgoing_traffic: number // Outgoing traffic in bytes
  created: string // ISO 8601 timestamp
}

/**
 * Hetzner API Response for List Servers
 */
export interface HetznerListServersResponse {
  servers: HetznerServer[]
  meta?: {
    pagination?: {
      page: number
      per_page: number
      previous_page: number | null
      next_page: number | null
      last_page: number
      total_entries: number
    }
  }
}
