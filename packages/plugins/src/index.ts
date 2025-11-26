/**
 * StackDock Plugin System
 * 
 * Composable full-stack plugin system for React frameworks.
 * Inspired by Better Stack (https://www.better-stack.ai/)
 */

// Plugin core types and utilities
export * from "./core/types"
export * from "./core/plugin"
export * from "./core/registry"

// Framework adapters
export * from "./adapters/nextjs"
export * from "./adapters/tanstack-router"
export * from "./adapters/react-router"

// React provider
export * from "./react/provider"
