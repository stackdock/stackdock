"use client"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
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
import { Loader2, AlertCircle } from "lucide-react"
import { CreateOrganizationDialog } from "@/components/dashboard/CreateOrganizationDialog"
import { toast } from "sonner"

export const Route = createFileRoute("/dashboard/docks/add")({
  component: AddDockPage,
})

function AddDockPage() {
  const navigate = useNavigate()
  const currentOrgId = useQuery(api.organizations.getCurrentOrgId)
  const availableProviders = useQuery(api["docks/queries"].listAvailableProviders)
  
  const [provider, setProvider] = useState("")
  const [name, setName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const createDock = useMutation(api["docks/mutations"].createDock)
  const syncDock = useMutation(api["docks/mutations"].syncDock)

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
      
      toast.success("Dock connected successfully")
      
      // Navigate to connected page
      navigate({ to: "/dashboard/docks/connected" })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create dock"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          Add Dock
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Connect a new infrastructure provider
        </p>
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

      {currentOrgId && (
        <Card className="max-w-2xl">
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
                  onClick={() => navigate({ to: "/dashboard/docks/connected" })}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
