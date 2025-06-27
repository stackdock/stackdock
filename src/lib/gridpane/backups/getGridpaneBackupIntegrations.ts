"use server";

import { BackupIntegrationsResponse, BackupIntegrationsApiResponse } from './types';
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

export async function getGridPaneBackupIntegrations(): Promise<BackupIntegrationsResponse> {
  const startTime = performance.now();
  const { url, token } = getGridPaneConfig();

  const endpoint = 'backup/all-integrations';
  const requestUrl = `${url}/backups/integrations`;

  try {
    const fetchWithTimeout = createFetchWithTimeout();

    const response = await withRetry(
      async () => {
        return await fetchWithTimeout(requestUrl, {
          method: 'GET',
          headers: createGridPaneHeaders(token),
          next: {
            revalidate: 900, // Cache backup integrations for 15 minutes (integrations change rarely)
            tags: [`gridpane-backup-integrations`]
          }
        });
      },
      endpoint
    );

    const apiResponse = await handleGridPaneResponse<BackupIntegrationsApiResponse>(response, endpoint);

    // Validate response structure (unique success/message format)
    if (!apiResponse || typeof apiResponse.success !== 'boolean') {
      throw new GridPaneApiError(
        'Invalid response structure: missing or invalid success field',
        200,
        endpoint
      );
    }

    if (!apiResponse.success) {
      throw new GridPaneApiError(
        `API request failed: ${apiResponse.message || 'Unknown error'}`,
        200,
        endpoint
      );
    }

    if (!apiResponse.message || typeof apiResponse.message !== 'string') {
      throw new GridPaneApiError(
        'Invalid response structure: missing or invalid message field',
        200,
        endpoint
      );
    }

    if (!Array.isArray(apiResponse.integrations)) {
      throw new GridPaneApiError(
        'Invalid response structure: integrations must be an array',
        200,
        endpoint
      );
    }

    // Validate integration objects
    for (const integration of apiResponse.integrations) {
      if (!integration || typeof integration.id !== 'number') {
        throw new GridPaneApiError(
          'Invalid response structure: invalid integration id',
          200,
          endpoint
        );
      }

      if (!integration.integrated_service || !integration.integration_name) {
        throw new GridPaneApiError(
          'Invalid response structure: missing required integration fields',
          200,
          endpoint
        );
      }

      if (!integration.token || !integration.secret_token) {
        throw new GridPaneApiError(
          'Invalid response structure: missing integration credentials',
          200,
          endpoint
        );
      }
    }

    // Calculate duration and prepare metadata
    const duration = Math.round(performance.now() - startTime);
    
    // Create enhanced response with metadata
    const backupIntegrationsResponse: BackupIntegrationsResponse = {
      ...apiResponse,
      _metadata: {
        fetched_at: new Date().toISOString(),
        cached_until: new Date(Date.now() + 900000).toISOString(), // 15 minutes from now
        request_duration_ms: duration,
        api_version: '1.0'
      }
    };

    // Log successful call
    logApiCall(`${endpoint} (${apiResponse.integrations.length} integrations)`, undefined, duration);

    return backupIntegrationsResponse;

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
