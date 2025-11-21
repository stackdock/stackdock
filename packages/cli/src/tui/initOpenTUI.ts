/**
 * OpenTUI Initialization Helper
 * 
 * Checks if OpenTUI can be initialized and provides initialization utilities
 */

import type { ReactElement } from 'react'

/**
 * Check if Bun is available (required for OpenTUI)
 * 
 * @returns true if running under Bun or Bun is available, false otherwise
 */
export async function checkBunAvailable(): Promise<boolean> {
  // Check if we're already running under Bun (Bun global is available)
  // @ts-ignore - Bun global may not be in TypeScript types
  if (typeof globalThis.Bun !== 'undefined' || typeof Bun !== 'undefined') {
    return true
  }
  
  // Fallback: try to check if bun command is available
  try {
    const { execSync } = await import('child_process')
    execSync('bun --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Check if Zig is available (required for OpenTUI)
 * 
 * @returns true if Zig appears to be installed, false otherwise
 */
export async function checkZigAvailable(): Promise<boolean> {
  try {
    const { execSync } = await import('child_process')
    execSync('zig version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Initialize and render TUI app using OpenTUI
 * 
 * @param appComponent - React component to render
 * @returns true if rendering succeeded, false otherwise
 */
export async function initializeAndRenderTUI(appComponent: ReactElement): Promise<boolean> {
  try {
    // Check if Bun is available (required for OpenTUI WASM support)
    const bunAvailable = await checkBunAvailable()
    
    if (!bunAvailable) {
      // Only show warning if we're not already in text mode (--no-tui flag)
      // This prevents duplicate warnings when falling back
      if (!process.argv.includes('--no-tui')) {
        console.warn('⚠️  Bun not found. Bun is required for TUI mode.')
        console.warn('   Install Bun: https://bun.sh/docs/installation')
        console.warn('   Windows: powershell -c "irm bun.sh/install.ps1 | iex"')
        console.warn('   Falling back to text mode...\n')
      }
      return false
    }

    // Check if Zig is available (required for OpenTUI)
    const zigAvailable = await checkZigAvailable()
    
    if (!zigAvailable) {
      console.warn('⚠️  Zig not found. TUI mode may not work properly.')
      console.warn('   Install Zig: https://ziglang.org/download/')
      console.warn('   Falling back to text mode...\n')
      return false
    }

    // Import OpenTUI core and react
    const opentuiCore = await import('@opentui/core')
    const opentuiReact = await import('@opentui/react')
    
    if (!opentuiCore || typeof opentuiCore.createCliRenderer !== 'function') {
      console.warn('⚠️  OpenTUI core not available')
      return false
    }

    if (!opentuiReact || typeof opentuiReact.createRoot !== 'function') {
      console.warn('⚠️  OpenTUI React reconciler not available')
      return false
    }

    // Create CLI renderer from OpenTUI core
    const renderer = await opentuiCore.createCliRenderer()
    
    // Create React root with the renderer
    const root = opentuiReact.createRoot(renderer)
    
    // Render the app component to the terminal
    root.render(appComponent)
    
    return true
  } catch (error) {
    // OpenTUI not available or failed to initialize
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn('⚠️  OpenTUI initialization failed:', errorMessage)
    return false
  }
}
