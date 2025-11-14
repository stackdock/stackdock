/**
 * Backup Schedules Table Component
 * 
 * TanStack Table implementation for displaying backup schedules from all providers
 */

"use client"

import { useId, useMemo, useRef, useState } from "react"
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
  FilterIcon,
  ListFilterIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { ProviderBadge } from "@/components/resources/shared/provider-badge"
import { Skeleton } from "@/components/ui/skeleton"

interface BackupSchedule {
  siteId: number
  siteUrl: string
  enabled: boolean
  frequency: string
  time: string
  type?: "local" | "remote"
  dayOfWeek?: number
  serviceId?: number
  serviceName?: string
  remoteBackupsEnabled: boolean
  provider: string
  dockId: string
  [key: string]: any
}

// Multi-column filter for site URL
const siteFilterFn: FilterFn<BackupSchedule> = (row, columnId, filterValue) => {
  const searchableContent = row.original.siteUrl.toLowerCase()
  const searchTerm = (filterValue ?? "").toLowerCase()
  return searchableContent.includes(searchTerm)
}

// Status filter (enabled/disabled)
const statusFilterFn: FilterFn<BackupSchedule> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  const status = row.original.enabled ? "enabled" : "disabled"
  return filterValue.includes(status)
}

// Provider filter
const providerFilterFn: FilterFn<BackupSchedule> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  return filterValue.includes(row.original.provider)
}

// Type filter (local/remote)
const typeFilterFn: FilterFn<BackupSchedule> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  const type = row.original.type || "unknown"
  return filterValue.includes(type)
}

// Frequency filter
const frequencyFilterFn: FilterFn<BackupSchedule> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  return filterValue.includes(row.original.frequency)
}

const columns: ColumnDef<BackupSchedule>[] = [
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
    header: "Provider",
    accessorKey: "provider",
    cell: ({ row }) => <ProviderBadge provider={row.getValue("provider")} />,
    size: 120,
    filterFn: providerFilterFn,
  },
  {
    header: "Site",
    accessorKey: "siteUrl",
    cell: ({ row }) => <div className="font-medium">{row.getValue("siteUrl")}</div>,
    size: 250,
    filterFn: siteFilterFn,
    enableHiding: false,
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
    size: 100,
    filterFn: statusFilterFn,
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
    filterFn: typeFilterFn,
  },
  {
    header: "Frequency",
    accessorKey: "frequency",
    cell: ({ row }) => {
      const frequency = row.getValue("frequency") as string
      if (!frequency) {
        return <span className="text-muted-foreground">—</span>
      }
      return <span className="capitalize">{frequency}</span>
    },
    size: 120,
    filterFn: frequencyFilterFn,
  },
  {
    header: "Time",
    accessorKey: "time",
    cell: ({ row }) => {
      const time = row.getValue("time") as string
      if (!time) {
        return <span className="text-muted-foreground">—</span>
      }
      return <span>{time}</span>
    },
    size: 100,
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
    size: 120,
  },
]

interface BackupSchedulesTableProps {
  data: BackupSchedule[] | undefined
}

export function BackupSchedulesTable({ data = [] }: BackupSchedulesTableProps) {
  const id = useId()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: "siteUrl", desc: false }])

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

  const uniqueStatusValues = useMemo(() => {
    return ["enabled", "disabled"]
  }, [])

  const uniqueProviderValues = useMemo(() => {
    const providerColumn = table.getColumn("provider")
    if (!providerColumn) return []
    return Array.from(providerColumn.getFacetedUniqueValues().keys()).sort()
  }, [table.getColumn("provider")?.getFacetedUniqueValues()])

  const uniqueTypeValues = useMemo(() => {
    const typeColumn = table.getColumn("type")
    if (!typeColumn) return []
    const values = Array.from(typeColumn.getFacetedUniqueValues().keys())
    return values.filter(v => v && v !== "unknown").sort()
  }, [table.getColumn("type")?.getFacetedUniqueValues()])

  const uniqueFrequencyValues = useMemo(() => {
    const frequencyColumn = table.getColumn("frequency")
    if (!frequencyColumn) return []
    return Array.from(frequencyColumn.getFacetedUniqueValues().keys()).filter(v => v).sort()
  }, [table.getColumn("frequency")?.getFacetedUniqueValues()])

  const selectedStatuses = useMemo(() => {
    return (table.getColumn("enabled")?.getFilterValue() as string[]) ?? []
  }, [table.getColumn("enabled")?.getFilterValue()])

  const selectedProviders = useMemo(() => {
    return (table.getColumn("provider")?.getFilterValue() as string[]) ?? []
  }, [table.getColumn("provider")?.getFilterValue()])

  const selectedTypes = useMemo(() => {
    return (table.getColumn("type")?.getFilterValue() as string[]) ?? []
  }, [table.getColumn("type")?.getFilterValue()])

  const selectedFrequencies = useMemo(() => {
    return (table.getColumn("frequency")?.getFilterValue() as string[]) ?? []
  }, [table.getColumn("frequency")?.getFilterValue()])

  const handleStatusChange = (checked: boolean, value: string) => {
    const filterValue = selectedStatuses
    const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
    table.getColumn("enabled")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  const handleProviderChange = (checked: boolean, value: string) => {
    const filterValue = selectedProviders
    const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
    table.getColumn("provider")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  const handleTypeChange = (checked: boolean, value: string) => {
    const filterValue = selectedTypes
    const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
    table.getColumn("type")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  const handleFrequencyChange = (checked: boolean, value: string) => {
    const filterValue = selectedFrequencies
    const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
    table.getColumn("frequency")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  if (data === undefined) {
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
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
          {/* Search */}
          <div className="relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn("h-8 w-[150px] lg:w-[250px] ps-9", Boolean(table.getColumn("siteUrl")?.getFilterValue()) && "pe-9")}
              value={(table.getColumn("siteUrl")?.getFilterValue() ?? "") as string}
              onChange={(e) => table.getColumn("siteUrl")?.setFilterValue(e.target.value)}
              placeholder="Filter by site URL..."
              type="text"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
              <ListFilterIcon size={16} />
            </div>
            {Boolean(table.getColumn("siteUrl")?.getFilterValue()) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 hover:text-foreground"
                onClick={() => {
                  table.getColumn("siteUrl")?.setFilterValue("")
                  inputRef.current?.focus()
                }}
              >
                <CircleXIcon size={16} />
              </button>
            )}
          </div>
          <div className="flex gap-x-2">
            {/* Status Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 !border-dashed">
                  <FilterIcon className="-ms-1 opacity-60" size={16} />
                  Status
                  {selectedStatuses.length > 0 && (
                    <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                      {selectedStatuses.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto min-w-36 p-3" align="start">
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground">Filters</div>
                  <div className="space-y-3">
                    {uniqueStatusValues.map((value, i) => (
                      <div key={value} className="flex items-center gap-2">
                        <Checkbox
                          id={`${id}-status-${i}`}
                          checked={selectedStatuses.includes(value)}
                          onCheckedChange={(checked: boolean) => handleStatusChange(checked, value)}
                        />
                        <Label htmlFor={`${id}-status-${i}`} className="font-normal capitalize">
                          {value}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {/* Provider Filter */}
            {uniqueProviderValues.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 !border-dashed">
                    <FilterIcon className="-ms-1 opacity-60" size={16} />
                    Provider
                    {selectedProviders.length > 0 && (
                      <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                        {selectedProviders.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto min-w-36 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">Filters</div>
                    <div className="space-y-3">
                      {uniqueProviderValues.map((value, i) => (
                        <div key={value} className="flex items-center gap-2">
                          <Checkbox
                            id={`${id}-provider-${i}`}
                            checked={selectedProviders.includes(value)}
                            onCheckedChange={(checked: boolean) => handleProviderChange(checked, value)}
                          />
                          <Label htmlFor={`${id}-provider-${i}`} className="font-normal">
                            {value}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {/* Type Filter */}
            {uniqueTypeValues.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 !border-dashed">
                    <FilterIcon className="-ms-1 opacity-60" size={16} />
                    Type
                    {selectedTypes.length > 0 && (
                      <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                        {selectedTypes.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto min-w-36 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">Filters</div>
                    <div className="space-y-3">
                      {uniqueTypeValues.map((value, i) => (
                        <div key={value} className="flex items-center gap-2">
                          <Checkbox
                            id={`${id}-type-${i}`}
                            checked={selectedTypes.includes(value)}
                            onCheckedChange={(checked: boolean) => handleTypeChange(checked, value)}
                          />
                          <Label htmlFor={`${id}-type-${i}`} className="font-normal capitalize">
                            {value}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {/* Frequency Filter */}
            {uniqueFrequencyValues.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 !border-dashed">
                    <FilterIcon className="-ms-1 opacity-60" size={16} />
                    Frequency
                    {selectedFrequencies.length > 0 && (
                      <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                        {selectedFrequencies.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto min-w-36 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">Filters</div>
                    <div className="space-y-3">
                      {uniqueFrequencyValues.map((value, i) => (
                        <div key={value} className="flex items-center gap-2">
                          <Checkbox
                            id={`${id}-frequency-${i}`}
                            checked={selectedFrequencies.includes(value)}
                            onCheckedChange={(checked: boolean) => handleFrequencyChange(checked, value)}
                          />
                          <Label htmlFor={`${id}-frequency-${i}`} className="font-normal capitalize">
                            {value}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto hidden h-8 lg:flex">
              <Columns3Icon className="-ms-1 opacity-60" size={16} />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="font-medium px-2 py-1.5 text-xs">Toggle columns</div>
            {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={(e) => e.preventDefault()}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border bg-background">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className={cn(
                      header.id === "select" && "sticky md:table-cell left-0 z-10 rounded-tl bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted pr-2 md:pr-0"
                    )}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className="flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronUpIcon className="shrink-0 opacity-60" size={16} />,
                          desc: <ChevronDownIcon className="shrink-0 opacity-60" size={16} />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.id === "select" && "sticky md:table-cell left-0 z-10 bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted pr-2 md:pr-0"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No backup schedules found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <Label htmlFor={id} className="max-sm:sr-only">Rows per page</Label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger id={id} className="w-fit whitespace-nowrap">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50].map((pageSize) => (
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
    </div>
  )
}
