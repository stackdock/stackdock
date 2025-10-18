/**
 * Rate Limiter for GridPane API
 *
 * GridPane exposes rate limit headers per normalized endpoint key.
 * - All `PUT /site/{id}` requests share a single bucket (2 calls per minute account-wide)
 * - Read endpoints such as `GET site/{id}` include their own limits (commonly 12/min)
 * - Global limit remains 60 requests per minute
 *
 * This helper caches header data so we can inform the UI about cooldowns
 * without blindly retrying requests.
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
    const now = Math.floor(Date.now() / 1000);

    // Per-endpoint limits
    const endpointLimit = headers.get('x-ratelimit-endpoint-limit');
    const endpointRemaining = headers.get('x-ratelimit-endpoint-remaining');
    const endpointReset = headers.get('x-ratelimit-endpoint-reset');
    const retryAfterEndpoint = headers.get('retry-after-endpoint');

    console.log(`[Rate Limiter] Updating ${endpoint}:`, {
      limit: endpointLimit,
      remaining: endpointRemaining,
      reset: endpointReset,
      retryAfter: retryAfterEndpoint
    });

    if (endpointLimit && endpointRemaining !== null) {
      let resetAt: number;

      if (endpointReset) {
        resetAt = parseInt(endpointReset);
      } else if (retryAfterEndpoint) {
        resetAt = now + parseInt(retryAfterEndpoint);
      } else {
        // Conservative: assume 60 second window
        resetAt = now + 60;
      }

      this.endpointLimits.set(endpoint, {
        limit: parseInt(endpointLimit),
        remaining: parseInt(endpointRemaining),
        resetAt: resetAt,
        lastRequestAt: now
      });

      console.log(`[Rate Limiter] Stored limit for ${endpoint}: ${endpointRemaining}/${endpointLimit} (resets in ${resetAt - now}s)`);
    }

    // Global limits
    const totalLimit = headers.get('x-ratelimit-total-limit');
    const totalRemaining = headers.get('x-ratelimit-total-remaining');

    if (totalLimit && totalRemaining) {
      const resetAt = now + 60;

      this.globalLimit = {
        limit: parseInt(totalLimit),
        remaining: parseInt(totalRemaining),
        resetAt: resetAt,
        lastRequestAt: now
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
      console.log(`[Rate Limiter] No limit info for ${endpoint} - allowing request`);
      return null;
    }

    // Check if limit has reset
    if (now >= limitInfo.resetAt) {
      console.log(`[Rate Limiter] Limit for ${endpoint} has reset - clearing`);
      this.endpointLimits.delete(endpoint);
      return null;
    }

    // Check if we have remaining requests
    if (limitInfo.remaining > 0) {
      const timeUntilReset = limitInfo.resetAt - now;
      console.log(`[Rate Limiter] ${endpoint}: ${limitInfo.remaining}/${limitInfo.limit} remaining (resets in ${timeUntilReset}s)`);
      return null;
    }

    // Rate limited - return seconds to wait
    const secondsToWait = limitInfo.resetAt - now;
    console.warn(`[Rate Limiter] ${endpoint} is rate limited! Wait ${secondsToWait}s`);
    return secondsToWait;
  }

  /**
   * Clear rate limit info for a specific endpoint (useful for testing)
   */
  clearEndpoint(endpoint: string): void {
    this.endpointLimits.delete(endpoint);
    console.log(`[Rate Limiter] Cleared limit info for ${endpoint}`);
  }

  /**
   * Clear all rate limit info (useful for testing)
   */
  clearAll(): void {
    this.endpointLimits.clear();
    this.globalLimit = null;
    console.log(`[Rate Limiter] Cleared all limit info`);
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
    if (this.endpointLimits.size === 0) {
      lines.push('  (none tracked)');
    } else {
      this.endpointLimits.forEach((info, endpoint) => {
        const resetDate = new Date(info.resetAt * 1000);
        const now = Math.floor(Date.now() / 1000);
        const secondsUntilReset = Math.max(0, info.resetAt - now);
        lines.push(`  ${endpoint}: ${info.remaining}/${info.limit} remaining (resets in ${secondsUntilReset}s at ${resetDate.toLocaleTimeString()})`);
      });
    }

    lines.push('========================');
    return lines.join('\n');
  }
}

// Singleton instance
export const rateLimiter = new GridPaneRateLimiter();
