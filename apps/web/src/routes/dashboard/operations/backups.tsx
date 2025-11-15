import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Clock, Archive } from "lucide-react"
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
  const schedulesList = schedules || []
  const integrationsList = integrations || []

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Backups
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          View your backups, schedules, and their integrations
        </p>
      </div>

      <div className="space-y-4">
        {/* Backup Schedules Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Backup Schedules
            </h2>
            {schedulesList.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {schedulesList.length} {schedulesList.length === 1 ? 'schedule' : 'schedules'}
              </span>
            )}
          </div>
          <BackupSchedulesTable data={schedules} />
        </div>

        {/* Backup Integrations Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Backup Integrations
            </h2>
            {integrationsList.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {integrationsList.length} {integrationsList.length === 1 ? 'integration' : 'integrations'}
              </span>
            )}
          </div>
          <BackupIntegrationsTable data={integrations} />
        </div>
      </div>
    </main>
  )
}
