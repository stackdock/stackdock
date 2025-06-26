"use server";

import { BundlesResponse, BundlesApiResponse } from './types';
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

export async function getGridPaneBundlesList(): Promise<BundlesResponse> {
  const startTime = performance.now();
  const { url, token } = getGridPaneConfig();

  const endpoint = 'bundles';
  const requestUrl = `${url}/bundle`;

  try {
    const fetchWithTimeout = createFetchWithTimeout();

    const response = await withRetry(
      async () => {
        return await fetchWithTimeout(requestUrl, {
          method: 'GET',
          headers: createGridPaneHeaders(token),
          next: {
            revalidate: 3600, // Cache bundles for 1 hour (bundles rarely change)
            tags: [`gridpane-bundles`]
          }
        });
      },
      endpoint
    );

    const apiResponse = await handleGridPaneResponse<BundlesApiResponse>(response, endpoint);

    // Validate response structure (bundles is an array)
    if (!apiResponse || !Array.isArray(apiResponse.bundles)) {
      throw new GridPaneApiError(
        'Invalid response structure: missing or invalid bundles array',
        200,
        endpoint
      );
    }

    // Validate bundle objects
    for (const bundle of apiResponse.bundles) {
      if (!bundle || typeof bundle.id !== 'number' || typeof bundle.name !== 'string') {
        throw new GridPaneApiError(
          'Invalid response structure: invalid bundle object format',
          200,
          endpoint
        );
      }
    }

    // Calculate duration and prepare metadata
    const duration = Math.round(performance.now() - startTime);
    
    // Create enhanced response with metadata
    const bundlesResponse: BundlesResponse = {
      ...apiResponse,
      _metadata: {
        fetched_at: new Date().toISOString(),
        cached_until: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        request_duration_ms: duration,
        api_version: '1.0'
      }
    };

    // Log successful call
    logApiCall(`${endpoint} (${apiResponse.bundles.length} bundles)`, undefined, duration);

    return bundlesResponse;

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
