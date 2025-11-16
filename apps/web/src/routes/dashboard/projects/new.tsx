"use client"

import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation, useQuery, useConvex } from "convex/react"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export const Route = createFileRoute("/dashboard/projects/new")({
  component: NewProjectPage,
})

function NewProjectPage() {
  const navigate = useNavigate()
  const convex = useConvex()
  const currentOrgId = useQuery(api.organizations.getCurrentOrgId)
  const teams = useQuery(
    api["teams/queries"].listTeams,
    currentOrgId ? { orgId: currentOrgId } : "skip"
  )
  const clients = useQuery(
    api["clients/queries"].listClients,
    currentOrgId ? { orgId: currentOrgId } : "skip"
  )

  const [name, setName] = useState("")
  const [teamId, setTeamId] = useState("")
  const [clientId, setClientId] = useState("")
  const [linearId, setLinearId] = useState("")
  const [githubRepo, setGithubRepo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createProject = useMutation(api["projects/mutations"].createProject)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!currentOrgId) {
      setError("No organization found. Please create an organization first.")
      return
    }

    if (!name.trim()) {
      setError("Project name is required")
      return
    }

    if (!teamId) {
      setError("Team is required")
      return
    }

    // Client is now optional - removed validation

    setIsSubmitting(true)

    try {
      const projectId = await createProject({
        orgId: currentOrgId,
        name: name.trim(),
        teamId: teamId as Id<"teams">,
        clientId: clientId && clientId !== "none" ? (clientId as Id<"clients">) : undefined, // Optional
        linearId: linearId.trim() || undefined,
        githubRepo: githubRepo.trim() || undefined,
      })

      toast.success("Project created successfully")
      // Fetch project to get slug for navigation
      const createdProject = await convex.query(api["projects/queries"].getProject, { projectId })
      if (createdProject) {
        navigate({ to: "/dashboard/projects/$projectSlug", params: { projectSlug: createdProject.slug } })
      } else {
        navigate({ to: "/dashboard/projects/view" })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create project"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          New Project
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Create a new project and link infrastructure resources
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-destructive text-xs">{error}</p>
        </div>
      )}

      {currentOrgId === null && (
        <Card>
          <CardHeader>
            <CardTitle>No Organization Found</CardTitle>
            <CardDescription>
              You need to create an organization before you can create projects.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {currentOrgId && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>
              Enter project details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Website Redesign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team">Team *</Label>
                <Select value={teamId} onValueChange={setTeamId} disabled={!teams}>
                  <SelectTrigger id="team">
                    <SelectValue placeholder={teams ? "Select team" : "Loading teams..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team) => (
                      <SelectItem key={team._id} value={team._id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {teams && teams.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No teams found. Create a team first.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client (Optional)</Label>
                <Select value={clientId || undefined} onValueChange={(value) => setClientId(value === "none" ? "" : value)} disabled={!clients}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder={clients ? "Select client (optional)" : "Loading clients..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clients?.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clients && clients.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No clients found. You can create a project without a client.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linearId">Linear ID (Optional)</Label>
                <Input
                  id="linearId"
                  placeholder="e.g., PROJ-123"
                  value={linearId}
                  onChange={(e) => setLinearId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubRepo">GitHub Repository (Optional)</Label>
                <Input
                  id="githubRepo"
                  placeholder="e.g., owner/repo-name"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Format: owner/repo-name (e.g., github/example-repo)
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/dashboard/projects/code" })}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
