import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { ServersTable } from "@/components/resources/servers-table"
import { WebServicesTable } from "@/components/resources/web-services-table"

export const Route = createFileRoute("/dashboard/infrastructure/compute")({
  component: ComputePage,
})

function ComputePage() {
  const servers = useQuery(api["resources/queries"].listServers)
  const webServices = useQuery(api["resources/queries"].listWebServices)

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold">Compute</h2>
        <p className="text-muted-foreground text-sm">
          Servers and PaaS applications
        </p>
      </div>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-base font-medium mb-4">Servers</h3>
          <ServersTable data={servers} />
        </div>
        
        <div>
          <h3 className="text-base font-medium mb-4">Web Services</h3>
          <WebServicesTable data={webServices} />
        </div>
      </div>
    </div>
  )
}
