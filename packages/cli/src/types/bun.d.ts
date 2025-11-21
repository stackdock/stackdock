/**
 * Bun global type declarations
 * 
 * These types are available when running under Bun runtime
 */

declare global {
  // eslint-disable-next-line no-var
  var Bun: {
    version: string
    // Add other Bun APIs as needed
  } | undefined
}

export {}
