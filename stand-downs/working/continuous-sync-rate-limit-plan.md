# Continuous Sync with Rate Limit Tracking - Implementation Plan

**Date**: 2025-11-14  
**Status**: 📋 **PLANNED** - Ready for Implementation  
**Priority**: High (MVP blocker)  
**Goal**: Transform StackDock from cache to real-time database with continuous sync

---

## Executive Summary

Implement continuous background syncing (every 15-30 seconds) for LIST endpoints while tracking API rate limits. This ensures the UI stays fresh without manual syncs. Mutations will trigger immediate syncs when write operations are added.

**Key Principles**:
- **LIST endpoints**: Continuous polling (15-30s) - higher limits, bulk data
- **Mutations**: Event-driven flush (immediate) - stricter limits, careful handling
- **Rate limit tracking**: Capture headers, annotate for production removal
- **Simple change detection**: MVP-focused, not over-engineered
- **Configurable intervals**: Per-dock/org settings

---

## Phase 1: Rate Limit Header Capture & Storage

### 1.1 Schema Updates

**File**: `convex/schema.ts`

Add rate limit tracking fields to `docks` table:

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
    enabled: v.boolean(), // Enable/disable auto-sync
    intervalSeconds: v.number(), // Sync interval (15-30 default)
    lastSyncAttempt: v.optional(v.number()), // Last sync attempt timestamp
    consecutiveFailures: v.optional(v.number()), // Track failures for backoff
    backoffUntil: v.optional(v.number()), // Don't sync until this timestamp
  })),
})
```

**New Table**: `rateLimitLogs` (for detailed tracking - optional, can be removed post-MVP)

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

### 1.2 API Client Updates

**Pattern**: Update all API client classes to capture rate limit headers

**File**: `convex/docks/adapters/{provider}/api.ts`

**Standard Pattern** (apply to all providers):

```typescript
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
      : 60
    
    throw new RateLimitError(
      `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      rateLimitHeaders,
      retryAfter
    )
  }
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`API error (${response.status}): ${errorText}`)
  }
  
  const data = await response.json()
  
  return { data, rateLimitHeaders }
}

/**
 * Extract header value (case-insensitive)
 */
private extractHeader(response: Response, possibleKeys: string[]): string | undefined {
  for (const key of possibleKeys) {
    const value = response.headers.get(key)
    if (value) return value
  }
  return undefined
}

/**
 * Extract ALL rate limit related headers
 */
private extractAllRateLimitHeaders(response: Response): Record<string, string> {
  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    if (
      lowerKey.includes("ratelimit") ||
      lowerKey.includes("rate-limit") ||
      lowerKey === "retry-after" ||
      lowerKey.includes("cf-api-ratelimit") // Cloudflare
    ) {
      headers[key] = value // Preserve original case
    }
  })
  return headers
}
```

**Type Definition** (`convex/docks/adapters/_types.ts`):

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

### 1.3 Rate Limit Storage

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

## Phase 2: Continuous Sync Architecture

### 2.1 Scheduled Sync Function

**File**: `convex/docks/scheduled.ts` (NEW)

```typescript
/**
 * Scheduled Functions for Continuous Sync
 * 
 * Runs every 15-30 seconds to sync all active docks
 */

import { internalAction, internalMutation } from "../_generated/server"
import { internal } from "../_generated/api"
import { getAdapter } from "./registry"
import { decryptApiKey } from "../lib/encryption"

/**
 * Auto-sync all active docks
 * 
 * Called by scheduler every 15-30 seconds
 * Only syncs docks that:
 * - Have auto-sync enabled
 * - Are not currently syncing
 * - Are not in backoff period
 * - Have not exceeded rate limits
 */
export const autoSyncAllDocks = internalAction({
  handler: async (ctx) => {
    console.log(`[Auto-Sync] Starting scheduled sync cycle`)
    
    // Get all active docks eligible for sync
    const docks = await ctx.runQuery(internal.docks.queries.listDocksForAutoSync)
    
    if (docks.length === 0) {
      console.log(`[Auto-Sync] No docks eligible for sync`)
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
        
        // Decrypt API key
        const apiKey = await ctx.runMutation(
          internal.docks.mutations.decryptApiKeyForSync,
          { dockId: dock._id }
        )
        
        // Get adapter to determine resource types
        const adapter = getAdapter(dock.provider)
        if (!adapter) {
          console.error(`[Auto-Sync] No adapter for provider: ${dock.provider}`)
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
        
        // Small delay between docks to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
        
      } catch (error) {
        console.error(
          `[Auto-Sync] Error syncing dock ${dock._id} (${dock.provider}):`,
          error
        )
        
        // Update dock sync status
        await ctx.runMutation(internal.docks.mutations.updateSyncStatus, {
          dockId: dock._id,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }
    
    console.log(`[Auto-Sync] Completed sync cycle`)
    
    // Schedule next sync (creates continuous loop)
    const nextInterval = 15 * 1000 // 15 seconds (configurable per dock)
    await ctx.scheduler.runAfter(
      nextInterval,
      internal.docks.scheduled.autoSyncAllDocks
    )
  },
})

/**
 * Initialize continuous sync
 * 
 * Call this once to start the sync loop
 */
export const initializeAutoSync = internalMutation({
  handler: async (ctx) => {
    // Check if sync is already running
    const existingSync = await ctx.db
      .query("docks")
      .filter((q) => q.eq(q.field("syncInProgress"), true))
      .first()
    
    if (existingSync) {
      console.log(`[Auto-Sync] Sync already initialized`)
      return
    }
    
    // Schedule first sync
    await ctx.scheduler.runAfter(0, internal.docks.scheduled.autoSyncAllDocks)
    
    console.log(`[Auto-Sync] Initialized continuous sync`)
  },
})
```

### 2.2 Query: List Docks for Auto-Sync

**File**: `convex/docks/queries.ts`

```typescript
/**
 * List docks eligible for auto-sync
 * 
 * Returns docks that:
 * - Have auto-sync enabled (syncConfig.enabled = true)
 * - Are not currently syncing
 * - Are not in backoff period
 * - Are not in error state (or error state is old)
 */
export const listDocksForAutoSync = internalQuery({
  handler: async (ctx) => {
    const docks = await ctx.db.query("docks").collect()
    
    const now = Date.now()
    const eligibleDocks = docks.filter((dock) => {
      // Check if auto-sync is enabled
      if (!dock.syncConfig?.enabled) return false
      
      // Check if sync is in progress
      if (dock.syncInProgress) return false
      
      // Check backoff period
      if (dock.syncConfig.backoffUntil && dock.syncConfig.backoffUntil > now) {
        return false
      }
      
      // Check if enough time has passed since last sync attempt
      const intervalMs = (dock.syncConfig.intervalSeconds || 30) * 1000
      const lastAttempt = dock.syncConfig.lastSyncAttempt || 0
      if (now - lastAttempt < intervalMs) {
        return false
      }
      
      // Allow sync if last sync was successful, or if error is old (> 5 minutes)
      if (dock.lastSyncStatus === "error") {
        const errorAge = now - (dock.lastSyncAt || 0)
        if (errorAge < 5 * 60 * 1000) {
          return false // Skip recent errors
        }
      }
      
      return true
    })
    
    return eligibleDocks
  },
})

/**
 * Check if dock can sync based on rate limits
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
      return { canSync: true } // No rate limit info, allow sync
    }
    
    // Check if we're in a retry-after period
    if (rateLimitInfo.retryAfter) {
      const retryAfterMs = rateLimitInfo.retryAfter * 1000
      const resetTime = (rateLimitInfo.lastSeenAt || 0) + retryAfterMs
      if (Date.now() < resetTime) {
        return {
          canSync: false,
          reason: `Rate limit retry-after: ${rateLimitInfo.retryAfter}s`,
        }
      }
    }
    
    // Check remaining requests
    if (rateLimitInfo.remaining !== undefined && rateLimitInfo.remaining <= 0) {
      return {
        canSync: false,
        reason: "Rate limit remaining is 0",
      }
    }
    
    // Check reset time
    if (rateLimitInfo.reset) {
      const resetTime = rateLimitInfo.reset * 1000 // Convert to milliseconds
      if (Date.now() < resetTime) {
        return {
          canSync: false,
          reason: `Rate limit resets at ${new Date(resetTime).toISOString()}`,
        }
      }
    }
    
    return { canSync: true }
  },
})
```

### 2.3 Update Sync Action to Track Rate Limits

**File**: `convex/docks/actions.ts`

Update `syncDockResources` to capture and store rate limit headers:

```typescript
export const syncDockResources = internalAction({
  args: {
    dockId: v.id("docks"),
    provider: v.string(),
    apiKey: v.string(),
    resourceTypes: v.array(v.string()),
    isAutoSync: v.optional(v.boolean()), // Flag for auto-sync
  },
  handler: async (ctx, args) => {
    // ... existing sync logic ...
    
    // After each API call, capture rate limit headers
    // Example for GridPane:
    if (args.provider === "gridpane") {
      const api = new GridPaneAPI(args.apiKey)
      
      if (args.resourceTypes.includes("servers")) {
        const { data, rateLimitHeaders } = await api.getServersWithHeaders()
        servers = data
        
        // Store rate limit info
        await ctx.runMutation(internal.docks.mutations.updateRateLimitInfo, {
          dockId: args.dockId,
          rateLimitHeaders,
          endpoint: "/servers",
          method: "GET",
        })
      }
      
      // ... repeat for other endpoints ...
    }
    
    // ... rest of sync logic ...
  },
})
```

---

## Phase 3: Change Detection (Simple MVP)

### 3.1 Simple Change Detection Strategy

**Approach**: Compare `updatedAt` timestamps and `providerResourceId` existence

**File**: `convex/docks/adapters/{provider}/adapter.ts`

**Pattern** (apply to all sync methods):

```typescript
async syncServers(
  ctx: MutationCtx,
  dock: Doc<"docks">,
  preFetchedData?: ProviderServer[]
): Promise<void> {
  const servers = preFetchedData || await this.fetchServers()
  
  for (const server of servers) {
    // Check if server exists
    const existing = await ctx.db
      .query("servers")
      .withIndex("by_dock_resource", (q) =>
        q.eq("dockId", dock._id).eq("providerResourceId", server.id)
      )
      .first()
    
    if (existing) {
      // Simple change detection: Compare updatedAt
      // If provider's updatedAt is newer, update
      const providerUpdatedAt = this.extractUpdatedAt(server)
      const existingUpdatedAt = existing.updatedAt || 0
      
      if (providerUpdatedAt > existingUpdatedAt) {
        // Update existing record
        await ctx.db.patch(existing._id, {
          ...this.mapToUniversal(server),
          updatedAt: Date.now(),
        })
      }
      // Otherwise, skip (no changes)
    } else {
      // New server, insert
      await ctx.db.insert("servers", {
        ...this.mapToUniversal(server),
        updatedAt: Date.now(),
      })
    }
  }
  
  // TODO: Handle deleted resources (if provider supports it)
  // For MVP, we'll skip this complexity
}
```

**Note**: MVP keeps change detection simple. Advanced diffing can be added later.

---

## Phase 4: Rate Limiting & Error Handling

### 4.1 Rate Limit Backoff Strategy

**File**: `convex/docks/mutations.ts`

```typescript
/**
 * Handle rate limit error and update dock backoff
 */
export const handleRateLimitError = internalMutation({
  args: {
    dockId: v.id("docks"),
    retryAfterSeconds: v.number(),
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const dock = await ctx.db.get(args.dockId)
    if (!dock) return
    
    // Calculate backoff until time
    const backoffUntil = Date.now() + (args.retryAfterSeconds * 1000)
    
    // Update sync config with backoff
    await ctx.db.patch(args.dockId, {
      syncConfig: {
        ...dock.syncConfig,
        backoffUntil,
        consecutiveFailures: (dock.syncConfig?.consecutiveFailures || 0) + 1,
        lastSyncAttempt: Date.now(),
      },
      lastSyncStatus: "error",
      lastSyncError: `Rate limit exceeded. Retry after ${args.retryAfterSeconds}s`,
      updatedAt: Date.now(),
    })
    
    // Log violation
    if (dock.rateLimitInfo) {
      await ctx.db.patch(args.dockId, {
        rateLimitInfo: {
          ...dock.rateLimitInfo,
          violations: [
            ...(dock.rateLimitInfo.violations || []),
            {
              timestamp: Date.now(),
              statusCode: 429,
              endpoint: args.endpoint,
              retryAfter: args.retryAfterSeconds,
              headers: {},
            },
          ],
        },
      })
    }
  },
})
```

### 4.2 Error Handling in Sync Action

**File**: `convex/docks/actions.ts`

```typescript
export const syncDockResources = internalAction({
  handler: async (ctx, args) => {
    try {
      // ... sync logic ...
    } catch (error) {
      // Handle rate limit errors specifically
      if (error instanceof RateLimitError) {
        await ctx.runMutation(internal.docks.mutations.handleRateLimitError, {
          dockId: args.dockId,
          retryAfterSeconds: error.retryAfterSeconds,
          endpoint: "unknown", // TODO: Pass endpoint from error
        })
        throw error
      }
      
      // Handle other errors
      await ctx.runMutation(internal.docks.mutations.updateSyncStatus, {
        dockId: args.dockId,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  },
})
```

---

## Phase 5: Configurable Sync Intervals

### 5.1 Default Sync Config

**File**: `convex/docks/mutations.ts`

```typescript
/**
 * Set sync config for a dock
 */
export const setSyncConfig = mutation({
  args: {
    dockId: v.id("docks"),
    enabled: v.optional(v.boolean()),
    intervalSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const dock = await ctx.db.get(args.dockId)
    if (!dock) {
      throw new ConvexError("Dock not found")
    }
    
    // Check permissions
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      dock.orgId,
      "docks:full"
    )
    if (!hasPermission) {
      throw new ConvexError("Permission denied")
    }
    
    // Update sync config
    await ctx.db.patch(args.dockId, {
      syncConfig: {
        enabled: args.enabled ?? dock.syncConfig?.enabled ?? true,
        intervalSeconds: args.intervalSeconds ?? dock.syncConfig?.intervalSeconds ?? 30,
        lastSyncAttempt: dock.syncConfig?.lastSyncAttempt,
        consecutiveFailures: dock.syncConfig?.consecutiveFailures,
        backoffUntil: dock.syncConfig?.backoffUntil,
      },
      updatedAt: Date.now(),
    })
    
    return { success: true }
  },
})
```

### 5.2 Frontend UI for Sync Config

**File**: `apps/web/src/routes/dashboard/settings/docks.tsx`

Add sync config controls to dock cards:

```typescript
// Add toggle for auto-sync
<Switch
  checked={dock.syncConfig?.enabled ?? true}
  onCheckedChange={(enabled) => {
    setSyncConfig({ dockId: dock._id, enabled })
  }}
/>

// Add interval selector
<Select
  value={dock.syncConfig?.intervalSeconds?.toString() ?? "30"}
  onValueChange={(value) => {
    setSyncConfig({ dockId: dock._id, intervalSeconds: parseInt(value, 10) })
  }}
>
  <SelectItem value="15">15 seconds</SelectItem>
  <SelectItem value="30">30 seconds</SelectItem>
  <SelectItem value="60">60 seconds</SelectItem>
</Select>
```

---

## Phase 6: Event-Driven Updates for Mutations

### 6.1 Mutation Hook Pattern

**File**: `convex/docks/mutations.ts`

When mutations are implemented, add immediate sync trigger:

```typescript
/**
 * Provision resource (example mutation)
 * After provisioning, immediately sync to get fresh data
 */
export const provisionResource = mutation({
  handler: async (ctx, args) => {
    // ... provisioning logic ...
    
    // After successful provision, trigger immediate sync
    await ctx.scheduler.runAfter(0, internal.docks.actions.syncDockResources, {
      dockId: dock._id,
      provider: dock.provider,
      apiKey: decryptedApiKey,
      resourceTypes: [args.resourceType], // Only sync the resource type we just created
      isAutoSync: false, // Manual sync (not auto-sync)
      immediate: true, // Flag for immediate sync (skip rate limit checks)
    })
    
    return { success: true }
  },
})
```

---

## Implementation Checklist

### Phase 1: Rate Limit Tracking
- [ ] Update `docks` schema with `rateLimitInfo` and `syncConfig`
- [ ] Create `rateLimitLogs` table (optional, for detailed tracking)
- [ ] Update all API client classes to capture rate limit headers
- [ ] Create `RateLimitHeaders` type and `RateLimitError` class
- [ ] Implement `updateRateLimitInfo` mutation
- [ ] Test rate limit header capture for each provider

### Phase 2: Continuous Sync
- [ ] Create `convex/docks/scheduled.ts` with `autoSyncAllDocks`
- [ ] Create `listDocksForAutoSync` query
- [ ] Create `checkRateLimit` query
- [ ] Update `syncDockResources` action to accept `isAutoSync` flag
- [ ] Add rate limit header capture to sync action
- [ ] Create `initializeAutoSync` mutation
- [ ] Test continuous sync loop

### Phase 3: Change Detection
- [ ] Update all adapter sync methods with simple change detection
- [ ] Compare `updatedAt` timestamps
- [ ] Handle new resources (insert)
- [ ] Handle updated resources (patch)
- [ ] Skip unchanged resources (no-op)
- [ ] Test change detection accuracy

### Phase 4: Rate Limiting & Error Handling
- [ ] Implement `handleRateLimitError` mutation
- [ ] Add backoff logic to sync config
- [ ] Update error handling in sync action
- [ ] Test rate limit error handling
- [ ] Test backoff periods

### Phase 5: Configurable Intervals
- [ ] Implement `setSyncConfig` mutation
- [ ] Add sync config UI to docks page
- [ ] Test configurable intervals
- [ ] Test enable/disable auto-sync

### Phase 6: Event-Driven Updates (Future)
- [ ] Add immediate sync trigger to mutations
- [ ] Test mutation-triggered syncs
- [ ] Ensure mutations respect rate limits

---

## Testing Strategy

### Unit Tests
- Rate limit header extraction
- Change detection logic
- Backoff calculations

### Integration Tests
- Continuous sync loop
- Rate limit error handling
- Configurable intervals

### Manual Testing
- Verify UI updates automatically
- Verify rate limits are respected
- Verify sync intervals are configurable

---

## MVP Annotations for Post-Production Cleanup

**Mark all rate limit tracking code with MVP annotations**:

```typescript
// MVP: Rate limit tracking - REMOVE POST-PRODUCTION
// This code captures rate limit headers for debugging/annotation
// Can be removed once rate limits are well-understood
```

**Files to clean up post-MVP**:
- `rateLimitLogs` table (entire table)
- `rateLimitInfo` field in `docks` table (optional, keep if useful)
- Detailed rate limit logging code
- MVP-specific annotations

---

## Success Criteria

1. ✅ UI updates automatically every 15-30 seconds
2. ✅ Rate limit headers are captured and stored
3. ✅ Rate limit errors trigger backoff
4. ✅ Sync intervals are configurable per dock
5. ✅ Change detection prevents unnecessary updates
6. ✅ MVP annotations mark code for removal

---

## Timeline Estimate

- **Phase 1** (Rate Limit Tracking): 2-3 days
- **Phase 2** (Continuous Sync): 2-3 days
- **Phase 3** (Change Detection): 1-2 days
- **Phase 4** (Error Handling): 1 day
- **Phase 5** (Configurable Intervals): 1 day
- **Phase 6** (Event-Driven): Future (when mutations are implemented)

**Total MVP**: ~7-10 days

---

## Notes

- **LIST endpoints**: Continuous polling (15-30s) - higher limits, bulk data
- **Mutations**: Event-driven flush (immediate) - stricter limits, careful handling
- **Rate limit tracking**: Capture headers, annotate for production removal
- **Simple change detection**: MVP-focused, not over-engineered
- **Configurable intervals**: Per-dock/org settings

This plan transforms StackDock from a cache to a real-time database while respecting API rate limits and keeping the MVP simple. The rate limit tracking can be removed post-production once limits are understood.
