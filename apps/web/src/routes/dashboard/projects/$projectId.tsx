import { createFileRoute, Outlet } from "@tanstack/react-router"
import { useParams } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/projects/$projectId")({
  component: ProjectLayout,
})

function ProjectLayout() {
  const { projectId } = useParams({ from: "/dashboard/projects/$projectId" })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">
          Project: {projectId}
        </h1>
        <p className="text-muted-foreground">
          Mission briefing - detailed view of this project
        </p>
      </div>
      <Outlet />
    </div>
  )
}
