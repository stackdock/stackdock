// Main BackupIntegration interface (matching API response structure)
export interface BackupIntegration {
  id: number;
  integrated_service: string;
  integration_name: string;
  token: string;
  secret_token: string;
  region: string;
}

// Error response type
export interface GridPaneErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Backup Integrations API response structure
export interface BackupIntegrationsApiResponse {
  success: boolean;
  message: string;
  integrations: BackupIntegration[];
}

// Enhanced BackupIntegrationsResponse with API response metadata
export interface BackupIntegrationsResponse extends BackupIntegrationsApiResponse {
  _metadata?: {
    fetched_at: string;
    cached_until?: string;
    request_duration_ms: number;
    api_version?: string;
  };
}

// Map of backup service types to display names and colors
export const BACKUP_SERVICE_INFO = {
  'aws-s3': {
    name: 'Amazon S3',
  },
  'dropbox': {
    name: 'Dropbox',
  },
  'backblaze': {
    name: 'Backblaze B2',
  },
  'wasabi': {
    name: 'Wasabi',
  },
} as const;

export const GRIDPANE_BACKUP_INTEGRATIONS_TAG = 'gridpane-backup-integrations';
