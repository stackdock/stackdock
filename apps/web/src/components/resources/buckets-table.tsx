/**
 * Buckets Table Component
 * 
 * TanStack Table implementation for displaying object storage buckets from all providers
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
  Copy,
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
import { toast } from "sonner"
import { ProviderBadge } from "./shared/provider-badge"
import { StatusBadge } from "./shared/status-badge"
import { formatBytes } from "./shared/format-utils"
import { TableSkeleton } from "./shared/table-skeleton"

type Bucket = Doc<"buckets">

// Multi-column filter for name
const multiColumnFilterFn: FilterFn<Bucket> = (row, _columnId, filterValue) => {
  const searchableContent = row.original.name.toLowerCase()
  const searchTerm = (filterValue ?? "").toLowerCase()
  return searchableContent.includes(searchTerm)
}

// Provider filter
const providerFilterFn: FilterFn<Bucket> = (row, _columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  return filterValue.includes(row.original.provider)
}

// Region filter
const regionFilterFn: FilterFn<Bucket> = (row, _columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  return filterValue.includes(row.original.region)
}

const columns: ColumnDef<Bucket>[] = [
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
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("name")}
      </div>
    ),
    size: 200,
    filterFn: multiColumnFilterFn,
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
    header: "Region/Cluster",
    accessorKey: "region",
    cell: ({ row }) => {
      const region = row.getValue("region") as string
      const cluster = row.original.cluster
      return <RegionClusterCell region={region} {...(cluster !== undefined && cluster !== null ? { cluster: cluster as string } : {})} />
    },
    size: 150,
    filterFn: regionFilterFn,
  },
  {
    header: "Size",
    accessorKey: "sizeBytes",
    cell: ({ row }) => {
      const sizeBytes = row.original.sizeBytes || 0
      return <SizeCell sizeBytes={sizeBytes} />
    },
    size: 120,
  },
  {
    header: "Objects",
    accessorKey: "objectCount",
    cell: ({ row }) => {
      const count = row.original.objectCount || 0
      return <span>{count.toLocaleString()}</span>
    },
    size: 100,
  },
  {
    header: "S3 Endpoint",
    accessorKey: "s3Endpoint",
    cell: ({ row }) => {
      const endpoint = row.original.s3Endpoint
      return endpoint ? <S3EndpointCell endpoint={endpoint} /> : <span className="text-muted-foreground">N/A</span>
    },
    size: 200,
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    size: 100,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <RowActions row={row} />,
    size: 60,
    enableHiding: false,
  },
]

interface BucketsTableProps {
  data: Bucket[] | undefined
}

export function BucketsTable({ data }: BucketsTableProps) {
  const id = useId()
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

  const uniqueProviderValues = useMemo(() => {
    const providerColumn = table.getColumn("provider")
    if (!providerColumn) return []
    return Array.from(providerColumn.getFacetedUniqueValues().keys()).sort()
  }, [table.getColumn("provider")?.getFacetedUniqueValues()])

  const uniqueRegionValues = useMemo(() => {
    const regionColumn = table.getColumn("region")
    if (!regionColumn) return []
    return Array.from(regionColumn.getFacetedUniqueValues().keys()).sort()
  }, [table.getColumn("region")?.getFacetedUniqueValues()])

  const selectedProviders = useMemo(() => {
    return (table.getColumn("provider")?.getFilterValue() as string[]) ?? []
  }, [table.getColumn("provider")?.getFilterValue()])

  const selectedRegions = useMemo(() => {
    return (table.getColumn("region")?.getFilterValue() as string[]) ?? []
  }, [table.getColumn("region")?.getFilterValue()])

  const handleProviderChange = (checked: boolean, value: string) => {
    const filterValue = selectedProviders
    const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
    table.getColumn("provider")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  const handleRegionChange = (checked: boolean, value: string) => {
    const filterValue = selectedRegions
    const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
    table.getColumn("region")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  if (data === undefined) {
    return (
      <div className="space-y-4">
        <TableSkeleton columnCount={8} showCheckbox={true} />
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
              placeholder="Filter by name..."
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
          <div className="flex gap-x-2">
            {/* Provider Filter */}
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
            {/* Region Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 !border-dashed">
                  <FilterIcon className="-ms-1 opacity-60" size={16} />
                  Region
                  {selectedRegions.length > 0 && (
                    <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                      {selectedRegions.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto min-w-36 p-3" align="start">
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground">Filters</div>
                  <div className="space-y-3">
                    {uniqueRegionValues.map((value, i) => (
                      <div key={value} className="flex items-center gap-2">
                        <Checkbox
                          id={`${id}-region-${i}`}
                          checked={selectedRegions.includes(value)}
                          onCheckedChange={(checked: boolean) => handleRegionChange(checked, value)}
                        />
                        <Label htmlFor={`${id}-region-${i}`} className="font-normal">
                          {value}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
                  No buckets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger id={id} aria-label="Rows per page" className="w-fit whitespace-nowrap">
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
    </div>
  )
}

function SizeCell({ sizeBytes }: { sizeBytes: number }) {
  const formatted = formatBytes(sizeBytes)
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(formatted)
      toast.success("Size copied to clipboard")
    } catch (err) {
      console.error("Failed to copy size:", err)
      toast.error("Failed to copy size")
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
      title="Click to copy"
    >
      <span>{formatted}</span>
      <Copy 
        className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors"
      />
    </button>
  )
}

function RegionClusterCell({ region, cluster }: { region: string; cluster?: string }) {
  const displayText = cluster ? `${region} / ${cluster}` : region
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(displayText)
      toast.success("Region/Cluster copied to clipboard")
    } catch (err) {
      console.error("Failed to copy region/cluster:", err)
      toast.error("Failed to copy region/cluster")
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
      title="Click to copy"
    >
      <span>{displayText}</span>
      <Copy 
        className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors"
      />
    </button>
  )
}

function S3EndpointCell({ endpoint }: { endpoint: string }) {
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(endpoint)
      toast.success("S3 Endpoint copied to clipboard")
    } catch (err) {
      console.error("Failed to copy endpoint:", err)
      toast.error("Failed to copy endpoint")
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 font-mono text-xs hover:text-foreground transition-colors group"
      title="Click to copy"
    >
      <span className="truncate max-w-[180px]">{endpoint}</span>
      <Copy 
        className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
      />
    </button>
  )
}

function RowActions({ row }: { row: Row<Bucket> }) {
  const bucket = row.original

  const handleCopyEndpoint = async () => {
    if (!bucket.s3Endpoint) return
    try {
      await navigator.clipboard.writeText(bucket.s3Endpoint)
      toast.success("S3 Endpoint copied to clipboard")
    } catch (err) {
      console.error("Failed to copy endpoint:", err)
      toast.error("Failed to copy endpoint")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="shadow-none">
          <EllipsisIcon size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>View Details</DropdownMenuItem>
        {bucket.s3Endpoint && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCopyEndpoint}>
              Copy Endpoint
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
