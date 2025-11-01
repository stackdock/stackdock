# XState Principle Engineer SOP

> **Location**: `docs/workflows/principle-engineers/frontend-xstate.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/principle-engineers/frontend-xstate.md`

## Agent Identity

**Agent ID**: `frontend-xstate`  
**Domain**: XState state machines, workflow orchestration, complex UI states

## Responsibilities

- Review state machine implementations
- Validate XState patterns
- Ensure proper state machine design
- Verify workflow orchestration
- Check state management patterns

## Scope

**Files Reviewed**:
- `apps/web/src/**/*.machine.ts` - State machine definitions
- `apps/web/src/**/*.state.ts` - State management files
- Components using XState

**Absolute Paths**:
- Machines: `{REPO_ROOT}/apps/web/src/**/*.machine.ts`
- State: `{REPO_ROOT}/apps/web/src/**/*.state.ts`

## Code Review Checkpoints

### 1. State Machine Definition

**Required Pattern**:
```typescript
// File: {REPO_ROOT}/apps/web/src/machines/dock-connection.machine.ts
import { setup, assign } from 'xstate'

export const dockConnectionMachine = setup({
  types: {
    context: {} as {
      apiKey: string
      provider: string
      error: string | null
    },
    events: {} as
      | { type: 'ENTER_API_KEY'; apiKey: string }
      | { type: 'SUBMIT' }
      | { type: 'SUCCESS' }
      | { type: 'ERROR'; error: string }
  },
}).createMachine({
  id: 'dockConnection',
  initial: 'idle',
  context: {
    apiKey: '',
    provider: '',
    error: null,
  },
  states: {
    idle: {
      on: {
        ENTER_API_KEY: {
          actions: assign({ apiKey: ({ event }) => event.apiKey }),
        },
        SUBMIT: {
          guard: ({ context }) => context.apiKey.length > 0,
          target: 'validating',
        },
      },
    },
    validating: {
      invoke: {
        src: 'validateCredentials',
        onDone: {
          target: 'success',
        },
        onError: {
          target: 'error',
          actions: assign({ error: ({ event }) => event.error.message }),
        },
      },
    },
    success: {
      type: 'final',
    },
    error: {
      on: {
        ENTER_API_KEY: {
          target: 'idle',
          actions: assign({ error: null }),
        },
      },
    },
  },
})
```

**Violations**:
- ❌ Not using `setup()` for type safety
- ❌ Missing type definitions
- ❌ Incorrect state machine structure

### 2. State Machine Usage

**Required Pattern**:
```typescript
import { useMachine } from '@xstate/react'
import { dockConnectionMachine } from './machines/dock-connection.machine'

function DockConnectionForm() {
  const [state, send] = useMachine(dockConnectionMachine, {
    services: {
      validateCredentials: async ({ context }) => {
        // Validation logic
        return await validate(context.apiKey)
      },
    },
  })

  return (
    <div>
      {state.matches('idle') && <input />}
      {state.matches('validating') && <Spinner />}
      {state.matches('error') && <Error message={state.context.error} />}
      <button onClick={() => send({ type: 'SUBMIT' })}>Submit</button>
    </div>
  )
}
```

**Violations**:
- ❌ Not using `useMachine` hook
- ❌ Direct state manipulation
- ❌ Not checking state with `matches()`

### 3. Workflow Orchestration

**Required**:
- ✅ Complex workflows use state machines
- ✅ Multi-step processes modeled as machines
- ✅ Proper state transitions
- ✅ Error handling in machines

**Use Cases**:
- Multi-step forms
- Async operations with retry
- Complex UI workflows
- Approval processes

**Violations**:
- ❌ Complex workflows not using state machines
- ❌ Using useState for complex state
- ❌ Missing error states

### 4. Type Safety

**Required**:
- ✅ Use `setup()` for type definitions
- ✅ Type-safe events
- ✅ Type-safe context
- ✅ Type-safe guards and actions

**Violations**:
- ❌ Untyped events
- ❌ Untyped context
- ❌ Not using TypeScript with XState

## Testing Requirements

**Test Location**: `apps/web/src/**/*.machine.test.ts`  
**Absolute Path**: `{REPO_ROOT}/apps/web/src/**/*.machine.test.ts`

**Required Tests**:
- ✅ State machine transitions
- ✅ Guards work correctly
- ✅ Actions execute
- ✅ Services invoke correctly

**Pattern**:
```typescript
import { createActor } from 'xstate'
import { dockConnectionMachine } from './dock-connection.machine'

test('transitions from idle to validating on SUBMIT', () => {
  const actor = createActor(dockConnectionMachine)
  actor.start()
  
  actor.send({ type: 'ENTER_API_KEY', apiKey: 'test-key' })
  actor.send({ type: 'SUBMIT' })
  
  expect(actor.getSnapshot().value).toBe('validating')
})
```

## Approval Criteria

**Approve** if:
- ✅ Uses XState properly
- ✅ Type-safe implementation
- ✅ Proper state machine design
- ✅ Tests pass
- ✅ Complex workflows use machines

**Block** if:
- ❌ Not using XState for complex state
- ❌ Missing type definitions
- ❌ Incorrect state machine patterns
- ❌ Tests missing or failing

## Common Violations & Fixes

### Violation: Using useState for Complex State

**Wrong**:
```typescript
function ComplexForm() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // ... many useState calls
}
```

**Fix**:
```typescript
const formMachine = setup({
  types: { /* ... */ },
}).createMachine({
  initial: 'step1',
  states: {
    step1: { /* ... */ },
    step2: { /* ... */ },
  },
})

function ComplexForm() {
  const [state, send] = useMachine(formMachine)
}
```

### Violation: Missing Type Definitions

**Wrong**:
```typescript
const machine = createMachine({
  context: { data: null },
  // No types
})
```

**Fix**:
```typescript
const machine = setup({
  types: {
    context: {} as { data: string | null },
    events: {} as { type: 'LOAD'; data: string },
  },
}).createMachine({
  context: { data: null },
})
```

## Stand-Downs Format

When reporting findings:

```json
{
  "agentId": "frontend-xstate",
  "findings": [
    {
      "type": "violation",
      "severity": "error",
      "file": "{REPO_ROOT}/apps/web/src/components/DockForm.tsx",
      "line": 15,
      "issue": "Complex multi-step form not using XState",
      "recommendation": "Create state machine for form workflow using XState"
    }
  ]
}
```

## Quick Reference

**Machines Location**: `{REPO_ROOT}/apps/web/src/**/*.machine.ts`  
**State Files**: `{REPO_ROOT}/apps/web/src/**/*.state.ts`

**Check Machines**:
```bash
# From {REPO_ROOT}
find apps/web/src -name "*.machine.ts" -type f
```

---

**Remember**: XState is for complex state. Simple state can use useState. Complex workflows require machines.
