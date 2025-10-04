"use server";

import { revalidateTag } from 'next/cache';
import {
  getGridPaneConfig,
  createFetchWithTimeout,
  logApiCall,
  createGridPaneHeaders,
  GridPaneApiError
} from '../helpers';
import { rateLimiter } from '../rate-limiter';
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

  const endpoint = `site/${siteId}`;
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

  console.log(`[UPDATE PHP VERSION] Starting update for site ${siteId} to PHP ${phpVersion}`);
  console.log(`[UPDATE PHP VERSION] Endpoint: ${endpoint}`);

  // Check rate limit BEFORE attempting request
  const waitTime = rateLimiter.checkEndpoint(endpoint);
  if (waitTime !== null) {
    const message = rateLimiter.getRateLimitMessage(endpoint);
    console.warn(`[UPDATE PHP VERSION] Rate limited - need to wait ${waitTime}s`);
    return {
      success: false,
      message: message || `Rate limited. Please wait ${waitTime} seconds before trying again.`,
      error: 'RATE_LIMITED'
    };
  }

  try {
    const fetchWithTimeout = createFetchWithTimeout();

    const requestBody = {
      php_version: phpVersion
    };

    const response = await withRetry(
      async () => {
        console.log(`[UPDATE PHP VERSION] Making PUT request to ${requestUrl}`);
        return await fetchWithTimeout(requestUrl, {
          method: 'PUT',
          headers: {
            ...createGridPaneHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
      },
      endpoint,
      undefined,
      0 // No retries for mutations
    );

    // Update rate limiter with response headers
    rateLimiter.updateFromHeaders(endpoint, response.headers);

    const apiResponse = await handleGridPaneResponse<Record<string, unknown>>(response, endpoint);

    // Log the actual response to see what GridPane returns
    console.log(`[UPDATE PHP VERSION] Response:`, JSON.stringify(apiResponse, null, 2));

    // Calculate duration and log success
    const duration = Math.round(performance.now() - startTime);
    logApiCall(`${endpoint} (PHP ${phpVersion})`, undefined, duration);

    // Revalidate cache tags for the updated site
    revalidateTag(`gridpane-single-site-${siteId}`);
    revalidateTag('gridpane-sites');

    console.log(`[UPDATE PHP VERSION] Successfully updated site ${siteId} to PHP ${phpVersion}`);

    return {
      success: true,
      message: `Successfully updated PHP version to ${phpVersion}. The change is being applied on the server.`,
      data: apiResponse as unknown as UpdatePhpVersionResponse
    };

  } catch (error) {
    const duration = Math.round(performance.now() - startTime);

    console.error(`[UPDATE PHP VERSION] Failed to update site ${siteId} after ${duration}ms:`, error);

    if (error instanceof GridPaneApiError) {
      // If it's a rate limit error, update the rate limiter and provide clear message
      if (error.status === 429) {
        const message = rateLimiter.getRateLimitMessage(endpoint);
        return {
          success: false,
          message: message || `Rate limit exceeded. GridPane allows only 2 PUT requests per minute for site updates.`,
          error: 'RATE_LIMITED'
        };
      }

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
