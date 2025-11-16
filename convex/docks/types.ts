/**
 * Rate limit types and utilities
 * 
 * MVP: For annotation/removal post-production
 */

/**
 * Rate limit headers structure
 * MVP: For annotation/removal post-production
 */
export interface RateLimitHeaders {
  limit?: string // X-RateLimit-Limit
  remaining?: string // X-RateLimit-Remaining
  reset?: string // X-RateLimit-Reset
  retryAfter?: string // Retry-After
  providerSpecific?: Record<string, string> // All provider-specific headers
  raw?: Record<string, string> // All headers (for debugging)
}

/**
 * Rate limit error with retry information
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public headers: RateLimitHeaders,
    public retryAfterSeconds: number
  ) {
    super(message)
    this.name = "RateLimitError"
  }
}

/**
 * Extract header value (case-insensitive)
 */
export function extractHeader(response: Response, headerNames: string[]): string | undefined {
  for (const name of headerNames) {
    const value = response.headers.get(name)
    if (value) return value
  }
  return undefined
}

/**
 * Extract all rate limit headers (case-insensitive)
 */
export function extractAllRateLimitHeaders(response: Response): Record<string, string> {
  const rateLimitHeaders: Record<string, string> = {}
  const headerNames = [
    "x-ratelimit-limit",
    "x-ratelimit-remaining",
    "x-ratelimit-reset",
    "ratelimit-limit",
    "ratelimit-remaining",
    "ratelimit-reset",
    "retry-after",
    "x-ratelimit-requests-left", // GridPane
    "cf-api-ratelimit", // Cloudflare
    "cf-api-ratelimit-reset", // Cloudflare
  ]
  
  for (const name of headerNames) {
    const value = response.headers.get(name)
    if (value) {
      rateLimitHeaders[name] = value
    }
  }
  
  return rateLimitHeaders
}

/**
 * Parse rate limit headers from response
 */
export function parseRateLimitHeaders(response: Response): RateLimitHeaders {
  // Convert headers to plain object (Convex-compatible)
  const rawHeaders: Record<string, string> = {}
  const headerNames = [
    "x-ratelimit-limit",
    "x-ratelimit-remaining",
    "x-ratelimit-reset",
    "ratelimit-limit",
    "ratelimit-remaining",
    "ratelimit-reset",
    "retry-after",
    "x-ratelimit-requests-left",
    "cf-api-ratelimit",
    "cf-api-ratelimit-reset",
  ]
  
  // Extract all headers we care about
  for (const name of headerNames) {
    const value = response.headers.get(name)
    if (value) {
      rawHeaders[name] = value
    }
  }
  
  return {
    // Standard headers
    limit: extractHeader(response, ["x-ratelimit-limit", "ratelimit-limit"]),
    remaining: extractHeader(response, ["x-ratelimit-remaining", "ratelimit-remaining"]),
    reset: extractHeader(response, ["x-ratelimit-reset", "ratelimit-reset"]),
    retryAfter: extractHeader(response, ["retry-after"]),
    
    // Provider-specific headers (capture all)
    providerSpecific: extractAllRateLimitHeaders(response),
    
    // Raw headers for debugging
    raw: rawHeaders,
  }
}
