// Available PHP versions (expand based on GridPane's supported versions)
export const AVAILABLE_PHP_VERSIONS = [
  '7.4',
  '8.0',
  '8.1',
  '8.2',
  '8.3',
  '8.4'
] as const;

export type PhpVersion = typeof AVAILABLE_PHP_VERSIONS[number];

// Response type for the mutation
export interface UpdatePhpVersionResponse {
  success: boolean;
  message: string;
  site_id: number;
  new_php_version: string;
  updated_at: string;
}

// Server action result type
export interface UpdatePhpVersionResult {
  success: boolean;
  message: string;
  data?: UpdatePhpVersionResponse;
  error?: string;
}
