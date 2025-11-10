/**
 * Provider Badge Component
 * 
 * Color-coded badge for displaying cloud providers
 */

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface ProviderBadgeProps {
  provider: string
  className?: string
}

export function ProviderBadge({ provider, className }: ProviderBadgeProps) {
  // Use shadcn design tokens - black/white theme
  // All providers use the same neutral styling
  return (
    <Badge variant="outline" className={cn("bg-muted text-muted-foreground", className)}>
      {provider}
    </Badge>
  )
}
