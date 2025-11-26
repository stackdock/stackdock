/**
 * Core types for the StackDock Plugin System
 */

import type { ComponentType } from "react"
import type { Request, Response } from "./http"

/**
 * Database schema definition
 */
export interface DatabaseSchema {
  [tableName: string]: {
    [fieldName: string]: string | DatabaseFieldDefinition
  }
}

export interface DatabaseFieldDefinition {
  type: "string" | "number" | "boolean" | "datetime" | "text" | "json"
  required?: boolean
  unique?: boolean
  default?: unknown
}

/**
 * Backend plugin definition
 */
export interface BackendPlugin {
  name: string
  schema: DatabaseSchema
  handler: (req: Request, res: Response) => Promise<Response>
}

/**
 * Client plugin definition
 */
export interface ClientPlugin {
  name: string
  routes: Record<string, ComponentType>
  hooks: Record<string, Function>
  loaders: Record<string, Function>
}

/**
 * Plugin stack configuration
 */
export interface PluginStackConfig {
  basePath: string
  plugins: Record<string, BackendPlugin | ClientPlugin>
  adapter?: DatabaseAdapter
}

/**
 * Database adapter interface
 */
export interface DatabaseAdapter {
  name: string
  generateSchema(schema: DatabaseSchema): string
  executeQuery(query: string, params?: unknown[]): Promise<unknown>
}

// Re-export HTTP types for convenience
export type { Request, Response } from "./http"
