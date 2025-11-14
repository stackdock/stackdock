import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Code } from "lucide-react"
import { RepositoriesTable } from "@/components/projects/RepositoriesTable"

export const Route = createFileRoute("/dashboard/projects/code")({
  component: ProjectsCodePage,
})

function ProjectsCodePage() {
  // Query projects with GitHub repos
  const projects = useQuery(api["projects/queries"].listProjects)
  
  // Filter projects that have GitHub repos
  const githubProjects = projects?.filter(p => p.githubRepo && p.fullApiData) || []
  
  if (projects === undefined) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            Code
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage your GitHub repositories, branches, and issues.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </main>
    )
  }
  
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Code
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Manage your GitHub repositories, branches, and issues.
        </p>
      </div>
      
      {/* Repositories Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Repositories
          </h2>
          {githubProjects.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {githubProjects.length} {githubProjects.length === 1 ? 'repository' : 'repositories'}
            </span>
          )}
        </div>
        <RepositoriesTable projects={githubProjects} />
      </div>
    </main>
  )
}
