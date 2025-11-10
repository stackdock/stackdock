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
        <h2 className="text-base font-semibold">Resources</h2>
        <p className="text-muted-foreground text-xs">
          Unified list of all resources linked to project {projectId}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">Project resources coming soon...</p>
      </div>
    </div>
  )
}
