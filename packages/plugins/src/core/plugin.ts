/**
 * Plugin definition utilities
 */

import type { BackendPlugin, ClientPlugin } from "./types"

/**
 * Define a backend plugin
 */
export function definePlugin(config: {
  name: string
  schema: BackendPlugin["schema"]
  handler: BackendPlugin["handler"]
}): BackendPlugin {
  return {
    name: config.name,
    schema: config.schema,
    handler: config.handler
  }
}

/**
 * Define a client plugin
 */
export function defineClientPlugin(config: {
  name: string
  routes: ClientPlugin["routes"]
  hooks: ClientPlugin["hooks"]
  loaders: ClientPlugin["loaders"]
}): ClientPlugin {
  return {
    name: config.name,
    routes: config.routes,
    hooks: config.hooks,
    loaders: config.loaders
  }
}
