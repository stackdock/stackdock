/**
 * DigitalOcean API Types
 * 
 * Generated from DigitalOcean API v2 documentation
 * 
 * @see https://docs.digitalocean.com/reference/api/api-reference/
 * @see docks/digitalocean/api-routes.md
 * @see docks/digitalocean/getDroplets.json for actual API response
 */

/**
 * DigitalOcean Droplet (Server)
 * Maps to universal `servers` table
 * 
 * @see docks/digitalocean/getDroplets.json for actual API response
 */
export interface DigitalOceanDroplet {
  id: number // Droplet ID (number, not string)
  name: string // Droplet name
  memory: number // RAM in MB
  vcpus: number // CPU count
  disk: number // Disk in GB
  disk_info: Array<{
    type: string
    size: {
      amount: number
      unit: string
    }
  }>
  locked: boolean // Locked flag
  status: string // "active", "off", "archive", "new"
  kernel: any | null // Kernel info
  created_at: string // ISO 8601 timestamp
  features: string[] // Features array (e.g., ["monitoring", "droplet_agent"])
  backup_ids: number[] // Backup IDs
  next_backup_window: any | null // Next backup window
  snapshot_ids: number[] // Snapshot IDs
  image: {
    id: number
    name: string
    distribution: string
    slug: string
    public: boolean
    regions: string[]
    created_at: string
    min_disk_size: number
    type: string
    size_gigabytes: number
    description: string
    tags: string[]
    status: string
  }
  volume_ids: string[] // Volume IDs
  size: {
    slug: string // Size slug (e.g., "s-1vcpu-1gb-amd")
    memory: number
    vcpus: number
    disk: number
    transfer: number
    price_monthly: number
    price_hourly: number
    regions: string[]
    available: boolean
    description: string
    networking_throughput: number
    disk_info: Array<{
      type: string
      size: {
        amount: number
        unit: string
      }
    }>
  }
  size_slug: string // Size slug (duplicate of size.slug)
  networks: {
    v4: Array<{
      ip_address: string
      netmask: string
      gateway: string
      type: "public" | "private"
    }>
    v6: Array<{
      ip_address: string
      netmask: number
      gateway: string
      type: "public" | "private"
    }>
  }
  region: {
    name: string // Region name (e.g., "Atlanta 1")
    slug: string // Region slug (e.g., "atl1")
    features: string[]
    available: boolean
    sizes: string[] // Available sizes
  }
  tags: string[] // Tags array
  vpc_uuid: string // VPC UUID
}

/**
 * DigitalOcean Account
 * Used for credential validation
 */
export interface DigitalOceanAccount {
  account: {
    droplet_limit: number
    floating_ip_limit: number
    volume_limit: number
    email: string
    uuid: string
    email_verified: boolean
    status: string
    status_message: string
  }
}
