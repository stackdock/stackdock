/**
 * Next.js App Router adapter
 */

import type { Request as PluginRequest } from "../core/http"
import type { createPluginStack } from "../core/registry"

/**
 * Next.js adapter for StackDock plugins
 * 
 * Usage:
 * ```typescript
 * // app/api/data/[...path]/route.ts
 * import { createNextJSAdapter } from "@stackdock/plugins/adapters/nextjs"
 * 
 * export const { GET, POST, PUT, DELETE } = createNextJSAdapter(backendStack)
 * ```
 */
export function createNextJSAdapter(stack: ReturnType<typeof createPluginStack>) {
  return {
    GET: async (request: PluginRequest) => {
      return stack.handle(request)
    },
    POST: async (request: PluginRequest) => {
      return stack.handle(request)
    },
    PUT: async (request: PluginRequest) => {
      return stack.handle(request)
    },
    DELETE: async (request: PluginRequest) => {
      return stack.handle(request)
    }
  }
}
