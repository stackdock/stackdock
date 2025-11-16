import { createFileRoute } from "@tanstack/react-router"
import { AlertCircle } from "lucide-react"

export const Route = createFileRoute("/dashboard/monitoring/errors")({
  component: ErrorsPage,
})

function ErrorsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Errors
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Error tracking and diagnostics
        </p>
      </div>
      
      {/* Errors Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Logs
          </h2>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="text-muted-foreground">Error logs coming soon...</p>
        </div>
      </div>
    </main>
  )
}
