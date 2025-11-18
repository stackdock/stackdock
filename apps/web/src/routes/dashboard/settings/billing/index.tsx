"use client"

import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, DollarSign, Package, TrendingUp } from "lucide-react"
import { PLANS, formatPrice, formatUsage } from "@/lib/billing"

export const Route = createFileRoute("/dashboard/settings/billing/")({
  component: BillingPage,
})

/**
 * Billing Settings Page
 * 
 * Displays subscription information, usage metrics, and billing management.
 * Currently scaffolded with placeholder data until Autumn is fully integrated.
 */
function BillingPage() {
  const currentOrgId = useQuery(api.organizations.getCurrentOrgId)
  const organizations = useQuery(api.organizations.list)
  
  // TODO: Fetch real subscription data
  // const subscription = useQuery(api.billing.queries.getCurrentSubscription, { orgId: currentOrgId })
  // const usage = useQuery(api.billing.queries.getCurrentUsage, { orgId: currentOrgId })
  // const invoices = useQuery(api.billing.queries.listInvoices, { orgId: currentOrgId })
  
  // Placeholder data
  const currentPlan = PLANS.FREE
  const mockUsage = {
    docks: 0,
    projects: 0,
    teamMembers: 1,
    apiCalls: 0,
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Billing & Subscription
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Manage your subscription, view usage, and billing history
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                You are currently on the {currentPlan.displayName}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg">
              {currentPlan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {formatPrice(currentPlan.price, currentPlan.currency)}
            </span>
            <span className="text-muted-foreground">
              / {currentPlan.interval}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {currentPlan.description}
            </p>
            <div className="pt-2 space-y-1">
              <p className="text-sm font-medium">Plan includes:</p>
              <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                <li>• Up to {currentPlan.features.maxDocks} docks</li>
                <li>• Up to {currentPlan.features.maxProjects} projects</li>
                <li>• Up to {currentPlan.features.maxTeamMembers} team members</li>
                {currentPlan.features.multiCloudSupport && <li>• Multi-cloud support</li>}
                {currentPlan.features.advancedMonitoring && <li>• Advanced monitoring</li>}
                {currentPlan.features.apiAccess && <li>• API access</li>}
              </ul>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button disabled>
              <TrendingUp className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
            <Button variant="outline" disabled>
              View All Plans
            </Button>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              💡 Tip: Upgrade functionality coming soon. For now, StackDock is free and open-source!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage This Month
          </CardTitle>
          <CardDescription>
            Track your usage against plan limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <UsageMetric
              label="Docks"
              usage={mockUsage.docks}
              limit={currentPlan.features.maxDocks}
            />
            <UsageMetric
              label="Projects"
              usage={mockUsage.projects}
              limit={currentPlan.features.maxProjects}
            />
            <UsageMetric
              label="Team Members"
              usage={mockUsage.teamMembers}
              limit={currentPlan.features.maxTeamMembers}
            />
            <UsageMetric
              label="API Calls"
              usage={mockUsage.apiCalls}
              limit={currentPlan.features.maxApiCallsPerMonth}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Method - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Manage your payment information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No payment method on file</p>
                <p className="text-xs text-muted-foreground">
                  Add a payment method to upgrade your plan
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Add Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>
            View past invoices and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No billing history yet</p>
            <p className="text-xs mt-1">
              Invoices will appear here once you subscribe to a paid plan
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

/**
 * Usage Metric Component
 * Displays a single usage metric with progress bar
 */
function UsageMetric({ 
  label, 
  usage, 
  limit 
}: { 
  label: string
  usage: number
  limit: number | undefined
}) {
  const isUnlimited = limit === undefined || limit === -1
  const percentage = isUnlimited ? 0 : Math.min((usage / limit) * 100, 100)
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatUsage(usage, limit)}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}
