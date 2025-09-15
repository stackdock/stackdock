"use server";

import { revalidateTag } from 'next/cache';
import {
  getGridPaneConfig,
  createFetchWithTimeout,
  logApiCall,
  createGridPaneHeaders,
  GridPaneApiError
} from '../helpers';
import {
  withRetry,
  handleGridPaneResponse
} from '../utils';

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

export async function updateSitePhpVersion(
  siteId: number,
  phpVersion: PhpVersion
): Promise<UpdatePhpVersionResult> {
  const startTime = performance.now();
  const { url, token } = getGridPaneConfig();

  const endpoint = `site/${siteId}/php-version`;
  const requestUrl = `${url}/site/${siteId}/php-version`;

  // Validate inputs
  if (!Number.isInteger(siteId) || siteId <= 0) {
    return {
      success: false,
      message: `Invalid site ID: ${siteId}. Must be a positive integer.`,
      error: 'INVALID_SITE_ID'
    };
  }

  if (!AVAILABLE_PHP_VERSIONS.includes(phpVersion)) {
    return {
      success: false,
      message: `Invalid PHP version: ${phpVersion}. Must be one of: ${AVAILABLE_PHP_VERSIONS.join(', ')}`,
      error: 'INVALID_PHP_VERSION'
    };
  }

  console.log(`[UPDATE PHP VERSION] Starting update for site ${siteId} to PHP ${phpVersion}`);

  try {
    const fetchWithTimeout = createFetchWithTimeout();

    const requestBody = {
      php_version: phpVersion
    };

    const response = await withRetry(
      async () => {
        return await fetchWithTimeout(requestUrl, {
          method: 'PUT',
          headers: {
            ...createGridPaneHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
      },
      endpoint
    );

    const apiResponse = await handleGridPaneResponse<UpdatePhpVersionResponse>(response, endpoint);

    // Validate response structure
    if (!apiResponse || typeof apiResponse.success !== 'boolean') {
      throw new GridPaneApiError(
        'Invalid response structure: missing success field',
        200,
        endpoint
      );
    }

    if (!apiResponse.success) {
      throw new GridPaneApiError(
        `PHP version update failed: ${apiResponse.message || 'Unknown error'}`,
        200,
        endpoint
      );
    }

    // Calculate duration and log success
    const duration = Math.round(performance.now() - startTime);
    logApiCall(`${endpoint} (PHP ${phpVersion})`, undefined, duration);

    // Revalidate cache tags for the updated site
    revalidateTag(`gridpane-single-site-${siteId}`);
    revalidateTag('gridpane-sites'); // Also revalidate sites list in case PHP version shows there

    console.log(`[UPDATE PHP VERSION] Successfully updated site ${siteId} to PHP ${phpVersion} (${duration}ms)`);

    return {
      success: true,
      message: `Successfully updated PHP version to ${phpVersion}`,
      data: apiResponse
    };

  } catch (error) {
    const _duration = Math.round(performance.now() - startTime);
    
    console.error(`[UPDATE PHP VERSION] Failed to update site ${siteId}:`, error);

    if (error instanceof GridPaneApiError) {
      return {
        success: false,
        message: error.message,
        error: 'GRIDPANE_API_ERROR'
      };
    }

    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'UNEXPECTED_ERROR'
    };
  }
}
