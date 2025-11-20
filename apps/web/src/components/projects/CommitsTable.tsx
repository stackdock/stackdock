/**
 * Commits Table Component
 * 
 * TanStack Table implementation for displaying GitHub commits
 */

"use client"

import { useId, useMemo, useRef, useState } from "react"
import { useAction } from "convex/react"
import { api } from "convex/_generated/api"
import { Loader2 } from "lucide-react"
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
  ExternalLinkIcon,
  FilterIcon,
  GitCommit,
  ListFilterIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
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

interface Commit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
  author?: {
    login: string
    avatar_url: string
  }
  html_url: string
}

// Multi-column filter for sha + message + author
const multiColumnFilterFn: FilterFn<Commit> = (row, _columnId, filterValue) => {
  const searchableContent = `${row.original.sha.substring(0, 7)} ${row.original.commit.message} ${row.original.commit.author.name}`.toLowerCase()
  const searchTerm = (filterValue ?? "").toLowerCase()
  return searchableContent.includes(searchTerm)
}

// Author filter
const authorFilterFn: FilterFn<Commit> = (row, _columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  const author = row.original.commit.author.name || "unknown"
  return filterValue.includes(author)
}

const columns: ColumnDef<Commit>[] = [
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
    header: "Commit",
    accessorKey: "sha",
    cell: ({ row }) => (
      <div className="font-medium flex items-center gap-2">
        <GitCommit className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-xs">{row.original.sha.substring(0, 7)}</span>
      </div>
    ),
    size: 120,
    enableHiding: false,
  },
  {
    header: "Message",
    accessorKey: "commit.message",
    cell: ({ row }) => {
      const message = row.original.commit.message
      const firstLine = message.split("\n")[0]
      return (
        <div className="max-w-md truncate" title={message}>
          {firstLine}
        </div>
      )
    },
    size: 300,
    filterFn: multiColumnFilterFn,
    enableHiding: false,
  },
  {
    header: "Author",
    accessorKey: "commit.author.name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.author?.avatar_url && (
          <img
            src={row.original.author.avatar_url}
            alt={row.original.commit.author.name}
            className="h-5 w-5 rounded-full"
          />
        )}
        <span className="text-sm">{row.original.commit.author.name}</span>
      </div>
    ),
    size: 180,
    filterFn: authorFilterFn,
  },
  {
    header: "Date",
    accessorKey: "commit.author.date",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.commit.author.date).toLocaleDateString()}
      </span>
    ),
    size: 120,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <a
        href={row.original.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline flex items-center gap-1 text-sm"
      >
        View <ExternalLinkIcon className="h-3 w-3" />
      </a>
    ),
    size: 80,
    enableHiding: false,
  },
]

interface CommitsTableProps {
  commits: Commit[]
  dockId: string // GitHub dock ID for fetching more commits
  owner: string // Repository owner (username or org)
  repo: string // Repository name
}

export function CommitsTable({ commits: initialCommits, dockId, owner, repo }: CommitsTableProps) {
  const id = useId()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: "commit.author.date", desc: true }])
  
  // State for loaded commits (initial + fetched)
  const [loadedCommits, setLoadedCommits] = useState<Commit[]>(initialCommits)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialCommits.length === 10) // Assume more if we got exactly 10
  const [currentPage, setCurrentPage] = useState(1) // Page 1 is already loaded (initial commits)
  
  // Action for fetching more commits
  const fetchMoreCommits = useAction(api["docks/actions"].fetchMoreCommits)

  // Handle loading more commits
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    try {
      const nextPage = currentPage + 1
      const newCommits = await fetchMoreCommits({
        dockId: dockId as any,
        owner,
        repo,
        page: nextPage,
        perPage: 10,
      })
      
      if (newCommits.length === 0) {
        setHasMore(false)
      } else {
        setLoadedCommits([...loadedCommits, ...newCommits])
        setCurrentPage(nextPage)
        // If we got less than 10, there's probably no more
        if (newCommits.length < 10) {
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error("Failed to fetch more commits:", error)
      // Don't show error to user, just stop loading more
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  const table = useReactTable({
    data: loadedCommits,
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

  const uniqueAuthorValues = useMemo(() => {
    const authorColumn = table.getColumn("commit.author.name")
    if (!authorColumn) return []
    const values = Array.from(authorColumn.getFacetedUniqueValues().keys())
    return values.filter(v => v && v !== "unknown").sort()
  }, [table.getColumn("commit.author.name")?.getFacetedUniqueValues()])

  const selectedAuthors = useMemo(() => {
    return (table.getColumn("commit.author.name")?.getFilterValue() as string[]) ?? []
  }, [table.getColumn("commit.author.name")?.getFilterValue()])

  const handleAuthorChange = (checked: boolean, value: string) => {
    const filterValue = selectedAuthors
    const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
    table.getColumn("commit.author.name")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  if (loadedCommits.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No commits found.</p>
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
              className={cn("h-8 w-[150px] lg:w-[250px] ps-9", Boolean(table.getColumn("commit.message")?.getFilterValue()) && "pe-9")}
              value={(table.getColumn("commit.message")?.getFilterValue() ?? "") as string}
              onChange={(e) => table.getColumn("commit.message")?.setFilterValue(e.target.value)}
              placeholder="Filter by sha, message, or author..."
              type="text"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
              <ListFilterIcon size={16} />
            </div>
            {Boolean(table.getColumn("commit.message")?.getFilterValue()) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 hover:text-foreground"
                onClick={() => {
                  table.getColumn("commit.message")?.setFilterValue("")
                  inputRef.current?.focus()
                }}
              >
                <CircleXIcon size={16} />
              </button>
            )}
          </div>
          <div className="flex gap-x-2">
            {/* Author Filter */}
            {uniqueAuthorValues.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 !border-dashed">
                    <FilterIcon className="-ms-1 opacity-60" size={16} />
                    Author
                    {selectedAuthors.length > 0 && (
                      <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                        {selectedAuthors.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto min-w-36 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">Filters</div>
                    <div className="space-y-3">
                      {uniqueAuthorValues.map((value, i) => (
                        <div key={value} className="flex items-center gap-2">
                          <Checkbox
                            id={`${id}-author-${i}`}
                            checked={selectedAuthors.includes(value)}
                            onCheckedChange={(checked: boolean) => handleAuthorChange(checked, value)}
                          />
                          <Label htmlFor={`${id}-author-${i}`} className="font-normal">
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
                  No commits found.
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
      
      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full sm:w-auto"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Commits"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
