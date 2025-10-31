import { createFileRoute } from "@tanstack/react-router"
import { useParams } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/projects/$projectId/resources")({
  component: ProjectResourcesPage,
})

function ProjectResourcesPage() {
  const { projectId } = useParams({ from: "/dashboard/projects/$projectId/resources" })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold">Resources</h2>
        <p className="text-muted-foreground text-sm">
          Unified list of all resources linked to project {projectId}
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-600">Project resources coming soon...</p>
      </div>
    </div>
  )
}
