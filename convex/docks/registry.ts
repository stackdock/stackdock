/**
 * Dock Adapter Registry
 * 
 * Maps provider names to their adapter implementations.
 * 
 * To add a new provider:
 * 1. Create adapter in convex/docks/adapters/{provider}/
 * 2. Import it here
 * 3. Add to registry map
 */

import type { DockAdapter } from "./_types"
import { gridpaneAdapter } from "./adapters/gridpane"
import { vercelAdapter } from "./adapters/vercel"
import { netlifyAdapter } from "./adapters/netlify"

/**
 * Registry of all dock adapters
 * 
 * Key: Provider identifier (must match docks.provider field)
 * Value: DockAdapter implementation
 */
const adapterRegistry: Record<string, DockAdapter> = {
  gridpane: gridpaneAdapter,
  vercel: vercelAdapter,
  netlify: netlifyAdapter,
  // Add more adapters here:
  // digitalocean: digitaloceanAdapter,
}

/**
 * Get adapter for a provider
 * 
 * @param provider - Provider identifier (e.g., "gridpane", "vercel")
 * @returns DockAdapter instance or undefined if not found
 */
export function getAdapter(provider: string): DockAdapter | undefined {
  return adapterRegistry[provider.toLowerCase()]
}

/**
 * Check if provider has an adapter
 */
export function hasAdapter(provider: string): boolean {
  return provider.toLowerCase() in adapterRegistry
}

/**
 * List all available providers
 */
export function listProviders(): string[] {
  return Object.keys(adapterRegistry)
}

/**
 * Provider display metadata
 * Maps provider ID to display name for UI
 * 
 * Add entries here as new adapters are added.
 */
const providerMetadata: Record<string, { displayName: string }> = {
  gridpane: { displayName: "GridPane" },
  vercel: { displayName: "Vercel" },
  netlify: { displayName: "Netlify" },
  // Add more as adapters are added:
  // digitalocean: { displayName: "DigitalOcean" },
}

/**
 * List all available providers with metadata
 * 
 * Returns array of providers with display names for UI consumption.
 */
export function listProvidersWithMetadata(): Array<{ id: string; displayName: string }> {
  return Object.keys(adapterRegistry).map(id => ({
    id,
    displayName: providerMetadata[id]?.displayName || id.charAt(0).toUpperCase() + id.slice(1),
  }))
}

/**
 * Register a new adapter (for dynamic registration if needed)
 */
export function registerAdapter(provider: string, adapter: DockAdapter): void {
  adapterRegistry[provider.toLowerCase()] = adapter
}
