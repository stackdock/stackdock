/**
 * Provider Sync Interval Configuration
 * 
 * Defines recommended minimum sync intervals based on provider API rate limits.
 * These are conservative defaults that respect rate limits while maintaining
 * reasonable data freshness.
 */

export interface ProviderSyncConfig {
  /** Recommended minimum interval in seconds */
  recommendedInterval: number
  /** Absolute minimum allowed interval in seconds */
  absoluteMinimum: number
  /** Reason for the interval (rate limit info) */
  reason: string
}

/**
 * Provider-specific sync interval configurations
 * 
 * Based on documented API rate limits:
 * - GridPane: 12/min per endpoint (very strict)
 * - Vercel: 100/hour (~1.67/min)
 * - DigitalOcean: 5000/hour (~83/min)
 * - Cloudflare: 1200/5min (~240/min)
 * - GitHub: 5000/hour authenticated (~83/min)
 * - Linode: ~3000/hour (~50/min)
 */
export const PROVIDER_SYNC_INTERVALS: Record<string, ProviderSyncConfig> = {
  gridpane: {
    recommendedInterval: 300, // 5 minutes (very strict: 12/min per endpoint)
    absoluteMinimum: 60, // 1 minute absolute minimum
    reason: "GridPane has strict rate limits: 12 requests/min per endpoint",
  },
  vercel: {
    recommendedInterval: 180, // 3 minutes (100/hour limit)
    absoluteMinimum: 60,
    reason: "Vercel rate limit: 100 requests/hour",
  },
  netlify: {
    recommendedInterval: 180, // 3 minutes (similar to Vercel)
    absoluteMinimum: 60,
    reason: "Netlify rate limit: ~100 requests/hour",
  },
  cloudflare: {
    recommendedInterval: 120, // 2 minutes (1200/5min = 240/min)
    absoluteMinimum: 60,
    reason: "Cloudflare rate limit: 1200 requests/5 minutes",
  },
  github: {
    recommendedInterval: 120, // 2 minutes (5000/hour authenticated)
    absoluteMinimum: 60,
    reason: "GitHub rate limit: 5000 requests/hour (authenticated)",
  },
  linode: {
    recommendedInterval: 120, // 2 minutes (~3000/hour)
    absoluteMinimum: 60,
    reason: "Linode rate limit: ~3000 requests/hour",
  },
  digitalocean: {
    recommendedInterval: 120, // 2 minutes (5000/hour)
    absoluteMinimum: 60,
    reason: "DigitalOcean rate limit: 5000 requests/hour",
  },
  vultr: {
    recommendedInterval: 120, // 2 minutes (similar to DO)
    absoluteMinimum: 60,
    reason: "Vultr rate limit: ~5000 requests/hour",
  },
  hetzner: {
    recommendedInterval: 120, // 2 minutes
    absoluteMinimum: 60,
    reason: "Hetzner rate limit: ~5000 requests/hour",
  },
  turso: {
    recommendedInterval: 180, // 3 minutes (conservative for DBaaS)
    absoluteMinimum: 60,
    reason: "Turso rate limit: Conservative 3-minute interval",
  },
  neon: {
    recommendedInterval: 180, // 3 minutes (conservative for DBaaS)
    absoluteMinimum: 60,
    reason: "Neon rate limit: Conservative 3-minute interval",
  },
  convex: {
    recommendedInterval: 180, // 3 minutes (conservative for DBaaS)
    absoluteMinimum: 60,
    reason: "Convex rate limit: Conservative 3-minute interval",
  },
  planetscale: {
    recommendedInterval: 180, // 3 minutes (conservative for DBaaS)
    absoluteMinimum: 60,
    reason: "PlanetScale rate limit: Conservative 3-minute interval",
  },
  coolify: {
    recommendedInterval: 120, // 2 minutes
    absoluteMinimum: 60,
    reason: "Coolify rate limit: ~5000 requests/hour",
  },
}

/**
 * Get recommended sync interval for a provider
 */
export function getRecommendedSyncInterval(provider: string): number {
  return PROVIDER_SYNC_INTERVALS[provider]?.recommendedInterval || 120 // Default: 2 minutes
}

/**
 * Get absolute minimum sync interval for a provider
 */
export function getAbsoluteMinimumSyncInterval(provider: string): number {
  return PROVIDER_SYNC_INTERVALS[provider]?.absoluteMinimum || 60 // Default: 1 minute
}

/**
 * Get sync config for a provider
 */
export function getProviderSyncConfig(provider: string): ProviderSyncConfig {
  return PROVIDER_SYNC_INTERVALS[provider] || {
    recommendedInterval: 120,
    absoluteMinimum: 60,
    reason: "Default sync interval: 2 minutes",
  }
}

/**
 * Validate sync interval against provider minimums
 */
export function validateSyncInterval(
  provider: string,
  intervalSeconds: number
): { valid: boolean; error?: string; recommended?: number } {
  const config = getProviderSyncConfig(provider)
  
  if (intervalSeconds < config.absoluteMinimum) {
    return {
      valid: false,
      error: `Sync interval must be at least ${config.absoluteMinimum} seconds for ${provider}`,
      recommended: config.recommendedInterval,
    }
  }
  
  if (intervalSeconds < config.recommendedInterval) {
    return {
      valid: true,
      error: `Recommended minimum is ${config.recommendedInterval} seconds for ${provider}. ${config.reason}`,
      recommended: config.recommendedInterval,
    }
  }
  
  return { valid: true }
}
