/**
 * Scheduled Functions for Continuous Sync
 * 
 * Uses Convex scheduler.runAfter() for continuous sync loop
 * Minimum frequency: 1 per minute (60 seconds)
 */

import { internalAction, internalMutation } from "../_generated/server"
import { internal } from "../_generated/api"
import { getAdapter } from "./registry"
import { RateLimitError } from "./types"
import type { Doc } from "../_generated/dataModel"

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
    const cycleStart = new Date(now).toISOString()
    
    // TEMP: Enhanced logging for testing - Remove after confirming no errors
    console.log(`\n${"=".repeat(80)}`)
    console.log(`[Auto-Sync] 🔄 CYCLE START: ${cycleStart}`)
    console.log(`${"=".repeat(80)}`)

    // Get all active docks eligible for sync
    const docks = await ctx.runQuery(internal.docks.queries.listDocksForAutoSync)

    if (docks.length === 0) {
      // Get all docks to show why they're not eligible
      const allDocks = await ctx.runQuery(internal.docks.queries.checkSyncStatusInternal)
      console.log(`[Auto-Sync] ⏭️  No docks eligible for sync`)
      if (allDocks.docks.length > 0) {
        console.log(`[Auto-Sync] 📊 Dock status summary:`)
        allDocks.docks.forEach((dock: any) => {
          console.log(`[Auto-Sync]   - ${dock.name} (${dock.provider}): ${dock.eligible ? "✅ eligible" : `❌ ${dock.reason}`}`)
        })
      }
      console.log(`[Auto-Sync] ⏰ Next sync scheduled in 60 seconds\n`)
      await ctx.scheduler.runAfter(60 * 1000, internal.docks.scheduled.autoSyncAllDocks)
      return
    }

    console.log(`[Auto-Sync] 📋 Found ${docks.length} dock(s) to sync:`)
    docks.forEach((dock: Doc<"docks">, idx: number) => {
      const lastSync = dock.syncConfig?.lastSyncAttempt 
        ? `${Math.round((now - dock.syncConfig.lastSyncAttempt) / 1000)}s ago`
        : "never"
      console.log(`  ${idx + 1}. ${dock.name} (${dock.provider}) - Last sync: ${lastSync}`)
    })
    console.log("")

    // Process docks sequentially to respect rate limits
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0

    for (const dock of docks) {
      const dockStart = Date.now()
      try {
        // TEMP: Log dock sync start
        console.log(`[Auto-Sync] 🔄 Syncing: ${dock.name} (${dock.provider})...`)

        // Check rate limits before syncing
        const rateLimitCheck = await ctx.runQuery(
          internal.docks.queries.checkRateLimit,
          { dockId: dock._id }
        )

        if (!rateLimitCheck.canSync) {
          console.log(`[Auto-Sync] ⏭️  Skipped: ${dock.name} - ${rateLimitCheck.reason}`)
          skippedCount++
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
          console.error(`[Auto-Sync] ❌ No adapter for provider: ${dock.provider}`)
          await ctx.runMutation(internal.docks.mutations.updateSyncStatus, {
            dockId: dock._id,
            status: "error",
            syncInProgress: false,
            error: `No adapter for provider: ${dock.provider}`,
          })
          errorCount++
          continue
        }

        // Determine resource types to sync
        const resourceTypes: string[] = []
        if (adapter.syncServers) resourceTypes.push("servers")
        if (adapter.syncWebServices) resourceTypes.push("webServices")
        if (adapter.syncDomains) resourceTypes.push("domains")
        if (adapter.syncDatabases) resourceTypes.push("databases")
        // GitHub repository sync: Syncs to repositories table (NOT projects table)
        if (adapter.syncRepositories) resourceTypes.push("repositories")
        if (adapter.syncBlockVolumes) resourceTypes.push("blockVolumes")
        if (adapter.syncBuckets) resourceTypes.push("buckets")
        if (adapter.syncMonitors) resourceTypes.push("monitors")
        if (adapter.syncIssues) resourceTypes.push("issues")

        // Log resource types with detailed info
        console.log(`[Auto-Sync] 📦 Syncing resource types: ${resourceTypes.join(", ") || "none"}`)
        console.log(`[Auto-Sync] 🔍 Adapter methods available:`)
        console.log(`[Auto-Sync]   - syncServers: ${!!adapter.syncServers}`)
        console.log(`[Auto-Sync]   - syncWebServices: ${!!adapter.syncWebServices}`)
        console.log(`[Auto-Sync]   - syncDomains: ${!!adapter.syncDomains}`)
        console.log(`[Auto-Sync]   - syncDatabases: ${!!adapter.syncDatabases}`)
        console.log(`[Auto-Sync]   - syncRepositories: ${!!adapter.syncRepositories}`)
        console.log(`[Auto-Sync]   - syncBlockVolumes: ${!!adapter.syncBlockVolumes}`)
        console.log(`[Auto-Sync]   - syncBuckets: ${!!adapter.syncBuckets}`)
        console.log(`[Auto-Sync]   - syncMonitors: ${!!adapter.syncMonitors}`)
        console.log(`[Auto-Sync]   - syncIssues: ${!!adapter.syncIssues}`)
        console.log(`[Auto-Sync]   - buckets in resourceTypes: ${resourceTypes.includes("buckets")}`)

        // Trigger sync (reuse existing syncDockResources action)
        // NOTE: syncDockResourcesMutation already updates syncConfig.lastSyncAttempt and sync status
        // We don't need to call updateSyncStatus here - it would create a race condition
        await ctx.runAction(internal.docks.actions.syncDockResources, {
          dockId: dock._id,
          provider: dock.provider,
          apiKey,
          resourceTypes,
          isAutoSync: true, // Flag for rate limit tracking
        })

        // syncDockResourcesMutation already updated sync status and syncConfig
        // No need to call updateSyncStatus here - it would overwrite the syncConfig that
        // syncDockResourcesMutation just set, potentially causing a race condition

        const dockDuration = ((Date.now() - dockStart) / 1000).toFixed(1)
        console.log(`[Auto-Sync] ✅ Success: ${dock.name} (${dockDuration}s)`)
        successCount++

        // Small delay between docks to respect rate limits (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        const dockDuration = ((Date.now() - dockStart) / 1000).toFixed(1)
        console.error(`[Auto-Sync] ❌ Error: ${dock.name} (${dockDuration}s)`)
        console.error(`[Auto-Sync]    Error: ${error instanceof Error ? error.message : String(error)}`)

        // Handle rate limit errors
        if (error instanceof RateLimitError) {
          const retryAfterSeconds = error.retryAfterSeconds || 60
          const backoffUntil = now + (retryAfterSeconds * 1000)
          console.error(`[Auto-Sync]    ⚠️  Rate limit hit - backoff until ${new Date(backoffUntil).toISOString()}`)

          await ctx.runMutation(internal.docks.mutations.updateSyncStatus, {
            dockId: dock._id,
            status: "error",
            syncInProgress: false,
            error: `Rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`,
            backoffUntil,
          })
        } else {
          await ctx.runMutation(internal.docks.mutations.updateSyncStatus, {
            dockId: dock._id,
            status: "error",
            syncInProgress: false,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
        errorCount++
      }
    }

    const cycleDuration = ((Date.now() - now) / 1000).toFixed(1)
    const cycleEnd = new Date().toISOString()
    
    // TEMP: Enhanced cycle summary
    console.log(`\n[Auto-Sync] 📊 CYCLE SUMMARY:`)
    console.log(`  ✅ Success: ${successCount}`)
    console.log(`  ❌ Errors: ${errorCount}`)
    console.log(`  ⏭️  Skipped: ${skippedCount}`)
    console.log(`  ⏱️  Duration: ${cycleDuration}s`)
    console.log(`[Auto-Sync] ⏰ Next sync scheduled in 60 seconds`)
    console.log(`[Auto-Sync] 🏁 CYCLE END: ${cycleEnd}`)
    console.log(`${"=".repeat(80)}\n`)

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
    const docks = await ctx.db
      .query("docks")
      .collect()

    // Check if any dock has recent sync activity (within last 2 minutes)
    const hasRecentSync = docks.some((dock) => {
      const syncConfig = dock.syncConfig
      if (!syncConfig?.enabled) return false
      if (!syncConfig.lastSyncAttempt) return false
      const timeSinceLastSync = Date.now() - syncConfig.lastSyncAttempt
      return timeSinceLastSync < 2 * 60 * 1000 // 2 minutes
    })

    if (hasRecentSync) {
      console.log(`[Auto-Sync] Sync already initialized (recent sync activity detected)`)
      return
    }

    // Schedule first sync immediately
    console.log(`[Auto-Sync] Scheduling first sync immediately...`)
    await ctx.scheduler.runAfter(0, internal.docks.scheduled.autoSyncAllDocks)

    console.log(`[Auto-Sync] ✅ Initialized continuous sync - first sync scheduled`)
  },
})
