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
        <h2 className="text-lg font-semibold">User</h2>
        <p className="text-muted-foreground text-sm">
          Manage your user settings
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <pre className="bg-gray-50 border border-gray-200 rounded p-4 overflow-auto text-sm">
          {JSON.stringify(currentUser || {}, null, 2)}
        </pre>
      </div>
    </div>
  )
}
