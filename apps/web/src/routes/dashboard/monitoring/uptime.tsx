/**
 * Uptime Monitoring Page
 * 
 * Displays uptime monitors from all providers in a unified table
 */

import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { UptimeTable } from "@/components/monitoring/uptime-table"
import { RadioTower } from "lucide-react"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/dashboard/monitoring/uptime")({
  component: UptimePage,
})

function UptimePage() {
  const monitors = useQuery(api["monitoring/queries"].listMonitors)
  const monitorsList = monitors || []

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Uptime Monitoring
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Monitor the availability and performance of your services across all providers
        </p>
      </div>

      {monitorsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
          <RadioTower className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No monitors found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Connect a monitoring provider dock (like Better Stack) to start tracking uptime.
            </p>
          </div>
          <Button asChild>
            <a href="/dashboard/docks/add">Connect a Dock</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <RadioTower className="h-5 w-5" />
              {monitorsList.length} {monitorsList.length === 1 ? "Monitor" : "Monitors"}
            </h2>
          </div>
          <UptimeTable data={monitors} />
        </div>
      )}
    </main>
  )
}
