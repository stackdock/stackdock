import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { DocksTable } from "@/components/docks/docks-table"
import { Plug } from "lucide-react"

export const Route = createFileRoute("/dashboard/docks/connected")({
  component: ConnectedDocksPage,
})

function ConnectedDocksPage() {
  const docks = useQuery(api["docks/queries"].listDocks)

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Connected Docks
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Manage your infrastructure provider connections
        </p>
      </div>
      
      {/* Docks Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Docks
          </h2>
        </div>
        <DocksTable data={docks} />
      </div>
    </main>
  )
}
