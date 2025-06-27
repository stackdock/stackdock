"use server";

import { CurrentTeamResponse, Team } from './types';
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

export async function getGridPaneCurrentTeam(): Promise<CurrentTeamResponse> {
  const startTime = performance.now();
  const { url, token } = getGridPaneConfig();

  const endpoint = 'currentteam';
  const requestUrl = `${url}/settings/teams/current`;

  try {
    const fetchWithTimeout = createFetchWithTimeout();

    const response = await withRetry(
      async () => {
        return await fetchWithTimeout(requestUrl, {
          method: 'GET',
          headers: createGridPaneHeaders(token),
          next: {
            revalidate: 600, // Cache current team for 10 minutes (team data changes infrequently)
            tags: [`gridpane-current-team`]
          }
        });
      },
      endpoint
    );

    const teamData = await handleGridPaneResponse<Team>(response, endpoint);

    // Validate response structure (team is a single object, not an array)
    if (!teamData || typeof teamData.id !== 'number') {
      throw new GridPaneApiError(
        'Invalid response structure: missing or invalid team id',
        200,
        endpoint
      );
    }

    if (!teamData.name || !teamData.owner_id) {
      throw new GridPaneApiError(
        'Invalid response structure: missing required team fields',
        200,
        endpoint
      );
    }

    if (!teamData.created_at || !teamData.updated_at) {
      throw new GridPaneApiError(
        'Invalid response structure: missing timestamp fields',
        200,
        endpoint
      );
    }

    // Calculate duration and prepare metadata
    const duration = Math.round(performance.now() - startTime);
    
    // Create enhanced response with metadata
    const teamResponse: CurrentTeamResponse = {
      ...teamData,
      _metadata: {
        fetched_at: new Date().toISOString(),
        cached_until: new Date(Date.now() + 600000).toISOString(), // 10 minutes from now
        request_duration_ms: duration,
        api_version: '1.0'
      }
    };

    // Log successful call
    logApiCall(`${endpoint} (team: ${teamData.name})`, undefined, duration);

    return teamResponse;

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
