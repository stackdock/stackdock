/**
 * Provider Badge Component
 * 
 * Color-coded badge for displaying cloud providers with brand colors
 */

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface ProviderBadgeProps {
  provider: string | string[] // Support single or multiple providers
  className?: string
}

// Map provider names to their brand color CSS variables (for border color)
const providerBorderColors: Record<string, string> = {
  gridpane: "var(--provider-gridpane)",
  vercel: "var(--provider-vercel)",
  netlify: "var(--provider-netlify)",
  cloudflare: "var(--provider-cloudflare)",
  turso: "var(--provider-turso)",
  neon: "var(--provider-neon)",
  convex: "var(--provider-convex)",
  planetscale: "var(--provider-planetscale)",
  vultr: "var(--provider-vultr)",
  digitalocean: "var(--provider-digitalocean)",
  linode: "var(--provider-linode)",
  hetzner: "var(--provider-hetzner)",
  github: "var(--provider-github)",
  coolify: "var(--provider-coolify)",
  betterstack: "var(--provider-betterstack)",
  "better-stack": "var(--provider-betterstack)", // Handle hyphenated version
  sentry: "var(--provider-sentry)",
}

// Map provider names to their display names (with proper capitalization)
const providerDisplayNames: Record<string, string> = {
  gridpane: "GridPane",
  vercel: "Vercel",
  netlify: "Netlify",
  cloudflare: "Cloudflare",
  turso: "Turso",
  neon: "Neon",
  convex: "Convex",
  planetscale: "PlanetScale",
  vultr: "Vultr",
  digitalocean: "DigitalOcean",
  linode: "Linode",
  hetzner: "Hetzner",
  github: "GitHub",
  coolify: "Coolify",
  betterstack: "BetterStack",
  "better-stack": "BetterStack", // Handle hyphenated version
  sentry: "Sentry",
}

/**
 * Format provider name with proper capitalization
 */
function formatProviderName(provider: string): string {
  const normalized = provider.toLowerCase()
  
  // Check if we have a specific display name
  if (providerDisplayNames[normalized]) {
    return providerDisplayNames[normalized]
  }
  
  // Fallback: capitalize first letter
  return provider.charAt(0).toUpperCase() + provider.slice(1)
}

export function ProviderBadge({ provider, className }: ProviderBadgeProps) {
  // Handle multiple providers
  const providers = Array.isArray(provider) ? provider : [provider]
  
  // If multiple providers, show multiple badges with "+" separator
  if (providers.length > 1) {
    return (
      <div className={cn("flex items-center gap-1 flex-wrap", className)}>
        {providers.map((p, index) => {
          const normalizedProvider = p.toLowerCase()
          const borderColor = providerBorderColors[normalizedProvider]
          const displayName = formatProviderName(p)
          
          return (
            <React.Fragment key={index}>
              {borderColor ? (
                <Badge 
                  variant="outline" 
                  className="text-foreground"
                  style={{ borderColor: borderColor }}
                >
                  {displayName}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-foreground">
                  {displayName}
                </Badge>
              )}
              {index < providers.length - 1 && (
                <span className="text-muted-foreground text-xs mx-0.5">+</span>
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }
  
  // Single provider (original behavior)
  const normalizedProvider = providers[0]?.toLowerCase() || ""
  const borderColor = providerBorderColors[normalizedProvider]
  const displayName = formatProviderName(providers[0] || "")
  
  if (borderColor) {
    return (
      <Badge 
        variant="outline" 
        className={cn("text-foreground", className)}
        style={{ borderColor: borderColor }}
      >
        {displayName}
      </Badge>
    )
  }
  
  // Fallback to neutral styling for unknown providers
  return (
    <Badge variant="outline" className={cn("text-foreground", className)}>
      {displayName}
    </Badge>
  )
}
