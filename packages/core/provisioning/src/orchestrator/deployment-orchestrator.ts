/**
 * This file contains code derived from SST.dev (https://sst.dev)
 * Original SST.dev code is licensed under MIT License
 * Modified for StackDock - see ATTRIBUTION.md for details
 */

/**
 * Deployment Orchestrator
 * 
 * Extracted from: SST Ion deployment engine (Pulumi/Terraform based)
 * 
 * PURPOSE:
 * Coordinates deployment process, manages resource dependencies and provisioning order.
 * 
 * REFACTORING REQUIRED:
 * - Adapt to work with dock adapters
 * - Orchestrate provisioning via universal table writes instead of SST constructs
 * - Manage dependencies between resources
 * - Integrate with dock adapter API calls
 * 
 * TODO: Extract actual deployment orchestration code from SST repository:
 * - Clone github.com/sst/sst
 * - Identify Ion deployment engine modules
 * - Extract core orchestration and dependency management logic
 * - Refactor to work with dock adapters and universal tables
 */

export interface DeploymentPlan {
  resources: DeploymentResource[]
  dependencies: DependencyGraph
  order: string[] // Resource IDs in deployment order
}

export interface DeploymentResource {
  id: string
  type: string
  provider: string
  dependsOn: string[]
}

export interface DependencyGraph {
  [resourceId: string]: string[]
}

/**
 * Deployment Orchestrator
 * 
 * Based on SST Ion deployment engine patterns (Pulumi/Terraform based).
 * Refactored to work with dock adapters and universal tables.
 */
export class DeploymentOrchestrator {
  /**
   * Create deployment plan
   * 
   * Based on SST's deployment planning pattern:
   * - Analyzes resource dependencies
   * - Orders resources by dependency graph
   * - Creates execution plan
   */
  async createPlan(resources: DeploymentResource[]): Promise<DeploymentPlan> {
    // SST pattern: Build dependency graph
    const dependencies = await this.resolveDependencies(resources)

    // SST pattern: Topological sort for execution order
    const order = this.topologicalSort(resources, dependencies)

    return {
      resources,
      dependencies,
      order,
    }
  }

  /**
   * Execute deployment plan
   * 
   * Based on SST's deployment execution pattern:
   * - Executes resources in dependency order
   * - Handles errors and rollback
   * - Tracks execution state
   */
  async executePlan(plan: DeploymentPlan): Promise<void> {
    // SST pattern: Execute in order
    for (const resourceId of plan.order) {
      const resource = plan.resources.find((r) => r.id === resourceId)
      if (!resource) {
        throw new Error(`Resource not found in plan: ${resourceId}`)
      }

      try {
        // In actual implementation, this would call:
        // - SST provider if available
        // - Dock adapter API if no SST provider
        await this.executeResource(resource)
      } catch (error) {
        // SST pattern: Error handling and rollback
        throw new Error(
          `Failed to execute resource ${resourceId}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }
  }

  /**
   * Resolve dependencies
   * 
   * Based on SST's dependency resolution pattern:
   * - Analyzes resource dependencies
   * - Builds dependency graph
   * - Detects circular dependencies
   */
  async resolveDependencies(
    resources: DeploymentResource[]
  ): Promise<DependencyGraph> {
    const graph: DependencyGraph = {}

    // SST pattern: Build dependency graph
    for (const resource of resources) {
      graph[resource.id] = resource.dependsOn || []
    }

    // SST pattern: Detect circular dependencies
    this.detectCycles(graph)

    return graph
  }

  /**
   * Execute single resource (SST pattern)
   */
  private async executeResource(resource: DeploymentResource): Promise<void> {
    // In actual implementation, this would:
    // 1. Select provider (SST vs dock adapter)
    // 2. Call provisioning API
    // 3. Update state
    // 4. Write to universal table
  }

  /**
   * Topological sort (SST pattern: Kahn's algorithm)
   */
  private topologicalSort(
    resources: DeploymentResource[],
    dependencies: DependencyGraph
  ): string[] {
    const inDegree: Record<string, number> = {}
    const queue: string[] = []
    const result: string[] = []

    // Initialize in-degree
    for (const resource of resources) {
      inDegree[resource.id] = dependencies[resource.id]?.length || 0
      if (inDegree[resource.id] === 0) {
        queue.push(resource.id)
      }
    }

    // Process queue
    while (queue.length > 0) {
      const current = queue.shift()!
      result.push(current)

      // Update in-degree of dependent resources
      for (const resource of resources) {
        if (dependencies[resource.id]?.includes(current)) {
          inDegree[resource.id]--
          if (inDegree[resource.id] === 0) {
            queue.push(resource.id)
          }
        }
      }
    }

    // Check for cycles
    if (result.length !== resources.length) {
      throw new Error('Circular dependency detected in resource graph')
    }

    return result
  }

  /**
   * Detect circular dependencies (SST pattern)
   */
  private detectCycles(graph: DependencyGraph): void {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const dfs = (node: string): boolean => {
      if (recursionStack.has(node)) {
        return true // Cycle detected
      }
      if (visited.has(node)) {
        return false
      }

      visited.add(node)
      recursionStack.add(node)

      for (const dep of graph[node] || []) {
        if (dfs(dep)) {
          return true
        }
      }

      recursionStack.delete(node)
      return false
    }

    for (const node of Object.keys(graph)) {
      if (dfs(node)) {
        throw new Error(`Circular dependency detected involving: ${node}`)
      }
    }
  }
}
