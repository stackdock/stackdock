/**
 * Docks Table Component
 * 
 * TanStack Table implementation for displaying connected docks
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
  CircleAlertIcon,
  CircleXIcon,
  Columns3Icon,
  FilterIcon,
  ListFilterIcon,
  RefreshCw,
  Settings,
  TrashIcon,
} from "lucide-react"
import type { Doc } from "convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"
import { ProviderBadge } from "@/components/resources/shared/provider-badge"
import { formatDate } from "@/components/resources/shared/format-utils"
import { TableSkeleton } from "@/components/resources/shared/table-skeleton"
import { getProviderCategory, CATEGORIES, type DockCategory } from "@/lib/dock-categories"
import { useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import { Loader2 } from "lucide-react"
import { DockSettingsDialog } from "./dock-settings-dialog"

type Dock = Doc<"docks"> & {
  category: DockCategory
}

// Multi-column filter for name
const nameFilterFn: FilterFn<Dock> = (row, columnId, filterValue) => {
  const searchableContent = row.original.name.toLowerCase()
  const searchTerm = (filterValue ?? "").toLowerCase()
  return searchableContent.includes(searchTerm)
}

// Status filter
const statusFilterFn: FilterFn<Dock> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  return filterValue.includes(row.original.lastSyncStatus)
}

// Provider filter
const providerFilterFn: FilterFn<Dock> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  return filterValue.includes(row.original.provider)
}

// Category filter
const categoryFilterFn: FilterFn<Dock> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  return filterValue.includes(row.original.category)
}

function getStatusBadge(status: string) {
  switch (status) {
    case "success":
      return <Badge variant="outline" className="bg-muted text-muted-foreground">Connected</Badge>
    case "error":
      return <Badge variant="destructive">Error</Badge>
    case "syncing":
      return <Badge variant="outline" className="bg-muted/50 text-muted-foreground">Syncing...</Badge>
    case "pending":
      return <Badge variant="outline" className="bg-muted/30 text-muted-foreground">Pending</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function CategoryBadge({ category }: { category: DockCategory }) {
  const cat = CATEGORIES[category]
  return (
    <Badge variant="outline" className="capitalize">
      {cat.label}
    </Badge>
  )
}

function RowActions({ row }: { row: Row<Dock> }) {
  const dock = row.original
  const syncDock = useMutation(api["docks/mutations"].syncDock)
  const deleteDock = useMutation(api["docks/mutations"].deleteDock)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncDock({ dockId: dock._id as any })
      toast.success("Dock synced successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sync dock")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this dock?")) return
    setIsDeleting(true)
    try {
      await deleteDock({ dockId: dock._id as any })
      toast.success("Dock deleted successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete dock")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setSettingsOpen(true)}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleSync}
          disabled={isSyncing || dock.syncInProgress}
          title="Sync"
        >
          {isSyncing || dock.syncInProgress ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <DockSettingsDialog
        dockId={dock._id}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  )
}

const columns: ColumnDef<Dock>[] = [
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
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    size: 200,
    filterFn: nameFilterFn,
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
    header: "Category",
    accessorKey: "category",
    cell: ({ row }) => <CategoryBadge category={row.getValue("category")} />,
    size: 100,
    filterFn: categoryFilterFn,
  },
  {
    header: "Status",
    accessorKey: "lastSyncStatus",
    cell: ({ row }) => getStatusBadge(row.getValue("lastSyncStatus")),
    size: 120,
    filterFn: statusFilterFn,
  },
  {
    header: "Last Synced",
    accessorKey: "lastSyncAt",
    cell: ({ row }) => {
      const lastSyncAt = row.getValue("lastSyncAt") as number | undefined
      return lastSyncAt ? formatDate(lastSyncAt) : "Never"
    },
    size: 150,
  },
  {
    id: "syncInterval",
    header: "Sync Interval",
    accessorFn: (row) => {
      // Access syncConfig from the dock data
      return (row as Dock).syncConfig
    },
    cell: ({ row }) => {
      const syncConfig = row.getValue("syncInterval") as { intervalSeconds?: number } | undefined
      const interval = syncConfig?.intervalSeconds || 120
      const minutes = Math.round(interval / 60)
      return (
        <div className="flex items-center gap-2">
          <span>{minutes}m</span>
          <span className="text-xs text-muted-foreground">
            ({interval}s)
          </span>
        </div>
      )
    },
    size: 120,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <RowActions row={row} />,
    size: 100,
    enableHiding: false,
  },
]

interface DocksTableProps {
  data: Doc<"docks">[] | undefined
  onDelete?: (ids: string[]) => void
}

export function DocksTable({ data, onDelete }: DocksTableProps) {
  const id = useId()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }])

  // Add category to each dock
  const docksWithCategory: Dock[] = useMemo(() => {
    if (!data) return []
    return data.map(dock => ({
      ...dock,
      category: getProviderCategory(dock.provider),
    }))
  }, [data])

  // Get valid column IDs to filter out invalid visibility state
  const validColumnIds = useMemo(() => {
    return new Set(columns.map(col => col.id || col.accessorKey).filter(Boolean))
  }, [])

  // Clean up columnVisibility to only include valid column IDs
  const cleanedColumnVisibility = useMemo(() => {
    const cleaned: VisibilityState = {}
    Object.keys(columnVisibility).forEach(key => {
      if (validColumnIds.has(key)) {
        cleaned[key] = columnVisibility[key]
      }
    })
    return cleaned
  }, [columnVisibility, validColumnIds])

  const table = useReactTable({
    data: docksWithCategory,
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
    state: { sorting, pagination, columnFilters, columnVisibility: cleanedColumnVisibility },
  })

  const uniqueStatusValues = useMemo(() => {
    try {
      const statusColumn = table.getColumn("lastSyncStatus")
      if (!statusColumn) return []
      return Array.from(statusColumn.getFacetedUniqueValues().keys()).sort()
    } catch {
      return []
    }
  }, [table.getColumn("lastSyncStatus")?.getFacetedUniqueValues()])

  const uniqueProviderValues = useMemo(() => {
    try {
      const providerColumn = table.getColumn("provider")
      if (!providerColumn) return []
      return Array.from(providerColumn.getFacetedUniqueValues().keys()).sort()
    } catch {
      return []
    }
  }, [table.getColumn("provider")?.getFacetedUniqueValues()])

  const uniqueCategoryValues = useMemo(() => {
    try {
      const categoryColumn = table.getColumn("category")
      if (!categoryColumn) return []
      return Array.from(categoryColumn.getFacetedUniqueValues().keys()).sort()
    } catch {
      return []
    }
  }, [table.getColumn("category")?.getFacetedUniqueValues()])

  const selectedStatuses = useMemo(() => {
    try {
      return (table.getColumn("lastSyncStatus")?.getFilterValue() as string[]) ?? []
    } catch {
      return []
    }
  }, [table.getColumn("lastSyncStatus")?.getFilterValue()])

  const selectedProviders = useMemo(() => {
    try {
      return (table.getColumn("provider")?.getFilterValue() as string[]) ?? []
    } catch {
      return []
    }
  }, [table.getColumn("provider")?.getFilterValue()])

  const selectedCategories = useMemo(() => {
    try {
      return (table.getColumn("category")?.getFilterValue() as string[]) ?? []
    } catch {
      return []
    }
  }, [table.getColumn("category")?.getFilterValue()])

  const handleStatusChange = (checked: boolean, value: string) => {
    try {
      const filterValue = selectedStatuses
      const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
      table.getColumn("lastSyncStatus")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
    } catch (err) {
      console.warn("Failed to update status filter:", err)
    }
  }

  const handleProviderChange = (checked: boolean, value: string) => {
    try {
      const filterValue = selectedProviders
      const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
      table.getColumn("provider")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
    } catch (err) {
      console.warn("Failed to update provider filter:", err)
    }
  }

  const handleCategoryChange = (checked: boolean, value: string) => {
    try {
      const filterValue = selectedCategories
      const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
      table.getColumn("category")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
    } catch (err) {
      console.warn("Failed to update category filter:", err)
    }
  }

  const handleDeleteRows = () => {
    const selectedRows = table.getSelectedRowModel().rows
    const ids = selectedRows.map(row => row.original._id)
    onDelete?.(ids)
    table.resetRowSelection()
  }

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
              onChange={(e) => {
                try {
                  table.getColumn("name")?.setFilterValue(e.target.value)
                } catch (err) {
                  console.warn("Failed to update name filter:", err)
                }
              }}
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
                  try {
                    table.getColumn("name")?.setFilterValue("")
                    inputRef.current?.focus()
                  } catch (err) {
                    console.warn("Failed to clear name filter:", err)
                  }
                }}
              >
                <CircleXIcon size={16} />
              </button>
            )}
          </div>
          <div className="flex gap-x-2">
            {/* Category Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 !border-dashed">
                  <FilterIcon className="-ms-1 opacity-60" size={16} />
                  Category
                  {selectedCategories.length > 0 && (
                    <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                      {selectedCategories.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto min-w-36 p-3" align="start">
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground">Filters</div>
                  <div className="space-y-3">
                    {uniqueCategoryValues.map((value, i) => (
                      <div key={value} className="flex items-center gap-2">
                        <Checkbox
                          id={`${id}-category-${i}`}
                          checked={selectedCategories.includes(value)}
                          onCheckedChange={(checked: boolean) => handleCategoryChange(checked, value)}
                        />
                        <Label htmlFor={`${id}-category-${i}`} className="font-normal capitalize">
                          {CATEGORIES[value as DockCategory].label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
                        <Label htmlFor={`${id}-status-${i}`} className="font-normal">
                          {value === "success" ? "Connected" : value}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            {table.getAllColumns()
              .filter((column) => column.getCanHide())
              .filter((column) => column.id) // Only include columns with valid IDs
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => {
                    try {
                      column.toggleVisibility(!!value)
                    } catch (err) {
                      console.warn(`Failed to toggle visibility for column ${column.id}:`, err)
                    }
                  }}
                  onSelect={(e) => e.preventDefault()}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Delete Button */}
        {table.getSelectedRowModel().rows.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <TrashIcon className="-ms-1 opacity-60" size={16} />
                Delete
                <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                  {table.getSelectedRowModel().rows.length}
                </span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {table.getSelectedRowModel().rows.length} selected dock{table.getSelectedRowModel().rows.length === 1 ? "" : "s"}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRows}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
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
                  No docks found.
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
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} dock{table.getFilteredRowModel().rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronFirstIcon size={16} />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeftIcon size={16} />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRightIcon size={16} />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
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
