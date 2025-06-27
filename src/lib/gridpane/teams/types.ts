// Main Team interface (matching API response structure)
export interface Team {
  id: number;
  owner_id: number;
  name: string;
  slug: string | null;
  photo_url: string;
  stripe_id: string | null;
  current_billing_plan: string | null;
  vat_id: string | null;
  trial_ends_at: string;
  created_at: string;
  updated_at: string;
  teams_additional_members: number | null;
  tax_rate: number;
}

// Error response type
export interface GridPaneErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Enhanced CurrentTeamResponse with API response metadata
export interface CurrentTeamResponse extends Team {
  _metadata?: {
    fetched_at: string;
    cached_until?: string;
    request_duration_ms: number;
    api_version?: string;
  };
}

// User Teams API response structure (object with numbered keys)
export interface UserTeamsApiResponse {
  [key: string]: Team;
}

// Enhanced UserTeamsResponse with API response metadata and converted array
export interface UserTeamsResponse {
  teams: Team[];
  _metadata?: {
    fetched_at: string;
    cached_until?: string;
    request_duration_ms: number;
    api_version?: string;
  };
}

export const GRIDPANE_CURRENT_TEAM_TAG = 'gridpane-current-team';
export const GRIDPANE_USER_TEAMS_TAG = 'gridpane-user-teams';
