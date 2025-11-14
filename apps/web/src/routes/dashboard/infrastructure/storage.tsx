import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Archive } from "lucide-react"

export const Route = createFileRoute("/dashboard/infrastructure/storage")({
  component: StoragePage,
})

function StoragePage() {
  // TODO: Query storage resources when available
  // const storage = useQuery(api["resources/queries"].listStorage)
  // const storageList = storage || []

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Storage
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          View your storage resources
        </p>
      </div>
      
      {/* Storage Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Storage Resources
          </h2>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="text-muted-foreground">Storage resources coming soon...</p>
        </div>
      </div>
    </main>
  )
}
