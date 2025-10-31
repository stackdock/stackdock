import { createFileRoute } from "@tanstack/react-router"
import { useParams } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/projects/$projectId/activity")({
  component: ProjectActivityPage,
})

function ProjectActivityPage() {
  const { projectId } = useParams({ from: "/dashboard/projects/$projectId/activity" })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold">Activity</h2>
        <p className="text-muted-foreground text-sm">
          Ship's log for project {projectId}
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-600">Project activity coming soon...</p>
      </div>
    </div>
  )
}
