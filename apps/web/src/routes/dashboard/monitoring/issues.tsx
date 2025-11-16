/**
 * Issues Monitoring Page
 * 
 * Displays error issues from all providers in a unified table
 */

import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { IssuesTable } from "@/components/monitoring/issues-table"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/dashboard/monitoring/issues")({
  component: IssuesPage,
})

function IssuesPage() {
  const issues = useQuery(api["monitoring/queries"].listIssues)
  const issuesList = issues || []

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Error Issues
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Monitor and track errors and exceptions from all your applications
        </p>
      </div>

      {issuesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No issues found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Connect a monitoring provider dock (like Sentry) to start tracking errors.
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
              <AlertCircle className="h-5 w-5" />
              {issuesList.length} {issuesList.length === 1 ? "Issue" : "Issues"}
            </h2>
          </div>
          <IssuesTable data={issues} />
        </div>
      )}
    </main>
  )
}
