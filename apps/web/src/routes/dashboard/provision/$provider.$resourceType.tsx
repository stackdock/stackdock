/**
 * Resource Provision Form Route
 * 
 * Resource provisioning form page with XState machine integration.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { ProvisionForm } from "@/components/provisioning/provision-form"
import type { ResourceType } from "@/machines/provision-resource.machine"

export const Route = createFileRoute("/dashboard/provision/$provider.$resourceType")({
  component: ResourceProvisionPage,
})

function ResourceProvisionPage() {
  const { provider, resourceType } = Route.useParams()
  const navigate = useNavigate()
  const docks = useQuery(api["docks/queries"].listDocks)

  // Find first dock for this provider (could be enhanced to let user select)
  const dock = docks?.find((d) => d.provider === provider)

  if (docks === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!dock) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link to="/dashboard/provision/$provider" params={{ provider }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">
            No dock found for provider: {provider}. Please configure a dock first.
          </p>
        </div>
      </div>
    )
  }

  // Validate resourceType
  const validResourceTypes: ResourceType[] = ['server', 'webService', 'database', 'domain']
  if (!validResourceTypes.includes(resourceType as ResourceType)) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link to="/dashboard/provision/$provider" params={{ provider }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">
            Invalid resource type: {resourceType}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Button variant="ghost" asChild className="w-fit">
        <Link to="/dashboard/provision/$provider" params={{ provider }}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      <ProvisionForm
        dockId={dock._id}
        resourceType={resourceType as ResourceType}
        provider={provider}
        onSubmit={(result) => {
          // Navigate to status page
          navigate({
            to: "/dashboard/provision/$provider/$resourceType/$provisionId",
            params: {
              provider,
              resourceType: resourceType as ResourceType,
              provisionId: result.provisionId,
            },
          })
        }}
        onCancel={() => {
          navigate({
            to: "/dashboard/provision/$provider",
            params: { provider },
          })
        }}
      />
    </div>
  )
}
