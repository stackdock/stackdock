# Contributing to StackDock

Thank you for your interest in contributing to StackDock! This document will guide you through the development workflow.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Submitting Changes](#submitting-changes)
8. [Building Dock Adapters](#building-dock-adapters)
9. [Building UI Components](#building-ui-components)

---

## Getting Started

### Prerequisites

- **Node.js**: 18+ (with npm)
- **npm**: 9+ (comes with Node.js)
- **Git**: Latest version
- **Convex Account**: https://convex.dev
- **Clerk Account**: https://clerk.com

### First-Time Setup

```bash
# Clone the repository
git clone https://github.com/stackdock/stackdock.git
cd stackdock

# Install dependencies
npm install

# Generate encryption key (copy the output into apps/web/.env.local)
node scripts/generate-encryption-key.js

# Start Convex dev
npm run dev:convex

# In another terminal, start the app
cd apps/web
npm run dev
```

### Environment Variables

Create `apps/web/.env.local` with values like:

```
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Encryption (output from node scripts/generate-encryption-key.js)
ENCRYPTION_MASTER_KEY=<64-char-hex>

# App
VITE_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Development Setup

### Monorepo Structure

```
stackdock/
├── apps/
│   └── web/              # Main TanStack Start app
├── packages/
│   ├── docks/            # Dock adapter registry
│   ├── ui/               # UI component registry
│   └── shared/           # Shared utilities
├── convex/               # Convex backend
└── docs/                 # Documentation
```

### Install Dependencies

```bash
# Install all workspace dependencies (from repo root)
npm install

# Install a dependency in a specific workspace
npm install <package> --workspace apps/web
npm install <package> --workspace packages/docks
```

### Development Commands

```bash
# Start the web app dev server (workspace)
npm run dev --workspace apps/web

# Start Convex in dev mode (from root)
npm run dev:convex

# Build the web app
npm run build --workspace apps/web

# Run tests (replace workspace as needed)
npm run test --workspace apps/web

# Run linter
npm run lint --workspace apps/web

# Type check
npm run type-check --workspace apps/web

# Format code (ROOT)
npm run format
```

---

## Project Structure

### App Structure (apps/web)

```
apps/web/
├── src/
│   ├── routes/                   # File-based routing
│   │   ├── __root.tsx           # Root layout (providers)
│   │   ├── index.tsx            # Landing page
│   │   └── dashboard/
│   │       ├── _layout.tsx      # Dashboard layout (auth guard)
│   │       ├── index.tsx        # Dashboard home
│   │       ├── docks/           # Dock management
│   │       ├── projects/        # Project management
│   │       ├── infrastructure/  # Resource views
│   │       └── settings/        # Settings
│   ├── components/
│   │   ├── ui/                  # shadcn components
│   │   ├── auth/                # Auth guards
│   │   ├── docks/               # Dock components
│   │   └── resources/           # Resource cards
│   ├── lib/
│   │   ├── convex.ts            # Convex client
│   │   ├── clerk.ts             # Clerk helpers
│   │   └── utils.ts             # Utilities
│   └── machines/                # XState machines
│       ├── dockConnectionMachine.ts
│       └── syncMachine.ts
├── public/                      # Static assets
├── vite.config.ts              # Vite config (TanStack Start plugin)
└── router.tsx                  # Router setup
```

### Convex Structure

```
convex/
├── schema.ts                    # Data model (source of truth)
├── auth.config.ts               # Clerk integration
├── lib/
│   ├── rbac.ts                  # RBAC middleware
│   ├── encryption.ts            # Encryption functions
│   └── audit.ts                 # Audit logging
├── users.ts                     # User queries/mutations
├── organizations.ts             # Org management
├── docks/
│   ├── mutations.ts             # Dock CRUD
│   ├── queries.ts               # Dock queries
│   ├── sync.ts                  # Sync orchestration
│   └── adapters/                # Provider adapters
├── resources/
│   ├── servers.ts
│   ├── webServices.ts
│   └── domains.ts
└── projects/
    ├── mutations.ts
    └── queries.ts
```

### Dock Adapter Structure

```
# Registry (source code)
packages/docks/gridpane/
├── adapter.ts           # Main adapter implementation
├── api.ts               # API client
├── types.ts             # TypeScript types
├── README.md            # Documentation
├── package.json
└── tests/
    └── adapter.test.ts

# Runtime (execution - copied from registry)
convex/docks/adapters/gridpane/
├── adapter.ts           # Same as registry (copied)
├── api.ts               # Same as registry (copied)
├── types.ts             # Same as registry (copied)
└── index.ts             # Export adapter
```

**Note**: Registry (`packages/docks/`) is source code for copy/paste/own model. Runtime (`convex/docks/adapters/`) is where adapters execute. CLI copies from registry to runtime.

---

## Development Workflow

### Sync Flow

```
┌──────────┐
│  User    │
│  Action  │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  Convex         │
│  Mutation       │
│  (withRBAC)     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Scheduler      │
│  (runAfter)     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Convex Action  │
│  (External API) │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Dock Adapter   │
│  1. Decrypt Key │
│  2. Call API    │
│  3. Transform   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Internal       │
│  Mutation       │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Universal      │
│  Table          │
│  (Insert/Update)│
└─────────────────┘
```

### RBAC Flow

```
┌──────────┐
│  Client  │
│  Request │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  Convex Query/  │
│  Mutation       │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  withRBAC()     │
│  Middleware     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  getCurrentUser │
│  (Clerk)        │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  checkPermission│
│  (RBAC)         │
└────┬────────────┘
     │
     ├─── Allowed ────► Execute Query/Mutation
     │
     └─── Denied ─────► Throw ConvexError
```

### Creating a New Feature

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes**
   - Follow [coding standards](#coding-standards)
   - Write tests
   - Update documentation

3. **Test locally**
   ```bash
   npm run test --workspace apps/web
   npm run type-check --workspace apps/web
   npm run lint --workspace apps/web
   ```

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```
   
   **Commit Message Format**:
   ```
   <type>(<scope>): <description>
   
   [optional body]
   
   [optional footer]
   ```
   
   **Types**:
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation only
   - `style`: Code style changes (formatting)
   - `refactor`: Code refactoring
   - `test`: Adding tests
   - `chore`: Maintenance tasks

5. **Push and create PR**
   ```bash
   git push origin feature/my-feature
   ```
   Open PR on GitHub with description of changes

### Pull Request Process

1. **PR Title**: Follow commit message format
2. **Description**: Explain what and why
3. **Checklist**:
   - [ ] Tests pass
   - [ ] Types are correct
   - [ ] Docs updated
   - [ ] No breaking changes (or documented)
4. **Review**: Wait for approval
5. **Merge**: Squash and merge

---

## Coding Standards

### TypeScript

**Use strict mode**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

**Explicit types** (no `any` unless necessary):
```typescript
// ❌ Bad
function process(data: any) {
  return data.map((item: any) => item.id)
}

// ✅ Good
function process(data: Array<{ id: string; name: string }>) {
  return data.map(item => item.id)
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `dock-connection-flow.tsx` |
| Components | PascalCase | `DockConnectionFlow` |
| Functions | camelCase | `syncWebServices` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `DockAdapter` |
| React hooks | camelCase starting with `use` | `useRBAC` |

### React Components

**Use function components**:
```typescript
// ✅ Good
export function DockCard({ dock }: { dock: Dock }) {
  return <div>{dock.name}</div>
}

// ❌ Avoid
export const DockCard: React.FC<{ dock: Dock }> = ({ dock }) => {
  return <div>{dock.name}</div>
}
```

**Props destructuring**:
```typescript
// ✅ Good
export function DockCard({ dock, onSync }: DockCardProps) {
  // ...
}

// ❌ Bad
export function DockCard(props: DockCardProps) {
  return <div>{props.dock.name}</div>
}
```

### Convex Functions

**Use descriptive names**:
```typescript
// ✅ Good
export const createDock = mutation({ ... })
export const listDocksForOrg = query({ ... })

// ❌ Bad
export const create = mutation({ ... })
export const list = query({ ... })
```

**Always enforce RBAC**:
```typescript
export const createDock = mutation({
  args: { orgId: v.id("organizations"), ... },
  handler: withRBAC("docks:full")(async (ctx, args, user) => {
    // Safe to proceed
  }),
})
```

**Document parameters**:
```typescript
/**
 * Create a new dock connection
 * @param orgId - Organization ID
 * @param provider - Provider name (gridpane, vercel, etc.)
 * @param name - Display name for dock
 * @param apiKey - Provider API key (will be encrypted)
 */
export const createDock = mutation({ ... })
```

---

## Testing

### Unit Tests

**Location**: Next to the file being tested
```
adapter.ts
adapter.test.ts
```

**Example**:
```typescript
import { describe, it, expect } from 'vitest'
import { vercelAdapter } from './adapter'

describe('Vercel Adapter', () => {
  it('validates credentials', async () => {
    const result = await vercelAdapter.validateCredentials('valid_key')
    expect(result).toBe(true)
  })
})
```

### Integration Tests

**Test real API calls** (use test accounts):
```typescript
describe('Vercel Integration', () => {
  it('syncs projects', async () => {
    const dock = createTestDock('vercel')
    await vercelAdapter.syncWebServices(mockCtx, dock)
    
    const services = await mockCtx.db.query("webServices").collect()
    expect(services.length).toBeGreaterThan(0)
  })
})
```

### Running Tests

```bash
# Run all tests
npm run test --workspace apps/web

# Run tests in watch mode
npm run test:watch --workspace apps/web

# Run tests for specific file
npm run test --workspace apps/web -- adapter.test.ts

# Run tests with coverage
npm run test:coverage --workspace apps/web
```

---

## Submitting Changes

### Before Submitting

1. **Run linter**
   ```bash
   npm run lint --workspace apps/web
   ```

2. **Run type check**
   ```bash
   npm run type-check --workspace apps/web
   ```

3. **Run tests**
   ```bash
   npm run test --workspace apps/web
   ```

4. **Update docs** (if applicable)
   - README.md
   - ARCHITECTURE.md
   - Adapter docs

### PR Checklist

- [ ] Code follows style guide
- [ ] Tests pass
- [ ] Types are correct
- [ ] Docs updated
- [ ] No console.log statements
- [ ] RBAC enforced (if Convex function)
- [ ] Encryption used (if handling secrets)
- [ ] Rate limiting considered (if API calls)

---

## Building Dock Adapters

See [DOCK_ADAPTER_GUIDE.md](./DOCK_ADAPTER_GUIDE.md) for detailed instructions.

**Quick Start**:
1. Create adapter directory: `packages/docks/provider-name/`
2. Implement `DockAdapter` interface
3. Add to registry: `packages/docks/registry.json`
4. Write tests
5. Document rate limits and field mappings
6. Submit PR

---

## Building UI Components

See [REGISTRY_GUIDE.md](./REGISTRY_GUIDE.md) for detailed instructions.

**Quick Start**:
1. Create component directory: `packages/ui/components/widget-name/`
2. Follow shadcn/ui patterns (copy/paste ownership)
3. Use universal tables (provider-agnostic)
4. Add to registry: `packages/ui/registry.json`
5. Document props and usage
6. Submit PR

---

## Questions?

- **Discord**: https://stackdock.dev/discord
- **GitHub Issues**: https://github.com/stackdock/stackdock/issues
- **Email**: dev@stackdock.dev

---

**Thank you for contributing to StackDock! 🚀**
