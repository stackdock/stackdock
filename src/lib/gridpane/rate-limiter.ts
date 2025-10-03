/**
 * Rate Limiter for GridPane API
 *
 * GridPane uses per-endpoint rate limits:
 * - PUT /site/{id} allows only 2 requests per ~22 seconds
 * - Global limit is 60 requests per minute
 *
 * This tracks requests and prevents hitting the limits
 */

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp
  lastRequestAt: number; // Unix timestamp
}

class GridPaneRateLimiter {
  private endpointLimits: Map<string, RateLimitInfo> = new Map();
  private globalLimit: RateLimitInfo | null = null;

  /**
   * Update rate limit info from response headers
   */
  updateFromHeaders(endpoint: string, headers: Headers): void {
    // Per-endpoint limits
    const endpointLimit = headers.get('x-ratelimit-endpoint-limit');
    const endpointRemaining = headers.get('x-ratelimit-endpoint-remaining');
    const endpointReset = headers.get('x-ratelimit-endpoint-reset');
    const retryAfterEndpoint = headers.get('retry-after-endpoint');

    // GridPane returns reset timestamp on 429, but null on successful responses
    // We need to estimate the reset time if it's not provided
    if (endpointLimit && endpointRemaining !== null) {
      let resetAt: number;

      if (endpointReset) {
        // Use the provided reset timestamp
        resetAt = parseInt(endpointReset);
      } else if (retryAfterEndpoint) {
        // Estimate reset from retry-after header
        resetAt = Math.floor(Date.now() / 1000) + parseInt(retryAfterEndpoint);
      } else {
        // Estimate: GridPane seems to use ~60 second windows for PUT /site/{id}
        // Use a conservative 60 seconds
        resetAt = Math.floor(Date.now() / 1000) + 60;
      }

      this.endpointLimits.set(endpoint, {
        limit: parseInt(endpointLimit),
        remaining: parseInt(endpointRemaining),
        resetAt: resetAt,
        lastRequestAt: Math.floor(Date.now() / 1000)
      });
    }

    // Global limits
    const totalLimit = headers.get('x-ratelimit-total-limit');
    const totalRemaining = headers.get('x-ratelimit-total-remaining');

    if (totalLimit && totalRemaining) {
      // Estimate reset time (1 minute from now if not provided)
      const resetAt = Math.floor(Date.now() / 1000) + 60;

      this.globalLimit = {
        limit: parseInt(totalLimit),
        remaining: parseInt(totalRemaining),
        resetAt: resetAt,
        lastRequestAt: Math.floor(Date.now() / 1000)
      };
    }
  }

  /**
   * Check if a request to an endpoint would hit the rate limit
   * Returns null if OK, or seconds to wait if rate limited
   */
  checkEndpoint(endpoint: string): number | null {
    const now = Math.floor(Date.now() / 1000);
    const limitInfo = this.endpointLimits.get(endpoint);

    if (!limitInfo) {
      // No limit info yet, allow the request
      return null;
    }

    // Check if limit has reset
    if (now >= limitInfo.resetAt) {
      // Limit has reset, clear the entry
      this.endpointLimits.delete(endpoint);
      return null;
    }

    // Check if we have remaining requests
    if (limitInfo.remaining > 0) {
      return null;
    }

    // Rate limited - return seconds to wait
    return limitInfo.resetAt - now;
  }

  /**
   * Get user-friendly message about rate limits
   */
  getRateLimitMessage(endpoint: string): string {
    const secondsToWait = this.checkEndpoint(endpoint);

    if (secondsToWait === null) {
      return '';
    }

    const limitInfo = this.endpointLimits.get(endpoint);
    if (!limitInfo) {
      return '';
    }

    const resetDate = new Date(limitInfo.resetAt * 1000);

    return `Rate limit reached for this operation (${limitInfo.limit} requests allowed). Please wait ${secondsToWait} seconds (resets at ${resetDate.toLocaleTimeString()}).`;
  }

  /**
   * Get all rate limit info for debugging
   */
  getDebugInfo(): string {
    const lines: string[] = ['=== Rate Limit Status ==='];

    if (this.globalLimit) {
      const resetDate = new Date(this.globalLimit.resetAt * 1000);
      lines.push(`Global: ${this.globalLimit.remaining}/${this.globalLimit.limit} remaining (resets at ${resetDate.toLocaleTimeString()})`);
    }

    lines.push('Per-Endpoint Limits:');
    this.endpointLimits.forEach((info, endpoint) => {
      const resetDate = new Date(info.resetAt * 1000);
      lines.push(`  ${endpoint}: ${info.remaining}/${info.limit} remaining (resets at ${resetDate.toLocaleTimeString()})`);
    });

    lines.push('========================');
    return lines.join('\n');
  }
}

// Singleton instance
export const rateLimiter = new GridPaneRateLimiter();
