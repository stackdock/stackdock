import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"

export const Route = createFileRoute("/dashboard/settings/user")({
  component: UserPage,
})

function UserPage() {
  const currentUser = useQuery(api.users.getCurrent)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">User</h2>
        <p className="text-muted-foreground text-xs">
          Manage your user settings
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <pre className="bg-muted border border-border rounded p-4 overflow-auto text-xs">
          {JSON.stringify(currentUser || {}, null, 2)}
        </pre>
      </div>
    </div>
  )
}
