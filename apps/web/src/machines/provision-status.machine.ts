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

// Union type for resource IDs (provisioning can create different resource types)
export type ResourceId = Id<'servers'> | Id<'webServices'> | Id<'databases'> | Id<'domains'>

export interface ProvisionStatusContext {
  provisionId: string
  status: ProvisionStatus | null
  resourceId: ResourceId | null
  error: string | null
  progress?: number
  message?: string
}

export type ProvisionStatusEvent =
  | { type: 'STATUS_UPDATE'; status: ProvisionStatus; progress?: number; message?: string; resourceId?: ResourceId }
  | { type: 'CANCEL' }
  | { type: 'RETRY' }
  | { type: 'done.invoke.fetchStatus'; output: { status: ProvisionStatus; progress?: number; message?: string; resourceId?: ResourceId | null } }
  | { type: 'done.invoke.subscribeToStatus'; output: ProvisionStatus }
  | { type: 'done.invoke.cancelProvision'; output: void }
  | { type: 'error.platform'; error: unknown }

// Service implementations (will be provided when machine is used)
export interface ProvisionStatusServices {
  fetchStatus: (context: ProvisionStatusContext) => Promise<{
    status: ProvisionStatus
    progress?: number
    message?: string
    resourceId?: ResourceId | null
  }>
  subscribeToStatus: (context: ProvisionStatusContext) => Promise<ProvisionStatus>
  cancelProvision: (context: ProvisionStatusContext) => Promise<void>
}

export const provisionStatusMachine = setup({
  types: {
    context: {} as ProvisionStatusContext,
    events: {} as ProvisionStatusEvent,
  },
  services: {
    fetchStatus: {} as ProvisionStatusServices['fetchStatus'],
    subscribeToStatus: {} as ProvisionStatusServices['subscribeToStatus'],
    cancelProvision: {} as ProvisionStatusServices['cancelProvision'],
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
        if ('output' in event && 'type' in event) {
          if (event.type === 'done.invoke.fetchStatus') {
            return ((event as { type: 'done.invoke.fetchStatus'; output: { status: ProvisionStatus; progress?: number; message?: string; resourceId?: ResourceId | null } }).output).status
          }
          if (event.type === 'done.invoke.subscribeToStatus') {
            return (event as { type: 'done.invoke.subscribeToStatus'; output: ProvisionStatus }).output
          }
        }
        return null
      },
      progress: ({ event }) => {
        if (event.type === 'STATUS_UPDATE') {
          return event.progress
        }
        if ('output' in event && 'type' in event && event.type === 'done.invoke.fetchStatus') {
          return ((event as { type: 'done.invoke.fetchStatus'; output: { status: ProvisionStatus; progress?: number; message?: string; resourceId?: ResourceId | null } }).output).progress
        }
        return undefined
      },
      message: ({ event }) => {
        if (event.type === 'STATUS_UPDATE') {
          return event.message
        }
        if ('output' in event && 'type' in event && event.type === 'done.invoke.fetchStatus') {
          return ((event as { type: 'done.invoke.fetchStatus'; output: { status: ProvisionStatus; progress?: number; message?: string; resourceId?: ResourceId | null } }).output).message
        }
        return undefined
      },
      resourceId: ({ event }) => {
        if (event.type === 'STATUS_UPDATE' && event.resourceId) {
          return event.resourceId
        }
        if ('output' in event && 'type' in event && event.type === 'done.invoke.fetchStatus') {
          return ((event as { type: 'done.invoke.fetchStatus'; output: { status: ProvisionStatus; progress?: number; message?: string; resourceId?: ResourceId | null } }).output).resourceId || null
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
