/**
 * Neon API Types
 * 
 * Generated from actual API responses in docks/neon/
 * 
 * @see docks/neon/project/listProjects.json
 * @see docks/neon/branch/listBranches.json
 * @see docks/neon/snapshot/listSnapshots.json
 */

/**
 * Neon Project
 * @see docks/neon/project/listProjects.json
 */
export interface NeonProject {
  id: string // "broad-field-27690464"
  platform_id: string // "aws"
  region_id: string // "aws-us-east-1"
  name: string // "Test Projects"
  provisioner: string // "k8s-neonvm"
  default_endpoint_settings: {
    autoscaling_limit_min_cu: number
    autoscaling_limit_max_cu: number
    suspend_timeout_seconds: number
  }
  settings: {
    allowed_ips: {
      ips: string[]
      protected_branches_only: boolean
    }
    enable_logical_replication: boolean
    maintenance_window: {
      weekdays: number[]
      start_time: string
      end_time: string
    }
    block_public_connections: boolean
    block_vpc_connections: boolean
    hipaa: boolean
  }
  pg_version: number // 16
  proxy_host: string // "us-east-1.aws.neon.tech"
  branch_logical_size_limit: number
  branch_logical_size_limit_bytes: number
  store_passwords: boolean
  active_time: number
  cpu_used_sec: number
  creation_source: string // "console"
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
  synthetic_storage_size: number
  quota_reset_at: string // ISO 8601
  owner_id: string // "org-spring-sound-71035136"
  compute_last_active_at: string // ISO 8601
  org_id: string // "org-spring-sound-71035136"
  history_retention_seconds: number
}

/**
 * Neon Branch
 * @see docks/neon/branch/listBranches.json
 */
export interface NeonBranch {
  id: string // "br-red-king-a4if1nyh"
  project_id: string // "broad-field-27690464"
  name: string // "main"
  current_state: string // "archived" | "active" | "suspended"
  state_changed_at: string // ISO 8601
  logical_size: number
  creation_source: string // "console"
  primary: boolean
  default: boolean
  protected: boolean
  cpu_used_sec: number
  compute_time_seconds: number
  active_time_seconds: number
  written_data_bytes: number
  data_transfer_bytes: number
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
  init_source: string // "parent-data"
}

/**
 * Neon Database
 * Note: Need to verify actual API response structure
 * Expected endpoint: GET /projects/{projectId}/branches/{branchId}/databases
 * For now, using placeholder structure based on Neon API docs
 * 
 * Note: API returns id as number (e.g., 33042544), but we convert to string for schema
 */
export interface NeonDatabase {
  id: string | number // API returns number, but we convert to string
  name: string
  branch_id: string
  created_at: string
  updated_at: string
  owner_name?: string
  // Add other fields from actual API response when available
}

/**
 * Neon Snapshot
 * @see docks/neon/snapshot/listSnapshots.json
 */
export interface NeonSnapshot {
  id: string // "snap-curly-art-a4oxpt34"
  name: string // "main at 2025-11-13 03:15:45 UTC (manual)"
  source_branch_id: string // "br-red-king-a4if1nyh"
  created_at: string // ISO 8601
  manual: boolean // true for manual snapshots
}
