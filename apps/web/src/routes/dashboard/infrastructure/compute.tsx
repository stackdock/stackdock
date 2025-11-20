import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { useMemo } from "react"
import { Cloud, Cpu } from "lucide-react"
import { ServersTable } from "@/components/resources/servers-table"
import { WebServicesTable } from "@/components/resources/web-services-table"
import { deduplicateServers } from "@/lib/resource-deduplication"

export const Route = createFileRoute("/dashboard/infrastructure/compute")({
  component: ComputePage,
})

function ComputePage() {
  const servers = useQuery(api["resources/queries"].listServers)
  const webServices = useQuery(api["resources/queries"].listWebServices)
  
  // Deduplicate servers for accurate count
  const deduplicatedServers = useMemo(() => {
    if (!servers) return undefined
    return deduplicateServers(servers)
  }, [servers])
  
  const serversList = deduplicatedServers || []
  const webServicesList = webServices || []

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Compute
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          View your IaaS servers and PaaS applications
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Servers Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Cpu className="h-5 w-5" />
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
