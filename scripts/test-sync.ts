/**
 * Test script for continuous sync
 * 
 * Run with: npx tsx scripts/test-sync.ts
 */

import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"

// Get Convex URL from environment or use default
const CONVEX_URL = process.env.CONVEX_URL || "http://localhost:3210"

async function main() {
  console.log("🔍 Checking sync status...\n")
  
  const client = new ConvexHttpClient(CONVEX_URL)
  
  try {
    // Check sync status
    const status = await client.query(api.docks.queries.checkSyncStatus, {})
    
    console.log("📊 Sync Status:")
    console.log(`   Summary: ${status.summary}`)
    console.log(`\n   Docks:`)
    status.docks.forEach((dock, idx) => {
      console.log(`   ${idx + 1}. ${dock.name} (${dock.provider})`)
      console.log(`      Enabled: ${dock.enabled}`)
      console.log(`      Status: ${dock.status}`)
      console.log(`      Last Sync: ${dock.lastSync}`)
      console.log(`      Eligible: ${dock.eligible ? "✅" : "❌"} - ${dock.reason}`)
      if (dock.consecutiveFailures > 0) {
        console.log(`      Failures: ${dock.consecutiveFailures}`)
      }
      console.log("")
    })
    
    // If no docks are eligible, try to initialize
    const eligibleCount = status.docks.filter(d => d.eligible).length
    if (eligibleCount === 0 && status.docks.length > 0) {
      console.log("⚠️  No docks eligible. Initializing sync...\n")
      
      const result = await client.mutation(api.docks.mutations.initializeAutoSyncManually, {})
      console.log(`✅ ${result.message}`)
      console.log("\n📝 Watch your terminal for sync logs (should appear within seconds)")
    } else if (eligibleCount > 0) {
      console.log(`✅ ${eligibleCount} dock(s) eligible - sync should be running`)
      console.log("📝 Watch your terminal for sync logs")
    } else {
      console.log("⚠️  No docks found. Create a dock first!")
    }
  } catch (error) {
    console.error("❌ Error:", error)
    console.log("\n💡 Make sure Convex dev server is running: npx convex dev")
  }
}

main().catch(console.error)
