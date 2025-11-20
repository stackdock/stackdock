/**
 * Project Resources Table Component
 * 
 * Displays resources linked to a project with unlink functionality
 */

"use client"

import { useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
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
import { Unlink } from "lucide-react"
import { ProviderBadge } from "@/components/resources/shared/provider-badge"
import { StatusBadge } from "@/components/resources/shared/status-badge"
import { TableSkeleton } from "@/components/resources/shared/table-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

type ResourceTable = "servers" | "webServices" | "domains" | "databases"

interface ProjectResource {
  link: {
    resourceTable: ResourceTable
    resourceId: string
    denormalized_name: string
    denormalized_status: string
  }
  resource: any
  resourceTable: ResourceTable
}

interface ProjectResourcesTableProps {
  resources: ProjectResource[] | undefined
  onUnlink: (resourceTable: ResourceTable, resourceId: string, resourceName: string) => void
}

const getResourceTypeLabel = (type: ResourceTable): string => {
  switch (type) {
    case "servers":
      return "Server"
    case "webServices":
      return "Web Service"
    case "domains":
      return "Domain"
    case "databases":
      return "Database"
  }
}

const columns: ColumnDef<ProjectResource>[] = [
  {
    header: "Type",
    accessorKey: "resourceTable",
    cell: ({ row }) => {
      const type = row.getValue("resourceTable") as ResourceTable
      return (
        <Badge variant="outline" className="capitalize">
          {getResourceTypeLabel(type)}
        </Badge>
      )
    },
    size: 120,
  },
  {
    header: "Name",
    accessorKey: "denormalized_name",
    cell: ({ row }) => {
      const name = row.original.link.denormalized_name || row.original.resource?.name || row.original.resource?.domainName || "Unknown"
      return <div className="font-medium">{name}</div>
    },
    size: 200,
  },
  {
    header: "Status",
    accessorKey: "denormalized_status",
    cell: ({ row }) => {
      const status = row.original.link.denormalized_status || row.original.resource?.status || "unknown"
      return <StatusBadge status={status} />
    },
    size: 120,
  },
  {
    header: "Provider",
    accessorKey: "provider",
    cell: ({ row }) => {
      const provider = row.original.resource?.provider || "unknown"
      return <ProviderBadge provider={provider} />
    },
    size: 120,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      const resource = row.original
      const onUnlink = (table.options.meta as any)?.onUnlink
      if (!onUnlink) return null
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onUnlink(
              resource.resourceTable,
              resource.link.resourceId,
              resource.link.denormalized_name || "resource"
            )
          }}
        >
          <Unlink className="h-4 w-4" />
        </Button>
      )
    },
    size: 80,
  },
]

export function ProjectResourcesTable({ resources, onUnlink }: ProjectResourcesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "denormalized_name", desc: false }])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data: resources || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, pagination },
    meta: {
      onUnlink,
    },
  })

  if (resources === undefined) {
    return (
      <div className="space-y-4">
        <TableSkeleton columnCount={5} showCheckbox={false} />
      </div>
    )
  }

  if (resources.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-muted-foreground">No resources linked to this project yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: `${header.getSize()}px` }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No resources found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-fit whitespace-nowrap">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex grow justify-end text-xs whitespace-nowrap text-muted-foreground">
            <p>
              <span className="text-foreground">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getRowCount()
                )}
              </span>{" "}
              of <span className="text-foreground">{table.getRowCount()}</span>
            </p>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.firstPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronFirstIcon size={16} />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeftIcon size={16} />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRightIcon size={16} />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronLastIcon size={16} />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
