/**
 * Optimistic Update Utilities for Convex
 * 
 * Provides helpers for implementing optimistic UI updates with automatic rollback on error.
 * 
 * Features:
 * - Type-safe optimistic updates
 * - Automatic rollback on mutation failure
 * - Integration with Convex queries
 * 
 * @see https://docs.convex.dev/client/react/optimistic-updates
 */

import type { Id } from "../_generated/dataModel"

/**
 * Optimistic update configuration for createProject
 * 
 * This helps the UI update immediately when a project is created,
 * before the server confirms the operation.
 */
export type OptimisticProject = {
  _id: Id<"projects">
  orgId: Id<"organizations">
  teamId: Id<"teams">
  clientId?: Id<"clients">
  name: string
  slug: string
  linearId?: string
  githubRepo?: string
  _optimistic?: boolean // Flag to mark optimistic updates
}

/**
 * Optimistic update configuration for linkResource
 * 
 * This helps the UI update immediately when a resource is linked,
 * before the server confirms the operation.
 */
export type OptimisticProjectResource = {
  _id: Id<"projectResources">
  orgId: Id<"organizations">
  projectId: Id<"projects">
  resourceTable: "servers" | "webServices" | "domains" | "databases"
  resourceId: string
  denormalized_name: string
  denormalized_status: string
  _optimistic?: boolean // Flag to mark optimistic updates
}

/**
 * Generate a temporary ID for optimistic updates
 * 
 * This creates a fake ID that looks like a real Convex ID but is clearly temporary.
 * The format matches Convex ID format to avoid type errors.
 */
export function generateOptimisticId(tableName: string): string {
  // Convex IDs are base64-encoded, so we generate a similar format
  // Prefix with "opt_" to make it obvious this is optimistic
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `opt_${tableName}_${randomPart}` as any
}

/**
 * Check if an ID is an optimistic (temporary) ID
 */
export function isOptimisticId(id: string): boolean {
  return typeof id === "string" && id.startsWith("opt_")
}

/**
 * Create an optimistic project object
 * 
 * Used to immediately show a new project in the UI while the mutation is in flight.
 */
export function createOptimisticProject(args: {
  orgId: Id<"organizations">
  teamId: Id<"teams">
  clientId?: Id<"clients">
  name: string
  linearId?: string
  githubRepo?: string
}): OptimisticProject {
  // Generate slug from name (same logic as server)
  const slug = args.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  
  return {
    _id: generateOptimisticId("projects") as Id<"projects">,
    orgId: args.orgId,
    teamId: args.teamId,
    name: args.name,
    slug,
    _optimistic: true,
    ...(args.clientId ? { clientId: args.clientId } : {}),
    ...(args.linearId ? { linearId: args.linearId } : {}),
    ...(args.githubRepo ? { githubRepo: args.githubRepo } : {}),
  }
}

/**
 * Create an optimistic project resource link
 * 
 * Used to immediately show a linked resource in the UI while the mutation is in flight.
 */
export function createOptimisticProjectResource(args: {
  orgId: Id<"organizations">
  projectId: Id<"projects">
  resourceTable: "servers" | "webServices" | "domains" | "databases"
  resourceId: string
  denormalized_name: string
  denormalized_status: string
}): OptimisticProjectResource {
  return {
    _id: generateOptimisticId("projectResources") as Id<"projectResources">,
    orgId: args.orgId,
    projectId: args.projectId,
    resourceTable: args.resourceTable,
    resourceId: args.resourceId,
    denormalized_name: args.denormalized_name,
    denormalized_status: args.denormalized_status,
    _optimistic: true,
  }
}

/**
 * Filter out optimistic updates from a query result
 * 
 * Useful when you want to show only confirmed data.
 */
export function filterOptimistic<T extends { _optimistic?: boolean }>(items: T[]): T[] {
  return items.filter((item) => !item._optimistic)
}

/**
 * Replace optimistic update with real data
 * 
 * When a mutation completes, replace the optimistic item with the real one.
 */
export function replaceOptimistic<T extends { _id: any; _optimistic?: boolean }>(
  items: T[],
  optimisticId: any,
  realItem: T
): T[] {
  return items.map((item) =>
    item._id === optimisticId ? realItem : item
  )
}

/**
 * Remove a failed optimistic update
 * 
 * When a mutation fails, remove the optimistic item.
 */
export function removeOptimistic<T extends { _id: any }>(
  items: T[],
  optimisticId: any
): T[] {
  return items.filter((item) => item._id !== optimisticId)
}
