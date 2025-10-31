import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"

export const Route = createFileRoute("/dashboard/operations/networking")({
  component: NetworkingPage,
})

function NetworkingPage() {
  const domains = useQuery(api["resources/queries"].listDomains)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold">Networking</h2>
        <p className="text-muted-foreground text-sm">
          Domain management and DNS
        </p>
      </div>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Domains</h3>
        <pre className="bg-gray-50 border border-gray-200 rounded p-4 overflow-auto text-sm">
          {JSON.stringify(domains || [], null, 2)}
        </pre>
      </div>
    </div>
  )
}
