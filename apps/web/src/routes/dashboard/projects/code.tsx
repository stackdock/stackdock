import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { CodeXml } from "lucide-react"
import { RepositoriesTable } from "@/components/projects/RepositoriesTable"

export const Route = createFileRoute("/dashboard/projects/code")({
  component: ProjectsCodePage,
})

function ProjectsCodePage() {
  // Query GitHub repositories from universal repositories table
  const repositories = useQuery(api["docks/queries"].listGitHubRepositories)
  
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            Code
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            View your repositories
          </p>
        </div>
      </div>
      
      {/* Repositories Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CodeXml className="h-5 w-5" />
            {repositories === undefined 
              ? "Loading..." 
              : `${repositories.length} ${repositories.length === 1 ? 'Repository' : 'Repositories'}`
            }
          </h2>
        </div>
        <RepositoriesTable projects={repositories} />
      </div>
    </main>
  )
}
