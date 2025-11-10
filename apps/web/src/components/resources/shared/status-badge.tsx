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
  // Use shadcn design tokens - black/white theme
  // Status-specific styling using CSS variables
  const statusStyles: Record<string, string> = {
    running: "bg-muted/50 text-foreground border-border capitalize",
    active: "bg-muted/50 text-foreground border-border capitalize",
    stopped: "bg-muted/30 text-muted-foreground border-border capitalize",
    inactive: "bg-muted/30 text-muted-foreground border-border capitalize",
    pending: "bg-muted/40 text-muted-foreground border-border capitalize",
    provisioning: "bg-muted/40 text-muted-foreground border-border capitalize",
    suspended: "bg-destructive/10 text-destructive border-destructive/20 capitalize",
    error: "bg-destructive/10 text-destructive border-destructive/20 capitalize",
    failed: "bg-destructive/10 text-destructive border-destructive/20 capitalize",
  }
  
  return (
    <Badge 
      variant="outline"
      className={cn(statusStyles[status] || "bg-muted/30 text-muted-foreground border-border capitalize", className)}
    >
      {status}
    </Badge>
  )
}
