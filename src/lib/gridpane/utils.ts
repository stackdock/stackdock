"use server";

import { GridPaneApiError } from './helpers';
import { rateLimiter } from './rate-limiter';
// GRIDPANE_CONFIG import removed temporarily - will re-add in Phase 3

// Retry logic with exponential backoff for transient failures
// PHASE 1: RETRIES DISABLED - One click = one request for testing
export async function withRetry<T>(
  operation: () => Promise<T>,
  endpoint: string,
  _page?: number, // Prefixed with _ to indicate intentionally unused
  _maxRetries: number = 0 // TEMPORARILY SET TO 0 - WAS: GRIDPANE_CONFIG.MAX_RETRIES
): Promise<T> {
  // Check rate limit BEFORE making request (but don't be too aggressive)
  const secondsToWait = rateLimiter.checkEndpoint(endpoint);
  if (secondsToWait !== null && secondsToWait > 0) {
    console.warn(`[GridPane] Rate limit check: Need to wait ${secondsToWait}s for ${endpoint}`);
    console.warn(`[GridPane] Attempting request anyway to verify current limit status...`);
    // CHANGED: Don't throw immediately - let the API tell us if we're actually rate limited
    // This handles cases where our cache is stale
  }

  // Direct execution - no retry logic
  return await operation();
}

// Enhanced response handler with structured error extraction
export async function handleGridPaneResponse<T>(
  response: Response,
  endpoint: string,
  page?: number
): Promise<T> {
  const contentType = response.headers.get('content-type');

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    // Handle rate limit errors
    if (response.status === 429) {
      const endpointLimit = response.headers.get('x-ratelimit-endpoint-limit');
      const retryAfterEndpoint = response.headers.get('retry-after-endpoint');
      const endpointReset = response.headers.get('x-ratelimit-endpoint-reset');

      // Update rate limiter with 429 response headers
      rateLimiter.updateFromHeaders(endpoint, response.headers);

      // Build user-friendly error message
      if (retryAfterEndpoint) {
        errorMessage = `Rate limit exceeded. This endpoint allows ${endpointLimit} requests. Please wait ${retryAfterEndpoint} seconds before trying again.`;
      } else if (endpointReset) {
        const resetDate = new Date(parseInt(endpointReset) * 1000);
        const secondsUntilReset = Math.max(0, Math.ceil((resetDate.getTime() - Date.now()) / 1000));
        errorMessage = `Rate limit exceeded. This endpoint allows ${endpointLimit} requests. Please wait ${secondsUntilReset} seconds (resets at ${resetDate.toLocaleTimeString()}).`;
      }

      console.error(`[GridPane Rate Limit] ${endpoint}: ${errorMessage}`);
    }

    // Try to extract structured error from response
    if (contentType?.includes('application/json')) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        if (errorData.errors) {
          const errorDetails = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          errorMessage += ` - ${errorDetails}`;
        }
      } catch {
        // If JSON parsing fails, try to get response text
        try {
          const text = await response.text();
          if (text) errorMessage += ` - ${text.substring(0, 200)}`;
        } catch {
          // If even text extraction fails, use the original message
        }
      }
    }

    const retryAfterHeader =
      response.headers.get('retry-after-endpoint') ??
      response.headers.get('retry-after');
    const retryAfterSeconds = retryAfterHeader
      ? Number.parseInt(retryAfterHeader, 10)
      : undefined;
    const _normalisedEnpoint = endpoint;
    rateLimiter.updateFromHeaders(endpoint, response.headers);

    throw new GridPaneApiError(
      errorMessage,
      response.status,
      endpoint,
      page,
      undefined,
      Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined
    );
  }

  // Update rate limiter with successful response headers
  rateLimiter.updateFromHeaders(endpoint, response.headers);

  // Validate JSON response
  if (!contentType?.includes('application/json')) {
    throw new GridPaneApiError(
      `Expected JSON response but received ${contentType}`,
      response.status,
      endpoint,
      page
    );
  }

  try {
    const data: T = await response.json();
    return data;
  } catch (error) {
    throw new GridPaneApiError(
      `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      response.status,
      endpoint,
      page,
      error
    );
  }
}
