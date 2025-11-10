/**
 * Provision Status Page Route
 * 
 * Displays provisioning status and progress with real-time updates.
 */

import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { ProvisionStatusCard } from "@/components/provisioning/provision-status-card"
import type { ResourceType } from "@/machines/provision-resource.machine"

export const Route = createFileRoute(
  "/dashboard/provision/$provider/$resourceType/$provisionId"
)({
  component: ProvisionStatusPage,
})

function ProvisionStatusPage() {
  const { provider, resourceType, provisionId } = Route.useParams()

  // Query provisioning status with real-time updates
  const statusData = useQuery(api.provisioning.queries.getProvisionStatus, {
    provisionId: provisionId,
  })

  // Loading state
  if (statusData === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link
            to="/dashboard/provision/$provider/$resourceType"
            params={{ provider, resourceType: resourceType as ResourceType }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Loading provisioning status...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (statusData === null) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link
            to="/dashboard/provision/$provider/$resourceType"
            params={{ provider, resourceType: resourceType as ResourceType }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">
            Unable to load provisioning status. The resource may not exist or you may not have permission to view it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Button variant="ghost" asChild className="w-fit">
        <Link
          to="/dashboard/provision/$provider/$resourceType"
          params={{ provider, resourceType: resourceType as ResourceType }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      <ProvisionStatusCard
        provisionId={provisionId}
        status={statusData.status || 'idle'}
        resourceType={(statusData.resourceType || resourceType) as ResourceType}
        provider={statusData.provider || provider}
        progress={statusData.progress}
        error={statusData.error}
        showDetails={true}
        onRetry={() => {
          // TODO: Implement retry logic (future enhancement)
          console.log('Retry provisioning:', provisionId)
        }}
        onCancel={() => {
          // TODO: Implement cancel logic (future enhancement)
          console.log('Cancel provisioning:', provisionId)
        }}
      />
    </div>
  )
}
