import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Authenticated } from "convex/react"

export const Route = createFileRoute("/dashboard/servers")({
  component: ServersPage,
})

function ServersPage() {
  const servers = useQuery(api["resources/queries"].listServers)

  return (
    <Authenticated>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Servers</h1>
          <p className="text-gray-600 mt-2">
            Manage your infrastructure servers across all providers.
          </p>
        </div>

        {servers === undefined ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : servers.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-gray-600">No servers yet. Connect a dock to get started.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-black mb-4">
              {servers.length} Server{servers.length !== 1 ? "s" : ""}
            </h2>
            <pre className="bg-gray-50 border border-gray-200 rounded p-4 overflow-auto text-sm">
              {JSON.stringify(servers, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Authenticated>
  )
}
