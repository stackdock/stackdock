import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/operations/backups")({
  component: BackupsPage,
})

function BackupsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold">Backups</h2>
        <p className="text-muted-foreground text-sm">
          Backup management and scheduling
        </p>
      </div>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-600">Backups management coming soon...</p>
      </div>
    </div>
  )
}
