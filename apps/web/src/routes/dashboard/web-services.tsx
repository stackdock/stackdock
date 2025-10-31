import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Authenticated } from "convex/react"

export const Route = createFileRoute("/dashboard/web-services")({
  component: WebServicesPage,
})

function WebServicesPage() {
  const webServices = useQuery(api["resources/queries"].listWebServices)

  return (
    <Authenticated>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Web Services</h1>
          <p className="text-gray-600 mt-2">
            Manage your websites, applications, and deployments.
          </p>
        </div>

        {webServices === undefined ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : webServices.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-gray-600">No web services yet. Connect a dock to get started.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-black mb-4">
              {webServices.length} Web Service{webServices.length !== 1 ? "s" : ""}
            </h2>
            <pre className="bg-gray-50 border border-gray-200 rounded p-4 overflow-auto text-sm">
              {JSON.stringify(webServices, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Authenticated>
  )
}
