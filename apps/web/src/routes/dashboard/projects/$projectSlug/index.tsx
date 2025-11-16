"use client"

import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Edit, Link as LinkIcon, Unlink, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { EditProjectDialog } from "@/components/projects/EditProjectDialog"
import { LinkResourceDialog } from "@/components/projects/LinkResourceDialog"
import { ProjectResourcesTable } from "@/components/projects/ProjectResourcesTable"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export const Route = createFileRoute("/dashboard/projects/$projectSlug/")({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { projectSlug } = Route.useParams()
  const navigate = useNavigate()
  
  const project = useQuery(api["projects/queries"].getProjectBySlug, { slug: projectSlug })
  const resources = useQuery(
    api["projects/queries"].getProjectResources,
    project ? { projectId: project._id } : "skip"
  )
  const teams = useQuery(
    api["teams/queries"].listTeams,
    project?.orgId ? { orgId: project.orgId } : "skip"
  )
  const clients = useQuery(
    api["clients/queries"].listClients,
    project?.orgId ? { orgId: project.orgId } : "skip"
  )

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [unlinkResource, setUnlinkResource] = useState<{
    resourceTable: "servers" | "webServices" | "domains" | "databases"
    resourceId: string
    resourceName: string
  } | null>(null)

  const unlinkMutation = useMutation(api["projects/mutations"].unlinkResource)

  const handleUnlink = async () => {
    if (!unlinkResource) return

    if (!project) return

    try {
      await unlinkMutation({
        projectId: project._id,
        resourceTable: unlinkResource.resourceTable,
        resourceId: unlinkResource.resourceId,
      })
      toast.success("Resource unlinked successfully")
      setUnlinkResource(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unlink resource")
    }
  }

  const teamName = teams?.find((t) => t._id === project?.teamId)?.name || "Unknown"
  const clientName = clients?.find((c) => c._id === project?.clientId)?.name || "Unknown"

  if (project === undefined || resources === undefined) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    )
  }

  if (project === null) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-destructive">Project not found</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              {project.name}
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Project details and linked resources
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button onClick={() => setLinkDialogOpen(true)}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Link Resource
            </Button>
          </div>
        </div>
      </div>

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Basic information about this project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Team</p>
              <p className="text-sm">{teamName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Client</p>
              <p className="text-sm">{clientName}</p>
            </div>
            {project.linearId && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Linear ID</p>
                <p className="text-sm">{project.linearId}</p>
              </div>
            )}
            {project.githubRepo && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">GitHub Repository</p>
                <p className="text-sm font-mono">{project.githubRepo}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Linked Resources */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Linked Resources ({resources?.length || 0})
          </h2>
        </div>
        <ProjectResourcesTable
          resources={resources}
          onUnlink={(resourceTable, resourceId, resourceName) => {
            setUnlinkResource({ resourceTable, resourceId, resourceName })
          }}
        />
      </div>

      {/* Edit Dialog */}
      {project && (
        <EditProjectDialog
          projectId={project._id}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}

      {/* Link Resource Dialog */}
      {project && (
        <LinkResourceDialog
          projectId={project._id}
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
        />
      )}

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={!!unlinkResource} onOpenChange={(open) => !open && setUnlinkResource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink "{unlinkResource?.resourceName}" from this project?
              This will not delete the resource, only remove the link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUnlinkResource(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlink} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Unlink className="mr-2 h-4 w-4" />
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
