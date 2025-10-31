import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Authenticated } from "convex/react"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
})

function DashboardHome() {
  const currentUser = useQuery(api.users.getCurrent)
  const counts = useQuery(api["resources/queries"].getCounts)

  return (
    <Authenticated>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to StackDock. Manage your infrastructure from one place.
          </p>
        </div>

        {currentUser && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-black mb-2">
              Your Account
            </h2>
            <p className="text-gray-600">
              <span className="font-medium">Name:</span> {currentUser.name}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Email:</span> {currentUser.email}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Servers
            </h3>
            <p className="text-2xl font-bold text-black">
              {counts?.servers ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Web Services
            </h3>
            <p className="text-2xl font-bold text-black">
              {counts?.webServices ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Domains
            </h3>
            <p className="text-2xl font-bold text-black">
              {counts?.domains ?? 0}
            </p>
          </div>
        </div>
      </div>
    </Authenticated>
  )
}
