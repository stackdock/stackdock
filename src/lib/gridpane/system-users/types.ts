// Types for nested sites within each system user
export interface SystemUserSite {
  id: number;
  url: string;
}

// Main SystemUser interface (matching API response structure)
export interface SystemUser {
  id: number;
  username: string;
  details: string | null;
  status: string;
  public_key: string | null;
  server_id: number;
  user_id: number;
  restricted_site_id: number | null;
  restricted_path: string | null;
  sudo: boolean;
  ssh_access: boolean;
  password: string;
  is_primary: boolean;
  is_primary_with_no_restricted_users: boolean;
  sites: SystemUserSite[];
}

// Standardized meta link structure
export interface MetaLink {
  url: string | null;
  label: string;
  active: boolean;
}

// Meta structure for pagination
export interface SystemUsersMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: MetaLink[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

// Links structure for pagination
export interface SystemUsersLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

// Error response type
export interface GridPaneErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// API response structure (matches your JSON exactly)
export interface SystemUsersApiResponse {
  data: SystemUser[];
  links: SystemUsersLinks;
  meta: SystemUsersMeta;
}

// Enhanced SystemUsersResponse with API response metadata
export interface SystemUsersResponse extends SystemUsersApiResponse {
  _metadata?: {
    fetched_at: string;
    cached_until?: string;
    request_duration_ms: number;
    api_version?: string;
  };
}

export const GRIDPANE_SYSTEM_USERS_TAG = 'gridpane-system-users';
