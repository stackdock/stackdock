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

export interface ProvisionResourceContext {
  dockId: Id<'docks'> | null
  provider: string
  resourceType: ResourceType
  spec: ResourceSpec | null
  validatedSpec: ResourceSpec | null
  provisionId: string | null
  resourceId: Id | null
  status: ProvisionStatus | null
  error: string | null
  formData: Record<string, any>
}

export type ProvisionResourceEvent =
  | { type: 'FILL_FORM'; field: string; value: any }
  | { type: 'SUBMIT' }
  | { type: 'RETRY' }
  | { type: 'EDIT_FORM' }
  | { type: 'CANCEL' }
  | { type: 'STATUS_UPDATE'; status: ProvisionStatus }

// Service implementations (will be provided when machine is used)
export interface ProvisionResourceServices {
  validateSpec: (context: ProvisionResourceContext) => Promise<ResourceSpec>
  provisionResource: (context: ProvisionResourceContext) => Promise<{ provisionId: string; resourceId: Id }>
  monitorProvisionStatus: (context: ProvisionResourceContext) => Promise<ProvisionStatus>
  cancelProvision: (context: ProvisionResourceContext) => Promise<void>
}

export const provisionResourceMachine = setup({
  types: {
    context: {} as ProvisionResourceContext,
    events: {} as ProvisionResourceEvent,
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
        if (event.type === 'done.invoke.validateSpec') {
          return event.output as ResourceSpec
        }
        return null
      },
    }),
    assignProvisionId: assign({
      provisionId: ({ event }) => {
        if (event.type === 'done.invoke.provisionResource') {
          return (event.output as { provisionId: string }).provisionId
        }
        return null
      },
      resourceId: ({ event }) => {
        if (event.type === 'done.invoke.provisionResource') {
          return (event.output as { resourceId: Id }).resourceId
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
        if (event.type === 'error.platform') {
          return event.error instanceof Error ? event.error.message : String(event.error)
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
  context: {
    dockId: null,
    provider: '',
    resourceType: 'server',
    spec: null,
    validatedSpec: null,
    provisionId: null,
    resourceId: null,
    status: null,
    error: null,
    formData: {},
  },
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
