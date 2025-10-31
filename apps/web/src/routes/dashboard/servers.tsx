import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/servers")({
  component: ServersPage,
})

function ServersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">Servers</h1>
        <p className="text-gray-600 mt-2">
          Manage your infrastructure servers across all providers.
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-600">No servers yet. Connect a dock to get started.</p>
      </div>
    </div>
  )
}

