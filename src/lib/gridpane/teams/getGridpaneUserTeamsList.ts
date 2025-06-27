"use server";

import { UserTeamsResponse, UserTeamsApiResponse, Team } from './types';
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

export async function getGridPaneUserTeamsList(): Promise<UserTeamsResponse> {
  const startTime = performance.now();
  const { url, token } = getGridPaneConfig();

  const endpoint = 'user-teams';
  const requestUrl = `${url}/settings/teams`;

  try {
    const fetchWithTimeout = createFetchWithTimeout();

    const response = await withRetry(
      async () => {
        return await fetchWithTimeout(requestUrl, {
          method: 'GET',
          headers: createGridPaneHeaders(token),
          next: {
            revalidate: 300, // Cache user teams for 5 minutes
            tags: [`gridpane-user-teams`]
          }
        });
      },
      endpoint
    );

    const apiResponse = await handleGridPaneResponse<UserTeamsApiResponse>(response, endpoint);

    // Validate response structure (should be an object with numbered keys)
    if (!apiResponse || typeof apiResponse !== 'object' || Array.isArray(apiResponse)) {
      throw new GridPaneApiError(
        'Invalid response structure: expected object with team entries',
        200,
        endpoint
      );
    }

    // Convert object to array and validate team objects
    const teamsArray: Team[] = [];
    const keys = Object.keys(apiResponse);

    if (keys.length === 0) {
      console.log(`[GridPane API] No teams found for user`);
    }

    for (const key of keys) {
      const team = apiResponse[key];
      
      // Validate team object structure
      if (!team || typeof team.id !== 'number' || typeof team.name !== 'string') {
        throw new GridPaneApiError(
          `Invalid team object at key ${key}: missing required fields`,
          200,
          endpoint
        );
      }

      if (!team.owner_id || !team.created_at || !team.updated_at) {
        throw new GridPaneApiError(
          `Invalid team object at key ${key}: missing required metadata`,
          200,
          endpoint
        );
      }

      teamsArray.push(team);
    }

    // Sort teams by creation date (newest first)
    teamsArray.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Calculate duration and prepare metadata
    const duration = Math.round(performance.now() - startTime);
    
    // Create enhanced response with metadata
    const userTeamsResponse: UserTeamsResponse = {
      teams: teamsArray,
      _metadata: {
        fetched_at: new Date().toISOString(),
        cached_until: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
        request_duration_ms: duration,
        api_version: '1.0'
      }
    };

    // Log successful call
    logApiCall(`${endpoint} (${teamsArray.length} teams)`, undefined, duration);

    return userTeamsResponse;

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
