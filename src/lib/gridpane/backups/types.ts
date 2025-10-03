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

// ============================================
// BACKUP SCHEDULES TYPES
// ============================================

// Individual backup schedule interface
export interface BackupSchedule {
  id: number;
  type: 'local' | 'remote';
  bup_schedule: string;
  hour: string;
  minute: string;
  day: string;
  service_id: number | null;
  service_name: string | null;
  service_user_id: number | null;
}

// Site backup schedules interface
export interface SiteBackupSchedules {
  server_id: number;
  site_id: number;
  url: string;
  schedule_backups: BackupSchedule[];
}

// Backup Schedules API response structure
export interface BackupSchedulesApiResponse {
  success: boolean;
  data: SiteBackupSchedules[];
}

// Enhanced BackupSchedulesResponse with API response metadata
export interface BackupSchedulesResponse extends BackupSchedulesApiResponse {
  _metadata?: {
    fetched_at: string;
    cached_until?: string;
    request_duration_ms: number;
    api_version?: string;
  };
}

// Schedule frequency mapping
export const SCHEDULE_FREQUENCY_INFO = {
  'daily': {
    name: 'Daily',
    color: 'bg-blue-100 text-blue-800',
    icon: '📅'
  },
  'weekly': {
    name: 'Weekly',
    color: 'bg-green-100 text-green-800',
    icon: '📆'
  },
  'monthly': {
    name: 'Monthly',
    color: 'bg-purple-100 text-purple-800',
    icon: '🗓️'
  },
  'hourly': {
    name: 'Hourly',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏰'
  }
} as const;

// Backup type mapping
export const BACKUP_TYPE_INFO = {
  'local': {
    name: 'Local Backup',
    color: 'bg-gray-100 text-gray-800',
    icon: '💾'
  },
  'remote': {
    name: 'Remote Backup',
    color: 'bg-orange-100 text-orange-800',
    icon: '☁️'
  }
} as const;

// Day of week mapping
export const DAY_OF_WEEK = {
  '0': 'Sunday',
  '1': 'Monday',
  '2': 'Tuesday',
  '3': 'Wednesday',
  '4': 'Thursday',
  '5': 'Friday',
  '6': 'Saturday'
} as const;

export const GRIDPANE_BACKUP_SCHEDULES_TAG = 'gridpane-backup-schedules';
