/**
 * Encryption utilities for StackDock
 * 
 * Uses AES-256-GCM for authenticated encryption of API keys.
 * 
 * Security:
 * - Master key stored in Convex environment variables (ENCRYPTION_MASTER_KEY)
 * - Never sent to client
 * - Only decrypted in Convex server functions
 * - Never logged
 * 
 * Note: Uses Web Crypto API (available globally in Convex)
 * 
 * @see docs/architecture/SECURITY.md for full security documentation
 */

import { auditLog } from "./audit"

// Web Crypto API is available globally in Convex
const webcrypto = crypto

/**
 * Convert hex string to Uint8Array
 * (Replacement for Buffer.from(hex, 'hex') in Convex)
 */
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

/**
 * Get the master encryption key from environment variables
 * 
 * @throws Error if ENCRYPTION_MASTER_KEY is not set
 */
function getMasterKey(): string {
  const key = process.env.ENCRYPTION_MASTER_KEY
  if (!key) {
    throw new Error(
      "ENCRYPTION_MASTER_KEY not set. " +
      "Generate with: node scripts/generate-encryption-key.js " +
      "Then add to Convex dashboard environment variables."
    )
  }
  
  // Validate key format (64-char hex = 256 bits)
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error(
      "ENCRYPTION_MASTER_KEY must be 64-character hexadecimal string (256 bits). " +
      "Generate with: node scripts/generate-encryption-key.js"
    )
  }
  
  return key
}

/**
 * Encrypt an API key using AES-256-GCM
 * 
 * Format: [IV (12 bytes)][Ciphertext (variable)]
 * 
 * @param plaintext - The API key to encrypt
 * @returns Encrypted bytes (ArrayBuffer) - IV + ciphertext (for Convex v.bytes())
 * 
 * @example
 * ```typescript
 * const encrypted = await encryptApiKey("my-api-key-123")
 * await ctx.db.insert("docks", { encryptedApiKey: encrypted })
 * ```
 */
export async function encryptApiKey(plaintext: string): Promise<ArrayBuffer> {
  if (!plaintext || plaintext.length === 0) {
    throw new Error("Cannot encrypt empty string")
  }
  
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  
  // Generate random 96-bit IV (12 bytes) for GCM mode
  const iv = webcrypto.getRandomValues(new Uint8Array(12))
  
  // Import master key from hex string
  const masterKey = getMasterKey()
  // Convert hex string to Uint8Array (Convex doesn't have Buffer)
  const keyData = hexToUint8Array(masterKey)
  const key = await webcrypto.subtle.importKey(
    'raw',
    keyData.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  
  // Encrypt with authenticated encryption (GCM provides authenticity)
  const encrypted = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  
  // Combine IV + ciphertext (IV needed for decryption)
  // Format: [IV (12 bytes)][Ciphertext (variable length)]
  const result = new Uint8Array(iv.length + encrypted.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(encrypted), iv.length)
  
  // Return ArrayBuffer for Convex v.bytes()
  return result.buffer
}

/**
 * Decrypt an API key that was encrypted with encryptApiKey
 * 
 * @param encrypted - Encrypted bytes (ArrayBuffer) - IV + ciphertext (from Convex v.bytes())
 * @param ctx - Optional Convex context for audit logging
 * @param auditMetadata - Optional metadata for audit logging (dockId, orgId)
 * @returns Decrypted API key string
 * 
 * @throws Error if decryption fails (wrong key, corrupted data, etc.)
 * 
 * @example
 * ```typescript
 * // Without audit logging (backward compatible)
 * const apiKey = await decryptApiKey(dock.encryptedApiKey)
 * 
 * // With audit logging (recommended)
 * const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
 *   dockId: dock._id,
 *   orgId: dock.orgId,
 * })
 * ```
 */
export async function decryptApiKey(
  encrypted: ArrayBuffer,
  ctx?: any, // MutationCtx | QueryCtx, but using any for backward compatibility
  auditMetadata?: { dockId?: any; orgId?: any } // Id types, but using any for backward compatibility
): Promise<string> {
  // Convert ArrayBuffer to Uint8Array for easier manipulation
  const encryptedUint8 = new Uint8Array(encrypted)
  
  if (!encryptedUint8 || encryptedUint8.length < 13) {
    throw new Error("Invalid encrypted data: too short (needs IV + at least 1 byte ciphertext)")
  }
  
  // Extract IV (first 12 bytes) and ciphertext (rest)
  const iv = encryptedUint8.slice(0, 12)
  const ciphertext = encryptedUint8.slice(12)
  
  if (ciphertext.length === 0) {
    throw new Error("Invalid encrypted data: no ciphertext found")
  }
  
  // Import master key from hex string
  const masterKey = getMasterKey()
  // Convert hex string to Uint8Array (Convex doesn't have Buffer)
  const keyData = hexToUint8Array(masterKey)
  const key = await webcrypto.subtle.importKey(
    'raw',
    keyData.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  
  // Decrypt with authenticated encryption
  // GCM mode will throw if data was tampered with
  let decrypted: ArrayBuffer
  let decryptionError: Error | null = null
  try {
    decrypted = await webcrypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )
  } catch (error) {
    decryptionError = new Error(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      "This usually means the encryption key is incorrect or the data is corrupted."
    )
    
    // Log audit entry for failed decryption (if ctx provided)
    if (ctx) {
      try {
        await auditLog(
          ctx,
          "credential.decrypt",
          "error",
          {
            dockId: auditMetadata?.dockId,
            orgId: auditMetadata?.orgId,
            errorMessage: decryptionError.message,
          }
        )
      } catch (auditError) {
        // Audit logging failure shouldn't break decryption error handling
        console.error("[Encryption] Failed to log audit entry:", auditError)
      }
    }
    
    throw decryptionError
  }
  
  const decoder = new TextDecoder()
  const decryptedKey = decoder.decode(decrypted)
  
  // Log audit entry for successful decryption (if ctx provided)
  if (ctx) {
    try {
      await auditLog(
        ctx,
        "credential.decrypt",
        "success",
        {
          dockId: auditMetadata?.dockId,
          orgId: auditMetadata?.orgId,
        }
      )
    } catch (auditError) {
      // Audit logging failure shouldn't break decryption
      // Log to console but don't throw
      console.error("[Encryption] Failed to log audit entry:", auditError)
    }
  }
  
  return decryptedKey
}
