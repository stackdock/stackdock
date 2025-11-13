/**
 * PlanetScale API Types
 * 
 * Generated from actual API responses in docks/planetscale/
 * 
 * @see docks/planetscale/listOrganizations.json
 * @see docks/planetscale/listDatabases.json
 */

/**
 * PlanetScale Organization
 * @see docks/planetscale/listOrganizations.json
 */
export interface PlanetScaleOrganization {
  id: string // "ul8umvvqyk0j"
  type: "Organization"
  name: string // "support-wpoperator"
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
  billing_email: string
  database_count: number
  plan: string // "scaler_pro"
  flags?: {
    block_new_keyspaces_if_other_keyspaces_unready?: string
    dedicated_az_replica_pgbouncer?: string
    one_node?: string
    postgres_ip_allowlist?: string
  }
  invoice_budget_amount?: string
  sso?: boolean
  sso_directory?: boolean
  single_tenancy?: boolean
  managed_tenancy?: boolean
  keyspace_shard_limit?: number
  allow_llm_usage?: boolean
  has_card?: boolean
  payment_info_required?: boolean
  valid_billing_info?: boolean
  idp_managed_roles?: boolean
  idp_sso_managed_roles?: boolean
  unrestricted_idp_organization_membership?: boolean
  invoice_budget_alerts?: boolean
  features?: {
    insights?: boolean
    insights_collect_queries?: boolean
    sso?: boolean
    single_tenancy?: boolean
  }
}

/**
 * PlanetScale Database
 * @see docks/planetscale/listDatabases.json
 */
export interface PlanetScaleDatabase {
  id: string // "wzul1qu5i9wa"
  type: "Database"
  name: string // "stackdock-test"
  state: string // "ready", "deleted", "suspended", etc.
  kind: string // "postgresql" or "mysql"
  ready: boolean
  region: {
    id: string
    type: "Region"
    provider: string // "AWS"
    enabled: boolean
    slug: string // "us-east"
    display_name: string // "AWS us-east-1"
    location: string // "N. Virginia"
    current_default: boolean
    public_ip_addresses: string[]
  }
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
  plan: string // "scaler_pro"
  branches_count: number
  default_branch: string // "main"
  notes?: string
  sharded?: boolean
  html_url?: string
  url?: string
  branches_url?: string
  insights_enabled?: boolean
  default_branch_shard_count?: number
  default_branch_table_count?: number
  schema_last_updated_at?: string
  data_import?: any
  open_schema_recommendations_count?: number
  production_branches_count?: number
  development_branches_count?: number
  resizing?: boolean
  resize_queued?: boolean
  require_approval_for_deploy?: boolean
  migration_table_name?: string | null
  migration_framework?: string | null
  insights_raw_queries?: boolean
  multiple_admins_required_for_deletion?: boolean
  at_backup_restore_branches_limit?: boolean
  at_development_branch_usage_limit?: boolean
  default_branch_read_only_regions_count?: number
  automatic_migrations?: any
  production_branch_web_console?: boolean
  restrict_branch_region?: boolean
  allow_data_branching?: boolean
  foreign_keys_enabled?: boolean
}

