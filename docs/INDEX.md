# Documentation Index

**Quick navigation for all StackDock documentation**

---

## Start Here

1. **[Root README](../README.md)** - Project overview and vision
2. **[SETUP.md](../SETUP.md)** - Complete setup instructions  
3. **[ARCHITECTURE.md](./architecture/ARCHITECTURE.md)** - System architecture

---

## By Topic

### Understanding the System
- [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) - Complete system design
- [The Three Registries](./architecture/ARCHITECTURE.md#the-three-registries)
- [Universal Table Pattern](./architecture/ARCHITECTURE.md#universal-table-architecture)

### Security
- [SECURITY.md](./architecture/SECURITY.md) - Security patterns
- [Encryption](./architecture/SECURITY.md#encryption)
- [RBAC System](./architecture/RBAC.md)

### Contributing
- [CONTRIBUTING.md](./guides/CONTRIBUTING.md) - Development workflow
- [Building Dock Adapters](./guides/DOCK_ADAPTER_GUIDE.md)
- [Building UI Components](./guides/REGISTRY_GUIDE.md)

### Help
- [TROUBLESHOOTING.md](./troubleshooting/TROUBLESHOOTING.md) - Common issues
- [CURRENT_ISSUE.md](./troubleshooting/CURRENT_ISSUE.md) - Active problems

---

## For AI Assistants

- [.cursorrules](../.cursorrules) - Rules to prevent breaking things
- [.stackdock-state.json](../.stackdock-state.json) - Current state
- [AI-HALL-OF-SHAME.md](../AI-HALL-OF-SHAME.md) - Learn from past mistakes

---

## File Locations

```
stackdock/
├── README.md                  # Project overview
├── SETUP.md                   # Setup instructions
├── .cursorrules               # AI assistant rules
├── .stackdock-state.json      # State tracking
├── AI-HALL-OF-SHAME.md        # Lessons learned
│
└── docs/
    ├── README.md              # Main docs entry point
    ├── INDEX.md               # Quick navigation (this file)
    ├── DIRECTORY_TREE.md      # Complete directory structure
    ├── REORGANIZATION_PLAN.md # Reorganization plan
    │
    ├── [TOP-LEVEL STATUS]
    │   ├── STATUS.md          # Current project status
    │   ├── PROGRESS.md        # Build progress
    │   ├── BUILT.md           # What's completed
    │   └── REFACTORING.md     # Refactoring notes
    │
    ├── architecture/          # System architecture (MID-LEVEL)
    │   ├── ARCHITECTURE.md    # System design
    │   ├── SECURITY.md        # Security patterns
    │   ├── RBAC.md            # Permissions
    │   ├── SCHEMA_DESIGN.md   # Database schema
    │   ├── NAVIGATION_ARCHITECTURE.md
    │   ├── ACCESSIBILITY.md
    │   └── DEVELOPMENT_PRIORITY.md
    │
    ├── guides/                # Step-by-step guides (MID-LEVEL)
    │   ├── SETUP.md           # Setup instructions
    │   ├── QUICKSTART.md      # Quick start
    │   ├── START.md           # Start StackDock
    │   ├── CONTRIBUTING.md    # Development workflow
    │   ├── DOCK_ADAPTER_GUIDE.md
    │   ├── REGISTRY_GUIDE.md
    │   ├── CLERK_SETUP.md
    │   └── CONVEX_SETUP.md
    │
    ├── guides/                # Step-by-step guides (MID-LEVEL)
    │   ├── SETUP.md           # Setup instructions
    │   ├── QUICKSTART.md      # Quick start
    │   ├── START.md           # Start StackDock
    │   ├── CONTRIBUTING.md    # Development workflow
    │   ├── DOCK_ADAPTER_GUIDE.md
    │   ├── REGISTRY_GUIDE.md
    │   ├── CLERK_SETUP.md
    │   ├── CONVEX_SETUP.md
    │   │
    │   ├── reference/          # Reference materials
    │   │   └── STATE-README.md
    │   │
    │   ├── troubleshooting/   # Problem solving
    │   │   └── TROUBLESHOOTING.md
    │   │
    │   └── workflows/         # Workflows & processes
    │       ├── WORKFLOW.md    # Core workflow docs
    │       ├── AGENT_SYSTEM.md # Agent system
    │       ├── STAND_DOWNS.md  # Stand-downs system
    │       ├── PIPELINE.md     # Testing pipeline
    │       ├── MERGE_CRITERIA.md # Merge requirements
    │       ├── BRANCH_PROTECTION.md
    │       │
    │       └── principle-engineers/  # Agent SOPs
    │           ├── frontend-shadcn.md
    │           ├── frontend-tailwind-v4.md
    │           ├── frontend-tanstack.md
    │           ├── frontend-xstate.md
    │           ├── backend-convex.md
    │           ├── backend-sst.md
    │           ├── devops.md
    │           └── security.md
    │
    ├── stand-downs/            # Mission tracking
    │   ├── active/            # Active missions
    │   ├── working/           # In-progress missions
    │   ├── archived/          # Completed missions
    │   └── agents/            # Agent system files
    │
    ├── internal/              # Internal documentation
    │   └── STATEMENT.md
    │
    ├── archived/              # Archived docs
    ├── local/                 # Local reference files
    │
    └── AI-HALL-OF-SHAME.md   # Lessons learned (never move)
```

## Documentation Organization

### Organization by Purpose
- **Guides** (`guides/`) - For users and developers
  - Includes: workflows, troubleshooting, reference
- **Architecture** (`architecture/`) - System design
- **Stand-downs** (`stand-downs/active/`) - All active missions/work
- **Internal** (`internal/`) - For agents and AI
- **Local** (`local/`) - Not pushed to GitHub (adapter JSONs, templates)

See [DIRECTORY_TREE.md](./DIRECTORY_TREE.md) for complete structure details.

---

**Everything is documented. Everything is organized.**
