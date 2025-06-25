"use server";

import { SingleSiteResponse, SingleSiteApiResponse } from './types';
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

export async function getGridPaneSite(siteId: number): Promise<SingleSiteResponse> {
  const startTime = performance.now();
  const { url, token } = getGridPaneConfig();

  const endpoint = `site/${siteId}`;
  const requestUrl = `${url}/site/${siteId}`;

  // Validate site ID
  if (!Number.isInteger(siteId) || siteId <= 0) {
    throw new GridPaneApiError(
      `Invalid site ID: ${siteId}. Must be a positive integer.`,
      400,
      endpoint
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
            revalidate: 180, // Cache single site for 3 minutes (more detailed data changes more frequently)
            tags: [`gridpane-single-site`, `gridpane-single-site-${siteId}`]
          }
        });
      },
      endpoint
    );

    const apiResponse = await handleGridPaneResponse<SingleSiteApiResponse>(response, endpoint);

    // Validate response structure (single site is wrapped in data object)
    if (!apiResponse || !apiResponse.data) {
      throw new GridPaneApiError(
        'Invalid response structure: missing data object',
        200,
        endpoint
      );
    }

    const siteData = apiResponse.data;

    if (!siteData || typeof siteData.id !== 'number') {
      throw new GridPaneApiError(
        'Invalid response structure: missing or invalid site id',
        200,
        endpoint
      );
    }

    if (!siteData.url || !siteData.server) {
      throw new GridPaneApiError(
        'Invalid response structure: missing required site fields',
        200,
        endpoint
      );
    }

    if (!Array.isArray(siteData.vpsServices)) {
      throw new GridPaneApiError(
        'Invalid response structure: vpsServices must be an array',
        200,
        endpoint
      );
    }

    if (!Array.isArray(siteData.schedule_backups)) {
      throw new GridPaneApiError(
        'Invalid response structure: schedule_backups must be an array',
        200,
        endpoint
      );
    }

    // Calculate duration and prepare metadata
    const duration = Math.round(performance.now() - startTime);
    
    // Create enhanced response with metadata
    const siteResponse: SingleSiteResponse = {
      ...siteData,
      _metadata: {
        fetched_at: new Date().toISOString(),
        cached_until: new Date(Date.now() + 180000).toISOString(), // 3 minutes from now
        request_duration_ms: duration,
        api_version: '1.0'
      }
    };

    // Log successful call
    logApiCall(`${endpoint} (site: ${siteData.url})`, undefined, duration);

    return siteResponse;

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
      undefined,
      error
    );
    
    console.error(`[GridPane API Error] ${endpoint}: ${unexpectedError.message} (${duration}ms)`, error);
    throw unexpectedError;
  }
}
