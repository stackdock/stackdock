# StackDock Web Application

> **Main StackDock dashboard application**

**Last Updated**: November 11, 2025

## Overview

The StackDock web application is built with TanStack Start (full-stack React framework) and provides the unified dashboard for managing infrastructure across multiple providers.

## Tech Stack

- **TanStack Start** - Full-stack React framework with file-based routing
- **Convex** - Real-time database (queries, mutations, subscriptions)
- **Clerk** - Authentication & organizations
- **XState** - State machines for complex workflows (provisioning)
- **shadcn/ui** - UI component primitives
- **Tailwind CSS 4** - Styling

## Current Features

### ✅ Implemented

- **Authentication**: Clerk integration with user sync to Convex
- **Dashboard Routes**: Infrastructure overview, docks management, projects
- **Provisioning UI**: Complete provisioning workflow (Mission 2.5)
  - Provider selection
  - Resource type selection
  - Multi-step provisioning form
  - Real-time status monitoring
- **Settings**: Organization, teams, clients, roles management
- **Real-time Updates**: Convex subscriptions for live data

### ⚠️ Current Blocker

- **Dock Creation**: GridPane credential validation needs fixing (Mission 3)
- **Resource Syncing**: Depends on working dock creation

## Project Structure

```
apps/web/
├── src/
│   ├── routes/              # TanStack Start file-based routes
│   │   ├── dashboard/       # Dashboard routes
│   │   │   ├── provision/   # Provisioning UI (Mission 2.5)
│   │   │   ├── infrastructure/
│   │   │   └── settings/
│   │   └── api/             # API routes (webhooks)
│   ├── components/          # React components
│   │   ├── provisioning/    # Provisioning components
│   │   └── ui/              # shadcn/ui components
│   ├── machines/            # XState state machines
│   │   ├── provision-resource.machine.ts
│   │   └── provision-status.machine.ts
│   └── lib/                 # Utilities
├── .env.local               # Environment variables (create this)
└── package.json
```

## Routes

### Dashboard Routes

- `/dashboard` - Overview
- `/dashboard/infrastructure/compute` - Servers (all providers)
- `/dashboard/infrastructure/data` - Databases
- `/dashboard/operations/networking` - Domains
- `/dashboard/provision` - Provisioning hub (Mission 2.5)
- `/dashboard/provision/$provider` - Provider selection
- `/dashboard/provision/$provider.$resourceType` - Provisioning form
- `/dashboard/provision/$provider.$resourceType.$provisionId` - Status monitoring
- `/dashboard/settings/docks` - Dock management
- `/dashboard/settings/organization` - Organization settings

## Environment Variables

Create `apps/web/.env.local`:

```bash
# Convex
VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
CONVEX_DEPLOYMENT=dev:<your-deployment>

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Encryption
ENCRYPTION_MASTER_KEY=<64-char-hex>

# App
VITE_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Development

```bash
# Install dependencies (from repo root)
npm install

# Start Convex dev server (terminal 1)
npm run dev:convex

# Start web app (terminal 2)
cd apps/web
npm run dev
```

**Open**: http://localhost:3000

## Building

```bash
npm run build
```

## Testing

```bash
npm run test
```

## State Management

### Convex Queries & Mutations

```typescript
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'

// Query (real-time)
const docks = useQuery(api.docks.queries.listDocks, { orgId })

// Mutation
const createDock = useMutation(api.docks.mutations.createDock)
```

### XState Machines

```typescript
import { useMachine } from '@xstate/react'
import { provisionResourceMachine } from '@/machines/provision-resource.machine'

const [state, send] = useMachine(provisionResourceMachine)
```

## Related Documentation

- [TanStack Start Docs](https://tanstack.com/start)
- [Convex Docs](https://docs.convex.dev)
- [Clerk Docs](https://clerk.com/docs)
- [XState Docs](https://xstate.js.org)
- [StackDock Architecture](../../docs/architecture/ARCHITECTURE.md)

---

**Last Updated**: November 11, 2025
