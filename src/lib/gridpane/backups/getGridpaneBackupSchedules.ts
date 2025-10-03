"use server";

import { BackupSchedulesResponse, BackupSchedulesApiResponse } from './types';
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

export async function getGridPaneBackupSchedules(): Promise<BackupSchedulesResponse> {
  const startTime = performance.now();
  const { url, token } = getGridPaneConfig();

  const endpoint = 'backup/allschedules';
  const requestUrl = `${url}/backups/schedules`;

  try {
    const fetchWithTimeout = createFetchWithTimeout();

    const response = await withRetry(
      async () => {
        return await fetchWithTimeout(requestUrl, {
          method: 'GET',
          headers: createGridPaneHeaders(token),
          next: {
            revalidate: 300, // Cache backup schedules for 5 minutes
            tags: [`gridpane-backup-schedules`]
          }
        });
      },
      endpoint
    );

    const apiResponse = await handleGridPaneResponse<BackupSchedulesApiResponse>(response, endpoint);

    // Validate response structure (success/data format)
    if (!apiResponse || typeof apiResponse.success !== 'boolean') {
      throw new GridPaneApiError(
        'Invalid response structure: missing or invalid success field',
        200,
        endpoint
      );
    }

    if (!apiResponse.success) {
      throw new GridPaneApiError(
        'API request failed: backup schedules request was not successful',
        200,
        endpoint
      );
    }

    if (!Array.isArray(apiResponse.data)) {
      throw new GridPaneApiError(
        'Invalid response structure: data must be an array',
        200,
        endpoint
      );
    }

    // Validate site backup schedule objects
    for (const siteSchedule of apiResponse.data) {
      if (!siteSchedule || typeof siteSchedule.server_id !== 'number' || typeof siteSchedule.site_id !== 'number') {
        throw new GridPaneApiError(
          'Invalid response structure: invalid site schedule server_id or site_id',
          200,
          endpoint
        );
      }

      if (!siteSchedule.url || !Array.isArray(siteSchedule.schedule_backups)) {
        throw new GridPaneApiError(
          'Invalid response structure: missing url or schedule_backups array',
          200,
          endpoint
        );
      }

      // Validate individual backup schedules
      for (const schedule of siteSchedule.schedule_backups) {
        if (!schedule || typeof schedule.id !== 'number') {
          throw new GridPaneApiError(
            'Invalid response structure: invalid backup schedule id',
            200,
            endpoint
          );
        }

        if (!['local', 'remote'].includes(schedule.type)) {
          throw new GridPaneApiError(
            'Invalid response structure: backup schedule type must be local or remote',
            200,
            endpoint
          );
        }

        if (!schedule.bup_schedule || !schedule.hour || !schedule.minute || !schedule.day) {
          throw new GridPaneApiError(
            'Invalid response structure: missing required backup schedule fields',
            200,
            endpoint
          );
        }
      }
    }

    // Calculate duration and prepare metadata
    const duration = Math.round(performance.now() - startTime);

    // Calculate total schedules
    const totalSchedules = apiResponse.data.reduce((sum, site) => sum + site.schedule_backups.length, 0);

    // Create enhanced response with metadata
    const backupSchedulesResponse: BackupSchedulesResponse = {
      ...apiResponse,
      _metadata: {
        fetched_at: new Date().toISOString(),
        cached_until: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
        request_duration_ms: duration,
        api_version: '1.0'
      }
    };

    // Log successful call
    logApiCall(`${endpoint} (${apiResponse.data.length} sites, ${totalSchedules} schedules)`, undefined, duration);

    return backupSchedulesResponse;

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
