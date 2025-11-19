/**
 * @stackdock/shared
 * 
 * Shared types and utilities for type-safe encryption and RBAC enforcement.
 * 
 * ## Encryption Types
 * 
 * Branded types prevent accidental exposure of plaintext API keys:
 * 
 * ```typescript
 * import { PlaintextApiKey, EncryptedApiKey, toPlaintextApiKey } from '@stackdock/shared'
 * 
 * const plaintext = toPlaintextApiKey(args.apiKey)
 * const encrypted = await encryptApiKey(plaintext)
 * ```
 * 
 * ## RBAC Types
 * 
 * Type-safe permissions prevent typos and enforce permission checks:
 * 
 * ```typescript
 * import { Permission, Permissions } from '@stackdock/shared'
 * 
 * const permission: Permission = Permissions.DOCKS_FULL
 * export const createDock = mutation({
 *   handler: withRBAC(permission)(async (ctx, args, user) => {
 *     // ...
 *   })
 * })
 * ```
 * 
 * @see docs/architecture/SECURITY.md
 * @see docs/architecture/RBAC.md
 */

// Encryption types and utilities
export {
  // Types
  PlaintextApiKey,
  EncryptedApiKey,
  
  // Type guards
  isPlaintextApiKey,
  isEncryptedApiKey,
  
  // Conversion helpers
  toPlaintextApiKey,
  toEncryptedApiKey,
  fromPlaintextApiKey,
  fromEncryptedApiKey,
} from './encryption'

// RBAC types and utilities
export {
  // Types
  RBACResource,
  RBACLevel,
  Permission,
  FullPermission,
  ReadPermission,
  RolePermissions,
  PartialRolePermissions,
  RBACProtected,
  
  // Utilities
  isValidPermission,
  parsePermission,
  hasPermission,
  markAsProtected,
  
  // Constants
  Permissions,
} from './rbac'
