import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Cpu, Cloud, Database, Globe, CodeXml, HardDrive, Archive } from "lucide-react"

export const Route = createFileRoute("/dashboard/")({
  component: InsightsPage,
})

function InsightsPage() {
  const servers = useQuery(api["resources/queries"].listServers)
  const webServices = useQuery(api["resources/queries"].listWebServices)
  const domains = useQuery(api["resources/queries"].listDomains)
  const databases = useQuery(api["resources/queries"].listDatabases)
  const projects = useQuery(api["projects/queries"].listProjects)
  const blockVolumes = useQuery(api["resources/queries"].listBlockVolumes)
  const buckets = useQuery(api["resources/queries"].listBuckets)
  
  const serversList = servers || []
  const webServicesList = webServices || []
  const domainsList = domains || []
  const databasesList = databases || []
  const projectsList = projects || []
  const blockVolumesList = blockVolumes || []
  const bucketsList = buckets || []
  
  // Filter out canary and staging subdomains from domains count
  const filteredDomainsList = domainsList.filter(domain => {
    const domainName = domain.domainName.toLowerCase()
    return !domainName.startsWith('canary.') && 
           !domainName.startsWith('staging.') &&
           !domainName.includes('.canary.') &&
           !domainName.includes('.staging.')
  })
  const domainsCount = filteredDomainsList.length
  
  // Filter GitHub projects for repositories count
  const githubProjects = projectsList.filter(p => p.githubRepo && p.fullApiData) || []

  if (servers === undefined || webServices === undefined || domains === undefined || databases === undefined || projects === undefined || blockVolumes === undefined || buckets === undefined) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            Insights
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Overview of all your infrastructure resources and projects
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="text-muted-foreground">Loading insights...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Insights
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Overview of all your infrastructure resources and projects
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-muted-foreground md:text-sm">
              Servers
            </h3>
          </div>
          <p className="text-2xl font-bold text-foreground md:text-3xl">
            {serversList.length}
          </p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-muted-foreground md:text-sm">
              Web Services
            </h3>
          </div>
          <p className="text-2xl font-bold text-foreground md:text-3xl">
            {webServicesList.length}
          </p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-muted-foreground md:text-sm">
              Databases
            </h3>
          </div>
          <p className="text-2xl font-bold text-foreground md:text-3xl">
            {databasesList.length}
          </p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-muted-foreground md:text-sm">
              Block Volumes
            </h3>
          </div>
          <p className="text-2xl font-bold text-foreground md:text-3xl">
            {blockVolumesList.length}
          </p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-muted-foreground md:text-sm">
              Buckets
            </h3>
          </div>
          <p className="text-2xl font-bold text-foreground md:text-3xl">
            {bucketsList.length}
          </p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-muted-foreground md:text-sm">
              Domains
            </h3>
          </div>
          <p className="text-2xl font-bold text-foreground md:text-3xl">
            {domainsCount}
          </p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <CodeXml className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-muted-foreground md:text-sm">
              Repositories
            </h3>
          </div>
          <p className="text-2xl font-bold text-foreground md:text-3xl">
            {githubProjects.length}
          </p>
        </div>
      </div>
    </main>
  )
}
