import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/projects")({
  component: ProjectsPage,
})

function ProjectsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">
          Projects
        </h1>
        <p className="text-muted-foreground">
          Logical units. Show me my missions.
        </p>
      </div>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-600">Projects list coming soon...</p>
      </div>
    </div>
  )
}
