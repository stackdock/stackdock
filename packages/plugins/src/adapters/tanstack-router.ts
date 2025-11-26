/**
 * TanStack Router adapter
 */

import type { createPluginStack } from "../core/registry"

/**
 * TanStack Router adapter for StackDock plugins
 * 
 * Usage:
 * ```typescript
 * // src/routes/__root.tsx
 * import { createTanStackRouterAdapter } from "@stackdock/plugins/adapters/tanstack-router"
 * 
 * const routes = createTanStackRouterAdapter(clientStack)
 * ```
 */
export function createTanStackRouterAdapter(stack: ReturnType<typeof createPluginStack>) {
  // Generate routes from plugin stack
  // Implementation will be added as plugins are developed
  return {}
}
