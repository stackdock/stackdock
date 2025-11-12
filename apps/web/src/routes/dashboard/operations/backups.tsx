import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { BackupSchedulesTable } from "@/components/operations/backup-schedules-table"
import { BackupIntegrationsTable } from "@/components/operations/backup-integrations-table"

export const Route = createFileRoute("/dashboard/operations/backups")({
  component: BackupsPage,
})

function BackupsPage() {
  // Get backup data from database (synced during dock sync)
  // undefined = loading, [] = no data, [data] = has data
  const schedules = useQuery(api["docks/queries"].getBackupSchedules)
  const integrations = useQuery(api["docks/queries"].getBackupIntegrations)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">Backups</h2>
        <p className="text-muted-foreground text-xs">
          View backup schedules and integrations across all your infrastructure providers.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold mb-4">Backup Schedules</h3>
          <BackupSchedulesTable data={schedules} />
        </section>

        <section>
          <h3 className="text-sm font-semibold mb-4">Backup Integrations</h3>
          <BackupIntegrationsTable data={integrations} />
        </section>
      </div>
    </div>
  )
}
