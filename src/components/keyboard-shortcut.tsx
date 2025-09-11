"use client"

import { useOperatingSystem } from "@/hooks/use-operating-system"

interface KeyboardShortcutProps {
  keys: string[]
  className?: string
}

export function KeyboardShortcut({ keys, className = "" }: KeyboardShortcutProps) {
  const { modifierKey, isMounted } = useOperatingSystem()

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <kbd className={`px-1.5 py-0.5 text-xs bg-muted rounded font-mono ${className}`}>
        <span className="text-xs">⌘</span>K
      </kbd>
    )
  }

  return (
    <kbd className={`px-1.5 py-0.5 text-xs bg-muted rounded font-mono ${className}`}>
      {keys.map((key, index) => (
        <span key={index}>
          {key === 'mod' ? (
            <span className="text-xs">{modifierKey}</span>
          ) : (
            key
          )}
          {index < keys.length - 1 && <span className="mx-0.5">+</span>}
        </span>
      ))}
    </kbd>
  )
}
