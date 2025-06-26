// Main Bundle interface (matching API response structure)
export interface Bundle {
  id: number;
  name: string;
}

// Error response type (matching other APIs)
export interface GridPaneErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Bundles response structure (simple array, no pagination)
export interface BundlesApiResponse {
  bundles: Bundle[];
}

// Enhanced BundlesResponse with API response metadata
export interface BundlesResponse extends BundlesApiResponse {
  _metadata?: {
    fetched_at: string;
    cached_until?: string;
    request_duration_ms: number;
    api_version?: string;
  };
}

export const GRIDPANE_BUNDLES_TAG = 'gridpane-bundles';
