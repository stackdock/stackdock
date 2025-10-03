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
import {
  AVAILABLE_PHP_VERSIONS,
  type PhpVersion,
  type UpdatePhpVersionResponse,
  type UpdatePhpVersionResult
} from './types';

export async function updateSitePhpVersion(
  siteId: number,
  phpVersion: PhpVersion
): Promise<UpdatePhpVersionResult> {
  const startTime = performance.now();
  const { url, token } = getGridPaneConfig();

  // Use normalized endpoint for rate limiting (all PUT /site/{id} share the same limit)
  const endpoint = `PUT:/site/{id}`;
  const requestUrl = `${url}/site/${siteId}`;

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

    const apiResponse = await handleGridPaneResponse<Record<string, unknown>>(response, endpoint);

    // GridPane PUT /site/{id} returns the updated site object, not a success/message structure
    // If we got a 200 response and the response was parsed, consider it successful

    // Calculate duration and log success
    const duration = Math.round(performance.now() - startTime);
    logApiCall(`${endpoint} (PHP ${phpVersion})`, undefined, duration);

    // Revalidate cache tags for the updated site
    revalidateTag(`gridpane-single-site-${siteId}`);
    revalidateTag('gridpane-sites'); // Also revalidate sites list in case PHP version shows there

    return {
      success: true,
      message: `Successfully updated PHP version to ${phpVersion}`,
      data: apiResponse as unknown as UpdatePhpVersionResponse
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
