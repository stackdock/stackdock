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
import { TableSkeleton } from "@/components/resources/shared/table-skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"

interface BackupIntegration {
  integrationId: number // ✅ camelCase (matches database schema, was id)
  integratedService: string // ✅ camelCase (matches database schema)
  integrationName: string // ✅ camelCase (matches database schema)
  region?: string
  provider: string // Provider identifier
  dockId: string // Dock ID for reference
  [key: string]: any
}

interface BackupIntegrationsTableProps {
  data: BackupIntegration[] | undefined
}

export function BackupIntegrationsTable({
  data,
}: BackupIntegrationsTableProps) {
  const columns: ColumnDef<BackupIntegration>[] = useMemo(
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
        header: "Name",
        accessorKey: "integrationName",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("integrationName")}</div>
        ),
      },
      {
        header: "Service",
        accessorKey: "integratedService",
        cell: ({ row }) => {
          const service = row.getValue("integratedService") as string
          return <Badge variant="outline">{service}</Badge>
        },
      },
      {
        header: "Region",
        accessorKey: "region",
        cell: ({ row }) => {
          const region = row.getValue("region") as string | undefined
          return region ? <span>{region}</span> : <span className="text-muted-foreground">—</span>
        },
      },
      {
        header: "ID",
        accessorKey: "integrationId",
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {row.getValue("integrationId")}
          </span>
        ),
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
    return (
      <div className="space-y-4">
        <TableSkeleton columnCount={5} showCheckbox={false} />
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
                  No backup integrations found.
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
