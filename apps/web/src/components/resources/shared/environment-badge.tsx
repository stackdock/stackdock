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
  
  const colors: Record<string, string> = {
    production: "bg-blue-500 text-blue-50",
    staging: "bg-yellow-500 text-yellow-50",
    development: "bg-gray-500 text-gray-50",
  }
  
  return (
    <Badge className={cn(colors[environment] || "bg-gray-500 text-gray-50", className)}>
      {environment}
    </Badge>
  )
}
