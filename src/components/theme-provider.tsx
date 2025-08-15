"use client"

import { createContext, useContext, useEffect, useState, useTransition } from "react"
import { updateTheme as updateThemeAction } from "@/app/actions/theme"
import type { Theme } from "@/lib/theme"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isPending: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme: Theme
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if client-side theme differs from server default
    const storedTheme = localStorage.getItem('stackdock-theme') as Theme
    if (storedTheme && storedTheme !== defaultTheme) {
      setThemeState(storedTheme)
    }
  }, [defaultTheme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    
    // Update DOM immediately for instant feedback
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(newTheme)
    }

    // Update localStorage immediately
    localStorage.setItem('stackdock-theme', newTheme)

    // Update server-side cookie
    startTransition(async () => {
      await updateThemeAction(newTheme)
    })
  }

  // Listen for system theme changes when theme is "system"
  useEffect(() => {
    if (!mounted || theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      const effectiveTheme = mediaQuery.matches ? 'dark' : 'light'
      root.classList.add(effectiveTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  const value = {
    theme,
    setTheme,
    isPending,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
