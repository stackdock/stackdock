# Provider-Aware Sync Intervals & Rate Limit Logging

**Date**: November 16, 2025  
**Status**: Ready for Implementation  
**Priority**: High  
**Estimated Time**: 3-4 hours

## Overview

Implement provider-aware sync intervals with recommended minimums, comprehensive rate limit logging, and UI controls for developers to configure sync intervals per dock.

## Goals

1. **Provider-Aware Defaults**: Set appropriate sync intervals based on provider rate limits
2. **Rate Limit Logging**: Log all rate limit headers for future analysis
3. **UI Configuration**: Allow developers to set sync intervals in the UI with minimum enforcement

---

## Phase 1: Provider-Aware Sync Interval Configuration

### 1.1 Create Provider Sync Interval Configuration

**File**: `convex/docks/sync-intervals.ts` (NEW)

Create a utility file that defines recommended sync intervals per provider:

```typescript
/**
 * Provider Sync Interval Configuration
 * 
 * Defines recommended minimum sync intervals based on provider API rate limits.
 * These are conservative defaults that respect rate limits while maintaining
 * reasonable data freshness.
 */

export interface ProviderSyncConfig {
  /** Recommended minimum interval in seconds */
  recommendedInterval: number
  /** Absolute minimum allowed interval in seconds */
  absoluteMinimum: number
  /** Reason for the interval (rate limit info) */
  reason: string
}

/**
 * Provider-specific sync interval configurations
 * 
 * Based on documented API rate limits:
 * - GridPane: 12/min per endpoint (very strict)
 * - Vercel: 100/hour (~1.67/min)
 * - DigitalOcean: 5000/hour (~83/min)
 * - Cloudflare: 1200/5min (~240/min)
 * - GitHub: 5000/hour authenticated (~83/min)
 * - Linode: ~3000/hour (~50/min)
 */
export const PROVIDER_SYNC_INTERVALS: Record<string, ProviderSyncConfig> = {
  gridpane: {
    recommendedInterval: 300, // 5 minutes (very strict: 12/min per endpoint)
    absoluteMinimum: 60, // 1 minute absolute minimum
    reason: "GridPane has strict rate limits: 12 requests/min per endpoint",
  },
  vercel: {
    recommendedInterval: 180, // 3 minutes (100/hour limit)
    absoluteMinimum: 60,
    reason: "Vercel rate limit: 100 requests/hour",
  },
  netlify: {
    recommendedInterval: 180, // 3 minutes (similar to Vercel)
    absoluteMinimum: 60,
    reason: "Netlify rate limit: ~100 requests/hour",
  },
  cloudflare: {
    recommendedInterval: 120, // 2 minutes (1200/5min = 240/min)
    absoluteMinimum: 60,
    reason: "Cloudflare rate limit: 1200 requests/5 minutes",
  },
  github: {
    recommendedInterval: 120, // 2 minutes (5000/hour authenticated)
    absoluteMinimum: 60,
    reason: "GitHub rate limit: 5000 requests/hour (authenticated)",
  },
  linode: {
    recommendedInterval: 120, // 2 minutes (~3000/hour)
    absoluteMinimum: 60,
    reason: "Linode rate limit: ~3000 requests/hour",
  },
  digitalocean: {
    recommendedInterval: 120, // 2 minutes (5000/hour)
    absoluteMinimum: 60,
    reason: "DigitalOcean rate limit: 5000 requests/hour",
  },
  vultr: {
    recommendedInterval: 120, // 2 minutes (similar to DO)
    absoluteMinimum: 60,
    reason: "Vultr rate limit: ~5000 requests/hour",
  },
  hetzner: {
    recommendedInterval: 120, // 2 minutes
    absoluteMinimum: 60,
    reason: "Hetzner rate limit: ~5000 requests/hour",
  },
  turso: {
    recommendedInterval: 180, // 3 minutes (conservative for DBaaS)
    absoluteMinimum: 60,
    reason: "Turso rate limit: Conservative 3-minute interval",
  },
  neon: {
    recommendedInterval: 180, // 3 minutes (conservative for DBaaS)
    absoluteMinimum: 60,
    reason: "Neon rate limit: Conservative 3-minute interval",
  },
  convex: {
    recommendedInterval: 180, // 3 minutes (conservative for DBaaS)
    absoluteMinimum: 60,
    reason: "Convex rate limit: Conservative 3-minute interval",
  },
  planetscale: {
    recommendedInterval: 180, // 3 minutes (conservative for DBaaS)
    absoluteMinimum: 60,
    reason: "PlanetScale rate limit: Conservative 3-minute interval",
  },
  coolify: {
    recommendedInterval: 120, // 2 minutes
    absoluteMinimum: 60,
    reason: "Coolify rate limit: ~5000 requests/hour",
  },
}

/**
 * Get recommended sync interval for a provider
 */
export function getRecommendedSyncInterval(provider: string): number {
  return PROVIDER_SYNC_INTERVALS[provider]?.recommendedInterval || 120 // Default: 2 minutes
}

/**
 * Get absolute minimum sync interval for a provider
 */
export function getAbsoluteMinimumSyncInterval(provider: string): number {
  return PROVIDER_SYNC_INTERVALS[provider]?.absoluteMinimum || 60 // Default: 1 minute
}

/**
 * Get sync config for a provider
 */
export function getProviderSyncConfig(provider: string): ProviderSyncConfig {
  return PROVIDER_SYNC_INTERVALS[provider] || {
    recommendedInterval: 120,
    absoluteMinimum: 60,
    reason: "Default sync interval: 2 minutes",
  }
}

/**
 * Validate sync interval against provider minimums
 */
export function validateSyncInterval(
  provider: string,
  intervalSeconds: number
): { valid: boolean; error?: string; recommended?: number } {
  const config = getProviderSyncConfig(provider)
  
  if (intervalSeconds < config.absoluteMinimum) {
    return {
      valid: false,
      error: `Sync interval must be at least ${config.absoluteMinimum} seconds for ${provider}`,
      recommended: config.recommendedInterval,
    }
  }
  
  if (intervalSeconds < config.recommendedInterval) {
    return {
      valid: true,
      error: `Recommended minimum is ${config.recommendedInterval} seconds for ${provider}. ${config.reason}`,
      recommended: config.recommendedInterval,
    }
  }
  
  return { valid: true }
}
```

### 1.2 Update createDock Mutation

**File**: `convex/docks/mutations.ts`

Update `createDock` to use provider-aware defaults:

```typescript
import { getRecommendedSyncInterval } from "./sync-intervals"

// In createDock handler:
const syncConfig = {
  enabled: true,
  intervalSeconds: getRecommendedSyncInterval(args.provider),
  consecutiveFailures: 0,
}
```

### 1.3 Create updateSyncInterval Mutation

**File**: `convex/docks/mutations.ts`

Add mutation to update sync interval with validation:

```typescript
/**
 * Update sync interval for a dock
 * 
 * Enforces provider-specific minimum intervals.
 */
export const updateSyncInterval = mutation({
  args: {
    dockId: v.id("docks"),
    intervalSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      throw new ConvexError("Dock not found")
    }
    
    // Verify permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      dock.orgId,
      "docks:full"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied: Only organization owners can update dock settings")
    }
    
    // Validate interval against provider minimums
    const validation = validateSyncInterval(dock.provider, args.intervalSeconds)
    if (!validation.valid) {
      throw new ConvexError(validation.error || "Invalid sync interval")
    }
    
    // Update sync config
    const syncConfig = dock.syncConfig || {
      enabled: true,
      intervalSeconds: getRecommendedSyncInterval(dock.provider),
      consecutiveFailures: 0,
    }
    
    syncConfig.intervalSeconds = args.intervalSeconds
    
    await ctx.db.patch(args.dockId, {
      syncConfig,
      updatedAt: Date.now(),
    })
    
    return { success: true, warning: validation.error }
  },
})
```

---

## Phase 2: Comprehensive Rate Limit Logging

### 2.1 Update Rate Limit Info Storage

**File**: `convex/docks/mutations.ts`

Enhance `updateRateLimitInfo` to log more details:

```typescript
/**
 * Internal mutation: Update rate limit info for a dock
 * 
 * Logs rate limit headers for analysis and future optimization.
 */
export const updateRateLimitInfo = internalMutation({
  args: {
    dockId: v.id("docks"),
    rateLimitHeaders: v.any(), // RateLimitHeaders object
    endpoint: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dock = await ctx.db.get(args.dockId)
    if (!dock) return
    
    const now = args.timestamp || Date.now()
    const headers = args.rateLimitHeaders || {}
    
    // Log rate limit info for analysis
    console.log(`[Rate Limit] ${dock.provider} (${dock.name}):`)
    console.log(`[Rate Limit]   Endpoint: ${args.endpoint || "unknown"}`)
    console.log(`[Rate Limit]   Limit: ${headers.limit || "unknown"}`)
    console.log(`[Rate Limit]   Remaining: ${headers.remaining || "unknown"}`)
    console.log(`[Rate Limit]   Reset: ${headers.reset ? new Date(headers.reset).toISOString() : "unknown"}`)
    console.log(`[Rate Limit]   Retry-After: ${headers.retryAfter || "none"}`)
    
    // Update rate limit info
    const rateLimitInfo = {
      lastHeaders: headers,
      lastSeenAt: now,
      limit: headers.limit ? parseInt(headers.limit, 10) : undefined,
      remaining: headers.remaining ? parseInt(headers.remaining, 10) : undefined,
      reset: headers.reset ? parseInt(headers.reset, 10) * 1000 : undefined, // Convert to ms
      retryAfter: headers.retryAfter ? parseInt(headers.retryAfter, 10) : undefined,
      providerSpecific: headers.providerSpecific || {},
    }
    
    await ctx.db.patch(args.dockId, {
      rateLimitInfo,
      updatedAt: now,
    })
  },
})
```

### 2.2 Update API Clients to Log Rate Limits

**Files**: `convex/docks/adapters/{provider}/api.ts`

Update all API clients to call `updateRateLimitInfo` after each request. Pattern:

```typescript
// After successful API request:
if (rateLimitHeaders) {
  await ctx.runMutation(internal.docks.mutations.updateRateLimitInfo, {
    dockId: dock._id,
    rateLimitHeaders,
    endpoint: "/servers", // or whatever endpoint was called
    timestamp: Date.now(),
  })
}
```

**Note**: This should be done incrementally, starting with providers that have strict limits (GridPane, Vercel).

---

## Phase 3: UI for Sync Interval Configuration

### 3.1 Create Dock Settings Dialog Component

**File**: `apps/web/src/components/docks/dock-settings-dialog.tsx` (NEW)

Create a dialog component for configuring dock settings:

```typescript
"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"
import { toast } from "sonner"

interface DockSettingsDialogProps {
  dockId: Id<"docks">
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DockSettingsDialog({
  dockId,
  open,
  onOpenChange,
}: DockSettingsDialogProps) {
  const dock = useQuery(api["docks/queries"].getDock, { dockId })
  const updateSyncInterval = useMutation(api["docks/mutations"].updateSyncInterval)
  const getProviderSyncConfig = useQuery(api["docks/queries"].getProviderSyncConfig, {
    provider: dock?.provider || "",
  })
  
  const [intervalSeconds, setIntervalSeconds] = useState<number>(120)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  
  // Initialize interval from dock syncConfig
  useState(() => {
    if (dock?.syncConfig?.intervalSeconds) {
      setIntervalSeconds(dock.syncConfig.intervalSeconds)
    }
  }, [dock])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setWarning(null)
    
    try {
      const result = await updateSyncInterval({
        dockId,
        intervalSeconds,
      })
      
      if (result.warning) {
        setWarning(result.warning)
        toast.warning("Sync interval updated with warning")
      } else {
        toast.success("Sync interval updated successfully")
        onOpenChange(false)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update sync interval")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const recommendedInterval = getProviderSyncConfig?.recommendedInterval || 120
  const absoluteMinimum = getProviderSyncConfig?.absoluteMinimum || 60
  const reason = getProviderSyncConfig?.reason || ""
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dock Settings</DialogTitle>
          <DialogDescription>
            Configure sync interval for {dock?.name || "this dock"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interval">Sync Interval (seconds)</Label>
            <Input
              id="interval"
              type="number"
              min={absoluteMinimum}
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(parseInt(e.target.value, 10))}
              placeholder={`${recommendedInterval}`}
            />
            <p className="text-sm text-muted-foreground">
              Recommended: {recommendedInterval} seconds ({Math.round(recommendedInterval / 60)} minutes)
            </p>
            <p className="text-xs text-muted-foreground">
              Minimum: {absoluteMinimum} seconds. {reason}
            </p>
          </div>
          
          {warning && (
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### 3.2 Add Query for Provider Sync Config

**File**: `convex/docks/queries.ts`

Add query to get provider sync config:

```typescript
import { getProviderSyncConfig } from "./sync-intervals"

export const getProviderSyncConfig = query({
  args: {
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    return getProviderSyncConfig(args.provider)
  },
})

export const getDock = query({
  args: {
    dockId: v.id("docks"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    const dock = await ctx.db.get(args.dockId)
    if (!dock) return null
    
    // Verify user belongs to dock's org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first()
    
    if (!membership || membership.orgId !== dock.orgId) {
      return null
    }
    
    return dock
  },
})
```

### 3.3 Update Docks Table

**File**: `apps/web/src/components/docks/docks-table.tsx`

Add sync interval column and settings button:

```typescript
// Add to columns array:
{
  id: "syncInterval",
  header: "Sync Interval",
  cell: ({ row }) => {
    const interval = row.original.syncConfig?.intervalSeconds || 120
    const minutes = Math.round(interval / 60)
    return (
      <div className="flex items-center gap-2">
        <span>{minutes}m</span>
        <span className="text-xs text-muted-foreground">
          ({interval}s)
        </span>
      </div>
    )
  },
}

// Update RowActions to include Settings button:
import { Settings } from "lucide-react"
import { DockSettingsDialog } from "./dock-settings-dialog"

function RowActions({ row }: { row: Row<Dock> }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  // ... existing code ...
  
  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setSettingsOpen(true)}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
        {/* ... existing sync and delete buttons ... */}
      </div>
      
      <DockSettingsDialog
        dockId={row.original._id}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  )
}
```

---

## Phase 4: Update Existing Docks

### 4.1 Migration Script

**File**: `convex/docks/mutations.ts`

Add internal mutation to update existing docks with provider-aware intervals:

```typescript
/**
 * Internal mutation: Update existing docks with provider-aware sync intervals
 * 
 * Can be called from CLI: npx convex run docks/mutations:updateDocksWithProviderIntervals
 */
export const updateDocksWithProviderIntervals = internalMutation({
  handler: async (ctx) => {
    const docks = await ctx.db.query("docks").collect()
    let updated = 0
    
    for (const dock of docks) {
      const recommended = getRecommendedSyncInterval(dock.provider)
      const current = dock.syncConfig?.intervalSeconds || 60
      
      // Only update if current interval is less than recommended
      if (current < recommended) {
        const syncConfig = dock.syncConfig || {
          enabled: true,
          intervalSeconds: 60,
          consecutiveFailures: 0,
        }
        
        syncConfig.intervalSeconds = recommended
        
        await ctx.db.patch(dock._id, {
          syncConfig,
          updatedAt: Date.now(),
        })
        
        updated++
        console.log(`[Migration] Updated ${dock.name} (${dock.provider}): ${current}s -> ${recommended}s`)
      }
    }
    
    return { updated, total: docks.length }
  },
})
```

---

## Testing Requirements

1. **Provider Intervals**: Verify each provider gets correct recommended interval
2. **Minimum Enforcement**: Test that intervals below minimum are rejected
3. **UI Validation**: Test that UI shows warnings for intervals below recommended
4. **Rate Limit Logging**: Verify rate limit headers are logged for all providers
5. **Migration**: Run migration script and verify existing docks are updated

---

## Success Criteria

- [ ] All providers have recommended sync intervals configured
- [ ] New docks use provider-aware defaults
- [ ] Sync interval updates enforce minimums
- [ ] Rate limit headers are logged for all API calls
- [ ] UI allows configuring sync intervals with validation
- [ ] Existing docks can be migrated to provider-aware intervals

---

## Files to Create/Modify

1. **NEW**: `convex/docks/sync-intervals.ts` - Provider sync interval configuration
2. **MODIFY**: `convex/docks/mutations.ts` - Update createDock, add updateSyncInterval, updateRateLimitInfo
3. **MODIFY**: `convex/docks/queries.ts` - Add getProviderSyncConfig, getDock queries
4. **NEW**: `apps/web/src/components/docks/dock-settings-dialog.tsx` - Settings dialog component
5. **MODIFY**: `apps/web/src/components/docks/docks-table.tsx` - Add sync interval column and settings button
6. **MODIFY**: `convex/docks/adapters/{provider}/api.ts` - Add rate limit logging (incremental)

---

## Notes

- Rate limit logging should be added incrementally, starting with strict providers
- UI validation should warn but allow intervals below recommended (with user confirmation)
- Migration script can be run manually to update existing docks
- Future: Use logged rate limit data to automatically adjust intervals based on actual usage
