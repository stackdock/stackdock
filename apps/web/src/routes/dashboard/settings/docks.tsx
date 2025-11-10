"use client"
import { createFileRoute } from "@tanstack/react-router"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { useOrganization } from "@clerk/clerk-react"
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
import { Loader2, Plus, RefreshCw, Trash2, AlertCircle } from "lucide-react"
import { CreateOrganizationDialog } from "@/components/dashboard/CreateOrganizationDialog"

export const Route = createFileRoute("/dashboard/settings/docks")({
  component: DocksPage,
})

function DocksPage() {
  const docks = useQuery(api["docks/queries"].listDocks)
  const currentOrgId = useQuery(api.organizations.getCurrentOrgId)
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [provider, setProvider] = useState("gridpane")
  const [name, setName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gridpane">GridPane</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production GridPane"
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

      <div className="space-y-4">
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
          docks.map((dock) => (
            <Card key={dock._id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{dock.name}</h3>
                      {getStatusBadge(dock.lastSyncStatus)}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Provider: <span className="font-medium capitalize">{dock.provider}</span>
                    </p>
                    {dock.lastSyncError && (
                      <p className="text-destructive text-xs mt-1">
                        Error: {dock.lastSyncError}
                      </p>
                    )}
                    {dock.lastSyncAt && (
                      <p className="text-muted-foreground text-xs">
                        Last synced: {new Date(dock.lastSyncAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(dock._id)}
                      disabled={dock.syncInProgress}
                    >
                      {dock.syncInProgress ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(dock._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
