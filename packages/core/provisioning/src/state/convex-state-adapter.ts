/**
 * StackDock-specific Convex State Adapter
 * 
 * This file is NOT derived from SST.dev - it's a new StackDock component
 * that replaces SST's file-based state system with Convex database integration.
 */

/**
 * Convex State Adapter
 * 
 * PURPOSE:
 * Adapts SST state management to use Convex database instead of file system.
 * 
 * This is a NEW component for StackDock, not extracted from SST.
 * It provides the integration layer between SST state management patterns
 * and StackDock's Convex database.
 */

// NOTE: Convex types will be available when this package is used in StackDock monorepo
// Type definition here - actual import path depends on monorepo structure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MutationCtx = any // Will be replaced with actual Convex type import
import type { ResourceState } from './state-manager'

/**
 * Convex State Adapter
 * 
 * Stores provisioning state in Convex universal tables instead of file system.
 */
export class ConvexStateAdapter {
  constructor(private ctx: MutationCtx) {}

  /**
   * Get state from Convex database
   */
  async getState(
    resourceId: string,
    tableName: 'servers' | 'webServices' | 'domains' | 'databases'
  ): Promise<ResourceState | null> {
    const resource = await this.ctx.db
      .query(tableName)
      .withIndex('by_dock_resource', (q) =>
        q.eq('providerResourceId', resourceId)
      )
      .first()

    if (!resource) {
      return null
    }

    return {
      resourceId: resource._id,
      provider: resource.provider,
      providerResourceId: resource.providerResourceId,
      state: {
        provisioningSource: resource.provisioningSource,
        sstResourceId: resource.sstResourceId,
        sstStackName: resource.sstStackName,
        provisioningState: resource.provisioningState,
        provisionedAt: resource.provisionedAt,
        ...resource.fullApiData,
      },
      lastUpdated: resource.provisionedAt || Date.now(),
    }
  }

  /**
   * Save state to Convex database
   */
  async saveState(
    state: ResourceState,
    tableName: 'servers' | 'webServices' | 'domains' | 'databases'
  ): Promise<void> {
    const existing = await this.ctx.db
      .query(tableName)
      .withIndex('by_dock_resource', (q) =>
        q.eq('providerResourceId', state.providerResourceId)
      )
      .first()

    if (existing) {
      await this.ctx.db.patch(existing._id, {
        provisioningState: state.state.provisioningState as
          | 'provisioning'
          | 'provisioned'
          | 'failed'
          | 'deprovisioning',
        provisionedAt: state.lastUpdated,
        fullApiData: state.state,
      })
    } else {
      // Resource should be created via provisioning operations, not here
      throw new Error(
        'Cannot save state for non-existent resource. Create resource first via provisioning operations.'
      )
    }
  }

  /**
   * Delete state for a resource
   */
  async deleteState(
    resourceId: string,
    tableName: 'servers' | 'webServices' | 'domains' | 'databases'
  ): Promise<void> {
    const resource = await this.ctx.db
      .query(tableName)
      .withIndex('by_dock_resource', (q) =>
        q.eq('providerResourceId', resourceId)
      )
      .first()

    if (resource) {
      await this.ctx.db.delete(resource._id)
    }
  }
}
