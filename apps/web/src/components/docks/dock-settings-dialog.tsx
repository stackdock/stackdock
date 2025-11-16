/**
 * Dock Settings Dialog Component
 * 
 * Allows configuring sync interval for a dock with provider-aware validation.
 */

"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"
import { toast } from "sonner"

interface DockSettingsDialogProps {
  dockId: Id<"docks">
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DockSettingsDialog({
  dockId,
  open,
  onOpenChange,
}: DockSettingsDialogProps) {
  const dock = useQuery(api["docks/queries"].getDock, { dockId })
  const updateSyncInterval = useMutation(api["docks/mutations"].updateSyncInterval)
  const getProviderSyncConfig = useQuery(api["docks/queries"].getProviderSyncConfig, {
    provider: dock?.provider || "",
  })
  
  const [intervalSeconds, setIntervalSeconds] = useState<number>(120)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  
  // Initialize interval from dock syncConfig
  useEffect(() => {
    if (dock?.syncConfig?.intervalSeconds) {
      setIntervalSeconds(dock.syncConfig.intervalSeconds)
    } else if (getProviderSyncConfig?.recommendedInterval) {
      setIntervalSeconds(getProviderSyncConfig.recommendedInterval)
    }
  }, [dock, getProviderSyncConfig])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setWarning(null)
    
    try {
      const result = await updateSyncInterval({
        dockId,
        intervalSeconds,
      })
      
      if (result.warning) {
        setWarning(result.warning)
        toast.warning("Sync interval updated with warning")
      } else {
        toast.success("Sync interval updated successfully")
        onOpenChange(false)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update sync interval")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!dock || !getProviderSyncConfig) {
    return null
  }
  
  const recommendedInterval = getProviderSyncConfig.recommendedInterval || 120
  const absoluteMinimum = getProviderSyncConfig.absoluteMinimum || 60
  const reason = getProviderSyncConfig.reason || ""
  const minutes = Math.round(intervalSeconds / 60)
  const recommendedMinutes = Math.round(recommendedInterval / 60)
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dock Settings</DialogTitle>
          <DialogDescription>
            Configure sync interval for {dock.name}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interval">Sync Interval (seconds)</Label>
            <Input
              id="interval"
              type="number"
              min={absoluteMinimum}
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(parseInt(e.target.value, 10) || absoluteMinimum)}
              placeholder={`${recommendedInterval}`}
            />
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                Recommended: {recommendedInterval} seconds ({recommendedMinutes} {recommendedMinutes === 1 ? "minute" : "minutes"})
              </p>
              <p className="text-xs">
                Minimum: {absoluteMinimum} seconds. {reason}
              </p>
            </div>
          </div>
          
          {intervalSeconds < recommendedInterval && intervalSeconds >= absoluteMinimum && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This interval is below the recommended minimum. You may hit rate limits more frequently.
              </AlertDescription>
            </Alert>
          )}
          
          {warning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
