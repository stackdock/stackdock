/**
 * @stackdock/core - Main Export File
 * 
 * StackDock core provisioning engine - Extracted and refactored from SST.dev
 */

// Lifecycle exports
export * from './lifecycle/resource-manager'

// State exports
export * from './state/state-manager'
export * from './state/convex-state-adapter'

// Orchestrator exports
export * from './orchestrator/deployment-orchestrator'

// Adapter exports
export * from './adapters/dock-adapter-api'
export * from './adapters/provisioning-context'
export * from './adapters/universal-table-mapper'

// Provider exports
export * from './providers/provider-registry'
export * from './providers/provider-selector'
