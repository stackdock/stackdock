"use server";

import { UserResponse, User } from './types';
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

export async function getGridPaneUser(): Promise<UserResponse> {
  const startTime = performance.now();
  const { url, token } = getGridPaneConfig();

  const endpoint = 'user';
  const requestUrl = `${url}/user`;

  try {
    const fetchWithTimeout = createFetchWithTimeout();

    const response = await withRetry(
      async () => {
        return await fetchWithTimeout(requestUrl, {
          method: 'GET',
          headers: createGridPaneHeaders(token),
          next: {
            revalidate: 300, // Cache user data for 5 minutes (less frequent changes)
            tags: [`gridpane-user`]
          }
        });
      },
      endpoint
    );

    const userData = await handleGridPaneResponse<User>(response, endpoint);

    // Validate response structure (user is a single object, not an array)
    if (!userData || typeof userData.id !== 'number') {
      throw new GridPaneApiError(
        'Invalid response structure: missing or invalid user id',
        200,
        endpoint
      );
    }

    if (!userData.email || !userData.name) {
      throw new GridPaneApiError(
        'Invalid response structure: missing required user fields',
        200,
        endpoint
      );
    }

    if (!userData.currentTeam || typeof userData.currentTeam.id !== 'number') {
      throw new GridPaneApiError(
        'Invalid response structure: missing or invalid currentTeam',
        200,
        endpoint
      );
    }

    // Calculate duration and prepare metadata
    const duration = Math.round(performance.now() - startTime);
    
    // Create enhanced response with metadata
    const userResponse: UserResponse = {
      ...userData,
      _metadata: {
        fetched_at: new Date().toISOString(),
        cached_until: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
        request_duration_ms: duration,
        api_version: '1.0'
      }
    };

    // Log successful call
    logApiCall(`${endpoint} (user: ${userData.name})`, undefined, duration);

    return userResponse;

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
