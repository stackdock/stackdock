"use client"

import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthActivityTable } from "@/components/auth/AuthActivityTable"
import { Activity, Shield } from "lucide-react"

export const Route = createFileRoute("/dashboard/settings/activity")({
  component: ActivityPage,
})

function ActivityPage() {
  const currentOrgId = useQuery(api.organizations.getCurrentOrgId)

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl flex items-center gap-2">
          <Activity className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
          Activity
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          View authentication activity and security events for your organization
        </p>
      </div>

      {currentOrgId === undefined ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      ) : currentOrgId === null ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              No Organization
            </CardTitle>
            <CardDescription>
              You need to create an organization to view activity logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity logs track authentication events and security actions for your organization.
              Create an organization in the Organization settings to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AuthActivityTable orgId={currentOrgId} />
      )}
    </main>
  )
}
