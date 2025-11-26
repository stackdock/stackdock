/**
 * Plugin registry and stack management
 */

import type { PluginStackConfig, BackendPlugin, ClientPlugin } from "./types"

/**
 * Create a plugin stack
 */
export function createPluginStack(config: PluginStackConfig) {
  return {
    config,
    plugins: config.plugins,
    
    // Backend stack methods
    handle: async (request: Request) => {
      // Route to appropriate plugin handler
      // Implementation will be added as plugins are developed
      throw new Error("Not implemented yet")
    },
    
    // Client stack methods
    generateRoutes: () => {
      // Generate routes from client plugins
      // Implementation will be added as plugins are developed
      return {}
    },
    
    generateHooks: () => {
      // Generate hooks from client plugins
      // Implementation will be added as plugins are developed
      return {}
    }
  }
}

/**
 * Plugin registry
 */
export const pluginRegistry = new Map<string, BackendPlugin | ClientPlugin>()

/**
 * Register a plugin
 */
export function registerPlugin(plugin: BackendPlugin | ClientPlugin) {
  pluginRegistry.set(plugin.name, plugin)
}

/**
 * Get a plugin by name
 */
export function getPlugin(name: string): BackendPlugin | ClientPlugin | undefined {
  return pluginRegistry.get(name)
}
