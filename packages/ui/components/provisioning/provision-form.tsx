/**
 * Provision Form Component
 * 
 * Multi-step form for resource provisioning with XState state machine integration.
 * Handles form validation, submission, and error states.
 * 
 * Follows shadcn/ui patterns: forwardRef, cn(), design tokens
 */

"use client"

import * as React from "react"
import { useMachine } from "@xstate/react"
import { useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2 } from "lucide-react"
import { provisionResourceMachine, type ResourceType, type ResourceSpec } from "@/machines/provision-resource.machine"
import { ResourceSpecForm } from "./resource-spec-form"
import { ProvisionProgressIndicator } from "./provision-progress-indicator"
import type { Id } from "convex/_generated/dataModel"

export interface ProvisionFormProps
  extends React.ComponentPropsWithoutRef<"div"> {
  dockId: Id<'docks'>
  resourceType: ResourceType
  provider: string
  defaultValues?: Partial<ResourceSpec>
  onSubmit?: (result: { provisionId: string; resourceId: Id }) => void
  onCancel?: () => void
  disabled?: boolean
}

const PROVISION_STEPS = [
  { id: 'validate', label: 'Validate Configuration', description: 'Validating resource specification' },
  { id: 'create', label: 'Create Resource', description: 'Provisioning resource via provider' },
  { id: 'configure', label: 'Configure Settings', description: 'Applying configuration' },
  { id: 'verify', label: 'Verify Provisioning', description: 'Verifying resource is ready' },
  { id: 'complete', label: 'Complete', description: 'Provisioning completed' },
]

const ProvisionForm = React.forwardRef<
  HTMLDivElement,
  ProvisionFormProps
>(({ 
  className, 
  dockId, 
  resourceType, 
  provider,
  defaultValues,
  onSubmit,
  onCancel,
  disabled = false,
  ...props 
}, ref) => {
  const provisionResource = useMutation(api.docks.mutations.provisionResource)

  const [state, send] = useMachine(provisionResourceMachine, {
    context: {
      dockId,
      provider,
      resourceType,
      spec: defaultValues || null,
      validatedSpec: null,
      provisionId: null,
      resourceId: null,
      status: null,
      error: null,
      formData: defaultValues || {},
    },
    services: {
      validateSpec: async ({ context }) => {
        // Client-side validation
        if (!context.spec || Object.keys(context.spec).length === 0) {
          throw new Error('Resource specification is required')
        }
        return context.spec
      },
      provisionResource: async ({ context }) => {
        if (!context.validatedSpec) {
          throw new Error('Validated specification is required')
        }
        
        const result = await provisionResource({
          dockId: context.dockId!,
          resourceType: context.resourceType,
          spec: context.validatedSpec,
        })
        
        return result
      },
      monitorProvisionStatus: async ({ context }) => {
        // This will be handled by real-time Convex query subscription
        // For now, return success immediately
        return 'success' as const
      },
      cancelProvision: async ({ context }) => {
        // TODO: Implement cancel mutation when available
        throw new Error('Cancel not yet implemented')
      },
    },
  })

  // Handle form data changes
  const handleSpecChange = React.useCallback((spec: ResourceSpec) => {
    send({ type: 'FILL_FORM', field: 'spec', value: spec })
  }, [send])

  // Handle form submission
  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault()
    send({ type: 'SUBMIT' })
  }, [send])

  // Handle cancel
  const handleCancel = React.useCallback(() => {
    if (state.matches('provisioning')) {
      send({ type: 'CANCEL' })
    }
    onCancel?.()
  }, [state, send, onCancel])

  // Notify parent on success
  React.useEffect(() => {
    if (state.matches('success') && state.context.provisionId && state.context.resourceId) {
      onSubmit?.({
        provisionId: state.context.provisionId,
        resourceId: state.context.resourceId,
      })
    }
  }, [state, onSubmit])

  const isSubmitting = state.matches('validating') || state.matches('provisioning')
  const hasError = state.matches('validationError') || state.matches('provisionError') || state.matches('monitoringError')
  const currentStep = state.matches('idle') ? 0
    : state.matches('validating') ? 0
    : state.matches('provisioning') ? 1
    : state.matches('monitoring') ? 2
    : state.matches('success') ? 4
    : 0

  return (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>
            Provision {resourceType} on {provider}
          </CardTitle>
          <CardDescription>
            Configure and provision your resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Indicator */}
          {(isSubmitting || state.matches('monitoring')) && (
            <ProvisionProgressIndicator
              steps={PROVISION_STEPS}
              currentStep={currentStep}
              status={state.matches('provisioning') ? 'provisioning' : state.matches('monitoring') ? 'provisioning' : 'validating'}
            />
          )}

          {/* Form */}
          {state.matches('idle') || state.matches('validationError') ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <ResourceSpecForm
                provider={provider}
                resourceType={resourceType}
                defaultValues={state.context.spec || defaultValues}
                onChange={handleSpecChange}
                errors={hasError && state.context.error ? { root: state.context.error } : undefined}
              />

              {hasError && state.context.error && (
                <div className="rounded-md border border-destructive bg-destructive/10 p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{state.context.error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={disabled || isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={disabled || isSubmitting || !state.can({ type: 'SUBMIT' })}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {state.matches('validating') ? 'Validating...' : 'Provisioning...'}
                    </>
                  ) : (
                    'Provision Resource'
                  )}
                </Button>
              </div>
            </form>
          ) : null}

          {/* Success State */}
          {state.matches('success') && (
            <div className="rounded-md border border-green-500 bg-green-50 p-4">
              <p className="text-sm text-green-800">
                Resource provisioned successfully! Resource ID: {state.context.resourceId}
              </p>
            </div>
          )}

          {/* Error State with Retry */}
          {(state.matches('provisionError') || state.matches('monitoringError')) && (
            <div className="space-y-4">
              <div className="rounded-md border border-destructive bg-destructive/10 p-3">
                <p className="text-sm text-destructive">
                  {state.context.error || 'Provisioning failed'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => send({ type: 'RETRY' })}
                  variant="default"
                >
                  Retry
                </Button>
                <Button
                  onClick={() => send({ type: 'EDIT_AND_RETRY' })}
                  variant="outline"
                >
                  Edit and Retry
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})

ProvisionForm.displayName = "ProvisionForm"

export { ProvisionForm }
