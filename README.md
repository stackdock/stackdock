![Image of Stackdock logo](/docs/stackdock-new-logo-dark.svg "Stackdock logo")

<div align="center">
  <h1>StackDock</h1>
  <p><strong>Open Source Developer Multi-Cloud Management Platform</strong></p>
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
npx stackdock add cloudflare
# → Copies StackDock's latest dock code into YOUR codebase
# → You own the dock adapter
# → Customize, publish your own adapters/registrys
```

### Why This Matters

- **WordPress democratized content management**
- **StackDock democratizes infrastructure management**
- **True FOSS**: You own the code (docks, UI, everything)
- **Composable**: Build your OWN infinitely customizable infra helm
- **Extensible**: If it has an API, it can be a dock

---

## Welcome Aboard Captain! ⚓️

Welcome to the shipyard! The blueprints are evolving, the vision is locked in, and the project is being built in public.

**This isn't just another tool.** It's infrastructure's Democracy moment.

**IMPORTANT: StackDock is currently in READ-ONLY mode. All functionality is view-only. No write operations (create, modify, delete, provision) are available or implemented yet.**

Star the repo to watch the build! 

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
- After universal schema is fully validated across all planned provider types
- Write operations will be clearly marked and documented when available

**⚠️ DO NOT attempt to use StackDock for any write operations. They are not implemented and will not work.**

---

## 🧭 Vision & Architecture

### The Three Registries

1. **Docks Registry**: Infrastructure adapters (copy/paste/own)
   - Location: `packages/docks/`
   - Coolify, Vercel, Netlify, DigitalOcean, Cloudflare, GridPane etc.
   - StackDock Open Source built and official adapters "docks"
   - Translates provider APIs to StackDock's universal schema
   - See: [packages/docks/README.md](./packages/docks/README.md)

2. **UI Registry**: Dashboard components (shadcn/ui model)
   - Location: `packages/ui/`
   - Server health widgets, deployment timelines, etc.
   - Works with ANY provider (provider-agnostic)
   - Copy, customize, own
   - See: [packages/ui/README.md](./packages/ui/README.md)

3. **The Platform**: Orchestration layer
   - Universal data model and schema (`convex/schema.ts`)
   - RBAC enforcement (unlimited users)
   - Encryption & security (AES-256-GCM)
   - Audit logging
   - Real-time sync
   - CLI tool (`packages/cli/`) for registry management

### Monorepo Structure

```
stackdock/
├── apps/
│   ├── web/                          # Main TanStack Start app
│   │   ├── src/
│   │   │   ├── routes/              # File-based routing
│   │   │   │   ├── dashboard/       # Dashboard routes
│   │   │   │   │   ├── docks/       # Dock management
│   │   │   │   │   ├── infrastructure/ # Resource views
│   │   │   │   │   ├── monitoring/  # Monitoring dashboards
│   │   │   │   │   ├── projects/    # Project management
│   │   │   │   │   └── settings/    # Settings pages
│   │   │   │   └── api/             # API routes (webhooks)
│   │   │   ├── components/         # React components
│   │   │   ├── lib/                 # Utilities
│   │   │   └── machines/            # XState state machines
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── marketing/                   # Next.js marketing site
│       ├── app/                     # Next.js app directory
│       ├── lib/                     # Blog utilities
│       └── package.json
│
├── packages/
│   ├── docks/                       # Dock adapter registry
│   ├── ui/                          # UI component registry
│   ├── cli/                         # CLI tool
│   └── shared/                      # Shared utilities
│
├── convex/                          # Convex backend
│   ├── schema.ts                    # Database schema (29 tables)
│   ├── auth.config.ts               # Clerk authentication
│   ├── docks/                       # Dock management
│   │   ├── adapters/                # 16 provider adapters
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
│   │   ├── mutations.ts
│   │   ├── queries.ts
│   │   ├── actions.ts
│   │   └── scheduled.ts
│   ├── resources/                   # Resource queries
│   ├── projects/                    # Project management
│   ├── monitoring/                  # Monitoring features
│   ├── organizations/              # Organization management
│   └── lib/                         # Utilities (RBAC, encryption, audit)
│
├── docs/                            # Documentation
│   ├── .stackdock-state.json        # State file (source of truth)
│   ├── architecture/                # Architecture docs
│   ├── guides/                      # Setup and contribution guides
│   ├── stand-downs/                 # Quality reviews
│   └── turnover/                    # Turnover documentation
│
├── .github/
│   ├── workflows/                  # GitHub Actions
│   ├── ISSUES/                      # Local issue files
│   └── scripts/                     # Automation scripts
│
├── .cursorrules                     # AI assistant rules
├── package.json                     # Root package.json
└── README.md                        # Project README
```

### Core Architecture

**Universal Tables** (Provider-Agnostic):
- `servers`: Coolify, Vultr, DigitalOcean, Linode, Hetzner, GridPane → ONE table (Laravel Forge, Ploi -> planned)
- `webServices`: Coolify, Vercel, Netlify, Cloudflare → ONE table (Railway, Render, Laravel Forge, Ploi -> planned)
- `domains`: Cloudflare, GridPane, DNS Records → ONE table (DNSimple, DNS Made Easy, NameCheap, Laravel Forge, Ploi, Name.com -> planned)
- `databases`: Turso, Neon, Convex, PlanetScale → ONE table (Supabase, Xata, Pocketbase -> planned)
- `projects`: Core StackDock feature to link resources into one project and PM tools (Linear, Jira -> planned and currently scoping)

**Dock Adapters** (Translators):
- Vercel, Netlify, Cloudflare, GridPane, etc. API → Universal `webServices` table
- Digital Ocean, Linode, Vultr, Hetzner, etc. API → Universal `servers` table
- Provider-specific data in `fullApiData` field
- Runtime adapters: `convex/docks/adapters/` (execution)
- Registry adapters: `packages/docks/` (copy/paste/own)

**AWS GCP Azure and Oracle are the "Big Four" - Obviously they will be on the road map and integrated. Just the least priority. This is a feature! Not a bug**

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
- Clerk auth page
- Redirect to dashboard after auth
- Start adding providers under "Docks"

---

## ✅ Current Status

**Last Updated**: November 17, 2025  
**Current Status**: MVP Ready - 16 Providers Integrated

### Core Platform ✅
- ✅ **TanStack Start** - Fully configured with file-based routing
- ✅ **Convex** - Real-time database connected and working
- ✅ **Clerk** - Authentication integrated and working
- ✅ **User Sync** - Auto-syncs users from Clerk to Convex
- ✅ **RBAC System** - Role-based access control implemented with full coverage
  - ✅ All resource queries protected (`resources:read`)
  - ✅ All project queries protected (`projects:read`)
  - ✅ All mutations protected (manual checks + `withRBAC` middleware)
  - ✅ Monitoring permission added for Sentry integration
- ✅ **Encryption** - AES-256-GCM encryption for API keys (no .env required)
- ✅ **Audit Logging** - Comprehensive audit trail infrastructure
- ✅ **Navigation** - Clean collapsible navigation structure
- ✅ **Continuous Sync** - Automated background syncing (60s+ intervals, provider-aware)
- ✅ **Rate Limit Tracking** - Comprehensive rate limit monitoring and logging
- ✅ **Polymorphic Deduplication** - Client-side deduplication for servers and domains

### Provider Integration ✅ (16 Providers)

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

**Project Providers** (1 provider):
- ✅ GitHub (repos/branches/commits/issues/)

**Monitoring Providers** (2 providers):
- ✅ Sentry (issues/errors) - Integrated into monitoring/issues table
- ✅ Better Stack (uptime monitoring)

### Universal Tables ✅
- ✅ `servers` - 6 providers (GridPane, Vultr, DigitalOcean, Linode, Hetzner, Coolify) - Client side Polymorphic deduplication 
- ✅ `webServices` - 5 providers (GridPane, Vercel, Netlify, Cloudflare, Coolify)
- ✅ `domains` - 2 providers (GridPane, Cloudflare) - Client side Polymorphic deduplication 
- ✅ `databases` - 5 providers (Turso, Neon, Convex, PlanetScale, Coolify)
- ✅ `issues` - 1 provider (Sentry) - Monitoring issues/errors
- ✅ `monitors` - 1 provider (Better Stack) - Uptime monitoring
- ✅ `backupSchedules` - 2 providers (GridPane, Neon)
- ✅ `deployments` - 1 provider (Convex)
- ✅ `projects` - 1 provider (GitHub - repositories, branches, issues, commits)

### Shelved for Post-MVP launch 11/17 📋
- 📋 **Linear adapter** - Shelved (complex project linking system)
- 📋 **Projects Core System** - Shelved (polymorphic resource linking to projects)
- 📋 **Complex Auth IaaS** (AWS/GCP/Azure) - Shelved (multi-field auth complexity)
- 📋 **Insights Board Enhancements** - Shelved (advanced visualization deferred)
- 📋 **Audits** - Shelved (frontend, convex, security, devops, cli etc.)
- 📋 **Docker-CI/CD** - Shelved (docker, dev, staging/preview, + deployment scripts (win - mac - linux) support)
- 📋 **E2E Testing Scaffold and implementation** - Yeah this will suck but I need practice. Perfect!
- 📋 **GitHub Org Level admin stuffs** - Have some type of handle on contributors, discussions, pr's etc.

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
- [x] Convex integration 
- [x] Clerk authentication 
- [x] User auto-sync to Convex 
- [x] RBAC implementation 
- [x] Encryption system 
- [x] Audit logging infrastructure 
- [x] Provisioning infrastructure (SST core, mutations, queries, UI) 
- [x] GridPane dock adapter (Read Only MVP)
- [x] Resource tables (Servers, Web Services, Domains, Databases)
- [x] UI foundation (TanStack Table components)

### ✅ Phase 2: Translation Layer Validation (Mission 5 & 7 - Complete)

**Status**: ✅ **COMPLETE** - Universal schema validated across 16 providers

**PaaS Providers** (Web Services) ✅:
- [x] Vercel dock adapter 
- [x] Netlify dock adapter 
- [x] Cloudflare adapter (zones, pages, workers, DNS)

**Database Providers** ✅:
- [x] Turso adapter 
- [x] Neon adapter 
- [x] Convex adapter 
- [x] PlanetScale adapter 

**IaaS Providers** (Simple Auth) ✅:
- [x] Vultr adapter 
- [x] DigitalOcean adapter 
- [x] Linode adapter 
- [x] Hetzner adapter 

**Translation Layer**: ✅ Validated and refined across multiple provider types

### ✅ Phase 3: Projects & Monitoring Providers (Complete)

**Status**: ✅ **COMPLETE** - GitHub and Sentry integrated

**Projects & Monitoring Providers** (Simple API Key Auth):
- [x] GitHub adapter (read-only) ✅
  - Repos, branches, issues, commits → `projects` table
  - Intelligent commit pagination (hybrid approach)
  - Host filter for multi-provider support
- [x] Projects UI - **COMPLETE**
  - [x] Code page with repositories table ✅
- [x] Sentry adapter (read-only) ✅
  - Issues/errors → `issues` table (monitoring/issues page)
- [x] Better Stack adapter (read-only) ✅
  - Uptime monitoring → `monitors` table

**Shelved for Post-MVP**:
- [ ] Linear adapter - **SHELVED** (complex project linking system)
- [ ] Projects Core System - **SHELVED** (polymorphic resource linking)

### 📋 Phase 4: Complex Auth IaaS Providers (Shelved)

**IaaS Providers** (Multi-Field Auth) - **SHELVED FOR POST-MVP**:
- [ ] AWS adapter (IAM role, multi-field auth)
- [ ] GCP adapter (service account, multi-field auth)
- [ ] Azure adapter (client ID/secret/tenant, multi-field auth)

### 📋 Phase 5: Insights Board (Shelved)

**Insights Board** - **BASIC VERSION COMPLETE, ENHANCEMENTS SHELVED**:
- [x] Basic insights dashboard with deduplicated counts ✅
- [ ] Advanced data visualization - **SHELVED**
- [ ] Aggregated dashboards - **SHELVED**
- [ ] Cross-provider analytics - **SHELVED**

**Current Progress**: ✅ **MVP COMPLETE** - Core platform complete. Universal schema validated across 16 providers. UI foundation polished. Monitoring integration complete (Sentry). Client side Polymorphic table deduplication working. **Shelved**: Linear, Projects Core System, Complex Auth IaaS, Insights enhancements.

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
*16 providers supported: GridPane, Vercel, Netlify, Cloudflare, Turso, Neon, Convex, PlanetScale, Vultr, DigitalOcean, Linode, Hetzner, Coolify, GitHub, Sentry, Better Stack*

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
- 16 providers integrated and syncing
- Universal schema validated across multiple provider types
- Resource tables displaying real-time data from all providers
- UI foundation fully functional (TanStack Table components)
- Real-time sync (Convex subscriptions)
- Provider-agnostic UI (badges, tables, sheets)
- Polymorphic deduplication (servers and domains)
- Monitoring integration (Sentry issues, Better Stack uptime)

**🎯 MVP Status**:
- ✅ **MVP COMPLETE** - 16 providers integrated
- ✅ Sentry issues integrated into monitoring/issues table
- ✅ Polymorphic deduplication working
- ✅ Insights dashboard with accurate counts
- 📋 Post-MVP: Linear, Projects Core System, Complex Auth IaaS, Insights enhancements

**🚀 What You Can Do Now** (READ-ONLY):
- Connect 16 providers with encrypted API keys ✅ (read-only)
- Sync resources from all providers ✅ (read-only sync)
- View unified dashboard with all resources ✅ (read-only viewing)
- See real-time updates across all providers ✅ (read-only subscriptions)
- View monitoring issues from Sentry ✅ (read-only)
- View uptime monitors from Better Stack ✅ (read-only)

**⚠️ What You CANNOT Do**:
- ❌ Create, modify, or delete any resources
- ❌ Provision infrastructure
- ❌ Make changes to provider resources
- ❌ Perform any write operations

**📋 MVP Milestone**: ✅ **COMPLETE**
- ✅ 16 providers integrated
- ✅ Monitoring providers (Sentry + Better Stack)
- ✅ Polymorphic deduplication
- ✅ Basic insights dashboard

**📋 Post-MVP Roadmap**:
- Linear adapter (shelved)
- Projects Core System (shelved)
- Complex auth providers (AWS/GCP/Azure - shelved)
- Insights board enhancements (shelved)

### For Developers Finding This Repo

**You can** (READ-ONLY):
- Explore the architecture (well-documented)
- Review code (all open source)
- Understand the patterns (universal tables, dock adapters)
- Set up locally (see Quick Start)
- Connect 16 providers and sync resources ✅ (read-only)
- View unified dashboard with all resources ✅ (read-only)
- View monitoring issues from Sentry ✅ (read-only)
- View uptime monitors from Better Stack ✅ (read-only)
- Contribute adapters for new providers (read-only adapters)
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
✅ GridPane, ✅ Vercel, ✅ Netlify, ✅ Cloudflare, ✅ Coolify (read-only: servers, services, databases)
📋 Kinsta, Rocket.net, RunCloud, Cloudways, Render, Fly.io, Railway, Laravel Forge, Ploi, InstaWP (planned)

**IaaS**:
✅ Vultr, ✅ DigitalOcean, ✅ Linode, ✅ Hetzner (simple auth complete)
📋 AWS, GCP, Azure (multi-field auth - shelved for post-MVP)

**Database Providers**:
✅ Turso, ✅ Neon, ✅ Convex, ✅ PlanetScale

**DNS/Domains**:
✅ Cloudflare, ✅ GridPane
📋 DNSimple, DNS Made Easy, Name.com, Namecheap (planned)

**APM/Monitoring**:
✅ Sentry (issues/errors), ✅ Better Stack (uptime)
📋 Posthog, New Relic, Datadog (planned)

**Project Management**:
✅ GitHub (repositories, branches, issues, commits)
📋 Linear (shelved for post-MVP)

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
