import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Database } from "lucide-react"
import { DatabasesTable } from "@/components/resources/databases-table"

export const Route = createFileRoute("/dashboard/infrastructure/data")({
  component: DataPage,
})

function DataPage() {
  const databases = useQuery(api["resources/queries"].listDatabases)
  const databasesList = databases || []

  if (databases === undefined) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            Data
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Databases and storage
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="text-muted-foreground">Loading databases...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Data
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Databases and storage
        </p>
      </div>
      
      {/* Databases Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            {databasesList.length} {databasesList.length === 1 ? 'Database' : 'Databases'}
          </h2>
        </div>
        <DatabasesTable data={databases} />
      </div>
    </main>
  )
}
