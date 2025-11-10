import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { DomainsTable } from "@/components/resources/domains-table"

export const Route = createFileRoute("/dashboard/operations/networking")({
  component: NetworkingPage,
})

function NetworkingPage() {
  const domains = useQuery(api["resources/queries"].listDomains)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">Networking</h2>
        <p className="text-muted-foreground text-xs">
          Domain management and DNS
        </p>
      </div>
      
      <DomainsTable data={domains} />
    </div>
  )
}
