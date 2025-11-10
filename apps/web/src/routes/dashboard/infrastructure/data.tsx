import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { DatabasesTable } from "@/components/resources/databases-table"

export const Route = createFileRoute("/dashboard/infrastructure/data")({
  component: DataPage,
})

function DataPage() {
  const databases = useQuery(api["resources/queries"].listDatabases)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">Data</h2>
        <p className="text-muted-foreground text-xs">
          Databases and storage
        </p>
      </div>
      
      <DatabasesTable data={databases} />
    </div>
  )
}
