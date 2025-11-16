# 


**Date**: November 15, 2025  
**Status**: Ready for Implementation  
**Priority**: High (MVP blocker)  
**Agent**: Convex Backend Agent  
**Estimated Time**: 4-6 hours

## Overview

Implement continuous background syncing (minimum 1 per minute) for all connected docks while respecting provider API rate limits. This transforms StackDock from a cache to a real-time database.

**Key Requirements**:
- **Minimum sync frequency**: 1 per minute (60 seconds)
- **Rate limit respect**: Track and honor provider rate limits
- **Concurrent capability**: Convex can handle simultaneous calls, but we'll process docks sequentially to respect rate limits
- **Intelligent backoff**: Skip docks that are rate-limited or in backoff period
- **Change detection**: Simple MVP approach using `updatedAt` timestamps

**Critical Question Answered**: 
- ✅ Convex can handle concurrent calls, but we'll process docks sequentially to respect rate limits
- ✅ Use Convex `scheduler.runAfter()` for continuous sync loop (not crons)
- ✅ Minimum 1 per minute sync frequency (60 seconds default, configurable per dock)

---

## Phase 1: Schema Updates

### 1.1 Update `docks` Table

**File**: `convex/schema.ts`

Add rate limit tracking and sync configuration fields:

```typescript
docks: defineTable({
  // ... existing fields ...
  
  // Rate limit tracking (MVP - can be removed post-production)
  rateLimitInfo: v.optional(v.object({
    // Last seen rate limit headers (for debugging/annotation)
    lastHeaders: v.optional(v.any()), // Raw headers object
    lastSeenAt: v.optional(v.number()), // Timestamp
    
    // Extracted rate limit values
    limit: v.optional(v.number()), // X-RateLimit-Limit
    remaining: v.optional(v.number()), // X-RateLimit-Remaining
    reset: v.optional(v.number()), // X-RateLimit-Reset (timestamp)
    retryAfter: v.optional(v.number()), // Retry-After (seconds)
    
    // Provider-specific headers (annotated for removal)
    // GridPane: X-RateLimit-Requests-Left
    // GitHub: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
    // Vercel: X-RateLimit-Limit, X-RateLimit-Remaining
    // DigitalOcean: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
    // Cloudflare: CF-API-RateLimit, CF-API-RateLimit-Reset
    providerSpecific: v.optional(v.any()), // Store all rate limit headers
    
    // Rate limit violations
    violations: v.optional(v.array(v.object({
      timestamp: v.number(),
      statusCode: v.number(), // 429
      endpoint: v.string(),
      retryAfter: v.optional(v.number()),
      headers: v.any(),
    }))),
  })),
  
  // Sync configuration
  syncConfig: v.optional(v.object({
    enabled: v.boolean(), // Enable/disable auto-sync (default: true)
    intervalSeconds: v.number(), // Sync interval (default: 60 seconds, minimum: 60)
    lastSyncAttempt: v.optional(v.number()), // Last sync attempt timestamp
    consecutiveFailures: v.optional(v.number()), // Track failures for backoff
    backoffUntil: v.optional(v.number()), // Don't sync until this timestamp
  })),
})
```

**Default Values**: When creating/updating docks, set default `syncConfig`:
```typescript
syncConfig: {
  enabled: true,
  intervalSeconds: 60, // 1 minute minimum
  consecutiveFailures: 0,
}
```

### 1.2 Create `rateLimitLogs` Table (Optional)

**File**: `convex/schema.ts`

For detailed rate limit tracking (can be disabled post-MVP):

```typescript
rateLimitLogs: defineTable({
  dockId: v.id("docks"),
  orgId: v.id("organizations"),
  provider: v.string(),
  endpoint: v.string(), // API endpoint called
  method: v.string(), // GET, POST, etc.
  timestamp: v.number(),
  headers: v.any(), // All rate limit headers captured
  extracted: v.object({
    limit: v.optional(v.number()),
    remaining: v.optional(v.number()),
    reset: v.optional(v.number()),
    retryAfter: v.optional(v.number()),
  }),
  // MVP annotation: Mark for removal post-production
  _mvpTracking: v.literal(true), // Explicit marker for cleanup
})
  .index("by_dockId", ["dockId"])
  .index("by_provider", ["provider"])
  .index("by_timestamp", ["timestamp"])
```

---

## Phase 2: Rate Limit Header Capture

### 2.1 Create Rate Limit Types

**File**: `convex/docks/adapters/_types.ts` (or create new `convex/docks/types.ts`)

```typescript
/**
 * Rate limit headers structure
 * MVP: For annotation/removal post-production
 */
export interface RateLimitHeaders {
  limit?: string // X-RateLimit-Limit
  remaining?: string // X-RateLimit-Remaining
  reset?: string // X-RateLimit-Reset
  retryAfter?: string // Retry-After
  providerSpecific?: Record<string, string> // All provider-specific headers
  raw?: Record<string, string> // All headers (for debugging)
}

/**
 * Rate limit error with retry information
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public headers: RateLimitHeaders,
    public retryAfterSeconds: number
  ) {
    super(message)
    this.name = "RateLimitError"
  }
}
```

### 2.2 Update API Client Pattern

**Pattern**: Update all API client classes to capture rate limit headers

**File**: `convex/docks/adapters/{provider}/api.ts`

**Standard Pattern** (apply to all providers - GridPane, Vultr, DigitalOcean, etc.):

```typescript
/**
 * Extract header value (case-insensitive)
 */
private extractHeader(response: Response, headerNames: string[]): string | undefined {
  for (const name of headerNames) {
    const value = response.headers.get(name)
    if (value) return value
  }
  return undefined
}

/**
 * Extract all rate limit headers (case-insensitive)
 */
private extractAllRateLimitHeaders(response: Response): Record<string, string> {
  const rateLimitHeaders: Record<string, string> = {}
  const headerNames = [
    "x-ratelimit-limit",
    "x-ratelimit-remaining",
    "x-ratelimit-reset",
    "ratelimit-limit",
    "ratelimit-remaining",
    "ratelimit-reset",
    "retry-after",
    "x-ratelimit-requests-left", // GridPane
    "cf-api-ratelimit", // Cloudflare
    "cf-api-ratelimit-reset", // Cloudflare
  ]
  
  for (const name of headerNames) {
    const value = response.headers.get(name)
    if (value) {
      rateLimitHeaders[name] = value
    }
  }
  
  return rateLimitHeaders
}

/**
 * Make authenticated request with rate limit header capture
 * 
 * MVP: Captures all rate limit headers for annotation/removal post-production
 */
private async requestWithRateLimitTracking<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ 
  data: T
  rateLimitHeaders: RateLimitHeaders 
}> {
  const url = `${this.baseUrl}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
  
  // Extract ALL rate limit headers (case-insensitive)
  const rateLimitHeaders: RateLimitHeaders = {
    // Standard headers
    limit: this.extractHeader(response, ["x-ratelimit-limit", "ratelimit-limit"]),
    remaining: this.extractHeader(response, ["x-ratelimit-remaining", "ratelimit-remaining"]),
    reset: this.extractHeader(response, ["x-ratelimit-reset", "ratelimit-reset"]),
    retryAfter: this.extractHeader(response, ["retry-after"]),
    
    // Provider-specific headers (capture all)
    providerSpecific: this.extractAllRateLimitHeaders(response),
    
    // Raw headers for debugging
    raw: Object.fromEntries(response.headers.entries()),
  }
  
  // Handle 429 Rate Limit errors
  if (response.status === 429) {
    const retryAfter = rateLimitHeaders.retryAfter 
      ? parseInt(rateLimitHeaders.retryAfter, 10) 
      : 60 // Default 60 seconds
    
    throw new RateLimitError(
      `Rate limit exceeded: ${response.statusText}`,
      rateLimitHeaders,
      retryAfter
    )
  }
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`${this.provider} API error (${response.status}): ${errorText}`)
  }
  
  const data = await response.json()
  
  return { data, rateLimitHeaders }
}

// Update existing request methods to use requestWithRateLimitTracking
async listServers(): Promise<{ servers: Server[]; rateLimitHeaders: RateLimitHeaders }> {
  const result = await this.requestWithRateLimitTracking<Server[]>("/servers")
  return { servers: result.data, rateLimitHeaders: result.rateLimitHeaders }
}
```

**Note**: This is a pattern to apply to ALL provider API clients. Start with one provider (e.g., GridPane) as a template, then apply to others.

### 2.3 Create Rate Limit Update Mutation

**File**: `convex/docks/mutations.ts`

Add internal mutation to update rate limit info:

```typescript
/**
 * Internal mutation: Update rate limit info for a dock
 * 
 * MVP: Stores rate limit headers for annotation/removal post-production
 */
export const updateRateLimitInfo = internalMutation({
  args: {
    dockId: v.id("docks"),
    rateLimitHeaders: v.any(), // RateLimitHeaders object
    endpoint: v.optional(v.string()),
    method: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dock = await ctx.db.get(args.dockId)
    if (!dock) return
    
    // Extract numeric values
    const limit = args.rateLimitHeaders.limit 
      ? parseInt(args.rateLimitHeaders.limit, 10) 
      : undefined
    const remaining = args.rateLimitHeaders.remaining 
      ? parseInt(args.rateLimitHeaders.remaining, 10) 
      : undefined
    const reset = args.rateLimitHeaders.reset 
      ? parseInt(args.rateLimitHeaders.reset, 10) 
      : undefined
    const retryAfter = args.rateLimitHeaders.retryAfter 
      ? parseInt(args.rateLimitHeaders.retryAfter, 10) 
      : undefined
    
    // Update dock rate limit info
    await ctx.db.patch(args.dockId, {
      rateLimitInfo: {
        lastHeaders: args.rateLimitHeaders,
        lastSeenAt: Date.now(),
        limit,
        remaining,
        reset,
        retryAfter,
        providerSpecific: args.rateLimitHeaders.providerSpecific || {},
      },
      updatedAt: Date.now(),
    })
    
    // Optional: Log to rateLimitLogs table (can be disabled post-MVP)
    if (args.endpoint && args.method) {
      await ctx.db.insert("rateLimitLogs", {
        dockId: args.dockId,
        orgId: dock.orgId,
        provider: dock.provider,
        endpoint: args.endpoint,
        method: args.method,
        timestamp: Date.now(),
        headers: args.rateLimitHeaders.raw || {},
        extracted: {
          limit,
          remaining,
          reset,
          retryAfter,
        },
        _mvpTracking: true, // Explicit marker for cleanup
      })
    }
  },
})
```

---

## Phase 3: Continuous Sync Architecture

### 3.1 Create Scheduled Sync Functions

**File**: `convex/docks/scheduled.ts` (NEW)

```typescript
/**
 * Scheduled Functions for Continuous Sync
 * 
 * Uses Convex scheduler.runAfter() for continuous sync loop
 * Minimum frequency: 1 per minute (60 seconds)
 */

import { internalAction, internalMutation } from "../_generated/server"
import { internal } from "../_generated/api"
import { getAdapter } from "./registry"
import { decryptApiKey } from "../lib/encryption"

/**
 * Auto-sync all active docks
 * 
 * Called by scheduler every 60 seconds (minimum)
 * Only syncs docks that:
 * - Have auto-sync enabled (syncConfig.enabled === true)
 * - Are not currently syncing (syncInProgress !== true)
 * - Are not in backoff period (backoffUntil < now)
 * - Have not exceeded rate limits (remaining > 0 or reset < now)
 * 
 * Processes docks sequentially to respect rate limits
 */
export const autoSyncAllDocks = internalAction({
  handler: async (ctx) => {
    const now = Date.now()
    console.log(`[Auto-Sync] Starting scheduled sync cycle at ${new Date(now).toISOString()}`)
    
    // Get all active docks eligible for sync
    const docks = await ctx.runQuery(internal.docks.queries.listDocksForAutoSync)
    
    if (docks.length === 0) {
      console.log(`[Auto-Sync] No docks eligible for sync`)
      // Schedule next sync (60 seconds)
      await ctx.scheduler.runAfter(60 * 1000, internal.docks.scheduled.autoSyncAllDocks)
      return
    }
    
    console.log(`[Auto-Sync] Found ${docks.length} docks to sync`)
    
    // Process docks sequentially to respect rate limits
    for (const dock of docks) {
      try {
        // Check rate limits before syncing
        const rateLimitCheck = await ctx.runQuery(
          internal.docks.queries.checkRateLimit,
          { dockId: dock._id }
        )
        
        if (!rateLimitCheck.canSync) {
          console.log(
            `[Auto-Sync] Skipping dock ${dock._id} (${dock.provider}): ${rateLimitCheck.reason}`
          )
          continue
        }
        
        // Mark dock as syncing
        await ctx.runMutation(internal.docks.mutations.updateSyncStatus, {
          dockId: dock._id,
          status: "syncing",
          syncInProgress: true,
        })
        
        // Decrypt API key
        const apiKey = await ctx.runMutation(
          internal.docks.mutations.decryptApiKeyForSync,
          { dockId: dock._id }
        )
        
        // Get adapter to determine resource types
        const adapter = getAdapter(dock.provider)
        if (!adapter) {
          console.error(`[Auto-Sync] No adapter for provider: ${dock.provider}`)
          await ctx.runMutation(internal.docks.mutations.updateSyncStatus, {
            dockId: dock._id,
            status: "error",
            syncInProgress: false,
            error: `No adapter for provider: ${dock.provider}`,
          })
          continue
        }
        
        // Determine resource types to sync
        const resourceTypes: string[] = []
        if (adapter.syncServers) resourceTypes.push("servers")
        if (adapter.syncWebServices) resourceTypes.push("webServices")
        if (adapter.syncDomains) resourceTypes.push("domains")
        if (adapter.syncDatabases) resourceTypes.push("databases")
        if (adapter.syncProjects) resourceTypes.push("projects")
        if (adapter.syncBlockVolumes) resourceTypes.push("blockVolumes")
        if (adapter.syncBuckets) resourceTypes.push("buckets")
        
        // Trigger sync (reuse existing syncDockResources action)
        await ctx.runAction(internal.docks.actions.syncDockResources, {
          dockId: dock._id,
          provider: dock.provider,
          apiKey,
          resourceTypes,
          isAutoSync: true, // Flag for rate limit tracking
        })
        
        // Update sync status to success
        await ctx.runMutation(internal.docks.mutations.updateSyncStatus, {
          dockId: dock._id,
          status: "success",
          syncInProgress: false,
          lastSyncAt: now,
        })
        
        // Small delay between docks to respect rate limits (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(
          `[Auto-Sync] Error syncing dock ${dock._id} (${dock.provider}):`,
          error
        )
        
        // Handle rate limit errors
        if (error instanceof Error && error.name === "RateLimitError") {
          const rateLimitError = error as any // RateLimitError
          const retryAfterSeconds = rateLimitError.retryAfterSeconds || 60
          const backoffUntil = now + (retryAfterSeconds * 1000)
          
          // Update dock with backoff period
          await ctx.runMutation(internal.docks.mutations.updateSyncStatus, {
            dockId: dock._id,
            status: "error",
            syncInProgress: false,
            error: `Rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`,
            backoffUntil,
          })
        } else {
          // Update dock sync status
          await ctx.runMutation(internal.docks.mutations.updateSyncStatus, {
            dockId: dock._id,
            status: "error",
            syncInProgress: false,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }
    }
    
    console.log(`[Auto-Sync] Completed sync cycle`)
    
    // Schedule next sync (60 seconds minimum)
    await ctx.scheduler.runAfter(60 * 1000, internal.docks.scheduled.autoSyncAllDocks)
  },
})

/**
 * Initialize continuous sync
 * 
 * Call this once to start the sync loop
 * Can be called from a mutation or manually
 */
export const initializeAutoSync = internalMutation({
  handler: async (ctx) => {
    // Check if sync is already initialized (check for recent sync attempts)
    const recentSync = await ctx.db
      .query("docks")
      .withIndex("by_orgId", (q) => q.eq("orgId", "any")) // Get any dock
      .filter((q) => {
        const syncConfig = q.field("syncConfig")
        return syncConfig !== undefined && syncConfig.enabled === true
      })
      .first()
    
    if (recentSync?.syncConfig?.lastSyncAttempt) {
      const lastSync = recentSync.syncConfig.lastSyncAttempt
      const timeSinceLastSync = Date.now() - lastSync
      
      // If sync happened in last 2 minutes, assume it's already running
      if (timeSinceLastSync < 2 * 60 * 1000) {
        console.log(`[Auto-Sync] Sync already initialized (last sync: ${timeSinceLastSync}ms ago)`)
        return
      }
    }
    
    // Schedule first sync immediately
    await ctx.scheduler.runAfter(0, internal.docks.scheduled.autoSyncAllDocks)
    
    console.log(`[Auto-Sync] Initialized continuous sync`)
  },
})
```

### 3.2 Create Queries for Auto-Sync

**File**: `convex/docks/queries.ts`

Add queries for auto-sync:

```typescript
/**
 * List docks eligible for auto-sync
 * 
 * Returns docks that:
 * - Have auto-sync enabled
 * - Are not currently syncing
 * - Are not in backoff period
 */
export const listDocksForAutoSync = internalQuery({
  handler: async (ctx) => {
    const now = Date.now()
    
    const docks = await ctx.db
      .query("docks")
      .collect()
    
    return docks.filter((dock) => {
      // Check if auto-sync is enabled
      if (!dock.syncConfig?.enabled) return false
      
      // Check if currently syncing
      if (dock.syncInProgress) return false
      
      // Check if in backoff period
      if (dock.syncConfig.backoffUntil && dock.syncConfig.backoffUntil > now) {
        return false
      }
      
      // Check if enough time has passed since last sync
      const intervalMs = (dock.syncConfig.intervalSeconds || 60) * 1000
      const lastSync = dock.syncConfig.lastSyncAttempt || 0
      if (now - lastSync < intervalMs) {
        return false
      }
      
      return true
    })
  },
})

/**
 * Check if dock can sync based on rate limits
 * 
 * Returns:
 * - canSync: boolean
 * - reason: string (if cannot sync)
 */
export const checkRateLimit = internalQuery({
  args: {
    dockId: v.id("docks"),
  },
  handler: async (ctx, args) => {
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      return { canSync: false, reason: "Dock not found" }
    }
    
    const rateLimitInfo = dock.rateLimitInfo
    if (!rateLimitInfo) {
      // No rate limit info yet, allow sync
      return { canSync: true }
    }
    
    const now = Date.now()
    
    // Check if we have remaining requests
    if (rateLimitInfo.remaining !== undefined && rateLimitInfo.remaining <= 0) {
      // Check if reset time has passed
      if (rateLimitInfo.reset && rateLimitInfo.reset > now) {
        const waitSeconds = Math.ceil((rateLimitInfo.reset - now) / 1000)
        return {
          canSync: false,
          reason: `Rate limit exhausted. Reset in ${waitSeconds} seconds.`,
        }
      }
    }
    
    // Check retry-after
    if (rateLimitInfo.retryAfter) {
      const retryAfterMs = rateLimitInfo.retryAfter * 1000
      if (now < retryAfterMs) {
        const waitSeconds = Math.ceil((retryAfterMs - now) / 1000)
        return {
          canSync: false,
          reason: `Rate limit retry-after: ${waitSeconds} seconds.`,
        }
      }
    }
    
    return { canSync: true }
  },
})
```

### 3.3 Update Mutations

**File**: `convex/docks/mutations.ts`

Add/update mutations:

```typescript
/**
 * Update sync status for a dock
 */
export const updateSyncStatus = internalMutation({
  args: {
    dockId: v.id("docks"),
    status: v.union(
      v.literal("pending"),
      v.literal("syncing"),
      v.literal("success"),
      v.literal("error")
    ),
    syncInProgress: v.optional(v.boolean()),
    lastSyncAt: v.optional(v.number()),
    error: v.optional(v.string()),
    backoffUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dock = await ctx.db.get(args.dockId)
    if (!dock) return
    
    const updates: any = {
      lastSyncStatus: args.status,
      updatedAt: Date.now(),
    }
    
    if (args.syncInProgress !== undefined) {
      updates.syncInProgress = args.syncInProgress
    }
    
    if (args.lastSyncAt !== undefined) {
      updates.lastSyncAt = args.lastSyncAt
    }
    
    if (args.error !== undefined) {
      updates.lastSyncError = args.error
    }
    
    // Update syncConfig
    const syncConfig = dock.syncConfig || {
      enabled: true,
      intervalSeconds: 60,
      consecutiveFailures: 0,
    }
    
    if (args.status === "success") {
      syncConfig.lastSyncAttempt = Date.now()
      syncConfig.consecutiveFailures = 0
      syncConfig.backoffUntil = undefined
    } else if (args.status === "error") {
      syncConfig.lastSyncAttempt = Date.now()
      syncConfig.consecutiveFailures = (syncConfig.consecutiveFailures || 0) + 1
      
      // Exponential backoff: 2^failures minutes (max 60 minutes)
      if (syncConfig.consecutiveFailures > 0) {
        const backoffMinutes = Math.min(
          Math.pow(2, syncConfig.consecutiveFailures),
          60
        )
        syncConfig.backoffUntil = Date.now() + (backoffMinutes * 60 * 1000)
      }
    }
    
    if (args.backoffUntil !== undefined) {
      syncConfig.backoffUntil = args.backoffUntil
    }
    
    updates.syncConfig = syncConfig
    
    await ctx.db.patch(args.dockId, updates)
  },
})

/**
 * Decrypt API key for sync (internal use only)
 */
export const decryptApiKeyForSync = internalMutation({
  args: {
    dockId: v.id("docks"),
  },
  handler: async (ctx, args) => {
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      throw new ConvexError("Dock not found")
    }
    
    return await decryptApiKey(dock.encryptedApiKey, ctx, {
      dockId: dock._id,
      orgId: dock.orgId,
    })
  },
})
```

### 3.4 Update Actions

**File**: `convex/docks/actions.ts`

Update `syncDockResources` action to:
1. Accept `isAutoSync` flag
2. Capture rate limit headers
3. Call `updateRateLimitInfo` mutation

```typescript
export const syncDockResources = internalAction({
  args: {
    dockId: v.id("docks"),
    provider: v.string(),
    apiKey: v.string(),
    resourceTypes: v.array(v.string()),
    isAutoSync: v.optional(v.boolean()), // Flag for auto-sync vs manual
  },
  handler: async (ctx, args) => {
    // ... existing sync logic ...
    
    // After each API call, capture rate limit headers
    // Example for GridPane:
    if (args.provider === "gridpane") {
      const api = new GridPaneAPI(args.apiKey)
      
      if (args.resourceTypes.includes("webServices")) {
        const result = await api.listSites() // Returns { sites, rateLimitHeaders }
        
        // Update rate limit info
        await ctx.runMutation(internal.docks.mutations.updateRateLimitInfo, {
          dockId: args.dockId,
          rateLimitHeaders: result.rateLimitHeaders,
          endpoint: "/sites",
          method: "GET",
        })
        
        // Continue with sync...
        webServices = result.sites
      }
    }
    
    // ... rest of sync logic ...
  },
})
```

---

## Phase 4: Initialize Sync on Dock Creation

### 4.1 Update `createDock` Mutation

**File**: `convex/docks/mutations.ts`

After successfully creating a dock, initialize auto-sync:

```typescript
export const createDock = mutation({
  // ... existing args and handler ...
  
  handler: async (ctx, args) => {
    // ... existing dock creation logic ...
    
    // Set default syncConfig
    const syncConfig = {
      enabled: true,
      intervalSeconds: 60, // 1 minute minimum
      consecutiveFailures: 0,
    }
    
    const dockId = await ctx.db.insert("docks", {
      // ... existing fields ...
      syncConfig,
    })
    
    // Initialize auto-sync if not already running
    await ctx.scheduler.runAfter(0, internal.docks.scheduled.initializeAutoSync)
    
    // ... rest of handler ...
  },
})
```

---

## Phase 5: Testing Checklist

### Phase 1: Rate Limit Tracking
- [ ] Update `docks` schema with `rateLimitInfo` and `syncConfig`
- [ ] Create `rateLimitLogs` table (optional)
- [ ] Update at least one API client (GridPane) to capture rate limit headers
- [ ] Create `RateLimitHeaders` type and `RateLimitError` class
- [ ] Implement `updateRateLimitInfo` mutation
- [ ] Test rate limit header capture

### Phase 2: Continuous Sync
- [ ] Create `convex/docks/scheduled.ts` with `autoSyncAllDocks`
- [ ] Create `listDocksForAutoSync` query
- [ ] Create `checkRateLimit` query
- [ ] Update `syncDockResources` action to accept `isAutoSync` flag
- [ ] Add rate limit header capture to sync action
- [ ] Create `updateSyncStatus` mutation
- [ ] Create `decryptApiKeyForSync` mutation
- [ ] Create `initializeAutoSync` mutation
- [ ] Update `createDock` to initialize auto-sync
- [ ] Test continuous sync loop (verify it runs every 60 seconds)

### Phase 3: Rate Limiting & Error Handling
- [ ] Test rate limit detection (429 errors)
- [ ] Test backoff period logic
- [ ] Test consecutive failures exponential backoff
- [ ] Test skipping docks in backoff period
- [ ] Test skipping docks that are rate-limited
- [ ] Verify sequential processing (not concurrent)

---

## Implementation Notes

### Convex Scheduler Usage

**Key Points**:
- ✅ Use `ctx.scheduler.runAfter(ms, function)` for continuous sync loop
- ✅ Convex can handle concurrent calls, but we process docks sequentially to respect rate limits
- ✅ Minimum sync frequency: 60 seconds (1 per minute)
- ✅ Each sync cycle schedules the next one (creates continuous loop)

**Pattern**:
```typescript
// In autoSyncAllDocks action:
// ... sync logic ...
// Schedule next sync (60 seconds)
await ctx.scheduler.runAfter(60 * 1000, internal.docks.scheduled.autoSyncAllDocks)
```

### Rate Limit Strategy

1. **Capture headers**: Every API call captures rate limit headers
2. **Store in dock**: Update `rateLimitInfo` after each sync
3. **Check before sync**: Query `checkRateLimit` before syncing each dock
4. **Respect limits**: Skip docks that are rate-limited or in backoff
5. **Exponential backoff**: Increase backoff time on consecutive failures

### Sequential Processing

**Why Sequential?**
- Convex can handle concurrent calls, but provider APIs have rate limits
- Processing docks sequentially ensures we don't exceed rate limits
- Small delay (1 second) between docks provides buffer

**Pattern**:
```typescript
for (const dock of docks) {
  // ... sync dock ...
  await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
}
```

---

## Success Criteria

✅ Continuous sync runs every 60 seconds (minimum)  
✅ Rate limit headers captured for all API calls  
✅ Docks respect rate limits (skip when rate-limited)  
✅ Exponential backoff on consecutive failures  
✅ Sequential processing prevents rate limit violations  
✅ Sync status tracked (`syncing`, `success`, `error`)  
✅ Backoff periods respected (skip docks in backoff)  
✅ Auto-sync initializes on dock creation  

---

## Reference Files

- **Schema**: `convex/schema.ts`
- **Mutations**: `convex/docks/mutations.ts`
- **Queries**: `convex/docks/queries.ts`
- **Actions**: `convex/docks/actions.ts`
- **Registry**: `convex/docks/registry.ts`
- **Adapter Pattern**: `convex/docks/adapters/gridpane/` (or any existing adapter)
- **Convex Agent SOP**: `docs/workflows/principle-engineers/backend-convex.md`
- **Existing Sync Plan**: `stand-downs/working/continuous-sync-rate-limit-plan.md`

---

## RBAC Requirements

**All functions must use RBAC**:
- ✅ Internal mutations/queries/actions don't need RBAC (they're internal)
- ✅ Public mutations (like `createDock`) must use `withRBAC()` or manual permission checks
- ✅ Follow pattern in `convex/docks/mutations.ts` for permission checks

---

**Ready to implement!** Follow the Convex agent SOP and ensure all schema changes, queries, mutations, and actions follow the universal table pattern and RBAC requirements.
