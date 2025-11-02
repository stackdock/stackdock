/**
 * This file contains code derived from SST.dev (https://sst.dev)
 * Original SST.dev code is licensed under MIT License
 * Modified for StackDock - see ATTRIBUTION.md for details
 */

/**
 * Provider Registry
 * 
 * Extracted from: SST provider system (150+ providers)
 * 
 * PURPOSE:
 * Manages cloud provider integrations via Pulumi providers.
 * 
 * REFACTORING REQUIRED:
 * - Integrate SST providers with dock adapter pattern
 * - Select provider based on availability (SST provider → dock adapter fallback)
 * - Register and manage both SST providers and dock adapters
 * 
 * TODO: Extract actual provider registry code from SST repository:
 * - Clone github.com/sst/sst
 * - Identify provider registry modules
 * - Extract core provider registration and selection logic
 * - Refactor to integrate with dock adapter pattern
 */

export interface Provider {
  name: string
  type: 'sst' | 'dock-adapter'
  resourceTypes: string[]
  available: boolean
}

/**
 * Provider Registry
 * 
 * Based on SST's provider registry system (150+ providers).
 * Refactored to integrate with dock adapter pattern.
 */
export class ProviderRegistry {
  private providers: Map<string, Provider> = new Map()

  /**
   * Register a provider
   * 
   * Based on SST's provider registration pattern:
   * - Validates provider configuration
   * - Registers provider in registry
   * - Supports both SST providers and dock adapters
   */
  register(provider: Provider): void {
    // SST pattern: Validate provider
    this.validateProvider(provider)

    // SST pattern: Register in registry
    this.providers.set(provider.name, provider)
  }

  /**
   * Get provider for resource type
   * 
   * Based on SST's provider selection pattern:
   * - Prefers SST providers when available
   * - Falls back to dock adapters
   */
  getProvider(resourceType: string, providerName?: string): Provider | null {
    if (providerName) {
      const provider = this.providers.get(providerName)
      if (provider && provider.resourceTypes.includes(resourceType)) {
        return provider
      }
      return null
    }

    // SST pattern: Find best provider for resource type
    // Priority: SST providers > Dock adapters
    const sstProviders = Array.from(this.providers.values()).filter(
      (p) => p.type === 'sst' && p.resourceTypes.includes(resourceType) && p.available
    )

    if (sstProviders.length > 0) {
      return sstProviders[0] // Return first available SST provider
    }

    // Fallback to dock adapters
    const dockAdapters = Array.from(this.providers.values()).filter(
      (p) => p.type === 'dock-adapter' && p.resourceTypes.includes(resourceType)
    )

    return dockAdapters[0] || null
  }

  /**
   * List available providers for resource type
   * 
   * Based on SST's provider listing pattern:
   * - Returns all providers supporting resource type
   * - Sorted by priority (SST providers first)
   */
  listProviders(resourceType: string): Provider[] {
    const matching = Array.from(this.providers.values()).filter((p) =>
      p.resourceTypes.includes(resourceType)
    )

    // SST pattern: Sort by priority (SST providers first)
    return matching.sort((a, b) => {
      if (a.type === 'sst' && b.type !== 'sst') return -1
      if (a.type !== 'sst' && b.type === 'sst') return 1
      return 0
    })
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(providerName: string): boolean {
    const provider = this.providers.get(providerName)
    return provider?.available ?? false
  }

  /**
   * Unregister provider
   */
  unregister(providerName: string): void {
    this.providers.delete(providerName)
  }

  /**
   * Validate provider (SST pattern)
   */
  private validateProvider(provider: Provider): void {
    if (!provider.name) {
      throw new Error('Provider name is required')
    }
    if (!provider.type) {
      throw new Error('Provider type is required')
    }
    if (!provider.resourceTypes || provider.resourceTypes.length === 0) {
      throw new Error('Provider must support at least one resource type')
    }
  }
}
