"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface OperatingSystemContextType {
  os: 'mac' | 'windows' | 'linux' | 'unknown'
  isMac: boolean
  isWindows: boolean
  isLinux: boolean
  modifierKey: string
  modifierText: string
  isMounted: boolean
}

const OperatingSystemContext = createContext<OperatingSystemContextType | undefined>(undefined)

export function OperatingSystemProvider({ children }: { children: ReactNode }) {
  const [os, setOs] = useState<'mac' | 'windows' | 'linux' | 'unknown'>('unknown')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Only run detection once when the provider mounts
    const userAgent = window.navigator.userAgent.toLowerCase()
    const platform = window.navigator.platform.toLowerCase()
    
    if (platform.includes('mac') || userAgent.includes('mac')) {
      setOs('mac')
    } else if (platform.includes('win') || userAgent.includes('windows')) {
      setOs('windows')
    } else if (platform.includes('linux') || userAgent.includes('linux')) {
      setOs('linux')
    } else {
      // Fallback detection
      const isMac = /macintosh|mac os x/i.test(userAgent)
      const isWindows = /windows|win32|win64/i.test(userAgent)
      const isLinux = /linux/i.test(userAgent)
      
      if (isMac) setOs('mac')
      else if (isWindows) setOs('windows')
      else if (isLinux) setOs('linux')
      else setOs('unknown')
    }
    
    setIsMounted(true)
  }, []) // Empty dependency array - only run once

  const isMac = os === 'mac'
  const isWindows = os === 'windows'
  const isLinux = os === 'linux'
  
  const modifierKey = isMac ? '⌘' : 'Ctrl'
  const modifierText = isMac ? 'Cmd' : 'Ctrl'

  const value = {
    os,
    isMac,
    isWindows,
    isLinux,
    modifierKey,
    modifierText,
    isMounted
  }

  return (
    <OperatingSystemContext.Provider value={value}>
      {children}
    </OperatingSystemContext.Provider>
  )
}

export function useOperatingSystem() {
  const context = useContext(OperatingSystemContext)
  if (context === undefined) {
    throw new Error('useOperatingSystem must be used within an OperatingSystemProvider')
  }
  return context
}
