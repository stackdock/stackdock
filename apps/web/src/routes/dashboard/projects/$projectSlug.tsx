import { createFileRoute, Outlet } from "@tanstack/react-router"
import { useParams } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"

export const Route = createFileRoute("/dashboard/projects/$projectSlug")({
  component: ProjectLayout,
})

function ProjectLayout() {
  const { projectSlug } = useParams({ from: "/dashboard/projects/$projectSlug" })
  const project = useQuery(api["projects/queries"].getProjectBySlug, { slug: projectSlug })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-0.5">
        <h1 className="text-lg font-bold tracking-tight md:text-xl">
          {project?.name || projectSlug}
        </h1>
        <p className="text-muted-foreground">
          Mission briefing - detailed view of this project
        </p>
      </div>
      <Outlet />
    </div>
  )
}
