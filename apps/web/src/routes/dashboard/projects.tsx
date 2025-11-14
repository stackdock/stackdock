import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router"
import { Code } from "lucide-react"

export const Route = createFileRoute("/dashboard/projects")({
  component: ProjectsPage,
})

function ProjectsPage() {
  const router = useRouterState()
  const isIndexRoute = router.location.pathname === "/dashboard/projects"
  
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      {isIndexRoute && (
        <>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              Projects
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Manage your projects across all platforms.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/dashboard/projects/code"
              className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Code className="h-5 w-5" />
                <h2 className="font-semibold">Code</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                GitHub repositories, branches, and issues
              </p>
            </Link>
            
            {/* Future placeholders (commented out for now): */}
            {/* 
            <Link
              to="/dashboard/projects/calendar"
              className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-5 w-5" />
                <h2 className="font-semibold">Calendar</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Task management and planning
              </p>
            </Link>
            
            <Link
              to="/dashboard/projects/content"
              className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5" />
                <h2 className="font-semibold">Content</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Content management and documentation
              </p>
            </Link>
            
            <Link
              to="/dashboard/projects/social"
              className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5" />
                <h2 className="font-semibold">Social</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Social media integration and analytics
              </p>
            </Link>
            */}
          </div>
        </>
      )}
      <Outlet />
    </main>
  )
}
