/**
 * Edit Project Dialog Component
 * 
 * Allows editing project details
 */

"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery, useConvex } from "convex/react"
import { useNavigate } from "@tanstack/react-router"
import { api } from "convex/_generated/api"
import type { Doc, Id } from "convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface EditProjectDialogProps {
  projectId: Id<"projects">
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectDialog({
  projectId,
  open,
  onOpenChange,
}: EditProjectDialogProps) {
  const navigate = useNavigate()
  const convex = useConvex()
  const project = useQuery(api["projects/queries"].getProject, { projectId })
  const teams = useQuery(
    api["teams/queries"].listTeams,
    project?.orgId ? { orgId: project.orgId } : "skip"
  )
  const clients = useQuery(
    api["clients/queries"].listClients,
    project?.orgId ? { orgId: project.orgId } : "skip"
  )

  const [name, setName] = useState("")
  const [teamId, setTeamId] = useState("")
  const [clientId, setClientId] = useState("")
  const [linearId, setLinearId] = useState("")
  const [githubRepo, setGithubRepo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateProject = useMutation(api["projects/mutations"].updateProject)

  // Pre-populate form when project loads
  useEffect(() => {
    if (project) {
      setName(project.name || "")
      setTeamId(project.teamId || "")
      setClientId(project.clientId || "")
      setLinearId(project.linearId || "")
      setGithubRepo(project.githubRepo || "")
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Form validation
    if (!name.trim()) {
      toast.error("Project name is required")
      return
    }
    if (!teamId) {
      toast.error("Team is required")
      return
    }
    // Client is optional - removed validation

    setIsSubmitting(true)

    try {
      await updateProject({
        projectId,
        name: name.trim(),
        teamId: teamId as Id<"teams">,
        clientId: clientId && clientId !== "none" ? (clientId as Id<"clients">) : undefined,
        linearId: linearId.trim() || undefined,
        githubRepo: githubRepo.trim() || undefined,
      })

      // Fetch updated project to get new slug if name changed
      const updatedProject = await convex.query(api["projects/queries"].getProject, { projectId })
      if (updatedProject && name.trim() !== project?.name) {
        // Navigate to new slug if name changed
        navigate({ to: "/dashboard/projects/$projectSlug", params: { projectSlug: updatedProject.slug } })
      }

      toast.success("Project updated successfully")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update project")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!project) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Project Name</Label>
            <Input
              id="edit-name"
              placeholder="e.g., Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-team">Team</Label>
            <Select value={teamId} onValueChange={setTeamId} disabled={!teams}>
              <SelectTrigger id="edit-team">
                <SelectValue placeholder={teams ? "Select team" : "Loading teams..."} />
              </SelectTrigger>
              <SelectContent>
                {teams?.map((team: Doc<"teams">) => (
                  <SelectItem key={team._id} value={team._id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client">Client (Optional)</Label>
            <Select {...(clientId ? { value: clientId } : {})} onValueChange={(value) => setClientId(value === "none" ? "" : value)} disabled={!clients}>
              <SelectTrigger id="edit-client">
                <SelectValue placeholder={clients ? "Select client (optional)" : "Loading clients..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {clients?.map((client: Doc<"clients">) => (
                  <SelectItem key={client._id} value={client._id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-linearId">Linear ID</Label>
            <Input
              id="edit-linearId"
              placeholder="e.g., PROJ-123"
              value={linearId}
              onChange={(e) => setLinearId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-githubRepo">GitHub Repository</Label>
            <Input
              id="edit-githubRepo"
              placeholder="e.g., owner/repo-name"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Format: owner/repo-name (e.g., github/example-repo)
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
