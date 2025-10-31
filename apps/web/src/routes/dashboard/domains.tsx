import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Authenticated } from "convex/react"

export const Route = createFileRoute("/dashboard/domains")({
  component: DomainsPage,
})

function DomainsPage() {
  const domains = useQuery(api["resources/queries"].listDomains)

  return (
    <Authenticated>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Domains</h1>
          <p className="text-gray-600 mt-2">
            Manage your domain names and DNS configuration.
          </p>
        </div>

        {domains === undefined ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : domains.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-gray-600">No domains yet. Connect a dock to get started.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-black mb-4">
              {domains.length} Domain{domains.length !== 1 ? "s" : ""}
            </h2>
            <pre className="bg-gray-50 border border-gray-200 rounded p-4 overflow-auto text-sm">
              {JSON.stringify(domains, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Authenticated>
  )
}
