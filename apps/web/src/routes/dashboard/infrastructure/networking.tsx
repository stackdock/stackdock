import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Globe } from "lucide-react"
import { DomainsTable } from "@/components/resources/domains-table"

export const Route = createFileRoute("/dashboard/infrastructure/networking")({
  component: NetworkingPage,
})

function NetworkingPage() {
  const domains = useQuery(api["resources/queries"].listDomains)
  const domainsList = domains || []

  if (domains === undefined) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            Networking
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Domain management and DNS
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="text-muted-foreground">Loading domains...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Networking
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Domain management and DNS
        </p>
      </div>
      
      {/* Domains Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domains
          </h2>
          {domainsList.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {domainsList.length} {domainsList.length === 1 ? 'domain' : 'domains'}
            </span>
          )}
        </div>
        <DomainsTable data={domains} />
      </div>
    </main>
  )
}
