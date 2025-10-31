import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/domains")({
  component: DomainsPage,
})

function DomainsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">Domains</h1>
        <p className="text-gray-600 mt-2">
          Manage your domain names and DNS configuration.
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-600">No domains yet. Connect a dock to get started.</p>
      </div>
    </div>
  )
}

