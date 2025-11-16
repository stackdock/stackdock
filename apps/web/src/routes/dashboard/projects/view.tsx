"use client"

import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Inbox, Plus, BookOpen } from "lucide-react"
import { ProjectsTable } from "@/components/projects/projects-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/dashboard/projects/view")({
  component: ProjectsViewPage,
})

function ProjectsViewPage() {
  const navigate = useNavigate()
  const projects = useQuery(api["projects/queries"].listProjects)
  const projectsList = projects || []
  const hasProjects = projectsList.length > 0

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              {hasProjects ? "Projects" : "Make your first project"}
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              {hasProjects ? "View and manage your projects" : "Get started by creating your first project"}
            </p>
          </div>
          {hasProjects && (
            <div className="flex gap-2">
              <Button onClick={() => navigate({ to: "/dashboard/projects/new" })}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
              <Button variant="outline" onClick={() => {/* TODO: Open documentation */}}>
                <BookOpen className="mr-2 h-4 w-4" />
                Documentation
              </Button>
            </div>
          )}
        </div>
      </div>

      {!hasProjects ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Make your first project</CardTitle>
            <CardDescription>
              Projects help you organize your infrastructure resources and track their status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={() => navigate({ to: "/dashboard/projects/new" })}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
              <Button variant="outline" onClick={() => {/* TODO: Open documentation */}}>
                <BookOpen className="mr-2 h-4 w-4" />
                Documentation
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              {projectsList.length} {projectsList.length === 1 ? 'Project' : 'Projects'}
            </h2>
          </div>
          <ProjectsTable data={projects} />
        </div>
      )}
    </main>
  )
}
