import { query } from "./_generated/server"

/**
 * Simple test query that doesn't require auth
 * Used to verify Convex connection
 */
export const ping = query({
  handler: async () => {
    return {
      status: "ok",
      timestamp: Date.now(),
      message: "Convex is connected!",
    }
  },
})

