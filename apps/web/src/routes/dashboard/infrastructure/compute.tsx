import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Server, Cloud } from "lucide-react"
import { ServersTable } from "@/components/resources/servers-table"
import { WebServicesTable } from "@/components/resources/web-services-table"

export const Route = createFileRoute("/dashboard/infrastructure/compute")({
  component: ComputePage,
})

function ComputePage() {
  const servers = useQuery(api["resources/queries"].listServers)
  const webServices = useQuery(api["resources/queries"].listWebServices)
  const serversList = servers || []
  const webServicesList = webServices || []

  if (servers === undefined || webServices === undefined) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            Compute
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Servers and PaaS applications
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="text-muted-foreground">Loading resources...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Compute
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Servers and PaaS applications
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Servers Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Server className="h-5 w-5" />
              {serversList.length} {serversList.length === 1 ? 'Server' : 'Servers'}
            </h2>
          </div>
          <ServersTable data={servers} />
        </div>
        
        {/* Web Services Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              {webServicesList.length} {webServicesList.length === 1 ? 'Web Service' : 'Web Services'}
            </h2>
          </div>
          <WebServicesTable data={webServices} />
        </div>
      </div>
    </main>
  )
}
