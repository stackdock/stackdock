---
title: Add ASCII Diagrams to Architecture and Documentation
labels: documentation,enhancement,post-mvp
priority: medium
category: documentation
estimated-hours: 8-12
---

## Goal

Add ASCII diagrams and visual trees to architecture documentation and navigation guides to improve readability and understanding of StackDock's structure.

## Current State

Documentation exists but lacks visual representations:
- Architecture documentation is text-heavy
- Navigation structure described in prose
- No visual diagrams for data flow, adapter patterns, or system architecture
- Monorepo structure shown as text only

## Proposed Diagrams

### 1. Architecture Diagrams

#### Three Registries Model
```
┌─────────────────────────────────────────────────────────────┐
│                    StackDock Platform                        │
│                  (Orchestration Layer)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   RBAC       │  │  Encryption   │  │    Audit    │     │
│  │  System      │  │  (AES-256)    │  │   Logging    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Universal Tables (convex/schema.ts)          │  │
│  │  servers | webServices | domains | databases | ...  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Docks        │   │ UI           │   │ CLI          │
│ Registry     │   │ Registry     │   │ Tool         │
│              │   │              │   │              │
│ packages/    │   │ packages/    │   │ packages/    │
│ docks/       │   │ ui/          │   │ cli/         │
│              │   │              │   │              │
│ Copy/Paste/  │   │ Copy/Paste/  │   │ Install      │
│ Own          │   │ Own          │   │ Components   │
└──────────────┘   └──────────────┘   └──────────────┘
```

#### Universal Table Pattern
```
Provider APIs                    Universal Tables
─────────────────                ────────────────────
                                 
GridPane API ────┐               
                 │               
Vercel API ──────┤               
                 │               
Netlify API ─────┼───┐           
                 │   │           
Cloudflare API ──┘   │           
                     │           
Coolify API ─────────┼───┐       
                     │   │       
                     │   │       
                     ▼   ▼       
            ┌─────────────────┐ 
            │  webServices     │ 
            │  (Universal)    │ 
            └─────────────────┘ 
                     │           
                     │           
                     ▼           
            ┌─────────────────┐ 
            │  fullApiData    │ 
            │  (Provider-     │ 
            │   specific)     │ 
            └─────────────────┘ 
```

#### Dock Adapter Flow
```
┌─────────────┐
│   User      │
│  Clicks     │
│  "Sync"     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Dock Adapter       │
│  (convex/docks/     │
│   adapters/)        │
│                     │
│  1. Decrypt API Key │
│  2. Call Provider   │
│     API             │
│  3. Transform Data  │
│     (Provider →     │
│      Universal)     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Universal Table    │
│  (servers,          │
│   webServices,      │
│   domains, etc.)    │
└─────────────────────┘
```

### 2. Navigation Tree Diagrams

#### Complete Navigation Structure
```
Dashboard ▼
├── Insights          → /dashboard
└── Projects          → /dashboard/projects
    └── $projectId    → /dashboard/projects/$projectId
        ├── Overview  → /dashboard/projects/$projectId/overview
        ├── Resources → /dashboard/projects/$projectId/resources
        ├── Activity  → /dashboard/projects/$projectId/activity
        └── Settings  → /dashboard/projects/$projectId/settings

Infrastructure ▼
├── Compute           → /dashboard/infrastructure/compute
│   ├── Servers       → /dashboard/infrastructure/servers (future)
│   │   └── $serverId → /dashboard/infrastructure/servers/$serverId
│   └── Web Services  → /dashboard/infrastructure/web-services (future)
│       └── $webServiceId → /dashboard/infrastructure/web-services/$webServiceId
├── Data              → /dashboard/infrastructure/data
│   └── Databases     → /dashboard/infrastructure/databases (future)
│       └── $databaseId → /dashboard/infrastructure/databases/$databaseId
└── Networking        → /dashboard/infrastructure/networking
    └── Domains       → /dashboard/infrastructure/domains (future)
        └── $domainId → /dashboard/infrastructure/domains/$domainId

Operations ▼
├── Backups           → /dashboard/operations/backups
│   └── $backupId     → /dashboard/operations/backups/$backupId (future)
└── Workflows         → /dashboard/operations/workflows
    └── $workflowId   → /dashboard/operations/workflows/$workflowId (future)

Monitoring ▼ (Future)
├── Issues            → /dashboard/monitoring/issues
├── Uptime            → /dashboard/monitoring/uptime
├── Activity          → /dashboard/monitoring/activity
│   └── $activityId   → /dashboard/monitoring/activity/$activityId
├── Alerts            → /dashboard/monitoring/alerts
│   └── $alertId     → /dashboard/monitoring/alerts/$alertId
└── Logs              → /dashboard/monitoring/logs
    └── $logId        → /dashboard/monitoring/logs/$logId

Settings ▼
├── Organization      → /dashboard/settings/organization
├── Teams             → /dashboard/settings/teams
├── Clients           → /dashboard/settings/clients
├── Roles             → /dashboard/settings/roles
├── User              → /dashboard/settings/user
├── Theme             → /dashboard/settings/theme
└── Docks             → /dashboard/settings/docks
```

#### Sidebar Navigation (User View)
```
┌─────────────────────────────────────┐
│  StackDock                          │
├─────────────────────────────────────┤
│  ▼ Dashboard                        │
│    • Insights                       │
│    • Projects                       │
├─────────────────────────────────────┤
│  ▼ Infrastructure                   │
│    • Compute                        │
│    • Data                           │
│    • Networking                     │
├─────────────────────────────────────┤
│  ▼ Operations                       │
│    • Backups                        │
│    • Workflows                      │
├─────────────────────────────────────┤
│  ▼ Monitoring                       │
│    • Issues                         │
│    • Uptime                         │
├─────────────────────────────────────┤
│  ▼ Settings                         │
│    • Organization                   │
│    • Teams                          │
│    • Clients                        │
│    • Roles                          │
│    • User                           │
│    • Theme                          │
│    • Docks                          │
└─────────────────────────────────────┘
```

### 3. Monorepo Structure Tree

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

### 4. Data Flow Diagrams

#### Sync Flow
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

#### RBAC Flow
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

### 5. Provider Integration Diagram

```
┌─────────────────────────────────────────────────────────┐
│              StackDock Universal Tables                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ servers  │ │webServices│ │ domains  │ │databases │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────┘
         ▲              ▲              ▲              ▲
         │              │              │              │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
    │         │    │         │    │         │    │         │
┌───┴───┐ ┌──┴──┐ ┌┴───┐ ┌──┴──┐ ┌┴───┐ ┌──┴──┐ ┌┴───┐ ┌──┴──┐
│GridPane│ │Vultr│ │Verc│ │Netl│ │Cloud│ │Grid│ │Turso│ │Neon │
│        │ │     │ │el  │ │ify │ │flare│ │Pane│ │     │ │     │
└────────┘ └─────┘ └────┘ └────┘ └─────┘ └─────┘ └─────┘ └─────┘
┌───┴───┐ ┌──┴──┐ ┌──┴──┐ ┌──┴──┐ ┌──┴──┐ ┌──┴──┐ ┌──┴──┐ ┌──┴──┐
│Digital│ │Lino│ │Hetz │ │Cooli│ │GitHu│ │Sentr│ │Bette│ │Conve│
│Ocean  │ │de  │ │ner  │ │fy   │ │b    │ │y    │ │r    │ │x    │
└───────┘ └────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘
```

## Files to Update

### Architecture Documentation
- `docs/architecture/ARCHITECTURE.md`
  - Add Three Registries diagram
  - Add Universal Table Pattern diagram
  - Add Dock Adapter Flow diagram
  - Add Provider Integration diagram

### Navigation Documentation
- `docs/architecture/NAVIGATION_ARCHITECTURE.md`
  - Add complete navigation tree diagram
  - Add sidebar navigation visual
  - Add detail page access flow diagram

### README Files
- `README.md`
  - Add monorepo structure tree
  - Add simplified architecture diagram

### Guides
- `docs/guides/CONTRIBUTING.md`
  - Add data flow diagrams
  - Add RBAC flow diagram
  - Add sync flow diagram

### New Documentation
- `docs/architecture/DIAGRAMS.md` (optional)
  - Centralized location for all diagrams
  - Reference from other docs

## Implementation Guidelines

### ASCII Art Standards
- Use consistent box-drawing characters (─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼)
- Maintain alignment and spacing
- Use clear labels and arrows
- Keep diagrams readable at standard terminal width (80-120 chars)

### Diagram Placement
- Place diagrams after introductory text
- Add captions/descriptions above diagrams
- Reference diagrams in text when relevant
- Keep diagrams close to related content

### Maintenance
- Update diagrams when architecture changes
- Verify diagrams match actual code structure
- Test diagram rendering in markdown viewers
- Keep diagrams version-controlled

## Success Criteria

- [ ] Three Registries diagram added to ARCHITECTURE.md
- [ ] Universal Table Pattern diagram added
- [ ] Dock Adapter Flow diagram added
- [ ] Complete navigation tree added to NAVIGATION_ARCHITECTURE.md
- [ ] Sidebar navigation visual added
- [ ] Monorepo structure tree added to README.md
- [ ] Data flow diagrams added to CONTRIBUTING.md
- [ ] RBAC flow diagram added
- [ ] Sync flow diagram added
- [ ] Provider integration diagram added
- [ ] All diagrams render correctly in GitHub markdown
- [ ] Diagrams are consistent in style and formatting

## Benefits

1. **Improved Understanding**: Visual representations make architecture easier to grasp
2. **Faster Onboarding**: New contributors can understand structure quickly
3. **Better Documentation**: Diagrams complement text explanations
4. **Navigation Clarity**: Tree structures show relationships clearly
5. **Reference Material**: Diagrams serve as quick reference guides

## Related Documentation

- `docs/architecture/ARCHITECTURE.md` - Main architecture documentation
- `docs/architecture/NAVIGATION_ARCHITECTURE.md` - Navigation structure
- `docs/guides/CONTRIBUTING.md` - Contribution guide
- `README.md` - Project overview

## Notes

- ASCII diagrams are preferred over image files for version control and readability
- Diagrams should be kept up-to-date with code changes
- Consider using tools like `asciiflow.com` or `monodraw` for complex diagrams
- Test diagram rendering in various markdown viewers (GitHub, VS Code, etc.)
