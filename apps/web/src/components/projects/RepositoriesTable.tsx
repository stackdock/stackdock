/**
 * Repositories Table Component
 * 
 * TanStack Table implementation for displaying GitHub repositories
 */

"use client"

import { useId, useEffect, useMemo, useRef, useState } from "react"
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
  AlertCircle,
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleXIcon,
  CodeXml,
  Columns3Icon,
  ExternalLinkIcon,
  FilterIcon,
  GitBranch,
  GitCommit,
  GitFork,
  GitPullRequest,
  ListFilterIcon,
  Star,
} from "lucide-react"
import type { Doc } from "convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BranchesTable } from "./BranchesTable"
import { IssuesTable } from "./IssuesTable"
import { PullRequestsTable } from "./PullRequestsTable"
import { CommitsTable } from "./CommitsTable"
import { TableSkeleton } from "@/components/resources/shared/table-skeleton"

type Repository = Doc<"repositories">

// Multi-column filter for name + description
const multiColumnFilterFn: FilterFn<Repository> = (row, columnId, filterValue) => {
  const searchableContent = `${row.original.fullName || row.original.name} ${row.original.description || ""}`.toLowerCase()
  const searchTerm = (filterValue ?? "").toLowerCase()
  return searchableContent.includes(searchTerm)
}

// Language filter
const languageFilterFn: FilterFn<Repository> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  const language = row.original.language || "N/A"
  return filterValue.includes(language)
}

// Host filter (for multi-provider support)
const hostFilterFn: FilterFn<Repository> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  const host = row.original.provider || "unknown"
  return filterValue.includes(host)
}

const columns: ColumnDef<Repository>[] = [
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
    header: "Repository",
    accessorKey: "name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.fullName || row.original.name}</div>
    },
    size: 200,
    filterFn: multiColumnFilterFn,
    enableColumnFilter: false,
    enableHiding: false,
    enableSorting: true,
  },
  {
    id: "host",
    header: "Host",
    accessorFn: (row) => {
      return row.provider || "unknown"
    },
    cell: ({ row }) => {
      const host = row.original.provider || "unknown"
      return <Badge variant="outline">{host === "github" ? "GitHub" : host}</Badge>
    },
    size: 100,
    filterFn: hostFilterFn,
    enableColumnFilter: false,
    enableSorting: true,
  },
  {
    id: "repoLink",
    header: "Repo Link",
    cell: ({ row }) => {
      const repoUrl = row.original.url
      
      if (!repoUrl) {
        return <span className="text-muted-foreground">—</span>
      }
      
      return (
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
          onClick={(e) => e.stopPropagation()}
          title="Open repository"
        >
          <ExternalLinkIcon className="h-4 w-4" />
        </a>
      )
    },
    size: 80,
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: "Last Updated",
    accessorFn: (row) => {
      return row.updatedAt || 0
    },
    cell: ({ row }) => {
      return row.original.updatedAt ? (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.updatedAt).toLocaleDateString()}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
    size: 120,
    enableSorting: true,
  },
  {
    id: "lastCommit",
    header: "Last Commit",
    accessorFn: (row) => {
      const commits = row.fullApiData?.commits || []
      const lastCommit = commits[0] // Commits are already sorted by date (most recent first)
      return lastCommit?.commit?.message || ""
    },
    cell: ({ row }) => {
      const commits = row.original.fullApiData?.commits || []
      const lastCommit = commits[0]
      
      if (!lastCommit) {
        return <span className="text-muted-foreground">—</span>
      }
      
      const commitMessage = lastCommit.commit?.message || ""
      const firstLine = commitMessage.split("\n")[0]
      const commitUrl = lastCommit.html_url
      
      return (
        <div className="max-w-md truncate">
          {commitUrl ? (
            <a
              href={commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
              title={commitMessage}
            >
              {firstLine || "—"}
            </a>
          ) : (
            <span className="text-muted-foreground" title={commitMessage}>
              {firstLine || "—"}
            </span>
          )}
        </div>
      )
    },
    size: 300,
    enableSorting: true,
  },
  {
    id: "language",
    header: "Language",
    accessorFn: (row) => {
      return row.language || "N/A"
    },
    cell: ({ row }) => {
      return row.original.language ? (
        <Badge variant="outline">{row.original.language}</Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">N/A</Badge>
      )
    },
    size: 120,
    filterFn: languageFilterFn,
    enableColumnFilter: false,
    enableSorting: true,
  },
  {
    header: "Branches",
    accessorFn: (row) => {
      const branches = row.fullApiData?.branches || []
      return branches.length
    },
    cell: ({ row }) => {
      const branches = row.original.fullApiData?.branches || []
      return <span>{branches.length}</span>
    },
    size: 100,
    enableSorting: true,
  },
  {
    header: "Issues",
    accessorFn: (row) => {
      const issues = row.fullApiData?.issues || []
      return issues.length
    },
    cell: ({ row }) => {
      const issues = row.original.fullApiData?.issues || []
      return <span>{issues.length}</span>
    },
    size: 100,
    enableSorting: true,
  },
  {
    header: "Pull Requests",
    accessorFn: (row) => {
      const pullRequests = row.fullApiData?.pullRequests || []
      return pullRequests.length
    },
    cell: ({ row }) => {
      const pullRequests = row.original.fullApiData?.pullRequests || []
      return <span>{pullRequests.length}</span>
    },
    size: 120,
    enableSorting: true,
  },
  {
    id: "details",
    header: "Details",
    cell: ({ row }) => <RepositoryDetailsCell row={row} />,
    size: 100,
    enableHiding: false,
  },
]

function RepositoryDetailsCell({ row }: { row: Row<Repository> }) {
  const [open, setOpen] = useState(false)
  const repository = row.original
  const branches = repository.fullApiData?.branches || []
  const issues = repository.fullApiData?.issues || []
  const pullRequests = repository.fullApiData?.pullRequests || []
  const commits = repository.fullApiData?.commits || []
  
  // Get repository data from fullApiData if available, otherwise use direct fields
  const repoData = repository.fullApiData?.repository || repository
  
  // Find GitHub dock for fetching more commits
  const docks = useQuery(api["docks/queries"].listDocks)
  const githubDock = docks?.find(d => d.provider === "github")
  
  // Extract owner from fullName (format: "owner/repo-name")
  const [owner, repoName] = repository.fullName?.split("/") || ["", repository.name]
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs bg-muted hover:bg-muted/80">
          View
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{repository.fullName || repository.name}</SheetTitle>
          <SheetDescription>
            {repository.description || "Repository details"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* Repository Info */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                {repository.description && (
                  <p className="text-sm text-muted-foreground">{repository.description}</p>
                )}
                <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                  {repository.language && (
                    <span className="flex items-center gap-1">
                      <CodeXml className="h-4 w-4" />
                      {repository.language}
                    </span>
                  )}
                  {repoData?.stargazers_count !== undefined && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {repoData.stargazers_count}
                    </span>
                  )}
                  {repoData?.forks_count !== undefined && (
                    <span className="flex items-center gap-1">
                      <GitFork className="h-4 w-4" />
                      {repoData.forks_count}
                    </span>
                  )}
                  {repository.updatedAt && (
                    <span>Updated {new Date(repository.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              {repository.url && (
                <a
                  href={repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-sm"
                >
                  View Repo <ExternalLinkIcon className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
          
          {/* Branches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Branches
              </h3>
              {branches.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {branches.length} {branches.length === 1 ? 'branch' : 'branches'}
                </span>
              )}
            </div>
            <BranchesTable branches={branches} />
          </div>
          
          {/* Issues */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Issues
              </h3>
              {issues.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
                </span>
              )}
            </div>
            <IssuesTable issues={issues} />
          </div>
          
          {/* Pull Requests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GitPullRequest className="h-5 w-5" />
                Pull Requests
              </h3>
              {pullRequests.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {pullRequests.length} {pullRequests.length === 1 ? 'pull request' : 'pull requests'}
                </span>
              )}
            </div>
            <PullRequestsTable pullRequests={pullRequests} />
          </div>
          
          {/* Commits */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GitCommit className="h-5 w-5" />
                Commits
              </h3>
              {commits.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {commits.length} {commits.length === 1 ? 'commit' : 'commits'}
                </span>
              )}
            </div>
            {githubDock ? (
              <CommitsTable 
                commits={commits} 
                dockId={githubDock._id}
                owner={owner}
                repo={repoName}
              />
            ) : (
              <CommitsTable 
                commits={commits} 
                dockId={""}
                owner={owner}
                repo={repoName}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface RepositoriesTableProps {
  projects: Repository[] | undefined
}

export function RepositoriesTable({ projects }: RepositoriesTableProps) {
  const id = useId()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  
  // Debug logging
  useEffect(() => {
    console.log(`[RepositoriesTable] DEBUG: Received ${projects?.length ?? 0} repositories`)
    if (projects && projects.length > 0) {
      console.log(`[RepositoriesTable] DEBUG: Sample repository:`, {
        id: projects[0]._id,
        name: projects[0].name,
        fullName: projects[0].fullName,
        provider: projects[0].provider,
        hasFullApiData: !!projects[0].fullApiData,
      })
    }
  }, [projects])
  
  // Get valid column IDs to filter out any stale/invalid column visibility state
  // Compute this once since columns is a constant
  const validColumnIds = useMemo(() => {
    return columns.map(col => col.id || (typeof col.accessorKey === 'string' ? col.accessorKey : undefined)).filter(Boolean) as string[]
  }, [])
  
  // Initialize column visibility state, filtering out any invalid column IDs (like clientId)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    // Compute valid IDs for initial state
    const validIds = columns.map(col => col.id || (typeof col.accessorKey === 'string' ? col.accessorKey : undefined)).filter(Boolean) as string[]
    
    // If there's any saved state, filter it to only include valid columns
    const saved = localStorage.getItem('repositories-table-column-visibility')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const filtered: VisibilityState = {}
        for (const [key, value] of Object.entries(parsed)) {
          if (validIds.includes(key)) {
            filtered[key] = value as boolean
          }
        }
        return filtered
      } catch {
        return {}
      }
    }
    return {}
  })
  
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  // Default sort by repository name (ascending) - using accessorKey "name" which is the column key
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }])

  // Filter column visibility to only include valid columns
  const filteredColumnVisibility = useMemo(() => {
    const filtered: VisibilityState = {}
    for (const [key, value] of Object.entries(columnVisibility)) {
      if (validColumnIds.includes(key)) {
        filtered[key] = value
      }
    }
    return filtered
  }, [columnVisibility, validColumnIds])

  // Clear any invalid column IDs from state on mount (safety check)
  useEffect(() => {
    const hasInvalidColumns = Object.keys(columnVisibility).some(key => !validColumnIds.includes(key))
    if (hasInvalidColumns) {
      const cleaned: VisibilityState = {}
      for (const [key, value] of Object.entries(columnVisibility)) {
        if (validColumnIds.includes(key)) {
          cleaned[key] = value
        }
      }
      setColumnVisibility(cleaned)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount to clean up any stale column visibility state

  const tableData = useMemo(() => {
    const data = projects || []
    console.log(`[RepositoriesTable] DEBUG: Table data prepared: ${data.length} repositories`)
    return data
  }, [projects])

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        // Filter out any invalid column IDs before setting state
        const filtered: VisibilityState = {}
        for (const [key, value] of Object.entries(next)) {
          if (validColumnIds.includes(key)) {
            filtered[key] = value
          }
        }
        return filtered
      })
    },
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    enableColumnFilters: false,
    state: { sorting, pagination, columnFilters, columnVisibility: filteredColumnVisibility },
  })

  // Debug logging for table rows
  useEffect(() => {
    const rows = table.getRowModel().rows
    console.log(`[RepositoriesTable] DEBUG: Table rows: ${rows.length} rows rendered`)
    if (rows.length === 0 && tableData.length > 0) {
      console.warn(`[RepositoriesTable] DEBUG: Data exists (${tableData.length}) but no rows rendered. Check filters/sorting.`)
    }
  }, [table, tableData])

  const uniqueLanguageValues = useMemo(() => {
    const languageColumn = table.getColumn("language")
    if (!languageColumn) return []
    try {
      const values = Array.from(languageColumn.getFacetedUniqueValues().keys())
      // Include "N/A" in the filter options, filter out empty strings
      return values.filter(v => v && v !== "").sort()
    } catch {
      return []
    }
  }, [table.getColumn("language")?.getFacetedUniqueValues()])

  const selectedLanguages = useMemo(() => {
    try {
      return (table.getColumn("language")?.getFilterValue() as string[]) ?? []
    } catch {
      return []
    }
  }, [table.getColumn("language")?.getFilterValue()])

  const handleLanguageChange = (checked: boolean, value: string) => {
    try {
      const filterValue = selectedLanguages
      const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
      table.getColumn("language")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
    } catch {
      // Column doesn't exist, ignore
    }
  }

  // Host filter values (for multi-provider support)
  const uniqueHostValues = useMemo(() => {
    const hostColumn = table.getColumn("host")
    if (!hostColumn) return []
    try {
      const values = Array.from(hostColumn.getFacetedUniqueValues().keys())
      return values.filter(v => v && v !== "").sort()
    } catch {
      return []
    }
  }, [table.getColumn("host")?.getFacetedUniqueValues()])

  const selectedHosts = useMemo(() => {
    try {
      return (table.getColumn("host")?.getFilterValue() as string[]) ?? []
    } catch {
      return []
    }
  }, [table.getColumn("host")?.getFilterValue()])

  const handleHostChange = (checked: boolean, value: string) => {
    try {
      const filterValue = selectedHosts
      const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
      table.getColumn("host")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
    } catch {
      // Column doesn't exist, ignore
    }
  }

  if (projects === undefined) {
    return (
      <div className="space-y-4">
        <TableSkeleton columnCount={10} showCheckbox={true} />
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
              placeholder="Filter by name or description..."
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
            {/* Host Filter (takes priority for multi-provider) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 !border-dashed">
                  <FilterIcon className="-ms-1 opacity-60" size={16} />
                  Host
                  {selectedHosts.length > 0 && (
                    <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                      {selectedHosts.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto min-w-36 p-3" align="start">
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground">Hosts</div>
                  {uniqueHostValues.length > 0 ? (
                    <div className="space-y-2">
                      {uniqueHostValues.map((value, i) => (
                        <div key={value} className="flex items-center gap-2">
                          <Checkbox
                            id={`${id}-host-${i}`}
                            checked={selectedHosts.includes(value)}
                            onCheckedChange={(checked: boolean) => handleHostChange(checked, value)}
                          />
                          <Label htmlFor={`${id}-host-${i}`} className="font-normal capitalize">
                            {value === "github" ? "GitHub" : value}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No hosts available</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {/* Language Filter */}
            {uniqueLanguageValues.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 !border-dashed">
                    <FilterIcon className="-ms-1 opacity-60" size={16} />
                    Language
                    {selectedLanguages.length > 0 && (
                      <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                        {selectedLanguages.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto min-w-36 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">Languages</div>
                    <div className="space-y-2">
                      {uniqueLanguageValues.map((value, i) => (
                        <div key={value} className="flex items-center gap-2">
                          <Checkbox
                            id={`${id}-language-${i}`}
                            checked={selectedLanguages.includes(value)}
                            onCheckedChange={(checked: boolean) => handleLanguageChange(checked, value)}
                          />
                          <Label htmlFor={`${id}-language-${i}`} className="font-normal">
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
            {table.getAllColumns()
              .filter((column) => {
                try {
                  return column.getCanHide() && column.id && validColumnIds.includes(column.id)
                } catch {
                  return false
                }
              })
              .map((column) => {
                try {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => {
                        try {
                          column.toggleVisibility(!!value)
                        } catch (err) {
                          console.warn(`[RepositoriesTable] Failed to toggle column ${column.id}:`, err)
                        }
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                } catch (err) {
                  console.warn(`[RepositoriesTable] Failed to render column ${column.id}:`, err)
                  return null
                }
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
                  No repositories found.
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
    </div>
  )
}
