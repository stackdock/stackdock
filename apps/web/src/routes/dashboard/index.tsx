import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
})

function DashboardHome() {
  const counts = useQuery(api["resources/queries"].getCounts)

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Full oversight dashboard - global alert feed, summary widgets, recent activity from all projects.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h3 className="text-xs font-medium text-muted-foreground mb-2 md:text-sm">
            Servers
          </h3>
          <p className="text-2xl font-bold text-foreground md:text-3xl">
            {counts?.servers ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h3 className="text-xs font-medium text-muted-foreground mb-2 md:text-sm">
            Web Services
          </h3>
          <p className="text-2xl font-bold text-foreground md:text-3xl">
            {counts?.webServices ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h3 className="text-xs font-medium text-muted-foreground mb-2 md:text-sm">
            Domains
          </h3>
          <p className="text-2xl font-bold text-foreground md:text-3xl">
            {counts?.domains ?? 0}
          </p>
        </div>
      </div>
    </main>
  )
}
