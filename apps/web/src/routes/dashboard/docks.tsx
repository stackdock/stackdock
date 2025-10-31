import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Authenticated } from "convex/react"

export const Route = createFileRoute("/dashboard/docks")({
  component: DocksPage,
})

function DocksPage() {
  const docks = useQuery(api["docks/queries"].listDocks)

  return (
    <Authenticated>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Docks</h1>
          <p className="text-gray-600 mt-2">
            Connect and manage your infrastructure provider integrations.
          </p>
        </div>

        {docks === undefined ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : docks.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-gray-600">No docks connected yet. Add a provider to get started.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-black mb-4">
              {docks.length} Dock{docks.length !== 1 ? "s" : ""}
            </h2>
            <pre className="bg-gray-50 border border-gray-200 rounded p-4 overflow-auto text-sm">
              {JSON.stringify(docks, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Authenticated>
  )
}
