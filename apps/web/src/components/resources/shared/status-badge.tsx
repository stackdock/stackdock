/**
 * Status Badge Component
 * 
 * Color-coded badge for displaying resource status
 */

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusColors: Record<string, string> = {
    running: "bg-green-500 text-green-50",
    active: "bg-green-500 text-green-50",
    stopped: "bg-muted-foreground/60 text-primary-foreground",
    inactive: "bg-muted-foreground/60 text-primary-foreground",
    pending: "bg-yellow-500 text-yellow-50",
    provisioning: "bg-yellow-500 text-yellow-50",
    error: "",
    failed: "",
  }
  
  const isError = status === "error" || status === "failed"
  
  return (
    <Badge 
      variant={isError ? "destructive" : "default"}
      className={cn(!isError && statusColors[status], className)}
    >
      {status}
    </Badge>
  )
}
