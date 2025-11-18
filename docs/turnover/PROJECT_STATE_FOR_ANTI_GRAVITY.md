# StackDock Project State - Complete Turnover Document
**Created**: November 17, 2025  
**Purpose**: Complete project context for Google Anti-Gravity Editor  
**Status**: MVP Complete, Post-MVP Phase

---

## Executive Summary

**StackDock** is an open-source multi-cloud infrastructure management platform that provides a unified interface for managing servers, databases, web services, and monitoring tools across 16+ providers. The project follows a "shadcn/ui for infrastructure" model where users own the code (copy/paste/own).

**Current Status**: ✅ **MVP COMPLETE** (November 17, 2025)  
**Next Phase**: Post-MVP improvements and enhancements

---

## Project Overview

### Vision
StackDock is infrastructure's WordPress moment - a composable, open-source platform where you own the code. Similar to how shadcn/ui revolutionized UI development by letting you copy components into your codebase, StackDock does the same for infrastructure adapters.

### Core Value Proposition
- **True FOSS**: You own the code (docks, UI, everything)
- **Composable**: Build your own infinitely customizable infrastructure control plane
- **Extensible**: If it has an API, it can be a dock
- **No Vendor Lock-in**: Copy adapters into your codebase, modify, republish

### Current Capabilities
- ✅ **Read-Only MVP**: View and sync resources from 16 providers
- ✅ **Universal Tables**: Provider-agnostic resource management
- ✅ **Real-time Sync**: Continuous provider synchronization
- ✅ **RBAC**: Full role-based access control
- ✅ **Encryption**: AES-256-GCM for API keys
- ✅ **Audit Logging**: Comprehensive audit trail
- ❌ **Write Operations**: Not yet implemented (post-MVP)

---

## Tech Stack (LOCKED - DO NOT CHANGE)

### Frontend
- **TanStack Start** (`@tanstack/react-start@1.136.5`) - Full-stack React framework
- **TanStack Router** (`@tanstack/router-plugin@1.132.0`) - File-based routing
- **React** - UI library
- **shadcn/ui** - Component primitives (copy/paste ownership model)
- **Tailwind CSS 4** - Styling
- **XState** - Complex workflow state machines (for future provisioning)

### Backend
- **Convex** (`convex@^1.28.0`) - Real-time database and serverless functions
  - Convex URL: `https://warmhearted-ferret-15.convex.cloud`
  - Deployment: `dev:warmhearted-ferret-15`
- **Clerk** - Authentication & organizations
  - Publishable Key: `pk_test_Y2FwaXRhbC1tZWVya2F0LTY2LmNsZXJrLmFjY291bnRzLmRldiQ`
  - Organizations enabled: ✅

### Development Tools
- **TypeScript** (`^5.2.0`) - Type safety
- **Turbo** (`^1.10.0`) - Monorepo build system
- **Vitest** (`^3.0.5`) - Testing framework (not yet configured)
- **Prettier** (`^3.0.0`) - Code formatting
- **ESLint** - Linting (configured)

### Package Manager
- **npm** (`10.0.0`) - Workspace-based monorepo
- **Node.js** (`>=18.0.0`) - Runtime requirement

---

## Project Structure

```
stackdock/
├── apps/
│   ├── web/                    # Main TanStack Start application
│   │   ├── src/
│   │   │   ├── routes/         # File-based routing
│   │   │   │   ├── dashboard/  # Dashboard routes
│   │   │   │   │   ├── docks/  # Dock management
│   │   │   │   │   ├── infrastructure/ # Resource views
│   │   │   │   │   ├── monitoring/    # Monitoring dashboards
│   │   │   │   │   ├── projects/      # Project management
│   │   │   │   │   └── settings/      # Settings pages
│   │   │   │   └── api/        # API routes (webhooks)
│   │   │   ├── components/     # React components
│   │   │   ├── lib/           # Utilities
│   │   │   └── machines/      # XState state machines
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── marketing/              # Next.js marketing site (NEW)
│       ├── app/               # Next.js app directory
│       ├── lib/               # Blog utilities
│       └── package.json
│
├── packages/
│   ├── docks/                  # Dock adapter registry (copy/paste/own)
│   │   └── README.md
│   ├── ui/                     # UI component registry (shadcn/ui model)
│   │   └── README.md
│   ├── cli/                    # CLI tool (structure exists, needs implementation)
│   │   ├── src/
│   │   ├── bin/
│   │   └── package.json
│   └── shared/                 # Shared utilities
│
├── convex/                     # Convex backend (shared across apps)
│   ├── schema.ts               # Database schema (29 tables)
│   ├── auth.config.ts          # Clerk authentication config
│   ├── docks/                  # Dock management
│   │   ├── adapters/           # 16 provider adapters
│   │   │   ├── gridpane/
│   │   │   ├── vercel/
│   │   │   ├── netlify/
│   │   │   ├── cloudflare/
│   │   │   ├── turso/
│   │   │   ├── neon/
│   │   │   ├── convex/
│   │   │   ├── planetscale/
│   │   │   ├── vultr/
│   │   │   ├── digitalocean/
│   │   │   ├── linode/
│   │   │   ├── hetzner/
│   │   │   ├── coolify/
│   │   │   ├── github/
│   │   │   ├── sentry/
│   │   │   └── betterstack/
│   │   ├── mutations.ts         # Dock CRUD operations
│   │   ├── queries.ts          # Dock queries
│   │   ├── actions.ts          # External API calls
│   │   └── scheduled.ts        # Auto-sync scheduler
│   ├── resources/              # Resource queries
│   │   ├── queries.ts          # Universal table queries
│   │   └── mutations.ts        # Resource mutations
│   ├── projects/               # Project management
│   ├── monitoring/             # Monitoring features
│   ├── organizations/          # Organization management
│   ├── lib/
│   │   ├── rbac.ts             # Role-based access control
│   │   ├── encryption.ts       # AES-256-GCM encryption
│   │   └── audit.ts            # Audit logging
│   └── _generated/             # Convex generated types
│
├── docs/                       # Documentation
│   ├── .stackdock-state.json   # SINGLE SOURCE OF TRUTH (machine-readable state)
│   ├── STATUS.md               # Human-readable status
│   ├── MISSIONS.md             # Post-MVP mission tracking
│   ├── architecture/           # Architecture documentation
│   ├── guides/                 # Setup and contribution guides
│   ├── stand-downs/            # Quality reviews and analysis
│   │   └── active/             # Active quality review files
│   └── turnover/               # This folder (turnover docs)
│
├── .github/
│   ├── workflows/              # GitHub Actions
│   │   ├── pr-pipeline.yml     # PR checks (lint, test, build)
│   │   └── sync-issues.yml     # Auto-create GitHub issues from markdown
│   ├── ISSUES/                 # Local issue files (synced to GitHub)
│   │   └── README.md           # Issue format documentation
│   └── scripts/
│       └── sync-issues.js      # Issue sync script
│
├── .cursorrules                # CRITICAL: AI assistant rules
├── package.json                # Root package.json (workspaces)
├── README.md                   # Project README
└── AI-HALL-OF-SHAME.md         # Lessons learned (NEVER MOVE)
```

---

## Architecture

### The Three Registries Model

1. **Docks Registry** (`packages/docks/`)
   - Infrastructure adapters (copy/paste/own)
   - Translates provider APIs to universal schema
   - Runtime adapters: `convex/docks/adapters/` (execution)
   - Registry adapters: `packages/docks/` (copy/paste/own)

2. **UI Registry** (`packages/ui/`)
   - Dashboard components (shadcn/ui model)
   - Provider-agnostic components
   - Copy, customize, own

3. **The Platform** (`convex/`, `apps/web/`)
   - Universal data model (`convex/schema.ts`)
   - RBAC enforcement
   - Encryption & security
   - Audit logging
   - Real-time sync

### Universal Table Pattern (CRITICAL ARCHITECTURE)

**Key Innovation**: One table per resource type, NOT one per provider.

```typescript
// ✅ CORRECT: Universal table
webServices: {
  provider: "gridpane" | "vercel" | "netlify" | "cloudflare" | "coolify",
  providerResourceId: string,
  name: string,
  productionUrl: string,
  status: string,
  fullApiData: any  // Provider-specific data preserved
}

// ❌ WRONG: Provider-specific tables (NEVER DO THIS)
gridPaneSites: { ... }
vercelDeployments: { ... }
```

**Universal Tables**:
- `servers` - 6 providers (GridPane, Vultr, DigitalOcean, Linode, Hetzner, Coolify)
- `webServices` - 5 providers (GridPane, Vercel, Netlify, Cloudflare, Coolify)
- `domains` - 2 providers (GridPane, Cloudflare)
- `databases` - 5 providers (Turso, Neon, Convex, PlanetScale, Coolify)
- `blockVolumes` - 2 providers (Vultr, DigitalOcean)
- `buckets` - 1 provider (Linode)
- `backupSchedules` - 2 providers (GridPane, Coolify)
- `deployments` - 1 provider (Convex)
- `repositories` - 1 provider (GitHub - universal table)
- `issues` - 1 provider (Sentry - universal table)
- `monitors` - 1 provider (Better Stack - universal table)

### Dock Adapter Pattern

**Docks are TRANSLATORS**: Provider API → Universal Schema

Each adapter implements:
- `api.ts` - HTTP client for provider API
- `adapter.ts` - Translation logic (provider data → universal schema)
- `types.ts` - TypeScript types for provider API responses
- `index.ts` - Exports

**Example Flow**:
```
User clicks "Sync" → Adapter decrypts API key → Calls provider API → 
Translates to universal schema → Inserts into universal tables
```

### Security Architecture

1. **RBAC (Role-Based Access Control)**
   - All queries/mutations MUST check permissions
   - Uses `withRBAC()` middleware
   - Permission format: `"docks:full"`, `"resources:read"`, `"monitoring:read"`
   - Enforced at Convex layer (server-side)

2. **Encryption**
   - AES-256-GCM for all API keys
   - Stored as `v.bytes()` in Convex
   - Only decrypted server-side
   - Never exposed to client

3. **Audit Logging**
   - Comprehensive audit trail
   - Tracks: dock creation, resource syncs, permission changes
   - Stored in `auditLogs` table

---

## Current State (Machine-Readable)

**Source of Truth**: `docs/.stackdock-state.json`

### MVP Status: ✅ COMPLETE
- **Completed**: November 17, 2025
- **Project Start**: October 22, 2025
- **Version**: 2.0.0

### Providers Integrated (16/16)
- **PaaS**: GridPane, Vercel, Netlify, Cloudflare, Coolify
- **Databases**: Turso, Neon, Convex, PlanetScale
- **IaaS**: Vultr, DigitalOcean, Linode, Hetzner
- **Projects**: GitHub
- **Monitoring**: Sentry, Better Stack

### Completed Steps
- ✅ Monorepo structure created
- ✅ Convex initialized and schema pushed
- ✅ Clerk authentication working
- ✅ RBAC system implemented
- ✅ Encryption system implemented
- ✅ Audit logging implemented
- ✅ 16 providers integrated
- ✅ Universal tables validated
- ✅ Projects feature implemented
- ✅ Sentry integration complete
- ✅ Better Stack integration complete
- ✅ Monitoring issues page working
- ✅ Polymorphic deduplication (servers + domains)
- ✅ Insights dashboard updated
- ✅ Cloudflare pagination fixed
- ✅ Continuous sync working
- ✅ Rate limit tracking implemented

### Current Blockers
- **None** - MVP complete, no blockers

### Next Steps
1. Start Mission 1: Clear Issues (8 GitHub issues from critical gaps review)
2. Create GitHub issues for shelved features
3. Cleanup orphaned code
4. Comprehensive testing for all 16 providers
5. Finalize MVP documentation
6. Prepare MVP release

### Shelved Features (Post-MVP)
- **Linear Adapter** - Complex project linking system (now Mission 6)
- **Projects Core System** - Polymorphic resource linking (now Mission 7)
- **Complex Auth IaaS** - AWS/GCP/Azure multi-field auth
- **Insights Enhancements** - Advanced visualization

---

## Post-MVP Missions (12 Missions Defined)

### Mission 1: Clear Issues
**Status**: 🔴 Pending | **Priority**: High | **Hours**: 26-37

**Goal**: Complete all 8 GitHub issues from critical gaps review

**Issues**:
1. Extract Universal Types
2. Add Shared tsconfig.base.json
3. Implement Adapter Contract Tests
4. Wire CI/CD GitHub Actions
5. Add Type/Lint Enforcement
6. Create Provider Capability Matrix
7. Implement Audit Log UI
8. Create Fake Provider Adapter

**Dependencies**: None

### Mission 2: Scaffold CLI
**Status**: 🔴 Pending | **Priority**: High

**Goal**: Build out CLI tool for registry management

**Scope**: `packages/cli/` implementation (structure exists)

**Dependencies**: None

### Mission 3: Test UI/Adapter Registry
**Status**: 🔴 Pending | **Priority**: High

**Goal**: Implement test suite for adapters and UI components

**Scope**: Contract tests, integration tests

**Dependencies**: Mission 1 (extract types)

### Mission 4: Full Audit Sweep
**Status**: 🔴 Pending | **Priority**: Medium

**Goal**: Comprehensive code review and cleanup

**Scope**: Remove orphaned code, fix technical debt

**Dependencies**: None

### Mission 5: Cleanup UI
**Status**: 🔴 Pending | **Priority**: Medium

**Goal**: Polish UI components, improve UX

**Scope**: Component cleanup, accessibility improvements

**Dependencies**: None

### Mission 6: Add Linear
**Status**: 🔴 Pending | **Priority**: Medium

**Goal**: Integrate Linear adapter

**Scope**: Linear API integration (GraphQL), adapter implementation

**Dependencies**: None

**Note**: Previously shelved, now post-MVP priority

### Mission 7: Harden Project Resources and Linking
**Status**: 🔴 Pending | **Priority**: High

**Goal**: Complete project resource linking system

**Scope**: Polymorphic resource linking, project management

**Dependencies**: Mission 1 (extract types)

### Mission 8: Docker Support
**Status**: 🔴 Pending | **Priority**: Low

**Goal**: Add Docker support for development/deployment

**Scope**: Dockerfiles, docker-compose, deployment configs

**Dependencies**: None

### Mission 9: Dev/Build/Deploy Scripts
**Status**: 🔴 Pending | **Priority**: Medium

**Goal**: Standardize development and deployment scripts

**Scope**: npm scripts, CI/CD improvements, deployment automation

**Dependencies**: Mission 1 (CI/CD setup)

### Mission 10: Version Number Management
**Status**: 🔴 Pending | **Priority**: Low

**Goal**: Implement semantic versioning and release management

**Scope**: Versioning strategy, changelog, release process

**Dependencies**: None

### Mission 11: New Marketing Site
**Status**: 🟡 In Progress | **Priority**: Medium

**Goal**: Complete marketing site/blog

**Scope**: `apps/marketing/` - content, blog posts, landing page

**Dependencies**: None

**Note**: Structure exists (Next.js app), needs content

### Mission 12: Fill Blog Backlog
**Status**: 🔴 Pending | **Priority**: Low

**Goal**: Create blog content for marketing site

**Scope**: Write blog posts, content strategy

**Dependencies**: Mission 11

---

## Quality Review Findings

### Post-MVP Quality Review (November 2025)

**Location**: `docs/stand-downs/active/`

#### Convex Integration: 9/10 ✅
- **Strengths**: Exemplary implementation, production-ready
- **Enhancements Needed**:
  - File storage for user uploads
  - Optimistic updates for better UX
  - Subscription pagination for large datasets

#### TanStack Start: 6/10 ⚠️
- **Strengths**: File-based routing, latest versions
- **Critical Gaps**:
  - ❌ No server functions (`createServerFn`)
  - ❌ No route loaders
  - ❌ No SSR/streaming
  - ❌ Client-side heavy (all data via `useQuery`)

**Recommendation**: Add route loaders, server functions, and SSR to leverage Start's full capabilities.

#### CodeRabbit: 3.5/10 ⚠️
- **Status**: Configuration exists but not integrated
- **Issues**:
  - Auto-review disabled
  - No GitHub Actions integration
  - Not used in development workflow

#### Platform Integrations (Data Sources Only)
- **Cloudflare**: 2/10 - API integration excellent, no platform usage
- **Netlify**: 1/10 - API integration excellent, no platform usage
- **Sentry**: 3/10 - API integration excellent, SDK not installed for StackDock's own errors

#### Not Integrated
- **Firecrawl**: 1/10 - Not used
- **Autumn**: 1/10 - No billing/monetization

**Key Finding**: StackDock is a multi-cloud management platform (like Terraform). It reads from providers via APIs but doesn't deploy on them. This is correct architecture but means most sponsors are managed providers, not platform integrations.

---

## Critical Rules (NEVER BREAK)

### Architecture Rules

1. **NEVER create provider-specific resource tables**
   - ❌ NO: `gridPaneSites`, `vercelDeployments`, `awsInstances`
   - ✅ YES: Use universal tables (`webServices`, `servers`, `domains`)
   - Provider-specific data goes in `fullApiData` field

2. **NEVER delete files without explicit user permission**
   - Always ask before removing code
   - Preserve existing functionality
   - Check git status first

3. **NEVER bypass RBAC checks**
   - Every Convex query/mutation MUST check permissions
   - Use `withRBAC()` middleware
   - No direct database access without auth

4. **NEVER store API keys unencrypted**
   - Always use `encryptApiKey()` before storing
   - Only decrypt in server-side Convex functions
   - Never expose to client

5. **NEVER break the dock adapter pattern**
   - Docks are TRANSLATORS (provider API → universal schema)
   - One adapter per provider
   - Follow the interface in `convex/docks/_types.ts`

### Development Rules

1. **ALWAYS check `.stackdock-state.json` first** - Single source of truth
2. **ALWAYS read `.cursorrules`** - Critical architecture rules
3. **ALWAYS verify paths exist** - Don't assume directory structure
4. **ALWAYS preserve existing functionality** - Don't break working code
5. **ALWAYS document changes** - Update relevant docs

---

## Environment Setup

### Required Environment Variables

**Location**: `apps/web/.env.local`

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex
CONVEX_URL=https://warmhearted-ferret-15.convex.cloud
CONVEX_DEPLOYMENT=dev:warmhearted-ferret-15

# Node Environment
NODE_ENV=development
```

### Services Status

- **Convex**: ✅ Configured and running
  - URL: `https://warmhearted-ferret-15.convex.cloud`
  - Deployment: `dev:warmhearted-ferret-15`
- **Clerk**: ✅ Configured
  - Organizations: Enabled
  - Publishable Key: Set
  - Secret Key: Set
- **Dev Server**: ✅ Running on port 3000
  - URL: `http://localhost:3000`
  - Login: ✅ Tested

---

## Known Issues & Limitations

### Current Limitations

1. **Read-Only Mode**: All functionality is view-only. No write operations (create, modify, delete, provision) are available.

2. **No Test Suite**: Test suite not yet configured. Vitest installed but no tests written.

3. **TanStack Start Underutilized**: Using Start like Router, missing advanced features (SSR, loaders, server functions).

4. **No CI/CD**: GitHub Actions workflow exists but not fully wired (Mission 1).

5. **No Type Extraction**: Universal types not extracted to shared package (Mission 1).

6. **No Audit Log UI**: Audit logs exist but no UI to view them (Mission 1).

### Technical Debt

1. **Orphaned Code**: Some unused code may exist (Mission 4: Full Audit Sweep).

2. **No Provider Capability Matrix**: No documentation of what each provider supports (Mission 1).

3. **No Fake Provider**: No test provider adapter for development/testing (Mission 1).

---

## Development Workflow

### Getting Started

1. **Clone Repository**
   ```bash
   git clone https://github.com/stackdock/stackdock.git
   cd stackdock
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   - Copy `apps/web/.env.local.example` to `apps/web/.env.local`
   - Add Clerk and Convex credentials

4. **Start Convex**
   ```bash
   npm run dev:convex
   ```

5. **Start Dev Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
   - Open `http://localhost:3000`
   - Login with Clerk

### Common Commands

```bash
# Development
npm run dev              # Start web app (port 3000)
npm run dev:marketing     # Start marketing site (port 3001)
npm run dev:convex        # Start Convex dev server
npm run dev:all           # Start all apps

# Building
npm run build             # Build all apps
npm run build:marketing    # Build marketing site

# Linting
npm run lint              # Lint web app
npm run lint:marketing     # Lint marketing site
npm run type-check        # Type check all workspaces

# Testing (not yet configured)
npm run test              # Placeholder
npm run pipeline          # Run all pipeline checks

# Cleanup
npm run clean             # Remove node_modules
```

---

## File Locations (Critical Paths)

### State & Configuration
- **State File**: `docs/.stackdock-state.json` (SINGLE SOURCE OF TRUTH)
- **Rules**: `.cursorrules` (CRITICAL: Read before making changes)
- **Root Package**: `package.json` (workspaces configuration)

### Backend
- **Schema**: `convex/schema.ts` (29 tables, defines entire data model)
- **Auth Config**: `convex/auth.config.ts` (Clerk integration)
- **RBAC**: `convex/lib/rbac.ts` (Permission system)
- **Encryption**: `convex/lib/encryption.ts` (AES-256-GCM)
- **Audit**: `convex/lib/audit.ts` (Audit logging)

### Frontend
- **Routes**: `apps/web/src/routes/` (TanStack Start file-based routing)
- **Components**: `apps/web/src/components/` (React components)
- **Lib**: `apps/web/src/lib/` (Utilities)

### Adapters
- **Location**: `convex/docks/adapters/` (16 providers)
- **Pattern**: Each adapter has `api.ts`, `adapter.ts`, `types.ts`, `index.ts`

### Documentation
- **Architecture**: `docs/architecture/ARCHITECTURE.md`
- **Status**: `docs/STATUS.md` (human-readable)
- **Missions**: `docs/MISSIONS.md` (post-MVP missions)
- **State**: `docs/.stackdock-state.json` (machine-readable)

---

## Important Notes for AI Assistants

### Context Persistence
- **ALWAYS read `.stackdock-state.json` first** - This is the single source of truth
- **ALWAYS read `.cursorrules`** - Critical architecture rules
- **NEVER assume** - Verify paths, check file existence
- **PRESERVE > DELETE** - Don't remove code without explicit permission

### Common Mistakes to Avoid
1. **Creating provider-specific tables** - Use universal tables instead
2. **Bypassing RBAC** - All queries/mutations must check permissions
3. **Storing unencrypted API keys** - Always encrypt before storing
4. **Breaking adapter pattern** - Docks are translators, not data stores
5. **Deleting files without permission** - Always ask first

### When In Doubt
1. Read `.stackdock-state.json` for current state
2. Read `.cursorrules` for architecture rules
3. Read `docs/architecture/ARCHITECTURE.md` for system design
4. Check `docs/stand-downs/active/` for quality reviews
5. Ask user before making breaking changes

---

## Comparison Context (Cursor vs Anti-Gravity)

### What Cursor Struggled With
1. **Context Token Management**: Frequent context loss, requiring re-reading files
2. **Path Assumptions**: Assumed directory structures without verification
3. **Breaking Changes**: Made changes that broke existing functionality
4. **Architecture Violations**: Created provider-specific tables (against rules)
5. **Incomplete Understanding**: Didn't read state file or rules before acting

### What Anti-Gravity Should Do Better
1. **Read State File First**: Always check `.stackdock-state.json` before acting
2. **Verify Paths**: Check file/directory existence before using
3. **Preserve Functionality**: Don't break working code
4. **Follow Architecture**: Respect universal table pattern, RBAC, encryption
5. **Complete Understanding**: Read all relevant docs before making changes

### Test Scenarios for Comparison
1. **Add New Provider**: Should follow adapter pattern, use universal tables
2. **Fix Bug**: Should preserve existing functionality, check RBAC
3. **Refactor Code**: Should maintain architecture, update docs
4. **Add Feature**: Should follow patterns, check state file for blockers

---

## Conclusion

StackDock is a well-architected, production-ready MVP with 16 providers integrated. The project follows strict architectural patterns (universal tables, RBAC, encryption) that must be preserved. The next phase focuses on post-MVP improvements: test suite, CI/CD, type extraction, and UI polish.

**Key Takeaway**: This is infrastructure's WordPress moment - a composable platform where users own the code. The architecture is sound, the vision is clear, and the path forward is documented.

---

**Document Version**: 1.0  
**Last Updated**: November 17, 2025  
**Next Review**: After Mission 1 completion
