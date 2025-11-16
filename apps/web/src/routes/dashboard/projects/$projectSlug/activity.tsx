import { createFileRoute } from "@tanstack/react-router"
import { useParams } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"

export const Route = createFileRoute("/dashboard/projects/$projectSlug/activity")({
  component: ProjectActivityPage,
})

function ProjectActivityPage() {
  const { projectSlug } = useParams({ from: "/dashboard/projects/$projectSlug/activity" })
  const project = useQuery(api["projects/queries"].getProjectBySlug, { slug: projectSlug })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">Activity</h2>
        <p className="text-muted-foreground text-xs">
          Ship's log for {project?.name || projectSlug}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">Project activity coming soon...</p>
      </div>
    </div>
  )
}
