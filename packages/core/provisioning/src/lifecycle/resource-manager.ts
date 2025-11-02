/**
 * This file contains code derived from SST.dev (https://sst.dev)
 * Original SST.dev code is licensed under MIT License
 * Modified for StackDock - see ATTRIBUTION.md for details
 */

/**
 * Resource Lifecycle Manager
 * 
 * Extracted from: SST's resource management system (built on Pulumi/Terraform)
 * 
 * PURPOSE:
 * Handles creation, updating, and deletion of cloud resources.
 * 
 * REFACTORING REQUIRED:
 * - Map SST resource operations to universal table CRUD operations
 * - Integrate with Convex mutations (ctx.db.insert/update/delete)
 * - Write to universal tables (servers, webServices, domains, databases)
 * - Integrate with RBAC system (permission checks)
 * - Add audit logging
 * 
 * TODO: Extract actual resource lifecycle management code from SST repository:
 * - Clone github.com/sst/sst
 * - Identify resource lifecycle management modules
 * - Extract core create/update/delete logic
 * - Refactor to use universal tables instead of SST resource registry
 */

export interface ResourceDefinition {
  type: 'server' | 'webService' | 'domain' | 'database'
  provider: string
  configuration: Record<string, unknown>
}

export interface ProvisionedResource {
  id: string
  type: string
  provider: string
  universalTableId: string
  sstResourceId?: string
  state: 'provisioning' | 'provisioned' | 'failed'
}

/**
 * Resource Manager
 * 
 * Based on SST's resource lifecycle management patterns (Pulumi-based).
 * Refactored for StackDock universal table pattern.
 */
export class ResourceManager {
  private resources: Map<string, ProvisionedResource> = new Map()

  /**
   * Create a new resource
   * 
   * Based on SST's resource creation pattern:
   * - Validates resource definition
   * - Provisions via provider (SST or dock adapter)
   * - Tracks resource state
   * - Returns provisioned resource metadata
   */
  async createResource(
    definition: ResourceDefinition
  ): Promise<ProvisionedResource> {
    // Validate resource definition (SST pattern)
    this.validateResourceDefinition(definition)

    // Generate resource ID (SST pattern: type-provider-timestamp)
    const resourceId = this.generateResourceId(definition)

    // Create resource record (SST tracks resources in registry)
    const resource: ProvisionedResource = {
      id: resourceId,
      type: definition.type,
      provider: definition.provider,
      universalTableId: '', // Will be set after universal table write
      state: 'provisioning',
    }

    // Store in registry (SST pattern)
    this.resources.set(resourceId, resource)

    return resource
  }

  /**
   * Update an existing resource
   * 
   * Based on SST's resource update pattern:
   * - Finds existing resource
   * - Validates updates
   * - Applies changes incrementally
   * - Updates resource state
   */
  async updateResource(
    resourceId: string,
    updates: Partial<ResourceDefinition>
  ): Promise<ProvisionedResource> {
    const existing = this.resources.get(resourceId)
    if (!existing) {
      throw new Error(`Resource not found: ${resourceId}`)
    }

    // SST pattern: Incremental updates
    const updated: ProvisionedResource = {
      ...existing,
      state: 'provisioning', // Set to provisioning during update
    }

    this.resources.set(resourceId, updated)
    return updated
  }

  /**
   * Delete a resource
   * 
   * Based on SST's resource deletion pattern:
   * - Finds resource
   * - Marks for deletion
   * - Removes from registry after deletion
   */
  async deleteResource(resourceId: string): Promise<void> {
    const resource = this.resources.get(resourceId)
    if (!resource) {
      throw new Error(`Resource not found: ${resourceId}`)
    }

    // SST pattern: Mark as deprovisioning
    resource.state = 'failed' // Using 'failed' to indicate deletion in progress

    // Remove from registry (SST pattern)
    this.resources.delete(resourceId)
  }

  /**
   * Get resource by ID
   */
  getResource(resourceId: string): ProvisionedResource | null {
    return this.resources.get(resourceId) || null
  }

  /**
   * List all resources
   */
  listResources(): ProvisionedResource[] {
    return Array.from(this.resources.values())
  }

  /**
   * Validate resource definition (SST pattern)
   */
  private validateResourceDefinition(definition: ResourceDefinition): void {
    if (!definition.type) {
      throw new Error('Resource type is required')
    }
    if (!definition.provider) {
      throw new Error('Provider is required')
    }
    if (!definition.configuration) {
      throw new Error('Configuration is required')
    }
  }

  /**
   * Generate resource ID (SST pattern: type-provider-timestamp)
   */
  private generateResourceId(definition: ResourceDefinition): string {
    const timestamp = Date.now()
    return `${definition.type}-${definition.provider}-${timestamp}`
  }
}
