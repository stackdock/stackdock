import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
})

function DashboardHome() {
  const counts = useQuery(api["resources/queries"].getCounts)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Full oversight dashboard - global alert feed, summary widgets, recent activity from all projects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Servers
          </h3>
          <p className="text-2xl font-bold text-black">
            {counts?.servers ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Web Services
          </h3>
          <p className="text-2xl font-bold text-black">
            {counts?.webServices ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Domains
          </h3>
          <p className="text-2xl font-bold text-black">
            {counts?.domains ?? 0}
          </p>
        </div>
      </div>
    </div>
  )
}
