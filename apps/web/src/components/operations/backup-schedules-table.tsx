"use client"

import { useMemo, useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  PaginationState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProviderBadge } from "@/components/resources/shared/provider-badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"

interface BackupSchedule {
  siteId: number
  siteUrl: string // ✅ camelCase (matches database schema)
  enabled: boolean
  frequency: string
  time: string
  type?: "local" | "remote" // Backup type
  dayOfWeek?: number // ✅ camelCase (matches database schema)
  serviceId?: number // ✅ camelCase (matches database schema, was integration_id)
  serviceName?: string // ✅ Added (matches database schema)
  remoteBackupsEnabled: boolean // ✅ camelCase (matches database schema)
  provider: string // Provider identifier
  dockId: string // Dock ID for reference
  [key: string]: any
}

interface BackupSchedulesTableProps {
  data: BackupSchedule[] | undefined
}

export function BackupSchedulesTable({ data = [] }: BackupSchedulesTableProps) {
  const columns: ColumnDef<BackupSchedule>[] = useMemo(
    () => [
      {
        header: "Provider",
        accessorKey: "provider",
        cell: ({ row }) => (
          <ProviderBadge provider={row.getValue("provider")} />
        ),
        size: 120,
      },
      {
        header: "Site",
        accessorKey: "siteUrl",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("siteUrl")}</div>
        ),
      },
      {
        header: "Status",
        accessorKey: "enabled",
        cell: ({ row }) => {
          const enabled = row.getValue("enabled") as boolean
          return (
            <Badge variant={enabled ? "default" : "secondary"}>
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
          )
        },
      },
      {
        header: "Type",
        accessorKey: "type",
        cell: ({ row }) => {
          const type = row.getValue("type") as "local" | "remote" | undefined
          if (!type) {
            return <span className="text-muted-foreground">—</span>
          }
          return (
            <Badge variant="outline" className="capitalize">
              {type}
            </Badge>
          )
        },
        size: 100,
      },
      {
        header: "Frequency",
        accessorKey: "frequency",
        cell: ({ row }) => {
          // Backend provides this field directly
          const frequency = row.getValue("frequency") as string
          if (!frequency) {
            return <span className="text-muted-foreground">—</span>
          }
          return <span className="capitalize">{frequency}</span>
        },
      },
      {
        header: "Time",
        accessorKey: "time",
        cell: ({ row }) => {
          // Backend provides formatted "HH:mm" directly
          const time = row.getValue("time") as string
          if (!time) {
            return <span className="text-muted-foreground">—</span>
          }
          return <span>{time}</span>
        },
      },
      {
        header: "Remote Backups",
        accessorKey: "remoteBackupsEnabled",
        cell: ({ row }) => {
          const enabled = row.getValue("remoteBackupsEnabled") as boolean
          return (
            <Badge variant={enabled ? "default" : "outline"}>
              {enabled ? "Yes" : "No"}
            </Badge>
          )
        },
      },
    ],
    []
  )

  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: { sorting, pagination },
  })

  if (data === undefined) {
    // Show skeleton loader to prevent layout shift
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">No backup schedules found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No backup schedules found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {table.getPageCount() > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
