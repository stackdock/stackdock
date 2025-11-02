/**
 * Provision Progress Indicator Component
 * 
 * Visual progress indicator for async provisioning operations.
 * Shows step-by-step progress with current step highlighting.
 * 
 * Follows shadcn/ui patterns: forwardRef, cn(), design tokens
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, AlertCircle, Loader2 } from "lucide-react"

export interface ProvisionStep {
  id: string
  label: string
  description?: string
}

export type ProvisionStatus = 'idle' | 'validating' | 'provisioning' | 'success' | 'error'

export interface ProvisionProgressIndicatorProps
  extends React.ComponentPropsWithoutRef<"div"> {
  steps: ProvisionStep[]
  currentStep: number
  status: ProvisionStatus
}

const ProvisionProgressIndicator = React.forwardRef<
  HTMLDivElement,
  ProvisionProgressIndicatorProps
>(({ className, steps, currentStep, status, ...props }, ref) => {
  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'pending' | 'error' => {
    if (stepIndex < currentStep) {
      return 'completed'
    }
    if (stepIndex === currentStep) {
      if (status === 'error') {
        return 'error'
      }
      return 'current'
    }
    return 'pending'
  }

  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(index)
        const isCurrent = stepStatus === 'current'
        const isCompleted = stepStatus === 'completed'
        const isError = stepStatus === 'error'
        const isPending = stepStatus === 'pending'

        return (
          <div key={step.id} className="flex items-start gap-4">
            {/* Step Indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && !isError && "border-primary bg-primary/10 text-primary",
                  isError && "border-destructive bg-destructive text-destructive-foreground",
                  isPending && "border-muted bg-muted text-muted-foreground"
                )}
              >
                {isCompleted && <Check className="h-5 w-5" />}
                {isCurrent && !isError && (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                {isError && <AlertCircle className="h-5 w-5" />}
                {isPending && <span className="text-sm font-medium">{index + 1}</span>}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mt-2 h-8 w-0.5",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 pb-8">
              <h4
                className={cn(
                  "text-sm font-medium",
                  isCurrent && "text-foreground",
                  isCompleted && "text-muted-foreground",
                  isError && "text-destructive",
                  isPending && "text-muted-foreground"
                )}
              >
                {step.label}
              </h4>
              {step.description && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
})

ProvisionProgressIndicator.displayName = "ProvisionProgressIndicator"

export { ProvisionProgressIndicator }

