/**
 * StackDock-specific Dock Adapter API
 * 
 * This file is NOT derived from SST.dev - it's a new StackDock component
 * that provides the integration API for dock adapters to use the provisioning engine.
 */

/**
 * Dock Adapter API
 * 
 * PURPOSE:
 * Integration API for dock adapters to use StackDock provisioning engine.
 * 
 * This is a NEW component for StackDock, not extracted from SST.
 * It provides the interface between dock adapters and the provisioning engine.
 */

import type { ProvisioningContext } from './provisioning-context'
import type { ResourceMapping } from './universal-table-mapper'
import type { ResourceDefinition, ProvisionedResource } from '../lifecycle/resource-manager'

import { ResourceManager } from '../lifecycle/resource-manager'
import { ProviderRegistry } from '../providers/provider-registry'
import { ProviderSelector } from '../providers/provider-selector'
import { mapResourceToUniversalTable } from './universal-table-mapper'
import { ConvexStateAdapter } from '../state/convex-state-adapter'

/**
 * Provision a new resource via SST engine or dock adapter
 */
export async function provisionResource(
  ctx: ProvisioningContext,
  resourceDef: ResourceDefinition
): Promise<ProvisionedResource> {
  // 1. Select provider (SST provider vs dock adapter)
  const providerRegistry = new ProviderRegistry()
  const providerSelector = new ProviderSelector()
  
  // Get available providers (in real implementation, this would come from Convex)
  const sstProviders = providerRegistry.listProviders(resourceDef.type)
  const dockAdapters: string[] = [] // In real implementation, get from dock registry

  const selection = providerSelector.selectProvider(
    resourceDef.type,
    resourceDef.provider,
    sstProviders,
    dockAdapters
  )

  // 2. If SST provider: Use SST provisioning engine
  // 3. If dock adapter: Call adapter's provision method
  const resourceManager = new ResourceManager()
  const provisionedResource = await resourceManager.createResource(resourceDef)

  // 4. Map provisioned resource to universal table
  const mapping = mapResourceToUniversalTable({
    type: resourceDef.type,
    id: provisionedResource.id,
    provider: resourceDef.provider,
    name: resourceDef.configuration.name as string || resourceDef.type,
    ...resourceDef.configuration,
  })

  if (!mapping) {
    throw new Error(`Cannot map resource type ${resourceDef.type} to universal table`)
  }

  // 5. Write to universal table (servers/webServices/domains/databases)
  // In actual implementation, this would write to Convex via ctx.convexCtx.db
  // For now, we'll update the resource with the mapping info
  provisionedResource.universalTableId = mapping.universalTable

  // 6. Update state in Convex
  const stateAdapter = new ConvexStateAdapter(ctx.convexCtx)
  await stateAdapter.saveState(
    {
      resourceId: provisionedResource.id,
      provider: resourceDef.provider,
      providerResourceId: mapping.mapping.providerResourceId as string,
      state: {
        provisioningSource: selection.method === 'sst-provider' ? 'sst' : 'api',
        provisioningState: 'provisioning',
        provisionedAt: Date.now(),
        ...mapping.mapping,
      },
      lastUpdated: Date.now(),
    },
    mapping.universalTable
  )

  // 7. Return provisioned resource metadata
  return provisionedResource
}

/**
 * Update an existing provisioned resource
 */
export async function updateResource(
  ctx: ProvisioningContext,
  resourceId: string,
  updates: Partial<ResourceDefinition>
): Promise<ProvisionedResource> {
  // 1. Find resource in universal table
  const resourceManager = new ResourceManager()
  const existing = resourceManager.getResource(resourceId)
  
  if (!existing) {
    throw new Error(`Resource not found: ${resourceId}`)
  }

  // 2. Select provider based on resource.provider field
  // 3. If SST provisioned: Use SST update operations
  // 4. If dock adapter: Call adapter's update method
  const updated = await resourceManager.updateResource(resourceId, updates)

  // 5. Update universal table record
  // 6. Update state in Convex
  const stateAdapter = new ConvexStateAdapter(ctx.convexCtx)
  // In actual implementation, would update Convex record

  // 7. Return updated resource metadata
  return updated
}

/**
 * Delete a provisioned resource
 */
export async function deleteResource(
  ctx: ProvisioningContext,
  resourceId: string
): Promise<void> {
  // 1. Find resource in universal table
  const resourceManager = new ResourceManager()
  const existing = resourceManager.getResource(resourceId)
  
  if (!existing) {
    throw new Error(`Resource not found: ${resourceId}`)
  }

  // 2. Select provider based on resource.provider field
  // 3. If SST provisioned: Use SST delete operations
  // 4. If dock adapter: Call adapter's delete method
  await resourceManager.deleteResource(resourceId)

  // 5. Delete from universal table
  // 6. Update state in Convex
  const stateAdapter = new ConvexStateAdapter(ctx.convexCtx)
  await stateAdapter.deleteState(resourceId)
}

/**
 * Get current state of a provisioned resource
 */
export async function getResourceState(
  ctx: ProvisioningContext,
  resourceId: string
): Promise<ResourceMapping | null> {
  // 1. Query universal table for resource
  const stateAdapter = new ConvexStateAdapter(ctx.convexCtx)
  
  // Try each table type (in real implementation, would know which table)
  const tableTypes: Array<'servers' | 'webServices' | 'domains' | 'databases'> = [
    'servers',
    'webServices',
    'domains',
    'databases',
  ]

  for (const tableType of tableTypes) {
    const state = await stateAdapter.getState(resourceId, tableType)
    if (state) {
      // 2. If SST provisioned: Query SST state
      // 3. If dock adapter: Query provider API via adapter
      // 4. Return resource state
      return {
        sstResourceType: state.state.sstResourceId as string || '',
        universalTable: tableType,
        mapping: state.state as ResourceMapping['mapping'],
      }
    }
  }

  return null
}

/**
 * Sync resource state from provider to universal table
 */
export async function syncResourceState(
  ctx: ProvisioningContext,
  resourceId: string
): Promise<void> {
  // 1. Get current state from provider (SST or dock adapter)
  const currentState = await getResourceState(ctx, resourceId)
  if (!currentState) {
    throw new Error(`Resource state not found: ${resourceId}`)
  }

  // 2. Compare with universal table state
  const stateAdapter = new ConvexStateAdapter(ctx.convexCtx)
  const tableState = await stateAdapter.getState(resourceId, currentState.universalTable)

  // 3. Update universal table if differences found
  if (tableState) {
    // Compare states and update if needed
    // In actual implementation, would compare and sync
  }

  // 4. Update state timestamp
  if (tableState) {
    await stateAdapter.saveState(
      {
        ...tableState,
        lastUpdated: Date.now(),
      },
      currentState.universalTable
    )
  }
}
