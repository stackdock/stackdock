import { createFileRoute } from "@tanstack/react-router"
import { useParams } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/projects/$projectId/overview")({
  component: ProjectOverviewPage,
})

function ProjectOverviewPage() {
  const { projectId } = useParams({ from: "/dashboard/projects/$projectId/overview" })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold">Overview</h2>
        <p className="text-muted-foreground text-sm">
          Dashboard for project {projectId}
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-600">Project overview coming soon...</p>
      </div>
    </div>
  )
}
