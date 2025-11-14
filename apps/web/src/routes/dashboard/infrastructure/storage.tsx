import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Archive, HardDrive } from "lucide-react"
import { BlockVolumesTable } from "@/components/resources/block-volumes-table"
import { BucketsTable } from "@/components/resources/buckets-table"

export const Route = createFileRoute("/dashboard/infrastructure/storage")({
  component: StoragePage,
})

function StoragePage() {
  const blockVolumes = useQuery(api["resources/queries"].listBlockVolumes)
  const buckets = useQuery(api["resources/queries"].listBuckets)
  
  const volumesList = blockVolumes || []
  const bucketsList = buckets || []

  if (blockVolumes === undefined || buckets === undefined) {
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
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="text-muted-foreground">Loading storage resources...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Storage
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          View your block volumes and object storage buckets
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Block Volumes Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              {volumesList.length} {volumesList.length === 1 ? 'Block Volume' : 'Block Volumes'}
            </h2>
          </div>
          <BlockVolumesTable data={blockVolumes} />
        </div>
        
        {/* Buckets Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Archive className="h-5 w-5" />
              {bucketsList.length} {bucketsList.length === 1 ? 'Bucket' : 'Buckets'}
            </h2>
          </div>
          <BucketsTable data={buckets} />
        </div>
      </div>
    </main>
  )
}
