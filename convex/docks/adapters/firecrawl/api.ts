/**
 * Firecrawl API Client
 * 
 * Wrapper around Firecrawl service for health monitoring
 */

import { FirecrawlService, getProviderStatusPageUrl } from "../../../lib/firecrawl"
import type { FirecrawlHealthCheck } from "./types"

export class FirecrawlAPI {
  private service: FirecrawlService

  constructor(apiKey: string) {
    this.service = new FirecrawlService(apiKey)
  }

  /**
   * Validate Firecrawl API credentials
   */
  async validateCredentials(): Promise<boolean> {
    return await this.service.validateCredentials()
  }

  /**
   * Check health status of a URL
   * 
   * @param url - Status page URL to check
   * @returns Health check result
   */
  async checkHealthStatus(url: string): Promise<FirecrawlHealthCheck> {
    const healthStatus = await this.service.extractHealthStatus(url)
    
    return {
      url,
      status: healthStatus.status,
      incidents: healthStatus.incidents,
      lastCheckedAt: healthStatus.lastUpdated,
      rawContent: healthStatus.rawContent,
    }
  }

  /**
   * Check health status of all configured provider status pages
   * 
   * @param providers - List of provider identifiers to check
   * @returns Array of health check results
   */
  async checkAllProviderHealthPages(providers: string[]): Promise<FirecrawlHealthCheck[]> {
    const results: FirecrawlHealthCheck[] = []

    for (const provider of providers) {
      const statusPageUrl = getProviderStatusPageUrl(provider)
      if (!statusPageUrl) {
        console.warn(`[Firecrawl] No status page URL configured for provider: ${provider}`)
        continue
      }

      try {
        const healthCheck = await this.checkHealthStatus(statusPageUrl)
        results.push(healthCheck)
      } catch (error) {
        console.error(`[Firecrawl] Failed to check health for ${provider}:`, error)
        // Add a failed health check result
        results.push({
          url: statusPageUrl,
          status: "unknown",
          incidents: [],
          lastCheckedAt: Date.now(),
          rawContent: "",
        })
      }
    }

    return results
  }
}
