import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/web-services")({
  component: WebServicesPage,
})

function WebServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">Web Services</h1>
        <p className="text-gray-600 mt-2">
          Manage your websites, applications, and deployments.
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-600">No web services yet. Connect a dock to get started.</p>
      </div>
    </div>
  )
}

