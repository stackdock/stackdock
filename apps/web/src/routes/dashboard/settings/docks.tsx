"use client"
import { createFileRoute } from "@tanstack/react-router"

import { useState, useMemo } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, RefreshCw, Trash2, AlertCircle, Search } from "lucide-react"
import { CreateOrganizationDialog } from "@/components/dashboard/CreateOrganizationDialog"
import { ProviderBadge } from "@/components/resources/shared/provider-badge"

export const Route = createFileRoute("/dashboard/settings/docks")({
  component: DocksPage,
})

function DocksPage() {
  const docks = useQuery(api["docks/queries"].listDocks)
  const currentOrgId = useQuery(api.organizations.getCurrentOrgId)
  const availableProviders = useQuery(api["docks/queries"].listAvailableProviders)
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [provider, setProvider] = useState("")
  const [name, setName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filtering and sorting state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterProvider, setFilterProvider] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "provider" | "lastSynced">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const createDock = useMutation(api["docks/mutations"].createDock)
  const syncDock = useMutation(api["docks/mutations"].syncDock)
  const deleteDock = useMutation(api["docks/mutations"].deleteDock)

  const handleCreateDock = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!currentOrgId) {
      setError("No organization found. Please create an organization first.")
      setIsSubmitting(false)
      return
    }

    if (!provider) {
      setError("Please select a provider")
      setIsSubmitting(false)
      return
    }

    try {
      const dockId = await createDock({
        orgId: currentOrgId,
        name,
        provider,
        apiKey,
      })
      
      // Auto-sync after creation
      await syncDock({ dockId })
      
      // Reset form
      setName("")
      setApiKey("")
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create dock")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSync = async (dockId: string) => {
    try {
      await syncDock({ dockId: dockId as any })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync dock")
    }
  }

  const handleDelete = async (dockId: string) => {
    if (!confirm("Are you sure you want to delete this dock?")) return
    
    try {
      await deleteDock({ dockId: dockId as any })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete dock")
    }
  }

  const getStatusBadge = (status: string) => {
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

  // Filtered and sorted docks
  const filteredDocks = useMemo(() => {
    if (!docks) return []
    
    let filtered = docks.filter((dock) => {
      // Search by name
      if (searchQuery && !dock.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Filter by provider
      if (filterProvider !== "all" && dock.provider !== filterProvider) {
        return false
      }
      // Filter by status
      if (filterStatus !== "all" && dock.lastSyncStatus !== filterStatus) {
        return false
      }
      return true
    })
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "provider":
          comparison = a.provider.localeCompare(b.provider)
          break
        case "lastSynced":
          comparison = (a.lastSyncAt || 0) - (b.lastSyncAt || 0)
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })
    
    return filtered
  }, [docks, searchQuery, filterProvider, filterStatus, sortBy, sortOrder])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Docks</h2>
          <p className="text-muted-foreground text-xs">
            Manage your infrastructure provider connections
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dock
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-destructive text-xs">{error}</p>
        </div>
      )}

      {currentOrgId === null && (
        <Card>
          <CardHeader>
            <CardTitle>No Organization Found</CardTitle>
            <CardDescription>
              You need to create an organization before you can connect docks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateOrganizationDialog />
          </CardContent>
        </Card>
      )}

      {showAddForm && currentOrgId && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Dock</CardTitle>
            <CardDescription>
              Connect a provider by entering your API credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDock} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select value={provider} onValueChange={setProvider} disabled={!availableProviders}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder={availableProviders ? "Select provider" : "Loading providers..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder={provider ? `e.g., Production ${availableProviders?.find(p => p.id === provider)?.displayName || ''}` : "e.g., Production Dock"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <PasswordInput
                  id="apiKey"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
                <p className="text-muted-foreground text-xs">
                  Your API key will be encrypted and stored securely
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setError(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search, Filter, and Sort Controls */}
      {docks === undefined ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : docks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No docks connected yet
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Dock
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search docks by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterProvider} onValueChange={setFilterProvider}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {availableProviders?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Connected</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="syncing">Syncing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(val) => {
                const [by, order] = val.split("-")
                setSortBy(by as "name" | "provider" | "lastSynced")
                setSortOrder(order as "asc" | "desc")
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="provider-asc">Provider (A-Z)</SelectItem>
                <SelectItem value="provider-desc">Provider (Z-A)</SelectItem>
                <SelectItem value="lastSynced-desc">Last Synced (Newest)</SelectItem>
                <SelectItem value="lastSynced-asc">Last Synced (Oldest)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <p className="text-muted-foreground text-xs">
            Showing {filteredDocks.length} of {docks.length} docks
          </p>

          {/* Grid of simplified dock cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocks.map((dock) => (
              <Card key={dock._id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{dock.name}</h3>
                        {getStatusBadge(dock.lastSyncStatus)}
                      </div>
                      <ProviderBadge provider={dock.provider} />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleSync(dock._id)}
                        disabled={dock.syncInProgress}
                        title="Sync"
                      >
                        {dock.syncInProgress ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(dock._id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {dock.lastSyncError && (
                    <p className="text-destructive text-xs mt-2">
                      Error: {dock.lastSyncError}
                    </p>
                  )}
                  {dock.lastSyncAt && (
                    <p className="text-muted-foreground text-xs mt-1">
                      Last synced: {new Date(dock.lastSyncAt).toLocaleString()}
                    </p>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>

          {filteredDocks.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  No docks match your filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
