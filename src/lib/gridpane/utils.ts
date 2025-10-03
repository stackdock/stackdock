"use server";

import { GridPaneApiError } from './helpers';
import { rateLimiter } from './rate-limiter';
// GRIDPANE_CONFIG import removed temporarily - will re-add in Phase 3

// Retry logic with exponential backoff for transient failures
// PHASE 1: RETRIES DISABLED - One click = one request for testing
export async function withRetry<T>(
  operation: () => Promise<T>,
  endpoint: string,
  page?: number,
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

  console.log(`[GridPane] Making request to ${endpoint}${page ? ` (page ${page})` : ''} - RETRIES DISABLED`);
  console.log(rateLimiter.getDebugInfo());

  // Direct execution - no retry logic
  return await operation();

  /* COMMENTED OUT - RETRY LOGIC (Re-enable in Phase 3 after testing)
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error instanceof GridPaneApiError) {
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
      }

      if (attempt < maxRetries) {
        const delay = GRIDPANE_CONFIG.RETRY_DELAY * Math.pow(2, attempt);
        console.warn(`[GridPane] Retry ${attempt + 1}/${maxRetries} for ${endpoint}${page ? ` (page ${page})` : ''} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new GridPaneApiError(
    `Failed after ${maxRetries + 1} attempts`,
    0,
    endpoint,
    page,
    lastError
  );
  */
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

    // PHASE 1: Read and log rate limit headers for 429 errors
    if (response.status === 429) {
      console.error('=== RATE LIMIT ERROR (429) ===');
      console.error('Rate Limit Headers:');
      console.error('  X-RateLimit-Limit:', response.headers.get('X-RateLimit-Limit'));
      console.error('  X-RateLimit-Remaining:', response.headers.get('X-RateLimit-Remaining'));
      console.error('  X-RateLimit-Reset:', response.headers.get('X-RateLimit-Reset'));
      console.error('  Retry-After:', response.headers.get('Retry-After'));

      // GridPane uses per-endpoint rate limits
      const endpointLimit = response.headers.get('x-ratelimit-endpoint-limit');
      const endpointRemaining = response.headers.get('x-ratelimit-endpoint-remaining');
      const endpointReset = response.headers.get('x-ratelimit-endpoint-reset');
      const retryAfterEndpoint = response.headers.get('retry-after-endpoint');
      const totalLimit = response.headers.get('x-ratelimit-total-limit');
      const totalRemaining = response.headers.get('x-ratelimit-total-remaining');

      console.error('Per-Endpoint Rate Limit:');
      console.error(`  Limit: ${endpointLimit} requests`);
      console.error(`  Remaining: ${endpointRemaining}`);
      console.error(`  Reset: ${endpointReset ? new Date(parseInt(endpointReset) * 1000).toLocaleTimeString() : 'N/A'}`);
      console.error(`  Retry After: ${retryAfterEndpoint} seconds`);
      console.error('Total/Global Rate Limit:');
      console.error(`  Limit: ${totalLimit} requests`);
      console.error(`  Remaining: ${totalRemaining}`);

      console.error('All Response Headers:');
      response.headers.forEach((value, key) => {
        console.error(`  ${key}: ${value}`);
      });
      console.error('==============================');

      // CRITICAL: Update rate limiter with 429 response headers!
      rateLimiter.updateFromHeaders(endpoint, response.headers);
      console.error('[GridPane] Rate limiter updated from 429 response');
      console.error(rateLimiter.getDebugInfo());

      // Build user-friendly error message
      if (retryAfterEndpoint) {
        errorMessage = `Rate limit exceeded. This endpoint allows ${endpointLimit} requests. Please wait ${retryAfterEndpoint} seconds before trying again.`;
      } else if (endpointReset) {
        const resetDate = new Date(parseInt(endpointReset) * 1000);
        const secondsUntilReset = Math.max(0, Math.ceil((resetDate.getTime() - Date.now()) / 1000));
        errorMessage = `Rate limit exceeded. This endpoint allows ${endpointLimit} requests. Please wait ${secondsUntilReset} seconds (resets at ${resetDate.toLocaleTimeString()}).`;
      }
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

    throw new GridPaneApiError(errorMessage, response.status, endpoint, page);
  }

  // Update rate limiter with successful response headers
  rateLimiter.updateFromHeaders(endpoint, response.headers);

  // Log current rate limit status after successful request
  console.log('[GridPane] Request successful. Response headers:');
  console.log('  x-ratelimit-endpoint-limit:', response.headers.get('x-ratelimit-endpoint-limit'));
  console.log('  x-ratelimit-endpoint-remaining:', response.headers.get('x-ratelimit-endpoint-remaining'));
  console.log('  x-ratelimit-endpoint-reset:', response.headers.get('x-ratelimit-endpoint-reset'));
  console.log('[GridPane] Current rate limits:');
  console.log(rateLimiter.getDebugInfo());  // Validate JSON response
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
