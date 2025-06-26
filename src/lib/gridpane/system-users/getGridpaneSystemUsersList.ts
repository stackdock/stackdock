"use server";

import { SystemUsersResponse, SystemUsersApiResponse } from './types';
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

export async function getGridPaneSystemUsersList(page: number = 1): Promise<SystemUsersResponse> {
  const startTime = performance.now();
  const { url, token } = getGridPaneConfig();

  const endpoint = 'system-user';
  const requestUrl = `${url}/system-user?page=${page}`;

  // Validate page parameter
  if (!Number.isInteger(page) || page < 1) {
    throw new GridPaneApiError(
      `Invalid page number: ${page}. Must be a positive integer.`,
      400,
      endpoint,
      page
    );
  }

  try {
    const fetchWithTimeout = createFetchWithTimeout();

    const response = await withRetry(
      async () => {
        return await fetchWithTimeout(requestUrl, {
          method: 'GET',
          headers: createGridPaneHeaders(token),
          next: {
            revalidate: 60, // Cache system users for 1 minute
            tags: [`gridpane-system-users`, `gridpane-system-users-page-${page}`]
          }
        });
      },
      endpoint
    );

    const apiResponse = await handleGridPaneResponse<SystemUsersApiResponse>(response, endpoint);

    // Validate response structure
    if (!apiResponse || !Array.isArray(apiResponse.data)) {
      throw new GridPaneApiError(
        'Invalid response structure: missing or invalid data array',
        200,
        endpoint,
        page
      );
    }

    if (!apiResponse.meta || typeof apiResponse.meta.current_page !== 'number') {
      throw new GridPaneApiError(
        'Invalid response structure: missing or invalid meta pagination',
        200,
        endpoint,
        page
      );
    }

    if (!apiResponse.links) {
      throw new GridPaneApiError(
        'Invalid response structure: missing links object',
        200,
        endpoint,
        page
      );
    }

    // Validate system user objects
    for (const systemUser of apiResponse.data) {
      if (!systemUser || typeof systemUser.id !== 'number' || typeof systemUser.username !== 'string') {
        throw new GridPaneApiError(
          'Invalid response structure: invalid system user object format',
          200,
          endpoint,
          page
        );
      }

      if (!Array.isArray(systemUser.sites)) {
        throw new GridPaneApiError(
          'Invalid response structure: system user sites must be an array',
          200,
          endpoint,
          page
        );
      }
    }

    // Verify page number matches requested page
    if (apiResponse.meta.current_page !== page) {
      console.warn(`Requested page ${page} but received page ${apiResponse.meta.current_page}`);
    }

    // Calculate duration and prepare metadata
    const duration = Math.round(performance.now() - startTime);
    
    // Create enhanced response with metadata
    const systemUsersResponse: SystemUsersResponse = {
      ...apiResponse,
      _metadata: {
        fetched_at: new Date().toISOString(),
        cached_until: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
        request_duration_ms: duration,
        api_version: '1.0'
      }
    };

    // Log successful call
    logApiCall(`${endpoint} (${apiResponse.data.length} system users)`, page, duration);

    return systemUsersResponse;

  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    
    if (error instanceof GridPaneApiError) {
      console.error(`[GridPane API Error] ${endpoint}: ${error.message} (${duration}ms)`);
      throw error;
    }

    // Handle unexpected errors
    const unexpectedError = new GridPaneApiError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
      endpoint,
      page,
      error
    );
    
    console.error(`[GridPane API Error] ${endpoint}: ${unexpectedError.message} (${duration}ms)`, error);
    throw unexpectedError;
  }
}
