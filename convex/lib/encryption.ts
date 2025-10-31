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
 * @see docs/architecture/SECURITY.md for full security documentation
 */

import { webcrypto } from "crypto"

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
 * @returns Encrypted bytes (Uint8Array) - IV + ciphertext
 * 
 * @example
 * ```typescript
 * const encrypted = await encryptApiKey("my-api-key-123")
 * await ctx.db.insert("docks", { encryptedApiKey: encrypted })
 * ```
 */
export async function encryptApiKey(plaintext: string): Promise<Uint8Array> {
  if (!plaintext || plaintext.length === 0) {
    throw new Error("Cannot encrypt empty string")
  }
  
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  
  // Generate random 96-bit IV (12 bytes) for GCM mode
  const iv = webcrypto.getRandomValues(new Uint8Array(12))
  
  // Import master key from hex string
  const masterKey = getMasterKey()
  const keyData = Buffer.from(masterKey, 'hex')
  const key = await webcrypto.subtle.importKey(
    'raw',
    keyData,
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
  
  return result
}

/**
 * Decrypt an API key that was encrypted with encryptApiKey
 * 
 * @param encrypted - Encrypted bytes (Uint8Array) - IV + ciphertext
 * @returns Decrypted API key string
 * 
 * @throws Error if decryption fails (wrong key, corrupted data, etc.)
 * 
 * @example
 * ```typescript
 * const dock = await ctx.db.get(dockId)
 * const apiKey = await decryptApiKey(dock.encryptedApiKey)
 * // Use apiKey to call provider API
 * ```
 */
export async function decryptApiKey(encrypted: Uint8Array): Promise<string> {
  if (!encrypted || encrypted.length < 13) {
    throw new Error("Invalid encrypted data: too short (needs IV + at least 1 byte ciphertext)")
  }
  
  // Extract IV (first 12 bytes) and ciphertext (rest)
  const iv = encrypted.slice(0, 12)
  const ciphertext = encrypted.slice(12)
  
  if (ciphertext.length === 0) {
    throw new Error("Invalid encrypted data: no ciphertext found")
  }
  
  // Import master key from hex string
  const masterKey = getMasterKey()
  const keyData = Buffer.from(masterKey, 'hex')
  const key = await webcrypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  
  // Decrypt with authenticated encryption
  // GCM mode will throw if data was tampered with
  let decrypted: ArrayBuffer
  try {
    decrypted = await webcrypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      "This usually means the encryption key is incorrect or the data is corrupted."
    )
  }
  
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

