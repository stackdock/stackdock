/**
 * Firecrawl Service
 * 
 * Handles web scraping via Firecrawl API for health page monitoring.
 * 
 * @see https://docs.firecrawl.dev/
 */

import FirecrawlApp from "@mendable/firecrawl-js"

/**
 * Firecrawl client wrapper
 */
export class FirecrawlService {
  private client: FirecrawlApp
  private apiKey: string

  constructor(apiKey: string) {
    if (!apiKey || apiKey === "fc-your-api-key-here") {
      throw new Error("Invalid Firecrawl API key. Please set FIRECRAWL_API_KEY environment variable.")
    }
    this.apiKey = apiKey
    this.client = new FirecrawlApp({ apiKey })
  }

  /**
   * Scrape a single URL and return markdown content
   * 
   * @param url - URL to scrape
   * @returns Scraped content as markdown
   */
  async scrapeUrl(url: string): Promise<{
    markdown: string
    html?: string
    metadata?: Record<string, any>
  }> {
    try {
      const result = await this.client.scrapeUrl(url, {
        formats: ["markdown", "html"],
      })

      if (!result.success) {
        throw new Error(`Failed to scrape ${url}: ${result.error || "Unknown error"}`)
      }

      return {
        markdown: result.markdown || "",
        html: result.html,
        metadata: result.metadata,
      }
    } catch (error) {
      console.error(`[Firecrawl] Error scraping ${url}:`, error)
      throw error
    }
  }

  /**
   * Extract health/status information from a status page
   * 
   * @param url - Status page URL
   * @returns Health status information
   */
  async extractHealthStatus(url: string): Promise<{
    status: "operational" | "degraded" | "down" | "unknown"
    incidents: Array<{
      title: string
      severity: string
      status: string
      affectedServices?: string[]
    }>
    lastUpdated: number
    rawContent: string
  }> {
    try {
      const scraped = await this.scrapeUrl(url)
      const markdown = scraped.markdown.toLowerCase()

      // Simple heuristic-based status detection
      // This can be improved with LLM-based extraction in the future
      let status: "operational" | "degraded" | "down" | "unknown" = "unknown"

      if (
        markdown.includes("all systems operational") ||
        markdown.includes("all services operational") ||
        markdown.includes("no incidents") ||
        markdown.includes("✓") ||
        markdown.includes("✅")
      ) {
        status = "operational"
      } else if (
        markdown.includes("major outage") ||
        markdown.includes("service down") ||
        markdown.includes("critical")
      ) {
        status = "down"
      } else if (
        markdown.includes("partial outage") ||
        markdown.includes("degraded") ||
        markdown.includes("investigating") ||
        markdown.includes("incident")
      ) {
        status = "degraded"
      }

      // Extract incidents (simple pattern matching)
      const incidents: Array<{
        title: string
        severity: string
        status: string
      }> = []

      // Look for common incident patterns in markdown
      const lines = scraped.markdown.split("\n")
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (
          line.match(/^#+\s+(incident|outage|issue|problem)/i) ||
          line.match(/investigating|identified|monitoring|resolved/i)
        ) {
          incidents.push({
            title: line.replace(/^#+\s+/, ""),
            severity: status === "down" ? "critical" : "degraded",
            status: line.toLowerCase().includes("resolved") ? "resolved" : "ongoing",
          })
        }
      }

      return {
        status,
        incidents,
        lastUpdated: Date.now(),
        rawContent: scraped.markdown,
      }
    } catch (error) {
      console.error(`[Firecrawl] Error extracting health status from ${url}:`, error)
      return {
        status: "unknown",
        incidents: [],
        lastUpdated: Date.now(),
        rawContent: "",
      }
    }
  }

  /**
   * Validate Firecrawl API credentials
   * 
   * @returns true if credentials are valid
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // Try to scrape a simple public page
      const result = await this.client.scrapeUrl("https://example.com", {
        formats: ["markdown"],
      })
      return result.success === true
    } catch (error) {
      console.error("[Firecrawl] Credential validation failed:", error)
      return false
    }
  }
}

/**
 * Provider status page URLs
 * 
 * Common status pages for major cloud providers
 */
export const PROVIDER_STATUS_PAGES: Record<string, string> = {
  "vercel": "https://www.vercel-status.com",
  "netlify": "https://www.netlifystatus.com",
  "cloudflare": "https://www.cloudflarestatus.com",
  "github": "https://www.githubstatus.com",
  "digitalocean": "https://status.digitalocean.com",
  "linode": "https://status.linode.com",
  "vultr": "https://status.vultr.com",
  "hetzner": "https://status.hetzner.com",
  "neon": "https://neonstatus.com",
  "planetscale": "https://www.planetscalestatus.com",
  "turso": "https://status.turso.tech",
  "convex": "https://status.convex.dev",
  "sentry": "https://status.sentry.io",
  "betterstack": "https://betterstack.statuspage.io",
}

/**
 * Get status page URL for a provider
 * 
 * @param provider - Provider identifier
 * @returns Status page URL or undefined if not configured
 */
export function getProviderStatusPageUrl(provider: string): string | undefined {
  return PROVIDER_STATUS_PAGES[provider.toLowerCase()]
}
