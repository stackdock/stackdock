/**
 * Dock Provider Categories
 * 
 * Maps providers to their service categories (IaaS, PaaS, SaaS)
 */

export type DockCategory = "iaas" | "paas" | "saas"

export interface CategoryInfo {
  id: DockCategory
  label: string
  description: string
}

export const CATEGORIES: Record<DockCategory, CategoryInfo> = {
  iaas: {
    id: "iaas",
    label: "IaaS",
    description: "Infrastructure as a Service",
  },
  paas: {
    id: "paas",
    label: "PaaS",
    description: "Platform as a Service",
  },
  saas: {
    id: "saas",
    label: "SaaS",
    description: "Software as a Service",
  },
}

/**
 * Provider to category mapping
 */
const PROVIDER_CATEGORIES: Record<string, DockCategory> = {
  // IaaS
  vultr: "iaas",
  digitalocean: "iaas",
  linode: "iaas",
  hetzner: "iaas",
  
  // PaaS
  gridpane: "paas",
  vercel: "paas",
  netlify: "paas",
  coolify: "paas",
  
  // SaaS
  cloudflare: "saas",
  turso: "saas",
  neon: "saas",
  convex: "saas",
  planetscale: "saas",
  github: "saas",
}

/**
 * Get category for a provider
 */
export function getProviderCategory(provider: string): DockCategory {
  return PROVIDER_CATEGORIES[provider.toLowerCase()] || "saas"
}

/**
 * Get all providers in a category
 */
export function getProvidersByCategory(category: DockCategory): string[] {
  return Object.entries(PROVIDER_CATEGORIES)
    .filter(([_, cat]) => cat === category)
    .map(([provider]) => provider)
}

/**
 * Check if provider belongs to category
 */
export function isProviderInCategory(provider: string, category: DockCategory): boolean {
  return getProviderCategory(provider) === category
}
