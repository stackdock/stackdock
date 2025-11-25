# StackDock Desktop

Desktop-first application with optional cloud sync. Built with Tauri, React, and local-first architecture.

## Architecture

**Desktop-First**: Local database (SQLite) as primary data store. Cloud sync (Convex) is optional.

**Redundant System**: Users can choose web access OR desktop. Both are independent implementations sharing the same primitives (docks, UI components).

## Tech Stack

- **Tauri 2.0** - Desktop framework (Rust backend, WebView frontend)
- **React** - UI framework (shared with web app)
- **TanStack Router** - SPA routing (not TanStack Start - no SSR needed)
- **SQLite** - Local database (via `tauri-plugin-sql`)
- **Convex** - Optional cloud sync (when configured)
- **Clerk** - Authentication (OAuth flow works in desktop)

## Monorepo Integration

### Shared Packages

- `packages/shared` - Encryption, RBAC, schema types
- `packages/ui` - React components (shadcn/ui model)
- `packages/docks` - Dock adapters (provider integrations)

### Code Sharing Strategy

```typescript
// Import shared utilities
import { encryptApiKey } from "@stackdock/shared/encryption"
import { withRBAC } from "@stackdock/shared/rbac"

// Import shared components
import { Button } from "@stackdock/ui/button"
import { Table } from "@stackdock/ui/table"

// Import dock adapters
import { vercelAdapter } from "@stackdock/docks/vercel"
```

## Data Layer Architecture

### Local-First Pattern

**Primary**: SQLite database (local, fast, offline-capable)
**Optional**: Convex sync (when user configures cloud sync)

### Data Layer Abstraction

```typescript
// packages/data-layer/hooks.ts
export function useServers() {
  const syncMode = useSyncMode() // "local" | "convex" | "hybrid"
  
  if (syncMode === "local" || syncMode === "hybrid") {
    return useLocalQuery("servers")
  }
  
  if (syncMode === "convex") {
    return useConvexQuery(api["resources/queries"].listServers)
  }
}
```

### Database Schema

**Local SQLite** mirrors Convex schema:
- `servers` - Universal server table
- `webServices` - Universal web service table
- `domains` - Universal domain table
- `databases` - Universal database table
- `docks` - Provider connections
- `projects` - Project management
- `organizations` - Multi-tenant orgs
- `users` - User accounts

**Sync Strategy**:
- Local-first: All reads/writes go to SQLite
- Optional Convex: Background sync when configured
- Conflict resolution: Last-write-wins (or user preference)

## Project Structure

```
apps/desktop/
├── src/                    # Frontend (React)
│   ├── routes/            # TanStack Router routes
│   ├── components/        # Desktop-specific components
│   ├── lib/               # Utilities
│   │   ├── data-layer/    # Data abstraction layer
│   │   │   ├── local.ts   # SQLite queries
│   │   │   ├── convex.ts  # Convex sync (optional)
│   │   │   └── hooks.ts   # Unified hooks
│   │   └── tauri/         # Tauri API wrappers
│   └── main.tsx           # Entry point
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── main.rs        # Tauri entry point
│   │   ├── db.rs          # SQLite database management
│   │   └── commands.rs    # Tauri commands (exposed to frontend)
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── package.json
├── vite.config.ts         # Vite config (no SSR)
└── README.md
```

## Key Differences from Web App

### 1. Routing

**Web**: TanStack Start (SSR-capable)
```typescript
// apps/web/src/routes/__root.tsx
export const Route = createRootRoute({ ... })
```

**Desktop**: TanStack Router (SPA-only)
```typescript
// apps/desktop/src/routes/__root.tsx
export const rootRoute = createRootRoute()
```

### 2. Data Layer

**Web**: Convex-only
```typescript
const servers = useQuery(api["resources/queries"].listServers)
```

**Desktop**: Local-first with optional Convex
```typescript
const servers = useServers() // Abstracts local vs convex
```

### 3. Authentication

**Web**: Clerk (full OAuth flow)
**Desktop**: Clerk (OAuth opens browser, works fine)

### 4. Database

**Web**: Convex (cloud database)
**Desktop**: SQLite (local) + optional Convex sync

## Tauri Commands

### Database Operations

```rust
// src-tauri/src/commands.rs
#[tauri::command]
async fn query_servers(db: State<Database>) -> Result<Vec<Server>, String> {
    // SQLite query
}

#[tauri::command]
async fn insert_server(db: State<Database>, server: Server) -> Result<String, String> {
    // SQLite insert
}
```

### Frontend Usage

```typescript
// src/lib/tauri/db.ts
import { invoke } from "@tauri-apps/api/core"

export async function queryServers() {
  return invoke<Server[]>("query_servers")
}
```

## Sync Strategy

### Local-First Flow

1. **Write**: Always write to local SQLite first
2. **Sync**: If Convex configured, sync in background
3. **Read**: Read from local SQLite (fast, offline)
4. **Conflict**: Last-write-wins (or user preference)

### Optional Cloud Sync

**When User Enables Cloud Sync**:
- Background sync every N minutes
- Sync on app start
- Sync on manual trigger
- Conflict resolution UI

**When Cloud Sync Disabled**:
- Fully offline
- No network dependency
- All data local

## Development

### Prerequisites

- Rust (latest stable)
- Node.js 18+
- Tauri CLI: `npm install -g @tauri-apps/cli`

### Setup

```bash
cd apps/desktop
npm install
```

### Development

```bash
# Terminal 1: Tauri dev server
npm run tauri dev

# Terminal 2: Convex (if using cloud sync)
cd ../..
npm run dev:convex
```

### Build

```bash
npm run tauri build
```

## Configuration

### Local-Only Mode

No configuration needed. Works fully offline.

### Cloud Sync Mode

Create `.env.local`:

```
VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Architecture Decisions

### Why Desktop-First?

1. **Radical Independence**: No cloud dependency required
2. **Performance**: Local SQLite is faster than network queries
3. **Offline**: Works without internet
4. **Privacy**: Data stays local by default

### Why Optional Cloud Sync?

1. **Flexibility**: Users choose their sync strategy
2. **Redundancy**: Web OR desktop, both work independently
3. **Migration**: Easy to move from local to cloud or vice versa

### Why Tauri Over Electron?

1. **Size**: ~600KB vs ~100MB+ (Electron)
2. **Performance**: Native WebView vs bundled Chromium
3. **Security**: Rust backend vs Node.js
4. **Battery**: Lower resource usage

## Future Considerations

### Multi-Device Sync

When cloud sync enabled:
- Sync across multiple desktop instances
- Sync with web app (same Convex backend)
- Real-time updates via Convex subscriptions

### Offline-First Patterns

- Service worker for background sync
- Conflict resolution UI
- Sync status indicators
- Manual sync triggers

## Status

**Current**: Prototype/Planning phase
**Next Steps**:
1. Scaffold Tauri project structure
2. Implement data layer abstraction
3. Port shared components
4. Implement local SQLite schema
5. Add optional Convex sync

## References

- [Tauri Documentation](https://tauri.app)
- [TanStack Router](https://tanstack.com/router)
- [SQLite via Tauri](https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/sql)
- [Convex React Client](https://docs.convex.dev/client/react)
