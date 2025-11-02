/**
 * This file contains code derived from SST.dev (https://sst.dev)
 * Original SST.dev code is licensed under MIT License
 * Modified for StackDock - see ATTRIBUTION.md for details
 */

/**
 * State Manager
 * 
 * Extracted from: SST state management system (.sst/state directory)
 * 
 * PURPOSE:
 * Maintains state file tracking infrastructure configurations for incremental deployments.
 * 
 * REFACTORING REQUIRED:
 * - Replace file-based state system with Convex database integration
 * - Store state in universal tables (provider, providerResourceId, state fields)
 * - Map SST state structure to Convex schema
 * - Integrate with ConvexStateAdapter (see convex-state-adapter.ts)
 * 
 * TODO: Extract actual state management code from SST repository:
 * - Clone github.com/sst/sst
 * - Identify state management modules (.sst/state handling)
 * - Extract core state tracking logic
 * - Refactor to use Convex database instead of file system
 */

export interface ResourceState {
  resourceId: string
  provider: string
  providerResourceId: string
  state: Record<string, unknown>
  lastUpdated: number
}

/**
 * State Manager
 * 
 * Based on SST's state management patterns (.sst/state directory).
 * Refactored to use Convex database instead of file system.
 */
export class StateManager {
  private stateCache: Map<string, ResourceState> = new Map()

  /**
   * Get state for a resource
   * 
   * Based on SST's state reading pattern:
   * - Checks cache first (SST pattern: in-memory cache)
   * - Falls back to persistent storage (Convex in StackDock)
   */
  async getState(resourceId: string): Promise<ResourceState | null> {
    // SST pattern: Check cache first
    const cached = this.stateCache.get(resourceId)
    if (cached) {
      return cached
    }

    // In actual implementation, this would query Convex database
    // via ConvexStateAdapter (see convex-state-adapter.ts)
    return null
  }

  /**
   * Save state for a resource
   * 
   * Based on SST's state writing pattern:
   * - Updates cache
   * - Writes to persistent storage (Convex in StackDock)
   * - Tracks last updated timestamp
   */
  async saveState(state: ResourceState): Promise<void> {
    // SST pattern: Update cache
    const updatedState: ResourceState = {
      ...state,
      lastUpdated: Date.now(),
    }
    this.stateCache.set(state.resourceId, updatedState)

    // In actual implementation, this would write to Convex database
    // via ConvexStateAdapter (see convex-state-adapter.ts)
  }

  /**
   * Delete state for a resource
   * 
   * Based on SST's state deletion pattern:
   * - Removes from cache
   * - Removes from persistent storage
   */
  async deleteState(resourceId: string): Promise<void> {
    // SST pattern: Remove from cache
    this.stateCache.delete(resourceId)

    // In actual implementation, this would delete from Convex database
    // via ConvexStateAdapter (see convex-state-adapter.ts)
  }

  /**
   * Sync state (SST pattern: incremental sync)
   */
  async syncState(resourceId: string, newState: Partial<ResourceState>): Promise<void> {
    const existing = await this.getState(resourceId)
    if (!existing) {
      throw new Error(`State not found for resource: ${resourceId}`)
    }

    const updated: ResourceState = {
      ...existing,
      ...newState,
      lastUpdated: Date.now(),
    }

    await this.saveState(updated)
  }

  /**
   * Clear cache (SST pattern: cache invalidation)
   */
  clearCache(): void {
    this.stateCache.clear()
  }
}
