import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/docks")({
  component: DocksPage,
})

function DocksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">Docks</h1>
        <p className="text-gray-600 mt-2">
          Connect and manage your infrastructure provider integrations.
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-600">No docks connected yet. Add a provider to get started.</p>
      </div>
    </div>
  )
}

