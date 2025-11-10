/**
 * Provider Provision Page Route
 * 
 * Provider-specific provisioning page - select resource type.
 */

import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Link, useNavigate } from "@tanstack/react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Server, Cloud, Database, Globe, Loader2, ArrowLeft } from "lucide-react"

export const Route = createFileRoute("/dashboard/provision/$provider")({
  component: ProviderProvisionPage,
})

const RESOURCE_TYPES = [
  { id: 'server', label: 'Server', icon: Server, description: 'Provision compute instances (EC2, Droplets, etc.)' },
  { id: 'webService', label: 'Web Service', icon: Cloud, description: 'Provision web services (S3, Workers, etc.)' },
  { id: 'database', label: 'Database', icon: Database, description: 'Provision databases (RDS, Managed DBs, etc.)' },
  { id: 'domain', label: 'Domain', icon: Globe, description: 'Provision domains and DNS zones' },
] as const

function ProviderProvisionPage() {
  const { provider } = Route.useParams()
  const navigate = useNavigate()
  const docks = useQuery(api["docks/queries"].listDocks)

  // Find docks for this provider
  const providerDocks = docks?.filter((dock) => dock.provider === provider) || []

  if (docks === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (providerDocks.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link to="/dashboard/provision">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No docks configured for provider: {provider}
              </p>
              <Button asChild>
                <Link to="/dashboard/settings/docks">
                  Connect Provider
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link to="/dashboard/provision">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold capitalize">Provision on {provider}</h2>
          <p className="text-muted-foreground text-xs">
            Select a resource type to provision
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RESOURCE_TYPES.map((resourceType) => {
          const Icon = resourceType.icon
          return (
            <Card
              key={resourceType.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                navigate({
                  to: "/dashboard/provision/$provider/$resourceType",
                  params: { provider, resourceType: resourceType.id },
                })
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {resourceType.label}
                </CardTitle>
                <CardDescription>{resourceType.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* Available Docks */}
      <div className="mt-8">
        <h3 className="text-xs font-medium mb-4">Available Docks</h3>
        <div className="space-y-2">
          {providerDocks.map((dock) => (
            <Card key={dock._id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{dock.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: {dock.lastSyncStatus}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
