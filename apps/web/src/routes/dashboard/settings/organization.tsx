"use client"

import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateOrganizationDialog } from "@/components/dashboard/CreateOrganizationDialog"
import { Badge } from "@/components/ui/badge"
import { Building2, Users } from "lucide-react"

export const Route = createFileRoute("/dashboard/settings/organization")({
  component: OrganizationPage,
})

function OrganizationPage() {
  const organizations = useQuery(api.organizations.list)
  const currentOrgId = useQuery(api.organizations.getCurrentOrgId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Organization</h2>
          <p className="text-muted-foreground text-xs">
            Manage your organization settings
          </p>
        </div>
        <CreateOrganizationDialog />
      </div>

      {organizations === undefined ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      ) : organizations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Organization</CardTitle>
            <CardDescription>
              You need to create an organization to get started. Organizations
              help you manage teams, clients, and infrastructure connections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateOrganizationDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {organizations.map((org) => (
            <Card key={org._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {org.name}
                        {currentOrgId === org._id && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Created {new Date(org._creationTime).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Owner</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
