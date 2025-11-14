/**
 * Repositories Table Component
 * 
 * TanStack Table implementation for displaying GitHub repositories
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
  AlertCircle,
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleXIcon,
  Code,
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

type Project = Doc<"projects">

// Multi-column filter for name + description
const multiColumnFilterFn: FilterFn<Project> = (row, columnId, filterValue) => {
  const repo = row.original.fullApiData?.repository as any
  const searchableContent = `${repo?.full_name || row.original.name} ${repo?.description || ""}`.toLowerCase()
  const searchTerm = (filterValue ?? "").toLowerCase()
  return searchableContent.includes(searchTerm)
}

// Language filter
const languageFilterFn: FilterFn<Project> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  const repo = row.original.fullApiData?.repository as any
  const language = repo?.language || "N/A"
  return filterValue.includes(language)
}

// Host filter (for multi-provider support)
const hostFilterFn: FilterFn<Project> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  // Check if it's a GitHub repository (has githubRepo field or fullApiData.repository)
  const repo = row.original.fullApiData?.repository as any
  const host = repo ? "github" : "unknown"
  return filterValue.includes(host)
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
    header: "Repository",
    accessorKey: "name",
    cell: ({ row }) => {
      const repo = row.original.fullApiData?.repository as any
      return <div className="font-medium">{repo?.full_name || row.original.name}</div>
    },
    size: 200,
    filterFn: multiColumnFilterFn,
    enableHiding: false,
    enableSorting: true,
  },
  {
    id: "host",
    header: "Host",
    accessorFn: (row) => {
      // Check if it's a GitHub repository (has githubRepo field or fullApiData.repository)
      const repo = row.fullApiData?.repository as any
      return repo ? "github" : "unknown"
    },
    cell: ({ row }) => {
      const repo = row.original.fullApiData?.repository as any
      const host = repo ? "github" : "unknown"
      return <Badge variant="outline">{host === "github" ? "GitHub" : host}</Badge>
    },
    size: 100,
    filterFn: hostFilterFn,
    enableSorting: true,
  },
  {
    id: "repoLink",
    header: "Repo Link",
    cell: ({ row }) => {
      const repo = row.original.fullApiData?.repository as any
      const repoUrl = repo?.html_url
      
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
          title="Open repository on GitHub"
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
      const repo = row.fullApiData?.repository as any
      return repo?.updated_at ? new Date(repo.updated_at).getTime() : 0
    },
    cell: ({ row }) => {
      const repo = row.original.fullApiData?.repository as any
      return repo?.updated_at ? (
        <span className="text-sm text-muted-foreground">
          {new Date(repo.updated_at).toLocaleDateString()}
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
      const repo = row.fullApiData?.repository as any
      return repo?.language || "N/A"
    },
    cell: ({ row }) => {
      const repo = row.original.fullApiData?.repository as any
      return repo?.language ? (
        <Badge variant="outline">{repo.language}</Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">N/A</Badge>
      )
    },
    size: 120,
    filterFn: languageFilterFn,
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

function RepositoryDetailsCell({ row }: { row: any }) {
  const [open, setOpen] = useState(false)
  const repo = row.original.fullApiData?.repository as any
  const branches = row.original.fullApiData?.branches || []
  const issues = row.original.fullApiData?.issues || []
  const pullRequests = row.original.fullApiData?.pullRequests || []
  const commits = row.original.fullApiData?.commits || []
  
  // Find GitHub dock for fetching more commits
  const docks = useQuery(api["docks/queries"].listDocks)
  const githubDock = docks?.find(d => d.provider === "github")
  
  // Debug: Log commits to console
  if (open && commits.length === 0 && repo) {
    console.log("[RepositoriesTable] No commits found for repo:", repo.full_name)
    console.log("[RepositoriesTable] fullApiData structure:", {
      hasRepository: !!row.original.fullApiData?.repository,
      hasBranches: !!row.original.fullApiData?.branches,
      hasIssues: !!row.original.fullApiData?.issues,
      hasCommits: !!row.original.fullApiData?.commits,
      commitsValue: row.original.fullApiData?.commits,
    })
  }
  
  if (!repo) {
    return <span className="text-muted-foreground text-xs">—</span>
  }
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs bg-muted hover:bg-muted/80">
          Open
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{repo.full_name || row.original.name}</SheetTitle>
          <SheetDescription>
            {repo.description || "GitHub repository details"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* Repository Info */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                {repo.description && (
                  <p className="text-sm text-muted-foreground">{repo.description}</p>
                )}
                <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                  {repo.language && (
                    <span className="flex items-center gap-1">
                      <Code className="h-4 w-4" />
                      {repo.language}
                    </span>
                  )}
                  {repo.stargazers_count !== undefined && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {repo.stargazers_count}
                    </span>
                  )}
                  {repo.forks_count !== undefined && (
                    <span className="flex items-center gap-1">
                      <GitFork className="h-4 w-4" />
                      {repo.forks_count}
                    </span>
                  )}
                  {repo.updated_at && (
                    <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              {repo.html_url && (
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-sm"
                >
                  View on GitHub <ExternalLinkIcon className="h-4 w-4" />
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
            {githubDock && repo ? (
              <CommitsTable 
                commits={commits} 
                dockId={githubDock._id}
                owner={repo.owner?.login || repo.full_name.split("/")[0]}
                repo={repo.name}
              />
            ) : (
              <CommitsTable 
                commits={commits} 
                dockId={""}
                owner={repo?.owner?.login || repo?.full_name?.split("/")[0] || ""}
                repo={repo?.name || ""}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface RepositoriesTableProps {
  projects: Project[]
}

export function RepositoriesTable({ projects }: RepositoriesTableProps) {
  const id = useId()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: "Last Updated", desc: true }])

  const table = useReactTable({
    data: projects,
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

  const uniqueLanguageValues = useMemo(() => {
    const languageColumn = table.getColumn("language")
    if (!languageColumn) return []
    const values = Array.from(languageColumn.getFacetedUniqueValues().keys())
    // Include "N/A" in the filter options, filter out empty strings
    return values.filter(v => v && v !== "").sort()
  }, [table.getColumn("language")?.getFacetedUniqueValues()])

  const selectedLanguages = useMemo(() => {
    return (table.getColumn("language")?.getFilterValue() as string[]) ?? []
  }, [table.getColumn("language")?.getFilterValue()])

  const handleLanguageChange = (checked: boolean, value: string) => {
    const filterValue = selectedLanguages
    const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
    table.getColumn("language")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  // Host filter values (for multi-provider support)
  const uniqueHostValues = useMemo(() => {
    const hostColumn = table.getColumn("host")
    if (!hostColumn) return []
    const values = Array.from(hostColumn.getFacetedUniqueValues().keys())
    return values.filter(v => v && v !== "").sort()
  }, [table.getColumn("host")?.getFacetedUniqueValues()])

  const selectedHosts = useMemo(() => {
    return (table.getColumn("host")?.getFilterValue() as string[]) ?? []
  }, [table.getColumn("host")?.getFilterValue()])

  const handleHostChange = (checked: boolean, value: string) => {
    const filterValue = selectedHosts
    const newFilterValue = checked ? [...filterValue, value] : filterValue.filter(v => v !== value)
    table.getColumn("host")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No GitHub repositories found.</p>
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
