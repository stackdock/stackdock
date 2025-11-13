/**
 * Vultr API Types
 * 
 * Generated from Vultr API v2 documentation
 * 
 * @see https://docs.vultr.com/api/
 * @see docks/vultr/api-routes.md
 * @see docks/vultr/getInstances.json for actual API response
 */

/**
 * Vultr Instance (Server)
 * Maps to universal `servers` table
 * 
 * @see docks/vultr/getInstances.json for actual API response
 */
export interface VultrInstance {
  id: string // Instance ID (UUID)
  os: string // OS name (e.g., "Ubuntu 24.04 LTS x64")
  ram: number // RAM in MB
  disk: number // Disk in GB
  main_ip: string // Primary IP address
  vcpu_count: number // CPU count
  region: string // Region code (e.g., "mia")
  plan: string // Plan ID (e.g., "vc2-1c-1gb")
  date_created: string // ISO 8601 timestamp
  status: string // Instance status (e.g., "active")
  allowed_bandwidth: number // Bandwidth in GB
  netmask_v4: string // IPv4 netmask
  gateway_v4: string // IPv4 gateway
  power_status: string // "running", "stopped", "pending", "resizing", "suspended"
  server_status: string // "ok", "locked", "installing", etc.
  v6_network: string // IPv6 network (empty string if not set)
  v6_main_ip: string // IPv6 main IP (empty string if not set)
  v6_network_size: number // IPv6 network size
  label: string // Instance label/name
  hostname: string // Hostname
  internal_ip: string // Internal IP (empty string if not set)
  vpcs: string[] // VPC IDs array
  kvm: string // KVM URL
  tag: string // Single tag (empty string if not set)
  tags: string[] // Tags array
  os_id: number // OS ID
  app_id: number // App ID (0 if not set)
  image_id: string // Image ID (empty string if not set)
  snapshot_id: string // Snapshot ID (empty string if not set)
  firewall_group_id: string // Firewall group ID (empty string if not set)
  vpc_only: boolean // VPC only flag
  features: string[] // Features array
  user_scheme: string // User scheme (e.g., "limited")
}

/**
 * Vultr Account
 * Used for credential validation
 */
export interface VultrAccount {
  account: {
    balance: number
    pending_charges: number
    last_payment_date: string | null
    last_payment_amount: number | null
  }
  name: string
  email: string
  acls: string[]
}
