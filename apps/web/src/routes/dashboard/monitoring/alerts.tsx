import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { IssuesTable } from "@/components/monitoring/issues-table"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/dashboard/monitoring/alerts")({
  component: AlertsPage,
})

function AlertsPage() {
  const alerts = useQuery(api["monitoring/queries"].listAlerts)
  const alertsList = alerts || []

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Alerts
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          System alerts and notifications from your monitoring providers
        </p>
      </div>

      {alertsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No alerts found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {alerts === undefined 
                ? "Loading alerts..."
                : "Connect a monitoring provider dock (like Sentry) and sync it to start tracking alerts and errors."}
            </p>
            {alerts !== undefined && (
              <p className="text-xs text-muted-foreground max-w-sm mt-2">
                If you already have a Sentry dock connected, make sure to sync it from the Docks page.
              </p>
            )}
          </div>
          {alerts !== undefined && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <a href="/dashboard/docks/connected">View Docks</a>
              </Button>
              <Button asChild>
                <a href="/dashboard/docks/add">Connect a Dock</a>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {alertsList.length} {alertsList.length === 1 ? "Alert" : "Alerts"}
            </h2>
          </div>
          <IssuesTable data={alerts} />
        </div>
      )}
    </main>
  )
}
