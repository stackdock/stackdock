import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/projects")({
  component: ProjectsPage,
})

function ProjectsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Projects
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Logical units. Show me my missions.
        </p>
      </div>
      
      <div className="rounded-lg border border-border bg-card p-4 md:p-6">
        <p className="text-muted-foreground">Projects list coming soon...</p>
      </div>
    </main>
  )
}
