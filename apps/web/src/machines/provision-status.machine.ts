/**
 * Provision Status State Machine
 * 
 * Manages provisioning status page state with real-time updates.
 * Uses XState v5 with setup() for type safety.
 * 
 * Reference: https://stately.ai/docs/xstate
 */

import { setup, assign } from 'xstate'
import type { Id } from 'convex/_generated/dataModel'

// Types
export type ProvisionStatus = 'idle' | 'validating' | 'provisioning' | 'success' | 'error'

export interface ProvisionStatusContext {
  provisionId: string
  status: ProvisionStatus | null
  resourceId: Id | null
  error: string | null
  progress?: number
  message?: string
}

export type ProvisionStatusEvent =
  | { type: 'STATUS_UPDATE'; status: ProvisionStatus; progress?: number; message?: string; resourceId?: Id }
  | { type: 'CANCEL' }
  | { type: 'RETRY' }

// Service implementations (will be provided when machine is used)
export interface ProvisionStatusServices {
  fetchStatus: (context: ProvisionStatusContext) => Promise<{
    status: ProvisionStatus
    progress?: number
    message?: string
    resourceId?: Id | null
  }>
  subscribeToStatus: (context: ProvisionStatusContext) => Promise<ProvisionStatus>
  cancelProvision: (context: ProvisionStatusContext) => Promise<void>
}

export const provisionStatusMachine = setup({
  types: {
    context: {} as ProvisionStatusContext,
    events: {} as ProvisionStatusEvent,
  },
  guards: {
    isSuccess: ({ context }) => context.status === 'success',
    isError: ({ context }) => context.status === 'error',
  },
  actions: {
    assignStatus: assign({
      status: ({ event }) => {
        if (event.type === 'STATUS_UPDATE') {
          return event.status
        }
        if (event.type === 'done.invoke.fetchStatus' || event.type === 'done.invoke.subscribeToStatus') {
          return (event.output as { status: ProvisionStatus }).status
        }
        return null
      },
      progress: ({ event }) => {
        if (event.type === 'STATUS_UPDATE') {
          return event.progress
        }
        if (event.type === 'done.invoke.fetchStatus') {
          return (event.output as { progress?: number }).progress
        }
        return undefined
      },
      message: ({ event }) => {
        if (event.type === 'STATUS_UPDATE') {
          return event.message
        }
        if (event.type === 'done.invoke.fetchStatus') {
          return (event.output as { message?: string }).message
        }
        return undefined
      },
      resourceId: ({ event }) => {
        if (event.type === 'STATUS_UPDATE' && event.resourceId) {
          return event.resourceId
        }
        if (event.type === 'done.invoke.fetchStatus') {
          return (event.output as { resourceId?: Id | null }).resourceId || null
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
  },
}).createMachine({
  id: 'provisionStatus',
  initial: 'loading',
  context: {
    provisionId: '',
    status: null,
    resourceId: null,
    error: null,
  },
  states: {
    loading: {
      invoke: {
        src: 'fetchStatus',
        onDone: {
          target: 'monitoring',
          actions: 'assignStatus',
        },
        onError: {
          target: 'error',
          actions: 'assignError',
        },
      },
    },
    monitoring: {
      invoke: {
        src: 'subscribeToStatus',
        onDone: [
          {
            guard: 'isSuccess',
            target: 'success',
          },
          {
            guard: 'isError',
            target: 'failed',
          },
        ],
      },
      on: {
        STATUS_UPDATE: {
          actions: 'assignStatus',
        },
        CANCEL: {
          target: 'cancelling',
        },
      },
    },
    success: {
      type: 'final',
    },
    failed: {
      on: {
        RETRY: {
          target: 'monitoring',
        },
      },
    },
    cancelling: {
      invoke: {
        src: 'cancelProvision',
        onDone: {
          target: 'cancelled',
        },
      },
    },
    cancelled: {
      type: 'final',
    },
    error: {
      on: {
        RETRY: {
          target: 'loading',
        },
      },
    },
  },
})
