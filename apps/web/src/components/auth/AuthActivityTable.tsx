/**
 * Auth Activity Table Component
 * 
 * Displays authentication activity logs in a table format
 */

"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import type { Doc, Id } from "convex/_generated/dataModel"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, CheckCircle2, XCircle, User } from "lucide-react"

interface AuthActivityTableProps {
  orgId: Id<"organizations">
}

export function AuthActivityTable({ orgId }: AuthActivityTableProps) {
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [limit, setLimit] = useState<number>(50)

  // Query auth activity
  const activityData = useQuery(
    api.auth.queries.listAuthActivity,
    {
      orgId,
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      endDate: endDate ? new Date(endDate).getTime() : undefined,
      limit,
    }
  )

  // Query stats
  const stats = useQuery(api.auth.queries.getAuthActivityStats, {
    orgId,
    days: 30,
  })

  // Helper to format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = Date.now()
    const diffMs = now - timestamp
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    let relative = ""
    if (diffMins < 1) {
      relative = "just now"
    } else if (diffMins < 60) {
      relative = `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
    } else if (diffHours < 24) {
      relative = `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
    } else if (diffDays < 30) {
      relative = `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
    } else {
      relative = date.toLocaleDateString()
    }

    return {
      relative,
      absolute: date.toLocaleString(),
    }
  }

  // Helper to format action
  const formatAction = (action: string) => {
    return action
      .split(".")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogins}</div>
              <p className="text-xs text-muted-foreground">
                Last {stats.periodDays} days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">
                Unique users logged in
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedAttempts}</div>
              <p className="text-xs text-muted-foreground">
                Authentication failures
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter authentication activity by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Results Limit</Label>
              <Input
                id="limit"
                type="number"
                min="10"
                max="500"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate("")
                setEndDate("")
                setLimit(50)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Activity</CardTitle>
          <CardDescription>
            View authentication events for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activityData === undefined ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">Loading activity...</div>
            </div>
          ) : activityData.logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                No authentication activity found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="w-[100px]">Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityData.logs.map((log: Doc<"auditLogs"> & { userName: string; userEmail: string }) => {
                      const timestamp = formatTimestamp(log.timestamp)
                      return (
                        <TableRow key={log._id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">
                                {timestamp.relative}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {timestamp.absolute}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">
                                {log.userName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {log.userEmail}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">
                              {formatAction(log.action)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {log.result === "success" ? (
                              <Badge
                                variant="outline"
                                className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Success
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400"
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Error
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Info */}
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  Showing {activityData.logs.length} of {activityData.total} events
                </div>
                {activityData.hasMore && (
                  <div className="flex items-center gap-2">
                    <span>More events available</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLimit(limit + 50)}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
