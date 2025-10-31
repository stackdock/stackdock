import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/infrastructure/data")({
  component: DataPage,
})

function DataPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold">Data</h2>
        <p className="text-muted-foreground text-sm">
          Databases and storage
        </p>
      </div>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-600">Databases list coming soon...</p>
      </div>
    </div>
  )
}
