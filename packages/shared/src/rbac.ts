/**
 * RBAC Type Enforcement
 * 
 * Type-safe permissions and RBAC helpers to prevent accidental bypasses
 * of permission checks.
 * 
 * ## What are RBAC Types?
 * 
 * RBAC (Role-Based Access Control) types provide compile-time safety for
 * permission checks. They ensure mutations always validate user permissions.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Define permission as const
 * const permission: Permission = "docks:full"
 * 
 * // Use in mutation with type safety
 * export const createDock = mutation({
 *   handler: withRBAC(permission)(async (ctx, args, user) => {
 *     // Type-safe: user is authenticated and authorized
 *   })
 * })
 * ```
 * 
 * ## Security Benefits
 * 
 * 1. **Autocomplete**: IDE suggests valid permission strings
 * 2. **Type errors**: Catch typos at compile time
 * 3. **Self-documenting**: Permission format is clear
 * 4. **Refactoring**: Easy to find all usages of a permission
 * 
 * @see docs/architecture/RBAC.md
 */

/**
 * Resource types in the RBAC system
 * 
 * Each resource has its own permission levels (read, full, none).
 */
export type RBACResource = 
  | "projects"      // Project management
  | "resources"     // Infrastructure (servers, sites, domains)
  | "docks"         // Provider connections
  | "operations"    // Backup/restore operations
  | "settings"      // Organization/team/role management
  | "provisioning"  // Infrastructure provisioning (optional, opt-in)
  | "monitoring"    // Monitoring and alerting (optional, opt-in)

/**
 * Permission levels in the RBAC system
 * 
 * - `none`: No access to the resource
 * - `read`: View-only access (queries)
 * - `full`: Full access (create, update, delete, read)
 */
export type RBACLevel = "none" | "read" | "full"

/**
 * Permission string format: "resource:level"
 * 
 * **Examples**:
 * - `"projects:full"` - Full access to projects (create, edit, delete, view)
 * - `"resources:read"` - Read-only access to resources (view only)
 * - `"docks:full"` - Full access to docks (connect, sync, delete)
 * - `"provisioning:full"` - Full access to provisioning (create, update, delete resources)
 * - `"settings:read"` - Read-only access to settings (view only)
 * 
 * @see docs/architecture/RBAC.md for full permission matrix
 */
export type Permission = `${RBACResource}:${RBACLevel}`

/**
 * Helper type: Extract all "full" permissions
 * 
 * @example
 * ```typescript
 * const permission: FullPermission = "docks:full" // OK
 * const badPermission: FullPermission = "docks:read" // Type error!
 * ```
 */
export type FullPermission = `${RBACResource}:full`

/**
 * Helper type: Extract all "read" permissions
 * 
 * @example
 * ```typescript
 * const permission: ReadPermission = "resources:read" // OK
 * const badPermission: ReadPermission = "resources:full" // Type error!
 * ```
 */
export type ReadPermission = `${RBACResource}:read`

/**
 * Permission validator: Check if a string is a valid Permission
 * 
 * This is a runtime validation function that can be used to validate
 * user input or configuration.
 * 
 * @param value - String to validate
 * @returns True if valid permission format
 * 
 * @example
 * ```typescript
 * if (isValidPermission(userInput)) {
 *   const permission: Permission = userInput
 * }
 * ```
 */
export function isValidPermission(value: string): value is Permission {
  const validResources: RBACResource[] = [
    "projects",
    "resources",
    "docks",
    "operations",
    "settings",
    "provisioning",
    "monitoring",
  ]
  
  const validLevels: RBACLevel[] = ["none", "read", "full"]
  
  const [resource, level] = value.split(":")
  
  return (
    validResources.includes(resource as RBACResource) &&
    validLevels.includes(level as RBACLevel)
  )
}

/**
 * Parse permission string into resource and level
 * 
 * @param permission - Permission string (e.g., "docks:full")
 * @returns Object with resource and level
 * 
 * @example
 * ```typescript
 * const { resource, level } = parsePermission("docks:full")
 * // resource = "docks", level = "full"
 * ```
 */
export function parsePermission(permission: Permission): {
  resource: RBACResource
  level: RBACLevel
} {
  const [resource, level] = permission.split(":") as [RBACResource, RBACLevel]
  return { resource, level }
}

/**
 * Role permission object
 * 
 * Maps each resource to a permission level.
 * 
 * @example
 * ```typescript
 * const adminRole: RolePermissions = {
 *   projects: "full",
 *   resources: "full",
 *   docks: "full",
 *   operations: "full",
 *   settings: "full",
 *   provisioning: "full",
 *   monitoring: "full",
 * }
 * 
 * const developerRole: RolePermissions = {
 *   projects: "full",
 *   resources: "read",
 *   docks: "none",
 *   operations: "read",
 *   settings: "none",
 *   provisioning: "none",
 *   monitoring: "read",
 * }
 * ```
 */
export type RolePermissions = {
  [K in RBACResource]: RBACLevel
}

/**
 * Partial role permissions (for optional permissions)
 * 
 * This allows roles to have undefined optional permissions like
 * "provisioning" and "monitoring" for backward compatibility.
 * 
 * @example
 * ```typescript
 * const legacyRole: PartialRolePermissions = {
 *   projects: "full",
 *   resources: "full",
 *   docks: "full",
 *   operations: "full",
 *   settings: "full",
 *   // provisioning and monitoring are undefined (opt-in)
 * }
 * ```
 */
export type PartialRolePermissions = {
  projects: RBACLevel
  resources: RBACLevel
  docks: RBACLevel
  operations: RBACLevel
  settings: RBACLevel
  provisioning?: RBACLevel  // Optional: opt-in for new features
  monitoring?: RBACLevel    // Optional: opt-in for new features
}

/**
 * Check if a role has a specific permission
 * 
 * Handles undefined optional permissions (returns false for undefined).
 * 
 * @param rolePermissions - Role's permission object
 * @param permission - Permission to check
 * @returns True if role has permission
 * 
 * @example
 * ```typescript
 * const role: PartialRolePermissions = {
 *   projects: "full",
 *   resources: "read",
 *   docks: "none",
 *   operations: "read",
 *   settings: "none",
 *   // provisioning is undefined
 * }
 * 
 * hasPermission(role, "projects:full") // true
 * hasPermission(role, "projects:read") // true (full includes read)
 * hasPermission(role, "resources:full") // false (only has read)
 * hasPermission(role, "provisioning:read") // false (undefined = denied)
 * ```
 */
export function hasPermission(
  rolePermissions: PartialRolePermissions,
  permission: Permission
): boolean {
  const { resource, level } = parsePermission(permission)
  const roleLevel = rolePermissions[resource]
  
  // Handle undefined permissions (opt-in): deny access
  if (roleLevel === undefined) {
    return false
  }
  
  // Check permission level
  if (roleLevel === "none") return false
  if (roleLevel === "full") return true
  if (roleLevel === "read" && level === "read") return true
  
  return false
}

/**
 * RBAC-protected resource marker (branded type)
 * 
 * This is an advanced pattern for marking resources that have passed
 * RBAC checks. It's optional and not required for basic RBAC enforcement.
 * 
 * @example
 * ```typescript
 * type ProtectedDock = RBACProtected<Dock>
 * 
 * function processDock(dock: ProtectedDock) {
 *   // Type system guarantees dock has passed RBAC checks
 * }
 * ```
 */
export type RBACProtected<T> = T & { readonly __rbac: true }

/**
 * Mark a resource as RBAC-protected
 * 
 * This is a no-op at runtime, but adds type-level safety.
 * 
 * @param resource - Resource to mark as protected
 * @returns Same resource with RBAC brand
 */
export function markAsProtected<T>(resource: T): RBACProtected<T> {
  return resource as RBACProtected<T>
}

/**
 * Common permission constants
 * 
 * Use these for consistency and autocomplete.
 */
export const Permissions = {
  // Projects
  PROJECTS_FULL: "projects:full" as const,
  PROJECTS_READ: "projects:read" as const,
  PROJECTS_NONE: "projects:none" as const,
  
  // Resources (infrastructure)
  RESOURCES_FULL: "resources:full" as const,
  RESOURCES_READ: "resources:read" as const,
  RESOURCES_NONE: "resources:none" as const,
  
  // Docks (provider connections)
  DOCKS_FULL: "docks:full" as const,
  DOCKS_READ: "docks:read" as const,
  DOCKS_NONE: "docks:none" as const,
  
  // Operations (backup/restore)
  OPERATIONS_FULL: "operations:full" as const,
  OPERATIONS_READ: "operations:read" as const,
  OPERATIONS_NONE: "operations:none" as const,
  
  // Settings (org/team/role management)
  SETTINGS_FULL: "settings:full" as const,
  SETTINGS_READ: "settings:read" as const,
  SETTINGS_NONE: "settings:none" as const,
  
  // Provisioning (infrastructure provisioning)
  PROVISIONING_FULL: "provisioning:full" as const,
  PROVISIONING_READ: "provisioning:read" as const,
  PROVISIONING_NONE: "provisioning:none" as const,
  
  // Monitoring (monitoring and alerting)
  MONITORING_FULL: "monitoring:full" as const,
  MONITORING_READ: "monitoring:read" as const,
  MONITORING_NONE: "monitoring:none" as const,
} satisfies Record<string, Permission>
