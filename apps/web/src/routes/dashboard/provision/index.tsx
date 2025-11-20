/**
 * Provisioning Hub Route
 * 
 * Lists available providers and resource types for provisioning.
 * Entry point for provisioning flows.
 */

import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import type { Doc } from "convex/_generated/dataModel"
import { Link } from "@tanstack/react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Cloud, Server, Database, Globe, Loader2 } from "lucide-react"

export const Route = createFileRoute("/dashboard/provision/")({
  component: ProvisionHubPage,
})

function ProvisionHubPage() {
  const docks = useQuery(api["docks/queries"].listDocks)
  const currentOrgId = useQuery(api.organizations.getCurrentOrgId)

  // Group docks by provider
  const providersMap = new Map<string, typeof docks>()
  if (docks) {
    docks.forEach((dock: Doc<"docks">) => {
      if (!providersMap.has(dock.provider)) {
        providersMap.set(dock.provider, [])
      }
      providersMap.get(dock.provider)!.push(dock)
    })
  }

  if (docks === undefined || currentOrgId === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (docks.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold">Provision Resources</h2>
          <p className="text-muted-foreground text-xs">
            Provision infrastructure resources through your connected providers
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No docks configured. Connect a provider first to start provisioning.
              </p>
              <Button asChild>
                <Link to="/dashboard/docks/add">
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
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">Provision Resources</h2>
        <p className="text-muted-foreground text-xs">
          Select a provider to start provisioning infrastructure resources
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from(providersMap.entries()).map(([provider, providerDocks]) => (
          <Card key={provider} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                <Cloud className="h-5 w-5" />
                {provider}
              </CardTitle>
              <CardDescription>
                {providerDocks.length} dock{providerDocks.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/dashboard/provision/$provider" params={{ provider }}>
                  Select Provider
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resource Type Quick Links */}
      <div className="mt-8">
        <h3 className="text-xs font-medium mb-4">Common Resource Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-2">
                <Server className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs font-medium">Servers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-2">
                <Cloud className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs font-medium">Web Services</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-2">
                <Database className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs font-medium">Databases</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-2">
                <Globe className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs font-medium">Domains</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
