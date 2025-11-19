/**
 * Encryption Type Enforcement
 * 
 * Branded types for API keys to prevent accidental exposure of plaintext
 * or misuse of encrypted data.
 * 
 * ## What are Branded Types?
 * 
 * Branded types (also called phantom types or nominal types) add a compile-time
 * marker to a base type to make it incompatible with other values of the same
 * base type. This prevents accidental misuse.
 * 
 * ## Usage
 * 
 * ```typescript
 * // ❌ BAD: Using raw strings
 * const apiKey: string = "secret-key-123"
 * await ctx.db.insert("docks", { encryptedApiKey: apiKey }) // Oops! Plaintext stored!
 * 
 * // ✅ GOOD: Using branded types
 * const plaintext: PlaintextApiKey = "secret-key-123" as PlaintextApiKey
 * const encrypted: EncryptedApiKey = await encryptApiKey(plaintext)
 * await ctx.db.insert("docks", { encryptedApiKey: encrypted }) // Type-safe!
 * ```
 * 
 * ## Security Benefits
 * 
 * 1. **Compile-time safety**: TypeScript catches misuse before runtime
 * 2. **Self-documenting**: Types make it clear what's encrypted vs plaintext
 * 3. **Forced conversions**: Must use encryption functions to convert types
 * 4. **IDE support**: Better autocomplete and error messages
 * 
 * @see https://basarat.gitbook.io/typescript/main-1/nominaltyping
 */

/**
 * Plaintext API key (unencrypted)
 * 
 * **Security**: This type should only exist:
 * - When receiving input from user
 * - Before calling encryptApiKey()
 * - After calling decryptApiKey()
 * - NEVER stored in database
 * - NEVER sent to client
 * - NEVER logged
 * 
 * @example
 * ```typescript
 * // Receive from user input
 * const plaintext = args.apiKey as PlaintextApiKey
 * 
 * // Encrypt immediately
 * const encrypted = await encryptApiKey(plaintext)
 * 
 * // Store encrypted version only
 * await ctx.db.insert("docks", { encryptedApiKey: encrypted })
 * ```
 */
export type PlaintextApiKey = string & { readonly __brand: 'PlaintextApiKey' }

/**
 * Encrypted API key (ciphertext)
 * 
 * **Security**: This type should:
 * - Be stored in database (v.bytes())
 * - Be the result of encryptApiKey()
 * - Be the input to decryptApiKey()
 * - NEVER be sent to client
 * - Safe to log (no plaintext revealed)
 * 
 * Note: In Convex, this is stored as ArrayBuffer (v.bytes())
 * 
 * @example
 * ```typescript
 * // Decrypt for use
 * const encrypted: EncryptedApiKey = dock.encryptedApiKey
 * const plaintext = await decryptApiKey(encrypted)
 * 
 * // Use plaintext (server-side only)
 * await fetch(providerApi, { headers: { Authorization: plaintext } })
 * ```
 */
export type EncryptedApiKey = ArrayBuffer & { readonly __brand: 'EncryptedApiKey' }

/**
 * Type guard: Check if a value is a PlaintextApiKey
 * 
 * Note: This is a compile-time type, so at runtime it's just a string.
 * This function is mainly for documentation and explicit intent.
 * 
 * @param value - Value to check
 * @returns Always true at runtime (type guard for TypeScript)
 */
export function isPlaintextApiKey(value: string): value is PlaintextApiKey {
  // At runtime, PlaintextApiKey is just a string
  // This is a type guard for compile-time safety only
  return typeof value === 'string'
}

/**
 * Type guard: Check if a value is an EncryptedApiKey
 * 
 * Note: This is a compile-time type, so at runtime it's just an ArrayBuffer.
 * This function is mainly for documentation and explicit intent.
 * 
 * @param value - Value to check
 * @returns Always true at runtime (type guard for TypeScript)
 */
export function isEncryptedApiKey(value: ArrayBuffer): value is EncryptedApiKey {
  // At runtime, EncryptedApiKey is just an ArrayBuffer
  // This is a type guard for compile-time safety only
  return value instanceof ArrayBuffer
}

/**
 * Convert a raw string to PlaintextApiKey
 * 
 * Use this when receiving API keys from user input, environment variables,
 * or other untrusted sources.
 * 
 * **Warning**: This does NOT validate or sanitize the input. It only
 * adds the type brand for compile-time safety.
 * 
 * @param apiKey - Raw API key string
 * @returns Branded PlaintextApiKey
 * 
 * @example
 * ```typescript
 * // From user input
 * const plaintext = toPlaintextApiKey(args.apiKey)
 * const encrypted = await encryptApiKey(plaintext)
 * 
 * // From environment variable
 * const envKey = toPlaintextApiKey(process.env.API_KEY!)
 * ```
 */
export function toPlaintextApiKey(apiKey: string): PlaintextApiKey {
  return apiKey as PlaintextApiKey
}

/**
 * Convert an ArrayBuffer to EncryptedApiKey
 * 
 * Use this when reading encrypted data from the database.
 * 
 * **Security**: This assumes the data is already encrypted.
 * Do NOT use this to "convert" plaintext to encrypted - use encryptApiKey() instead.
 * 
 * @param encrypted - Encrypted ArrayBuffer from database
 * @returns Branded EncryptedApiKey
 * 
 * @example
 * ```typescript
 * // From database
 * const dock = await ctx.db.get(dockId)
 * const encrypted = toEncryptedApiKey(dock.encryptedApiKey)
 * const plaintext = await decryptApiKey(encrypted)
 * ```
 */
export function toEncryptedApiKey(encrypted: ArrayBuffer): EncryptedApiKey {
  return encrypted as EncryptedApiKey
}

/**
 * Convert PlaintextApiKey to raw string
 * 
 * Use this when you need to use the plaintext key (e.g., API calls).
 * 
 * **Security**: Only use this in server-side code, never expose to client.
 * 
 * @param plaintext - Branded PlaintextApiKey
 * @returns Raw string
 * 
 * @example
 * ```typescript
 * const plaintext = await decryptApiKey(encrypted)
 * const apiKey = fromPlaintextApiKey(plaintext)
 * 
 * // Use in API call (server-side only)
 * await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
 * ```
 */
export function fromPlaintextApiKey(plaintext: PlaintextApiKey): string {
  return plaintext as string
}

/**
 * Convert EncryptedApiKey to raw ArrayBuffer
 * 
 * Use this when you need to store the encrypted data in the database.
 * 
 * @param encrypted - Branded EncryptedApiKey
 * @returns Raw ArrayBuffer
 * 
 * @example
 * ```typescript
 * const encrypted = await encryptApiKey(plaintext)
 * const buffer = fromEncryptedApiKey(encrypted)
 * 
 * // Store in database
 * await ctx.db.insert("docks", { encryptedApiKey: buffer })
 * ```
 */
export function fromEncryptedApiKey(encrypted: EncryptedApiKey): ArrayBuffer {
  return encrypted as ArrayBuffer
}
