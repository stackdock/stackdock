import { createFileRoute } from "@tanstack/react-router"
import { useParams } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"

export const Route = createFileRoute("/dashboard/projects/$projectId/settings")({
  component: ProjectSettingsPage,
})

function ProjectSettingsPage() {
  const { projectSlug } = useParams({ from: "/dashboard/projects/$projectSlug/settings" })
  const project = useQuery(api["projects/queries"].getProjectBySlug, { slug: projectSlug })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">Settings</h2>
        <p className="text-muted-foreground text-xs">
          Project name, collaborators, etc. for {project?.name || projectSlug}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">Project settings coming soon...</p>
      </div>
    </div>
  )
}
