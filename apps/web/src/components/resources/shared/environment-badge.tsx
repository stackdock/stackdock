/**
 * Environment Badge Component
 * 
 * Color-coded badge for displaying environment (production, staging, development)
 */

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface EnvironmentBadgeProps {
  environment?: string
  className?: string
}

export function EnvironmentBadge({ environment, className }: EnvironmentBadgeProps) {
  if (!environment) return null
  
  // Use shadcn design tokens - black/white theme
  // All environments use neutral styling with slight variations
  const environmentStyles: Record<string, string> = {
    production: "bg-muted text-muted-foreground",
    staging: "bg-muted/50 text-muted-foreground",
    development: "bg-muted/30 text-muted-foreground",
  }
  
  return (
    <Badge variant="outline" className={cn(environmentStyles[environment] || "bg-muted/30 text-muted-foreground", className)}>
      {environment}
    </Badge>
  )
}
