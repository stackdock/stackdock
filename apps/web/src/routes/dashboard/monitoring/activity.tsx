import { createFileRoute } from "@tanstack/react-router"
import { Activity } from "lucide-react"

export const Route = createFileRoute("/dashboard/monitoring/activity")({
  component: ActivityPage,
})

function ActivityPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Activity
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          System activity and event logs
        </p>
      </div>
      
      {/* Activity Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Logs
          </h2>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="text-muted-foreground">Activity logs coming soon...</p>
        </div>
      </div>
    </main>
  )
}
