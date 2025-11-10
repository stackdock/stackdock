import * as React from "react"
import { cn } from "@/lib/utils"

export function SkipLink({ href = "#content", children = "Skip to main content" }: { href?: string; children?: React.ReactNode }) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]",
        "focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground",
        "focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
    >
      {children}
    </a>
  )
}
