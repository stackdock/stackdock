import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/operations/workflows")({
  component: WorkflowsPage,
})

function WorkflowsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">Workflows</h2>
        <p className="text-muted-foreground text-xs">
          Automated workflows and task management
        </p>
      </div>
      
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">Workflows coming soon...</p>
      </div>
    </div>
  )
}
