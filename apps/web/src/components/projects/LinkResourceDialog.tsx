/**
 * Link Resource Dialog Component
 * 
 * Allows linking infrastructure resources to a project
 */

"use client"

import { useState, useMemo } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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

type ResourceTable = "servers" | "webServices" | "domains" | "databases"

interface LinkResourceDialogProps {
  projectId: Id<"projects">
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LinkResourceDialog({
  projectId,
  open,
  onOpenChange,
}: LinkResourceDialogProps) {
  const project = useQuery(api["projects/queries"].getProject, { projectId })
  const linkedResources = useQuery(api["projects/queries"].getProjectResources, { projectId })

  const [resourceType, setResourceType] = useState<ResourceTable | "">("")
  const [resourceId, setResourceId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch resources based on selected type
  const servers = useQuery(api["resources/queries"].listServers)
  const webServices = useQuery(api["resources/queries"].listWebServices)
  const domains = useQuery(api["resources/queries"].listDomains)
  const databases = useQuery(api["resources/queries"].listDatabases)

  const linkResource = useMutation(api["projects/mutations"].linkResource)

  // Get available resources for selected type, excluding already linked ones
  const availableResources = useMemo(() => {
    if (!resourceType || !linkedResources) return []

    const linkedIds = new Set(
      linkedResources
        .filter((r) => r.resourceTable === resourceType)
        .map((r) => r.link.resourceId)
    )

    let allResources: any[] = []
    switch (resourceType) {
      case "servers":
        allResources = servers || []
        break
      case "webServices":
        allResources = webServices || []
        break
      case "domains":
        allResources = domains || []
        break
      case "databases":
        allResources = databases || []
        break
    }

    return allResources.filter((r) => !linkedIds.has(r._id))
  }, [resourceType, linkedResources, servers, webServices, domains, databases])

  const getResourceName = (resource: any): string => {
    if (resourceType === "domains") {
      return resource.domainName || "Unknown"
    }
    return resource.name || "Unknown"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resourceType || !resourceId) {
      toast.error("Please select a resource type and resource")
      return
    }

    setIsSubmitting(true)

    try {
      await linkResource({
        projectId,
        resourceTable: resourceType,
        resourceId,
      })

      toast.success("Resource linked successfully")
      setResourceType("")
      setResourceId("")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link resource")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setResourceType("")
    setResourceId("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Resource</DialogTitle>
          <DialogDescription>
            Link an infrastructure resource to this project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resource-type">Resource Type</Label>
            <Select value={resourceType} onValueChange={(value) => {
              setResourceType(value as ResourceTable)
              setResourceId("") // Reset resource selection when type changes
            }}>
              <SelectTrigger id="resource-type">
                <SelectValue placeholder="Select resource type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="servers">Server</SelectItem>
                <SelectItem value="webServices">Web Service</SelectItem>
                <SelectItem value="domains">Domain</SelectItem>
                <SelectItem value="databases">Database</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {resourceType && (
            <div className="space-y-2">
              <Label htmlFor="resource">Resource</Label>
              <Select value={resourceId} onValueChange={setResourceId} disabled={availableResources.length === 0}>
                <SelectTrigger id="resource">
                  <SelectValue
                    placeholder={
                      availableResources.length === 0
                        ? "No available resources"
                        : "Select resource"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableResources.map((resource) => (
                    <SelectItem key={resource._id} value={resource._id}>
                      {getResourceName(resource)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableResources.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  All {resourceType} resources are already linked to this project.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !resourceType || !resourceId || availableResources.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                "Link Resource"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
