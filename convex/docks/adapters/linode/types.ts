/**
 * Linode API Types
 * 
 * Generated from Linode API v4 documentation
 * 
 * @see https://www.linode.com/api/v4
 * @see docks/linode/api-routes.md
 * @see docks/linode/getLinodes.json for actual API response
 */

/**
 * Linode Instance (Server)
 * Maps to universal `servers` table
 * 
 * @see docks/linode/getLinodes.json for actual API response
 */
export interface LinodeInstance {
  id: number // Linode ID (number, convert to string)
  label: string // Linode label/name
  group: string // Group (empty string if not set)
  status: string // "running", "stopped", "offline", "booting", etc.
  created: string // ISO 8601 timestamp
  updated: string // ISO 8601 timestamp
  type: string // Type slug (e.g., "g6-nanode-1")
  ipv4: string[] // Array of IPv4 addresses
  ipv6: string | null // IPv6 address (CIDR format)
  image: string // Image slug (e.g., "linode/ubuntu24.04")
  region: string // Region code (e.g., "us-central")
  site_type: string // Site type (e.g., "core")
  specs: {
    disk: number // Disk in MB
    memory: number // Memory in MB
    vcpus: number // CPU count
    gpus: number // GPU count
    transfer: number // Transfer quota in GB
    accelerated_devices: number // Accelerated devices count
  }
  alerts: {
    cpu: number // CPU alert threshold (%)
    network_in: number // Network in alert threshold (MB/s)
    network_out: number // Network out alert threshold (MB/s)
    transfer_quota: number // Transfer quota alert threshold (%)
    io: number // IO alert threshold (IOPS)
  }
  backups: {
    enabled: boolean // Backups enabled
    available: boolean // Backups available
    schedule: {
      day: string // Backup day
      window: string // Backup window
    }
    last_successful: string | null // Last successful backup timestamp
  }
  hypervisor: string // Hypervisor type (e.g., "kvm")
  watchdog_enabled: boolean // Watchdog enabled
  tags: string[] // Tags array
  host_uuid: string // Host UUID
  has_user_data: boolean // Has user data
  placement_group: any | null // Placement group
  disk_encryption: string // Disk encryption status (e.g., "enabled")
  lke_cluster_id: number | null // LKE cluster ID
  capabilities: string[] // Capabilities array
}

/**
 * Linode Account
 * Used for credential validation
 */
export interface LinodeAccount {
  email: string
  username: string
  first_name: string
  last_name: string
  company: string | null
  address_1: string
  address_2: string | null
  city: string
  state: string | null
  zip: string
  country: string
  phone: string | null
  tax_id: string | null
  balance: number
  balance_uninvoiced: number
  active_since: string
  capabilities: string[]
  euuid: string
}

/**
 * Linode Bucket (Object Storage)
 * Maps to universal `buckets` table
 * 
 * @see docks/linode/getBuckets.json for actual API response
 */
export interface LinodeBucket {
  hostname: string // Bucket hostname (e.g., "sdtest.us-sea-1.linodeobjects.com")
  label: string // Bucket label/name
  created: string // ISO 8601 timestamp
  region: string // Region code (e.g., "us-sea")
  cluster: string // Cluster name (e.g., "us-sea-1")
  size: number // Total size in bytes
  objects: number // Number of objects
  endpoint_type: string // Endpoint type (e.g., "E1")
  s3_endpoint: string // S3-compatible endpoint (e.g., "us-sea-1.linodeobjects.com")
}
