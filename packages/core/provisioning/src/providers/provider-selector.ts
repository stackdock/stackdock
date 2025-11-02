/**
 * StackDock-specific Provider Selector
 * 
 * This file is NOT derived from SST.dev - it's a new StackDock component
 * that selects between SST providers and dock adapters.
 */

/**
 * Provider Selector
 * 
 * PURPOSE:
 * Selects provisioning method (SST provider vs dock adapter).
 * 
 * This is a NEW component for StackDock, not extracted from SST.
 * It implements the provider selection strategy: SST provider > Dock adapter
 */

import type { Provider } from './provider-registry'

export type ProvisioningMethod = 'sst-provider' | 'dock-adapter'

export interface ProviderSelection {
  method: ProvisioningMethod
  provider: Provider | null
  dockAdapterName?: string
}

/**
 * Provider Selector
 * 
 * Logic:
 * 1. Check if SST provider exists for resource type
 * 2. If SST provider available: Use SST provisioning engine
 * 3. If no SST provider: Use dock adapter
 * 4. Fallback: Dock adapter for all providers
 */
export class ProviderSelector {
  /**
   * Select provisioning method for resource type
   */
  selectProvider(
    resourceType: string,
    providerName: string,
    sstProviders: Provider[],
    dockAdapters: string[]
  ): ProviderSelection {
    // Priority 1: SST provider (if available)
    const sstProvider = sstProviders.find(
      (p) => p.name === providerName && p.resourceTypes.includes(resourceType)
    )

    if (sstProvider && sstProvider.available) {
      return {
        method: 'sst-provider',
        provider: sstProvider,
      }
    }

    // Priority 2: Dock adapter (fallback)
    if (dockAdapters.includes(providerName)) {
      return {
        method: 'dock-adapter',
        provider: null,
        dockAdapterName: providerName,
      }
    }

    // No provider available
    throw new Error(
      `No provider available for resource type "${resourceType}" and provider "${providerName}"`
    )
  }
}
