import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/operations/backups")({
  component: BackupsPage,
})

function BackupsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">Backups</h2>
        <p className="text-muted-foreground text-xs">
          Backup management and scheduling
        </p>
      </div>
      
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">Backups management coming soon...</p>
      </div>
    </div>
  )
}
