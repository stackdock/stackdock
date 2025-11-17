/**
 * Resource Deduplication Utilities
 * 
 * Client-side deduplication for polymorphic resources (servers, domains)
 * that appear multiple times across different providers.
 * 
 * This is a read-only MVP - no schema changes, no backend changes.
 * All original data is preserved in mergedData.
 */

import type { Doc } from "convex/_generated/dataModel"

/**
 * Deduplicated Server with combined providers
 */
export interface DeduplicatedServer extends Doc<"servers"> {
  providers: string[] // All providers that manage this server
  originalIds: string[] // All original _id values
  mergedData: Doc<"servers">[] // All original records
}

/**
 * Deduplicated Domain with combined providers
 */
export interface DeduplicatedDomain extends Doc<"domains"> {
  providers: string[] // All providers that manage this domain
  originalIds: string[] // All original _id values
  mergedData: Doc<"domains">[] // All original records
}

/**
 * Provider categories for consistent ordering
 * Platform as a Service (PaaS) = management/deployment platforms
 * Infrastructure as a Service (IaaS) = compute/storage providers
 * Software as a Service (SaaS) = application services
 */
type ProviderCategory = "paas" | "iaas" | "saas" | "unknown"

/**
 * Categorize provider by type
 * PaaS providers are management/deployment platforms (always shown first)
 */
function getProviderCategory(provider: string): ProviderCategory {
  const normalized = provider.toLowerCase()
  
  // Platform as a Service (PaaS) - management/deployment platforms
  const paasProviders = [
    "gridpane",
    "coolify",
    "vercel",
    "netlify",
    "cloudflare pages",
    "railway",
    "render",
    "fly.io",
    "heroku",
    "platform.sh",
    "cleavr",
    "ploi",
    "runcloud",
    "serverpilot",
    "moss.sh",
  ]
  
  // Infrastructure as a Service (IaaS) - compute/storage
  const iaasProviders = [
    "hetzner",
    "linode",
    "digitalocean",
    "aws",
    "azure",
    "gcp",
    "google cloud",
    "vultr",
    "scaleway",
    "ovh",
    "contabo",
    "ionos",
    "upcloud",
    "lightsail",
    "ec2",
  ]
  
  // Software as a Service (SaaS) - application services
  const saasProviders = [
    "cloudflare", // DNS/CDN (not Pages)
    "planetscale",
    "sentry",
    "datadog",
    "new relic",
  ]
  
  if (paasProviders.includes(normalized)) return "paas"
  if (iaasProviders.includes(normalized)) return "iaas"
  if (saasProviders.includes(normalized)) return "saas"
  return "unknown"
}

/**
 * Sort providers: PaaS first, then IaaS/SaaS, then unknown
 * Within each category, maintain original order (stable sort)
 */
function sortProviders(providers: string[]): string[] {
  const categorized = providers.map((p, index) => ({
    provider: p,
    category: getProviderCategory(p),
    originalIndex: index,
  }))
  
  // Sort by category priority, then by original index
  categorized.sort((a, b) => {
    const categoryOrder: Record<ProviderCategory, number> = {
      paas: 0,
      iaas: 1,
      saas: 1, // Same priority as IaaS
      unknown: 2,
    }
    
    const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category]
    if (categoryDiff !== 0) return categoryDiff
    
    // Within same category, maintain original order
    return a.originalIndex - b.originalIndex
  })
  
  return categorized.map(c => c.provider)
}

/**
 * Normalize server name for comparison (case-insensitive, trimmed)
 */
function normalizeServerName(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Normalize IP address for comparison (trim whitespace)
 */
function normalizeIpAddress(ip: string | undefined | null): string | null {
  if (!ip) return null
  return ip.trim()
}

/**
 * Normalize domain name for comparison (case-insensitive, trimmed)
 * Handles edge cases like trailing dots, www prefixes, URLs with paths, etc.
 * Extracts hostname from URLs if needed.
 */
function normalizeDomainName(domain: string): string {
  if (!domain) return ""
  
  // Trim whitespace and convert to lowercase
  let normalized = domain.trim().toLowerCase()
  
  // If it looks like a URL (contains ://), extract the hostname
  if (normalized.includes("://")) {
    try {
      // Try to parse as URL to extract hostname
      const url = new URL(normalized.startsWith("http") ? normalized : `https://${normalized}`)
      normalized = url.hostname
    } catch {
      // If URL parsing fails, try manual extraction
      // Remove protocol (http://, https://, etc.)
      normalized = normalized.replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
      // Extract hostname (everything before first /)
      const slashIndex = normalized.indexOf("/")
      if (slashIndex !== -1) {
        normalized = normalized.substring(0, slashIndex)
      }
    }
  } else {
    // Not a URL, but might have path/query - extract hostname part
    const slashIndex = normalized.indexOf("/")
    if (slashIndex !== -1) {
      normalized = normalized.substring(0, slashIndex)
    }
    // Remove query strings and fragments
    const queryIndex = normalized.indexOf("?")
    if (queryIndex !== -1) {
      normalized = normalized.substring(0, queryIndex)
    }
    const hashIndex = normalized.indexOf("#")
    if (hashIndex !== -1) {
      normalized = normalized.substring(0, hashIndex)
    }
  }
  
  // Remove port numbers (e.g., example.com:8080)
  const colonIndex = normalized.indexOf(":")
  if (colonIndex !== -1) {
    normalized = normalized.substring(0, colonIndex)
  }
  
  // Remove trailing dots (some providers might include them)
  normalized = normalized.replace(/\.+$/, "")
  
  // Remove trailing slashes (shouldn't be here after hostname extraction, but just in case)
  normalized = normalized.replace(/\/+$/, "")
  
  // Remove www. prefix for comparison (optional - comment out if you want to keep www as distinct)
  // normalized = normalized.replace(/^www\./, "")
  
  return normalized
}

/**
 * Generate a unique key for server matching
 * Uses name OR IP address (whichever is available)
 */
function getServerMatchKey(server: Doc<"servers">): string | null {
  const normalizedName = normalizeServerName(server.name)
  const normalizedIp = normalizeIpAddress(server.primaryIpAddress)
  
  // Prefer IP address if available (more reliable)
  if (normalizedIp) {
    return `ip:${normalizedIp}`
  }
  
  // Fallback to name
  if (normalizedName) {
    return `name:${normalizedName}`
  }
  
  return null
}

/**
 * Check if two servers should be deduplicated
 * Matches when name OR IP address are identical
 */
function serversMatch(server1: Doc<"servers">, server2: Doc<"servers">): boolean {
  const name1 = normalizeServerName(server1.name)
  const name2 = normalizeServerName(server2.name)
  const ip1 = normalizeIpAddress(server1.primaryIpAddress)
  const ip2 = normalizeIpAddress(server2.primaryIpAddress)
  
  // Match if IP addresses are identical (most reliable)
  if (ip1 && ip2 && ip1 === ip2) {
    return true
  }
  
  // Match if names are identical
  if (name1 && name2 && name1 === name2) {
    return true
  }
  
  return false
}

/**
 * Deduplicate servers by name or IP address
 * 
 * Groups servers that match by name OR IP address.
 * Returns merged records with combined providers.
 * 
 * @param servers - Array of server documents
 * @returns Array of deduplicated servers with combined providers
 */
export function deduplicateServers(servers: Doc<"servers">[]): DeduplicatedServer[] {
  if (!servers || servers.length === 0) {
    return []
  }
  
  // Group servers by match key
  const groups = new Map<string, Doc<"servers">[]>()
  
  for (const server of servers) {
    const matchKey = getServerMatchKey(server)
    
    if (!matchKey) {
      // No match key available - keep as separate entry
      const fallbackKey = `unique:${server._id}`
      if (!groups.has(fallbackKey)) {
        groups.set(fallbackKey, [])
      }
      groups.get(fallbackKey)!.push(server)
      continue
    }
    
    // Try to find existing group
    let foundGroup = false
    for (const [key, group] of groups.entries()) {
      if (key.startsWith("unique:")) continue // Skip unique entries
      
      // Check if this server matches any server in this group
      if (group.some(existingServer => serversMatch(existingServer, server))) {
        group.push(server)
        foundGroup = true
        break
      }
    }
    
    if (!foundGroup) {
      // Create new group
      if (!groups.has(matchKey)) {
        groups.set(matchKey, [])
      }
      groups.get(matchKey)!.push(server)
    }
  }
  
  // Convert groups to deduplicated servers
  const deduplicated: DeduplicatedServer[] = []
  
  for (const group of groups.values()) {
    if (group.length === 0) continue
    
    // Use most recent server as primary (by updatedAt, or first if no timestamp)
    const primary = group.reduce((latest, current) => {
      const latestTime = latest.updatedAt || 0
      const currentTime = current.updatedAt || 0
      return currentTime > latestTime ? current : latest
    })
    
    // Collect all providers (unique) and sort: PaaS first, then IaaS/SaaS
    const providers = sortProviders(Array.from(new Set(group.map(s => s.provider))))
    
    // Collect all original IDs
    const originalIds = group.map(s => s._id)
    
    // Create deduplicated server
    const deduplicatedServer: DeduplicatedServer = {
      ...primary,
      providers,
      originalIds,
      mergedData: group,
    }
    
    deduplicated.push(deduplicatedServer)
  }
  
  return deduplicated
}

/**
 * Deduplicate domains by domainName
 * 
 * Groups domains with identical domainName (case-insensitive).
 * Returns merged records with combined providers.
 * 
 * @param domains - Array of domain documents
 * @returns Array of deduplicated domains with combined providers
 */
export function deduplicateDomains(domains: Doc<"domains">[]): DeduplicatedDomain[] {
  if (!domains || domains.length === 0) {
    return []
  }
  
  // Group domains by normalized domainName
  const groups = new Map<string, Doc<"domains">[]>()
  
  for (const domain of domains) {
    const normalizedDomain = normalizeDomainName(domain.domainName)
    
    if (!groups.has(normalizedDomain)) {
      groups.set(normalizedDomain, [])
    }
    
    groups.get(normalizedDomain)!.push(domain)
  }
  
  // Convert groups to deduplicated domains
  const deduplicated: DeduplicatedDomain[] = []
  
  for (const [normalizedDomain, group] of groups.entries()) {
    if (group.length === 0) continue
    
    // Use most recent domain as primary (by updatedAt, or first if no timestamp)
    const primary = group.reduce((latest, current) => {
      const latestTime = latest.updatedAt || 0
      const currentTime = current.updatedAt || 0
      return currentTime > latestTime ? current : latest
    })
    
    // Collect all providers (unique) and sort: PaaS first, then IaaS/SaaS
    const providers = sortProviders(Array.from(new Set(group.map(d => d.provider))))
    
    // Collect all original IDs
    const originalIds = group.map(d => d._id)
    
    // Create deduplicated domain
    const deduplicatedDomain: DeduplicatedDomain = {
      ...primary,
      providers,
      originalIds,
      mergedData: group,
    }
    
    deduplicated.push(deduplicatedDomain)
  }
  
  return deduplicated
}
