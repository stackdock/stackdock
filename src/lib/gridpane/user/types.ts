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

// Types for the nested 'currentTeam' and 'teams' objects
export interface TeamPivot {
  user_id: number;
  team_id: number;
  role: string;
}

export interface Team {
  id: number;
  owner_id: number;
  name: string;
  slug: string | null;
  photo_url: string;
  stripe_id: string | null;
  current_billing_plan: string | null;
  vat_id: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  pivot: TeamPivot;
  teams_additional_members: number | null;
  tax_rate: number;
}

// Types for permissions
export interface PermissionPivot {
  model_id: number;
  permission_id: number;
  model_type: string;
}

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  state: boolean;
  permission_usage_amount_values: unknown[];
  is_on_grace_period: boolean;
  pivot: PermissionPivot;
}

// Types for roles
export interface RolePivot {
  model_id: number;
  role_id: number;
  model_type: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  pivot: RolePivot;
}

// Types for billing plan
export interface Plan {
  id: number;
  name: string;
  slug: string;
  test_stripe_plan_id: string;
  prod_stripe_plan_id: string;
  type: string;
  price: number;
  permission_price_tier: string;
  trial_days: number;
  max_teams: number | null;
  max_team_members: number;
  yearly: number;
  archived: boolean;
  hidden: boolean;
  release_time: string | null;
  archive_time: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Main User interface (in exact order as API response)
export interface User {
  id: number;
  name: string;
  email: string;
  previous_email: string | null;
  minimum_balance_amount: number;
  photo_url: string;
  uses_two_factor_auth: boolean;
  two_factor_enable_count: number;
  otp_session_duration: number;
  otp_preferences: string | null;
  current_team_id: number;
  current_billing_plan: string;
  billing_state: string | null;
  vat_id: string | null;
  trial_ends_at: string | null;
  last_read_announcements_at: string;
  first_login_onboarding: boolean;
  onboarding_scheduled: boolean;
  onboarding_complete: number;
  test_user: boolean;
  paid_fortress: boolean;
  crisp_signature: string;
  is_account_suspended: boolean;
  multitenancy_available: number;
  pre_restore_backup_modal_invisible: boolean;
  app_timezone: string;
  last_visited_at: string;
  email_verified_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  last_seen: string;
  can_create_server: boolean;
  currentTeam: Team;
  uses_authy: boolean;
  uses_google: boolean;
  can_use_preemptive_support: boolean;
  can_use_multisite_preemptive_support: boolean;
  use_preemptive_support_addon_is_on_grace_period: boolean;
  use_multisite_preemptive_support_addon_is_on_grace_period: boolean;
  preemptive_support_state: boolean;
  multisite_preemptive_support_state: boolean;
  plan_type: string;
  has_git_mt_access: boolean;
  has_git_access: boolean;
  peak_freq_servers_count: number;
  is_core_stripe_id: boolean;
  peak_freq_available: boolean;
  teams: Team[];
  permissions: Permission[];
  roles: Role[];
  plan: Plan;
  tax_rate: number;
}

// Error response type (matching other APIs)
export interface GridPaneErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Enhanced UserResponse with API response metadata
export interface UserResponse extends User {
  // Add response-specific metadata that might be useful
  _metadata?: {
    fetched_at: string;
    cached_until?: string;
    request_duration_ms: number;
    api_version?: string;
  };
}

export const GRIDPANE_USER_TAG = 'gridpane-user';
