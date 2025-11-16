# StackDock Documentation Directory Tree

**Last Updated**: November 16, 2025  
**Purpose**: Complete documentation organization structure

---

## 📁 Directory Tree Structure

```
docs/
├── README.md                          # Main docs entry point
├── INDEX.md                           # Quick navigation index
├── DIRECTORY_TREE.md                  # This file - directory structure
│
├── [TOP-LEVEL]                        # High-level overview docs
│   ├── STATUS.md                      # Current project status
│   ├── PROGRESS.md                    # Build progress tracking
│   ├── BUILT.md                       # What's been completed
│   └── REFACTORING.md                 # Refactoring notes
│
├── architecture/                      # System architecture (MID-LEVEL)
│   ├── ARCHITECTURE.md                # Complete system design (23k+ words)
│   ├── SECURITY.md                    # Security patterns & encryption
│   ├── RBAC.md                        # Role-Based Access Control
│   ├── SCHEMA_DESIGN.md               # Database schema design
│   ├── NAVIGATION_ARCHITECTURE.md     # Navigation system design
│   ├── ACCESSIBILITY.md               # Accessibility standards
│   └── DEVELOPMENT_PRIORITY.md        # Development priorities
│
├── guides/                            # Step-by-step guides (MID-LEVEL)
│   ├── SETUP.md                       # Complete setup instructions
│   ├── QUICKSTART.md                  # Quick start guide
│   ├── START.md                       # Start StackDock after setup
│   ├── CONTRIBUTING.md                # Development workflow
│   ├── DOCK_ADAPTER_GUIDE.md          # Building dock adapters
│   ├── REGISTRY_GUIDE.md              # Building UI components
│   ├── CLERK_SETUP.md                 # Clerk authentication setup
│   ├── CONVEX_SETUP.md                # Convex database setup
│   │
│   ├── reference/                     # Reference materials
│   │   └── STATE-README.md            # State system documentation
│   │
│   ├── troubleshooting/               # Problem solving
│   │   └── TROUBLESHOOTING.md         # Common issues & solutions
│   │
│   └── workflows/                     # Workflow processes & guides
│       ├── WORKFLOW.md                 # General workflow process
│       ├── AGENT_SYSTEM.md            # Principle engineer agent system
│       ├── STAND_DOWNS.md             # Stand-down reporting system
│       ├── PIPELINE.md                # Testing pipeline
│       ├── MERGE_CRITERIA.md          # Merge requirements
│       ├── BRANCH_PROTECTION.md       # Branch protection rules
│       │
│       └── principle-engineers/        # Agent SOPs (LOW-LEVEL)
│           ├── frontend-shadcn.md     # shadcn/ui patterns
│           ├── frontend-tailwind-v4.md # Tailwind CSS 4 standards
│           ├── frontend-tanstack.md   # TanStack Start/Router patterns
│           ├── frontend-xstate.md     # XState state machines
│           ├── backend-convex.md      # Convex database patterns
│           ├── backend-sst.md         # SST.dev infrastructure
│           ├── devops.md              # CI/CD and deployment
│           └── security.md            # Security and encryption
│
├── stand-downs/                       # Mission tracking (ACTIVE)
│   ├── README.md                      # Stand-downs system overview
│   ├── OVERARCHING-GOALS.md          # Long-term goals
│   ├── ORGANIZATION-SUMMARY.md        # Organization structure
│   ├── SUCCESS-LOG.md                 # Completed missions
│   ├── SECURITY-LOG.md                # Security-related missions
│   ├── MISSION-STATUS.md              # Current mission status
│   │
│   ├── active/                        # Active missions (ACTIVE)
│   │   ├── README.md
│   │   ├── OPEN-MISSIONS.md
│   │   ├── projects-ui-frontend-agent-prompt.md
│   │   ├── rbac-enhancement-review.md
│   │   ├── provider-aware-sync-intervals-plan.md
│   │   ├── sync-deletion-architecture.md
│   │   ├── storage-buckets-frontend-agent-prompt.md
│   │   ├── storage-buckets-convex-agent-prompt.md
│   │   ├── PLAN-monitoring-sidebar-cleanup.md
│   │   └── frontend-agent-monitoring-sidebar-cleanup.md
│   │
│   ├── working/                      # In-progress missions (ACTIVE)
│   │   ├── README.md
│   │   ├── MISSION-STATUS.md
│   │   ├── universal-table-skeleton-fix-plan.md
│   │   └── continuous-sync-rate-limit-plan.md
│   │
│   ├── agents/                       # Agent system files (LOW-LEVEL)
│   │   ├── README.md
│   │   ├── SYNC_GUIDE.md
│   │   ├── agent-sessions.json
│   │   ├── index.json
│   │   ├── split-sessions.js
│   │   └── templates/
│   │
│   └── archived/                     # Completed missions (ARCHIVED)
│       ├── mission-1-completion-log.json
│       ├── mission-2-state.json
│       ├── mission-3-completed/
│       ├── mission-4-completed/
│       ├── mission-5-completed/
│       ├── mission-6-completed/
│       ├── mission-7-completed/
│       └── [other archived items]
│
├── internal/                         # Internal documentation (LOW-LEVEL)
│   └── STATEMENT.md                  # Internal philosophy & standards
│
├── archived/                         # Archived docs (ARCHIVED)
│   ├── CLEANUP-2025-11-16.md
│   ├── CLEANUP-PLAN-2025-11-16.md
│   ├── MVP_STATUS-2025-11-16.md
│   ├── NEXT_STEPS-2025-11-16.md
│   └── stackdock-state-2025-01-12.json
│
├── local/                            # Local reference files (REFERENCE)
│   ├── docks/                        # Provider API references
│   │   ├── README.md
│   │   ├── aws/
│   │   ├── better-stack/
│   │   ├── cloudflare/
│   │   ├── convex/
│   │   ├── coolify/
│   │   ├── digitalocean/
│   │   ├── github/
│   │   ├── gridpane/
│   │   ├── hetzner/
│   │   ├── linode/
│   │   ├── neon/
│   │   ├── netlify/
│   │   ├── planetscale/
│   │   ├── turso/
│   │   ├── vercel/
│   │   └── vultr/
│   │
│   └── shadcn-admin-1.0.0/           # Reference implementation
│
└── AI-HALL-OF-SHAME.md               # Lessons learned (never move)
```

---

## 📊 Documentation Levels

### TOP-LEVEL (High-Level Overview)
**Purpose**: Quick status, progress, overview  
**Location**: `docs/[TOP-LEVEL]/` or root of `docs/`  
**Files**:
- `STATUS.md` - Current project status
- `PROGRESS.md` - Build progress
- `BUILT.md` - What's completed
- `REFACTORING.md` - Refactoring notes

**Audience**: Everyone (developers, stakeholders, AI agents)

### MID-LEVEL (Architecture & Guides)
**Purpose**: System design, how-to guides, troubleshooting  
**Location**: `docs/architecture/`, `docs/guides/`, `docs/troubleshooting/`  
**Files**:
- Architecture docs (system design, security, RBAC, schema)
- Setup guides (SETUP.md, QUICKSTART.md, START.md)
- Contributing guides (CONTRIBUTING.md, DOCK_ADAPTER_GUIDE.md)
- Troubleshooting (TROUBLESHOOTING.md)

**Audience**: Developers, contributors, AI agents

### LOW-LEVEL (Reference & Implementation)
**Purpose**: Detailed implementation details, SOPs, reference materials  
**Location**: `docs/workflows/principle-engineers/`, `docs/reference/`, `docs/internal/`  
**Files**:
- Principle engineer SOPs (frontend-shadcn.md, backend-convex.md, etc.)
- Reference materials (STATE-README.md)
- Internal docs (STATEMENT.md)
- Agent system files (stand-downs/agents/)

**Audience**: AI agents, principle engineers, deep-dive developers

---

## 🔄 Active Work Organization

### Workflows (`docs/workflows/`)
**Purpose**: Active workflows, processes, and agent prompts  
**Structure**:
- `workflows/` - Core workflow documentation
- `workflows/principle-engineers/` - Agent SOPs
- `workflows/[active-work]/` - Active work items (temporary)

### Stand-Downs (`docs/stand-downs/`)
**Purpose**: Mission tracking, active work, completed missions  
**Structure**:
- `stand-downs/active/` - Currently active missions
- `stand-downs/working/` - In-progress missions
- `stand-downs/archived/` - Completed missions
- `stand-downs/agents/` - Agent system files

**Lifecycle**:
1. Mission starts → `stand-downs/active/` or `stand-downs/working/`
2. Mission completes → Move to `stand-downs/archived/`
3. Workflow document → Move to `workflows/[active-work]/` or archive

---

## 📝 File Naming Conventions

### Status Files
- `STATUS.md` - Current project status
- `PROGRESS.md` - Build progress
- `BUILT.md` - What's built
- `MISSION-STATUS.md` - Mission status

### Guide Files
- `SETUP.md` - Setup instructions
- `QUICKSTART.md` - Quick start
- `CONTRIBUTING.md` - Contributing guide
- `[TOPIC]_GUIDE.md` - Topic-specific guide

### Plan Files
- `PLAN-[topic].md` - Implementation plan
- `[topic]-plan.md` - Alternative plan format

### Agent Files
- `[agent]-[topic]-agent-prompt.md` - Agent prompt
- `[agent]-[topic]-guide.md` - Agent guide
- `[agent]-[topic]-completion.md` - Completion summary

### Archived Files
- `[topic]-[date].md` - Date-stamped archived file
- `mission-[N]-completed/` - Completed mission folder

---

## 🎯 Quick Reference

### Where to Find Things

**Current Status?**
- `docs/STATUS.md` - Project status
- `docs/PROGRESS.md` - Build progress
- `docs/stand-downs/active/OPEN-MISSIONS.md` - Active missions

**How to Build Something?**
- `docs/guides/DOCK_ADAPTER_GUIDE.md` - Dock adapters
- `docs/guides/REGISTRY_GUIDE.md` - UI components
- `docs/architecture/ARCHITECTURE.md` - System architecture

**Active Work?**
- `docs/stand-downs/active/` - Active missions (all active work)
- `docs/stand-downs/working/` - In-progress missions

**Agent SOPs?**
- `docs/guides/workflows/principle-engineers/` - All agent SOPs
- `docs/guides/workflows/AGENT_SYSTEM.md` - Agent system overview

**Troubleshooting?**
- `docs/guides/troubleshooting/TROUBLESHOOTING.md` - Common issues

**Lessons Learned?**
- `docs/AI-HALL-OF-SHAME.md` - Past mistakes (never move)

---

## 🔧 Maintenance

### Adding New Documentation

1. **Determine Purpose**: 
   - **Guides** (`guides/`) - For users/developers
   - **Architecture** (`architecture/`) - System design
   - **Stand-downs** (`stand-downs/active/`) - Active missions/work
   - **Internal** (`internal/`) - For agents/AI
   - **Local** (`local/`) - Not pushed to GitHub
2. **Follow Naming**: Use conventions above
3. **Update INDEX.md**: Add to navigation

### Archiving Documentation

1. **Move to `archived/`**: When no longer active
2. **Date Stamp**: Add date to filename if needed
3. **Update INDEX.md**: Remove from active navigation
4. **Keep Structure**: Maintain folder organization

### Active Work Lifecycle

1. **Create**: In `stand-downs/active/` (all active work goes here)
2. **Work**: Update as progress is made
3. **Complete**: Move to `stand-downs/archived/`
4. **Reference**: Keep in archived for future reference

---

## 📌 Key Principles

1. **Everything in `docs/`**: All internal documentation goes here
2. **Purpose-Based Organization**: 
   - `guides/` - For users/developers (includes workflows, troubleshooting, reference)
   - `architecture/` - System design
   - `stand-downs/active/` - All active missions/work
   - `internal/` - For agents/AI
   - `local/` - Not pushed to GitHub
3. **No Redundant Folders**: Stop spiraling files unless they have a clear purpose
4. **Never Move**: `AI-HALL-OF-SHAME.md` stays in `docs/`
5. **Clear Naming**: Follow conventions for easy discovery
6. **Maintain INDEX.md**: Keep navigation updated

---

**This structure evolves with the project. Update this file when making organizational changes.**
