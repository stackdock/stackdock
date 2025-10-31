import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/operations/workflows")({
  component: WorkflowsPage,
})

function WorkflowsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold">Workflows</h2>
        <p className="text-muted-foreground text-sm">
          Automated workflows and task management
        </p>
      </div>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-600">Workflows coming soon...</p>
      </div>
    </div>
  )
}
