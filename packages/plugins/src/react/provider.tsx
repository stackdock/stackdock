/**
 * React provider for StackDock plugins
 */

import { createContext, useContext, type ReactNode } from "react"
import type { PluginStackConfig } from "../core/types"
import type { createPluginStack } from "../core/registry"

interface PluginStackContextValue {
  config: PluginStackConfig
}

const PluginStackContext = createContext<PluginStackContextValue | null>(null)

/**
 * Provider component for StackDock plugins
 * 
 * Usage:
 * ```typescript
 * import { PluginStackProvider } from "@stackdock/plugins/react"
 * 
 * <PluginStackProvider stack={clientStack}>
 *   {children}
 * </PluginStackProvider>
 * ```
 */
export function PluginStackProvider({
  stack,
  children
}: {
  stack: ReturnType<typeof createPluginStack>
  children: ReactNode
}) {
  return (
    <PluginStackContext.Provider value={{ config: stack.config }}>
      {children}
    </PluginStackContext.Provider>
  )
}

/**
 * Hook to access plugin stack context
 */
export function usePluginStack() {
  const context = useContext(PluginStackContext)
  if (!context) {
    throw new Error("usePluginStack must be used within PluginStackProvider")
  }
  return context
}
