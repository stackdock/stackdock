![Image of Stackdock logo](/docs/stackdock-logo-dark-mode.svg "Stackdock logo")

<div align="center">
  <h1>StackDock</h1>
  <p><strong>Open Source Multi-Cloud Management Platform</strong></p>
  <p>Manage websites, apps, databases, servers, and APM tools across multiple providers from a unified interface.</p>
  <p>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript"/>
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License"/>
    </a>
     <a href="https://github.com/stackdock/stackdock/stargazers">
      <img src="https://img.shields.io/github/stars/stackdock/stackdock?style=flat-square&logo=github" alt="GitHub stars"/>
    </a>
  </p>
</div>

---

## The Vision

**Remember how shadcn/ui changed UI development?**

```bash
npx shadcn add button
# → Copies component into YOUR codebase
# → You own the code
# → No vendor lock-in
```

**StackDock does the same for infrastructure.**

```bash
npx stackdock add gridpane
# → Copies infrastructure adapter into YOUR codebase
# → You own the dock adapter
# → Customize, fork, publish your own
```

### Why This Matters

- **WordPress democratized content management**
- **StackDock democratizes infrastructure management**
- **True FOSS**: You own the code (docks, UI, everything)
- **Composable**: Build your perfect control plane
- **Extensible**: If it has an API, it can be a dock

---

## Welcome Aboard Captain! ⚓️

You're early – but welcome to the shipyard! The blueprints are evolving, the vision is locked in, and we're building in public.

**This isn't just another tool.** It's infrastructure's WordPress moment.

**⚠️ IMPORTANT: StackDock is currently in READ-ONLY mode. All functionality is view-only. No write operations (create, modify, delete, provision) are available or implemented.**

Star the repo to watch the build! ⭐

---

## ⚠️ PRE-ALPHA WARNING ⚠️

**This is pre-alpha software. NOT ready for production.**

- Breaking changes frequent
- Core features under development
- Database schema evolving
- DO NOT use with critical infrastructure

**For early contributors only.** Star for updates on stable releases.

---

## 🔒 READ-ONLY MODE ⚠️

**IMPORTANT: All current functionality is READ-ONLY.**

**What this means:**
- ✅ **You CAN**: View resources, sync data, browse dashboards, read information
- ❌ **You CANNOT**: Create, modify, delete, or provision resources
- ❌ **You CANNOT**: Make changes to infrastructure through StackDock
- ❌ **You CANNOT**: Perform write operations on any provider resources

**Current Status:**
- All provider integrations are **read-only** (viewing/syncing only)
- All resource tables display **read-only** data
- All dashboards show **read-only** information
- No provisioning, modification, or deletion capabilities exist

**This is intentional.** StackDock is currently in **read-only observability mode** to validate the universal schema and translation layer before adding write capabilities.

**When will write operations be available?**
- After MVP validation is complete
- After universal schema is fully validated across all provider types
- Write operations will be clearly marked and documented when available

**⚠️ DO NOT attempt to use StackDock for any write operations. They are not implemented and will not work.**

---

## 🧭 Vision & Architecture

### The Three Registries

1. **Docks Registry**: Infrastructure adapters (copy/paste/own)
   - Location: `packages/docks/`
   - GridPane, Vercel, AWS, DigitalOcean, Cloudflare, etc.
   - Community-built and official adapters
   - Translates provider APIs to universal schema
   - See: [packages/docks/README.md](./packages/docks/README.md)

2. **UI Registry**: Dashboard components (shadcn/ui model)
   - Location: `packages/ui/`
   - Server health widgets, deployment timelines, etc.
   - Works with ANY provider (provider-agnostic)
   - Copy, customize, own
   - See: [packages/ui/README.md](./packages/ui/README.md)

3. **The Platform**: Orchestration layer
   - Universal data model (`convex/schema.ts`)
   - RBAC enforcement (unlimited users)
   - Encryption & security (AES-256-GCM)
   - Audit logging
   - Real-time sync
   - CLI tool (`packages/cli/`) for registry management

### Core Architecture

**Universal Tables** (Provider-Agnostic):
- `servers`: GridPane, Vultr, DigitalOcean, Linode, Hetzner → ONE table (AWS/GCP/Azure next)
- `webServices`: GridPane, Vercel, Netlify, Cloudflare → ONE table
- `domains`: GridPane, Cloudflare → ONE table
- `databases`: Turso, Neon, Convex, PlanetScale → ONE table

**Dock Adapters** (Translators):
- GridPane API → Universal `webServices` table
- Vercel API → Universal `webServices` table
- Provider-specific data in `fullApiData` field
- Runtime adapters: `convex/docks/adapters/` (execution)
- Registry adapters: `packages/docks/` (copy/paste/own)

**See [ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md) for complete details.**

---

## 🚀 Quick Start

**Prerequisites**: Node.js 18+, npm 9+

```bash
# Clone & install
git clone https://github.com/stackdock/stackdock.git
cd stackdock
npm install

# Setup environment
node scripts/generate-encryption-key.js
# Create apps/web/.env.local with your Convex + Clerk values (see below)
# Paste the generated ENCRYPTION_MASTER_KEY into apps/web/.env.local

# Start Convex (terminal 1)
npm run dev:convex

# Start app (terminal 2)
cd apps/web
npm run dev
```

Create `apps/web/.env.local` with values like:

```
VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
CONVEX_DEPLOYMENT=dev:<your-deployment>
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
ENCRYPTION_MASTER_KEY=<64-char-hex-from-generator>
VITE_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Open http://localhost:3000**

You should see:
- Landing page with StackDock branding
- **Green "Connected" status** if Convex is configured correctly
- Connection status indicator shows: "Connected • Convex is connected!"

---

## ✅ Current Status

**Last Updated**: November 15, 2025

### Core Platform ✅
- ✅ **TanStack Start** - Fully configured with file-based routing
- ✅ **Convex** - Real-time database connected and working
- ✅ **Clerk** - Authentication integrated and working
- ✅ **User Sync** - Auto-syncs users from Clerk to Convex
- ✅ **RBAC System** - Role-based access control implemented
- ✅ **Encryption** - AES-256-GCM encryption for API keys (no .env required)
- ✅ **Audit Logging** - Comprehensive audit trail infrastructure
- ✅ **Navigation** - Clean collapsible navigation structure

### Provider Integration ✅ (13 Providers)

**PaaS/Web Services** (5 providers):
- ✅ GridPane (servers, web services, domains, backups)
- ✅ Vercel (web services)
- ✅ Netlify (web services)
- ✅ Cloudflare (zones, pages, workers, DNS)
- ✅ Coolify (servers, web services, databases) - **Read-only**

**Database Providers** (4 providers):
- ✅ Turso (databases)
- ✅ Neon (databases, snapshots/backups)
- ✅ Convex (databases, projects, deployments)
- ✅ PlanetScale (databases)

**IaaS Providers** (4 providers):
- ✅ Vultr (servers/instances)
- ✅ DigitalOcean (servers/droplets)
- ✅ Linode (servers/linodes)
- ✅ Hetzner (servers)

### Universal Tables ✅
- ✅ `servers` - 6 providers (GridPane, Vultr, DigitalOcean, Linode, Hetzner, Coolify)
- ✅ `webServices` - 5 providers (GridPane, Vercel, Netlify, Cloudflare, Coolify)
- ✅ `domains` - 2 providers (GridPane, Cloudflare)
- ✅ `databases` - 5 providers (Turso, Neon, Convex, PlanetScale, Coolify)
- ✅ `backupSchedules` - 2 providers (GridPane, Neon)
- ✅ `deployments` - 1 provider (Convex)
- ✅ `projects` - 1 provider (GitHub - repositories, branches, issues, commits)

### Next Phase 🎯
- 🔄 Projects & Monitoring providers (Linear + Sentry) - **NEXT** (GitHub ✅ complete)
- 📋 Complex auth IaaS providers (AWS/GCP/Azure) - After Projects & Monitoring
- 📋 Insights board (data visualization)

---

## 📚 Documentation

All documentation is organized in `docs/`:

### Architecture
- **[ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md)** - Complete system design
- **[SECURITY.md](./docs/architecture/SECURITY.md)** - Security patterns
- **[RBAC.md](./docs/architecture/RBAC.md)** - Permission system

### Guides
- **[CONTRIBUTING.md](./docs/guides/CONTRIBUTING.md)** - Development workflow
- **[CONVEX_SETUP.md](./docs/guides/CONVEX_SETUP.md)** - Convex integration guide ⭐
- **[CLERK_SETUP.md](./docs/guides/CLERK_SETUP.md)** - Clerk authentication setup ⭐
- **[DOCK_ADAPTER_GUIDE.md](./docs/guides/DOCK_ADAPTER_GUIDE.md)** - Build adapters
- **[REGISTRY_GUIDE.md](./docs/guides/REGISTRY_GUIDE.md)** - Build UI components
- **[SETUP.md](./docs/guides/SETUP.md)** - Complete setup instructions
- **[QUICKSTART.md](./docs/guides/QUICKSTART.md)** - Quick start guide
- **[START.md](./docs/guides/START.md)** - Start StackDock

### Registries
- **[packages/ui/README.md](./packages/ui/README.md)** - UI component registry (shadcn model)
- **[packages/docks/README.md](./packages/docks/README.md)** - Dock adapter registry
- **[packages/cli/README.md](./packages/cli/README.md)** - CLI tool documentation

### Troubleshooting
- **[TROUBLESHOOTING.md](./docs/troubleshooting/TROUBLESHOOTING.md)** - Common issues

### Reference
- **[docs/README.md](./docs/README.md)** - Documentation index
- **[.cursorrules](./.cursorrules)** - AI assistant rules
- **[AI-HALL-OF-SHAME.md](./AI-HALL-OF-SHAME.md)** - Lessons learned (ALWAYS stays in root)

---

## 🎯 MVP Roadmap (Read-Only Dashboard)

**Goal**: Multi-provider **READ-ONLY** dashboard with validated universal schema

**⚠️ CRITICAL: All progress is READ-ONLY. No write operations exist.**

### ✅ Phase 1: Foundation (Complete)
- [x] Architecture documentation
- [x] TanStack Start app setup
- [x] Convex integration ⭐
- [x] Clerk authentication ⭐
- [x] User auto-sync to Convex ⭐
- [x] RBAC implementation ⭐
- [x] Encryption system ⭐
- [x] Audit logging infrastructure ⭐
- [x] Provisioning infrastructure (SST core, mutations, queries, UI) ⭐
- [x] GridPane dock adapter (Partial MVP) - **AUTHENTICATION WORKING** ✅
  - Servers & Web Services syncing successfully
  - Sufficient for read-only MVP observability mode
  - Full API coverage deferred until after schema validation
- [x] Resource tables (Servers, Web Services, Domains, Databases) - **DATA DISPLAYING** ✅
- [x] UI foundation (TanStack Table components) - **POLISHED & READY** ✅

### ✅ Phase 2: Translation Layer Validation (Mission 5 & 7 - Complete)

**Status**: ✅ **COMPLETE** - Universal schema validated across 13 providers

**PaaS Providers** (Web Services) ✅:
- [x] Vercel dock adapter ✅
- [x] Netlify dock adapter ✅
- [x] Cloudflare adapter ✅ (zones, pages, workers, DNS)

**Database Providers** ✅:
- [x] Turso adapter ✅
- [x] Neon adapter ✅
- [x] Convex adapter ✅
- [x] PlanetScale adapter ✅

**IaaS Providers** (Simple Auth) ✅:
- [x] Vultr adapter ✅
- [x] DigitalOcean adapter ✅
- [x] Linode adapter ✅
- [x] Hetzner adapter ✅

**Translation Layer**: ✅ Validated and refined across multiple provider types

### 🔄 Phase 3: Projects & Monitoring Providers (Current Focus - Mission 7)

**Status**: IN PROGRESS - Simple auth providers complete, Projects & Monitoring next

**Projects & Monitoring Providers** (Simple API Key Auth):
- [ ] Linear adapter (read-only) - **NEXT**
  - Projects, issues → `projects` table
- [x] GitHub adapter (read-only) ✅
  - Repos, branches, issues, commits → `projects` table
  - Intelligent commit pagination (hybrid approach)
  - Host filter for multi-provider support
- [ ] Sentry adapter (read-only)
  - Projects, alerts → monitoring/alerts structure

**Strategy**: Build Projects and Monitoring pages with real data before tackling complex auth

### 📋 Phase 4: Complex Auth IaaS Providers (After Phase 3 - Mission 7)

**IaaS Providers** (Multi-Field Auth):
- [ ] AWS adapter (IAM role, multi-field auth)
- [ ] GCP adapter (service account, multi-field auth)
- [ ] Azure adapter (client ID/secret/tenant, multi-field auth)

### 📋 Phase 5: Insights Board (Mission 8)

**Insights Board**:
- [ ] Data visualization
- [ ] Aggregated dashboards
- [ ] Cross-provider analytics

**Current Progress**: Core platform complete. Universal schema validated across 13 providers. UI foundation polished. **Current**: Adding Linear/GitHub/Sentry (Projects & Monitoring). **Next**: Complex auth IaaS (AWS/GCP/Azure), then Insights board.

---

## 🔧 How It Works (For Developers)

### The Architecture

**StackDock is infrastructure's WordPress moment** - a composable platform where you own the code.

**Three Registries Model**:
1. **Docks Registry** (`packages/docks/`) - Infrastructure adapters (copy/paste/own)
2. **UI Registry** (`packages/ui/`) - Dashboard components (shadcn/ui model)
3. **The Platform** (`convex/`, `apps/web/`) - Orchestration layer (RBAC, encryption, audit)

### Universal Table Pattern

**Key Innovation**: One table per resource type, not one per provider.

```typescript
// ✅ CORRECT: Universal table
webServices: {
  provider: "gridpane" | "vercel" | "railway",
  name: string,
  productionUrl: string,
  status: string,
  fullApiData: any  // Provider-specific data preserved
}

// ❌ WRONG: Provider-specific tables
gridPaneSites: { ... }
vercelDeployments: { ... }
```

**Why This Works**:
- Unified dashboard works with ANY provider
- Cross-provider operations possible
- Scales infinitely (100 providers = 4 tables, not 100)
- UI components are provider-agnostic

### How It Works

**1. Connect Provider (Create Dock)** ✅:
```
User → Enters API key/token → System validates → Encrypts → Stores in docks table
```
*13 providers supported: GridPane, Vercel, Netlify, Cloudflare, Turso, Neon, Convex, PlanetScale, Vultr, DigitalOcean, Linode, Hetzner, Coolify*

**2. Sync Resources** ✅:
```
User clicks "Sync" → Adapter decrypts API key → Calls provider API → 
Translates to universal schema → Inserts into universal tables
```
*All providers syncing successfully, displaying in unified tables*

**3. View Unified Dashboard** ✅:
```
Dashboard queries universal tables → Shows resources from ALL providers → 
Provider-agnostic UI components render everything
```
*6 universal tables displaying real-time data via Convex queries*

**4. Provision Infrastructure** (Ready):
```
User fills form → System calls provisionResource mutation → 
Uses SST core engine OR dock adapter → Creates resource → 
Real-time status updates via Convex subscriptions
```
*Infrastructure ready, testing with GridPane*

### Current State

**✅ What's Working**:
- Core platform (auth, RBAC, encryption, audit)
- 13 providers integrated and syncing
- Universal schema validated across multiple provider types
- Resource tables displaying real-time data from all providers
- UI foundation fully functional (TanStack Table components)
- Real-time sync (Convex subscriptions)
- Provider-agnostic UI (badges, tables, sheets)

**🎯 Current Focus**:
- Linear + GitHub + Sentry adapters (Projects & Monitoring providers) - **NEXT**
- Complex auth IaaS providers (AWS/GCP/Azure) - After Projects & Monitoring
- Insights board (data visualization)
- See [`stand-downs/working/MISSION-STATUS.md`](./stand-downs/working/MISSION-STATUS.md) for current mission status

**🚀 What You Can Do Now** (READ-ONLY):
- Connect 13 providers with encrypted API keys ✅ (read-only)
- Sync resources from all providers ✅ (read-only sync)
- View unified dashboard with all resources ✅ (read-only viewing)
- See real-time updates across all providers ✅ (read-only subscriptions)
- Add more provider adapters (AWS, GCP, Azure, Sentry, etc.) (read-only adapters)

**⚠️ What You CANNOT Do**:
- ❌ Create, modify, or delete any resources
- ❌ Provision infrastructure
- ❌ Make changes to provider resources
- ❌ Perform any write operations

**📋 Next Milestone**: Solo Developer MVP
- Projects & Monitoring providers (Linear + GitHub + Sentry)
- Complex auth providers (AWS/GCP/Azure)
- Insights board (data visualization)

### For Developers Finding This Repo

**You can** (READ-ONLY):
- Explore the architecture (well-documented)
- Review code (all open source)
- Understand the patterns (universal tables, dock adapters)
- Set up locally (see Quick Start)
- Connect 13 providers and sync resources ✅ (read-only)
- View unified dashboard with all resources ✅ (read-only)
- Contribute adapters for new providers (AWS, GCP, Azure, Sentry, etc.) (read-only adapters)
- Build UI components (read-only display components)

**⚠️ You CANNOT**:
- Create, modify, or delete resources
- Provision infrastructure
- Perform write operations

**You should**:
- Read [`stand-downs/working/MISSION-STATUS.md`](./stand-downs/working/MISSION-STATUS.md) for current mission status
- Check [`stand-downs/SUCCESS-LOG.md`](./stand-downs/SUCCESS-LOG.md) for recent progress
- Review adapter patterns in `convex/docks/adapters/` for examples

---

## 🔌 Provider Support

### Planned Docks (Adapters)

**PaaS/Server Management**:
✅ GridPane, ✅ Vercel, ✅ Netlify, ✅ Coolify (read-only: servers, services, databases), Kinsta, Rocket.net, RunCloud, Cloudways, Render, Fly.io, Railway, Laravel Forge, Ploi, InstaWP

**IaaS**:
✅ Vultr, ✅ DigitalOcean, ✅ Linode, ✅ Hetzner (simple auth complete)
AWS, GCP, Azure (multi-field auth - next)

**DNS/Domains**:
Cloudflare, Route53, Namecheap

**APM/Monitoring**:
Posthog, New Relic, Sentry, Datadog

**If it has an API, it can be a dock.**

---

## 🛠️ Tech Stack

- **[TanStack Start](https://tanstack.com/start)** - Full-stack React framework
- **[Convex](https://convex.dev)** - Real-time database
- **[Clerk](https://clerk.com)** - Authentication & orgs
- **[XState](https://xstate.js.org)** - State machines
- **[shadcn/ui](https://ui.shadcn.com)** - Component primitives
- **[Tailwind CSS 4](https://tailwindcss.com)** - Styling


## 🤝 Contributing

We welcome contributions! Please read:

- [CONTRIBUTING.md](./docs/guides/CONTRIBUTING.md) - Development workflow
- [DOCK_ADAPTER_GUIDE.md](./docs/guides/DOCK_ADAPTER_GUIDE.md) - Build adapters
- [REGISTRY_GUIDE.md](./docs/guides/REGISTRY_GUIDE.md) - Build UI components

**Ways to contribute**:
1. Build dock adapters for new providers
2. Create UI components for the registry
3. Improve documentation
4. Report bugs
5. Share feedback

---

## 🔒 Security

**Reporting Vulnerabilities**: security@stackdock.dev

**DO NOT** create public GitHub issues for security vulnerabilities.

See [SECURITY.md](./docs/architecture/SECURITY.md) for complete security documentation.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 📞 Contact

- **Website**: [stackdock.dev](https://stackdock.dev)
- **Security**: security@stackdock.dev
- **General**: contact@stackdock.dev
- **Issues**: [GitHub Issues](https://github.com/stackdock/stackdock/issues)

---

<div align="center">

**StackDock** - Infrastructure's WordPress Moment

[Website](https://stackdock.dev) • [Documentation](./docs/architecture/ARCHITECTURE.md) • [Contributing](./docs/guides/CONTRIBUTING.md)

*Built with ⚓️ for the captains navigating the multi-cloud ocean*

</div>
