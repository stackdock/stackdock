/**
 * Provision Resource State Machine
 * 
 * Manages the complete provisioning workflow from form submission to success/error.
 * Uses XState v5 with setup() for type safety.
 * 
 * Reference: https://stately.ai/docs/xstate
 */

import { setup, assign } from 'xstate'
import type { Id } from 'convex/_generated/dataModel'

// Types
export type ResourceType = 'server' | 'webService' | 'database' | 'domain'
export type ProvisionStatus = 'idle' | 'validating' | 'provisioning' | 'success' | 'error'
export type ResourceSpec = Record<string, any>

// Union type for resource IDs (provisioning can create different resource types)
export type ResourceId = Id<'servers'> | Id<'webServices'> | Id<'databases'> | Id<'domains'>

// Re-export for use in components
export type { ResourceId as ProvisionResourceId }

export interface ProvisionResourceContext {
  dockId: Id<'docks'> | null
  provider: string
  resourceType: ResourceType
  spec: ResourceSpec | null
  validatedSpec: ResourceSpec | null
  provisionId: string | null
  resourceId: ResourceId | null
  status: ProvisionStatus | null
  error: string | null
  formData: Record<string, any>
}

export type ProvisionResourceEvent =
  | { type: 'FILL_FORM'; field: string; value: any }
  | { type: 'SUBMIT' }
  | { type: 'RETRY' }
  | { type: 'EDIT_FORM' }
  | { type: 'EDIT_AND_RETRY' }
  | { type: 'RETRY_MONITORING' }
  | { type: 'MANUAL_CHECK' }
  | { type: 'CANCEL' }
  | { type: 'STATUS_UPDATE'; status: ProvisionStatus }
  | { type: 'done.invoke.validateSpec'; output: ResourceSpec }
  | { type: 'done.invoke.provisionResource'; output: { provisionId: string; resourceId: ResourceId } }
  | { type: 'done.invoke.monitorProvisionStatus'; output: ProvisionStatus }
  | { type: 'done.invoke.cancelProvision'; output: void }
  | { type: 'error.platform'; error: unknown }

// Service implementations (will be provided when machine is used)
export interface ProvisionResourceServices {
  validateSpec: (context: ProvisionResourceContext) => Promise<ResourceSpec>
  provisionResource: (context: ProvisionResourceContext) => Promise<{ provisionId: string; resourceId: ResourceId }>
  monitorProvisionStatus: (context: ProvisionResourceContext) => Promise<ProvisionStatus>
  cancelProvision: (context: ProvisionResourceContext) => Promise<void>
}

export const provisionResourceMachine = setup({
  types: {
    context: {} as ProvisionResourceContext,
    events: {} as ProvisionResourceEvent,
    input: {} as Partial<ProvisionResourceContext>,
  },
  services: {
    validateSpec: {} as ProvisionResourceServices['validateSpec'],
    provisionResource: {} as ProvisionResourceServices['provisionResource'],
    monitorProvisionStatus: {} as ProvisionResourceServices['monitorProvisionStatus'],
    cancelProvision: {} as ProvisionResourceServices['cancelProvision'],
  },
  guards: {
    isFormValid: ({ context }) => {
      // Check if required fields are filled
      if (!context.dockId || !context.provider || !context.resourceType) {
        return false
      }
      if (!context.spec || Object.keys(context.spec).length === 0) {
        return false
      }
      return true
    },
    isSuccess: ({ context }) => context.status === 'success',
    isError: ({ context }) => context.status === 'error',
  },
  actions: {
    assignFormData: assign({
      formData: ({ context, event }) => {
        if (event.type === 'FILL_FORM') {
          return {
            ...context.formData,
            [event.field]: event.value,
          }
        }
        return context.formData
      },
      spec: ({ context, event }) => {
        if (event.type === 'FILL_FORM') {
          // Build spec from form data
          const newFormData = {
            ...context.formData,
            [event.field]: event.value,
          }
          return newFormData as ResourceSpec
        }
        return context.spec
      },
    }),
    assignValidatedSpec: assign({
      validatedSpec: ({ event }) => {
        if ('output' in event && 'type' in event && event.type === 'done.invoke.validateSpec') {
          return (event as { type: 'done.invoke.validateSpec'; output: ResourceSpec }).output
        }
        return null
      },
    }),
    assignProvisionId: assign({
      provisionId: ({ event }) => {
        if ('output' in event && 'type' in event && event.type === 'done.invoke.provisionResource') {
          return ((event as { type: 'done.invoke.provisionResource'; output: { provisionId: string; resourceId: ResourceId } }).output).provisionId
        }
        return null
      },
      resourceId: ({ event }) => {
        if ('output' in event && 'type' in event && event.type === 'done.invoke.provisionResource') {
          return ((event as { type: 'done.invoke.provisionResource'; output: { provisionId: string; resourceId: ResourceId } }).output).resourceId
        }
        return null
      },
    }),
    assignStatus: assign({
      status: ({ event }) => {
        if (event.type === 'STATUS_UPDATE') {
          return event.status
        }
        return null
      },
    }),
    assignError: assign({
      error: ({ event }) => {
        if ('error' in event && 'type' in event && event.type === 'error.platform') {
          return (event as { type: 'error.platform'; error: unknown }).error instanceof Error 
            ? (event as { type: 'error.platform'; error: Error }).error.message 
            : String((event as { type: 'error.platform'; error: unknown }).error)
        }
        return null
      },
    }),
    clearError: assign({
      error: null,
    }),
  },
}).createMachine({
  id: 'provisionResource',
  initial: 'idle',
  context: ({ input }) => ({
    dockId: input?.dockId ?? null,
    provider: input?.provider ?? '',
    resourceType: input?.resourceType ?? 'server',
    spec: input?.spec ?? null,
    validatedSpec: input?.validatedSpec ?? null,
    provisionId: input?.provisionId ?? null,
    resourceId: input?.resourceId ?? null,
    status: input?.status ?? null,
    error: input?.error ?? null,
    formData: input?.formData ?? {},
  }),
  states: {
    idle: {
      description: 'Initial state, form ready for input',
      on: {
        FILL_FORM: {
          target: 'idle',
          actions: 'assignFormData',
        },
        SUBMIT: {
          guard: 'isFormValid',
          target: 'validating',
        },
      },
    },
    validating: {
      description: 'Validating resource specification',
      invoke: {
        src: 'validateSpec',
        onDone: {
          target: 'provisioning',
          actions: 'assignValidatedSpec',
        },
        onError: {
          target: 'validationError',
          actions: 'assignError',
        },
      },
    },
    validationError: {
      description: 'Validation failed, show errors',
      on: {
        RETRY: {
          target: 'validating',
        },
        EDIT_FORM: {
          target: 'idle',
          actions: 'clearError',
        },
      },
    },
    provisioning: {
      description: 'Resource provisioning in progress',
      invoke: {
        src: 'provisionResource',
        onDone: {
          target: 'monitoring',
          actions: 'assignProvisionId',
        },
        onError: {
          target: 'provisionError',
          actions: 'assignError',
        },
      },
      on: {
        CANCEL: {
          target: 'cancelling',
        },
      },
    },
    cancelling: {
      description: 'Cancelling provisioning',
      invoke: {
        src: 'cancelProvision',
        onDone: {
          target: 'cancelled',
        },
        onError: {
          target: 'provisionError',
        },
      },
    },
    monitoring: {
      description: 'Monitoring provisioning progress',
      invoke: {
        src: 'monitorProvisionStatus',
        onDone: [
          {
            guard: 'isSuccess',
            target: 'success',
          },
          {
            guard: 'isError',
            target: 'provisionError',
          },
        ],
        onError: {
          target: 'monitoringError',
        },
      },
      on: {
        STATUS_UPDATE: {
          actions: 'assignStatus',
        },
      },
    },
    success: {
      type: 'final',
      description: 'Provisioning completed successfully',
    },
    provisionError: {
      description: 'Provisioning failed',
      on: {
        RETRY: {
          target: 'provisioning',
        },
        EDIT_AND_RETRY: {
          target: 'idle',
          actions: 'clearError',
        },
      },
    },
    cancelled: {
      type: 'final',
      description: 'Provisioning cancelled',
    },
    monitoringError: {
      description: 'Error monitoring status',
      on: {
        RETRY_MONITORING: {
          target: 'monitoring',
        },
        MANUAL_CHECK: {
          target: 'success',
        },
      },
    },
  },
})
