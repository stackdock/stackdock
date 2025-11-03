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
  const colors: Record<string, string> = {
    gridpane: "bg-purple-500 text-purple-50",
    vercel: "bg-black text-white",
    aws: "bg-orange-500 text-orange-50",
    vultr: "bg-blue-500 text-blue-50",
    digitalocean: "bg-blue-600 text-blue-50",
    cloudflare: "bg-orange-600 text-orange-50",
    netlify: "bg-teal-500 text-teal-50",
    "aws-rds": "bg-orange-500 text-orange-50",
    "digitalocean-db": "bg-blue-600 text-blue-50",
    planetscale: "bg-gray-900 text-white",
  }
  
  return (
    <Badge className={cn(colors[provider] || "bg-gray-500 text-gray-50", className)}>
      {provider}
    </Badge>
  )
}
