import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"

export const Route = createFileRoute("/dashboard/infrastructure/compute")({
  component: ComputePage,
})

function ComputePage() {
  const servers = useQuery(api["resources/queries"].listServers)
  const webServices = useQuery(api["resources/queries"].listWebServices)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold">Compute</h2>
        <p className="text-muted-foreground text-sm">
          Servers and PaaS applications
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Servers</h3>
          <pre className="bg-gray-50 border border-gray-200 rounded p-4 overflow-auto text-sm">
            {JSON.stringify(servers || [], null, 2)}
          </pre>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Web Services</h3>
          <pre className="bg-gray-50 border border-gray-200 rounded p-4 overflow-auto text-sm">
            {JSON.stringify(webServices || [], null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
