/**
 * Provision Status Card Component
 * 
 * Displays provisioning progress and status with real-time updates.
 * Shows status badges, progress indicators, and error messages.
 * 
 * Follows shadcn/ui patterns: forwardRef, cn(), design tokens
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Loader2, XCircle, RefreshCw } from "lucide-react"
import type { ResourceType } from "@/machines/provision-resource.machine"

export type ProvisionStatus = 'idle' | 'validating' | 'provisioning' | 'success' | 'error'

export interface ProvisionStatusCardProps
  extends React.ComponentPropsWithoutRef<"div"> {
  provisionId: string
  status: ProvisionStatus
  resourceType: ResourceType
  provider: string
  progress?: number
  message?: string
  error?: string | null
  onRetry?: () => void
  onCancel?: () => void
  showDetails?: boolean
}

const ProvisionStatusCard = React.forwardRef<
  HTMLDivElement,
  ProvisionStatusCardProps
>(({ 
  className, 
  provisionId, 
  status, 
  resourceType, 
  provider,
  progress,
  message,
  error,
  onRetry,
  onCancel,
  showDetails = false,
  ...props 
}, ref) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'idle':
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            Ready to provision
          </Badge>
        )
      case 'validating':
        return (
          <Badge className="bg-yellow-500 text-yellow-50">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Validating...
          </Badge>
        )
      case 'provisioning':
        return (
          <Badge className="bg-blue-500 text-blue-50">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Provisioning...
          </Badge>
        )
      case 'success':
        return (
          <Badge className="bg-green-500 text-green-50">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Success
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        )
      default:
        return null
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-8 w-8 text-green-500" />
      case 'error':
        return <AlertCircle className="h-8 w-8 text-destructive" />
      case 'validating':
      case 'provisioning':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    if (message) return message
    
    switch (status) {
      case 'idle':
        return 'Ready to start provisioning'
      case 'validating':
        return 'Validating configuration...'
      case 'provisioning':
        return 'Provisioning resource... This may take a few minutes.'
      case 'success':
        return 'Resource provisioned successfully!'
      case 'error':
        return error || 'Provisioning failed. Please try again.'
      default:
        return 'Unknown status'
    }
  }

  return (
    <Card ref={ref} className={cn("w-full", className)} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle>
                Provision {resourceType} on {provider}
              </CardTitle>
              <CardDescription>
                Provision ID: {provisionId}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {getStatusMessage()}
        </p>

        {status === 'provisioning' && progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === 'error' && error && (
          <div className="rounded-md border border-destructive bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {showDetails && (
          <div className="rounded-md border bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Details</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resource Type:</span>
                <span className="font-medium">{resourceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-medium">{provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">{status}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {status === 'error' && onRetry && (
            <Button onClick={onRetry} variant="default" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
          {(status === 'validating' || status === 'provisioning') && onCancel && (
            <Button onClick={onCancel} variant="outline" size="sm">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

ProvisionStatusCard.displayName = "ProvisionStatusCard"

export { ProvisionStatusCard }
