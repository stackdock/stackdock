/**
 * Firecrawl Adapter Types
 * 
 * Types for Firecrawl-based health monitoring adapter
 */

/**
 * Health check result from Firecrawl scraping
 */
export interface FirecrawlHealthCheck {
  url: string
  status: "operational" | "degraded" | "down" | "unknown"
  incidents: FirecrawlIncident[]
  lastCheckedAt: number
  rawContent: string
}

/**
 * Incident detected on a status page
 */
export interface FirecrawlIncident {
  title: string
  severity: string
  status: string
  affectedServices?: string[]
}

/**
 * Configuration for a health check monitor
 */
export interface FirecrawlMonitorConfig {
  name: string
  url: string
  checkFrequency?: number // seconds
  provider?: string
}
