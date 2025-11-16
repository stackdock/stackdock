/**
 * Projects Table Component
 * 
 * TanStack Table implementation for displaying projects
 */

"use client"

import { useId, useMemo, useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleXIcon,
  Columns3Icon,
  EllipsisIcon,
  FilterIcon,
  ListFilterIcon,
} from "lucide-react"
import type { Doc } from "convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableSkeleton } from "@/components/resources/shared/table-skeleton"
import { formatDate } from "@/components/resources/shared/format-utils"
import { Badge } from "@/components/ui/badge"

function RowActions({ project }: { project: Project }) {
  const navigate = useNavigate()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <EllipsisIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => {
            navigate({ to: "/dashboard/projects/$projectSlug", params: { projectSlug: project.slug } })
          }}
        >
          View Details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          Delete Project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type Project = Doc<"projects">

// Multi-column filter for name
const multiColumnFilterFn: FilterFn<Project> = (row, columnId, filterValue) => {
  const searchableContent = `${row.original.name} ${row.original.linearId || ""} ${row.original.githubRepo || ""}`.toLowerCase()
  const searchTerm = (filterValue ?? "").toLowerCase()
  return searchableContent.includes(searchTerm)
}

const columns: ColumnDef<Project>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: 28,
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => {
      const project = row.original
      return (
        <div className="font-medium">
          <a
            href={`/dashboard/projects/${project.slug}`}
            className="text-left hover:underline"
          >
            {row.getValue("name")}
          </a>
        </div>
      )
    },
    size: 200,
    filterFn: multiColumnFilterFn,
    enableHiding: false,
  },
  {
    header: "Team",
    accessorKey: "teamId",
    cell: ({ row }) => {
      // TODO: Fetch team name from teamId
      return <span className="text-muted-foreground">Team</span>
    },
    size: 150,
  },
  {
    header: "Client",
    accessorKey: "clientId",
    cell: ({ row }) => {
      const clientId = row.getValue("clientId") as string | undefined
      if (!clientId) {
        return <Badge variant="outline">None</Badge>
      }
      // TODO: Fetch client name from clientId
      return <span className="text-muted-foreground">Client</span>
    },
    size: 150,
  },
  {
    header: "Linear ID",
    accessorKey: "linearId",
    cell: ({ row }) => {
      const linearId = row.getValue("linearId") as string | undefined
      return linearId ? <Badge variant="secondary">{linearId}</Badge> : <span className="text-muted-foreground">—</span>
    },
    size: 120,
  },
  {
    header: "GitHub Repo",
    accessorKey: "githubRepo",
    cell: ({ row }) => {
      const githubRepo = row.getValue("githubRepo") as string | undefined
      if (!githubRepo) {
        return <span className="text-muted-foreground">—</span>
      }
      return (
        <a
          href={`https://github.com/${githubRepo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {githubRepo}
        </a>
      )
    },
    size: 200,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const project = row.original
      return <RowActions project={project} />
    },
    size: 60,
    enableHiding: false,
  },
]

interface ProjectsTableProps {
  data: Project[] | undefined
}

export function ProjectsTable({ data }: ProjectsTableProps) {
  const id = useId()
  const navigate = useNavigate()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }])

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: { sorting, pagination, columnFilters, columnVisibility },
  })

  if (data === undefined) {
    return (
      <div className="space-y-4">
        <TableSkeleton columnCount={7} showCheckbox={true} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
          {/* Search */}
          <div className="relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn("h-8 w-[150px] lg:w-[250px] ps-9", Boolean(table.getColumn("name")?.getFilterValue()) && "pe-9")}
              value={(table.getColumn("name")?.getFilterValue() ?? "") as string}
              onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
              placeholder="Filter projects..."
              type="text"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
              <ListFilterIcon size={16} />
            </div>
            {Boolean(table.getColumn("name")?.getFilterValue()) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 hover:text-foreground"
                onClick={() => {
                  table.getColumn("name")?.setFilterValue("")
                  inputRef.current?.focus()
                }}
              >
                <CircleXIcon size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Columns3Icon className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border bg-background">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }}
                      className={cn(header.column.getCanSort() && "cursor-pointer select-none")}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center space-x-2">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="inline-flex">
                              {{
                                asc: <ChevronUpIcon className="h-4 w-4" />,
                                desc: <ChevronDownIcon className="h-4 w-4" />,
                              }[header.column.getIsSorted() as string] ?? (
                                <FilterIcon className="h-4 w-4 opacity-50" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                  No projects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label className="text-sm font-normal">Rows per page</Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center justify-center text-sm font-normal">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronFirstIcon className="h-4 w-4" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronLastIcon className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}
