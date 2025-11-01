# StackDock Documentation

> Organized documentation for the StackDock platform

---

## 📚 Documentation Structure

### Architecture (`docs/architecture/`)

Deep dive into system design, security, and permissions:

- **[ARCHITECTURE.md](./architecture/ARCHITECTURE.md)** - Complete system architecture (23k+ words)
  - The Three Registries (Docks, UI, Platform)
  - Universal Table Pattern
  - Dock Adapter Pattern
  - Data Model & Relationships
  - Tech Stack Decisions

- **[SECURITY.md](./architecture/SECURITY.md)** - Security patterns and best practices
  - Threat Model
  - Encryption (AES-256-GCM)
  - Authentication & Authorization
  - Audit Logging
  - Network Security

- **[SCHEMA_DESIGN.md](./architecture/SCHEMA_DESIGN.md)** - Schema design & evolution
  - MVP Schema (v1) - Current implementation
  - Universal Provider Pattern
  - Future enhancements (post-MVP)
  - Migration strategy
  - Known limitations & trade-offs

- **[RBAC.md](./architecture/RBAC.md)** - Role-Based Access Control
  - Permission Model
  - Enforcement Architecture
  - Common Scenarios
  - API Reference

---

### Guides (`docs/guides/`)

Step-by-step guides for contributors:

- **[SETUP.md](./guides/SETUP.md)** - Complete setup instructions
  - Prerequisites
  - Environment configuration
  - Convex & Clerk setup
  - First run

- **[QUICKSTART.md](./guides/QUICKSTART.md)** - Quick start guide
  - Fastest path to running StackDock
  - Essential steps only

- **[START.md](./guides/START.md)** - Start StackDock
  - After dependencies installed
  - Convex & Clerk initialization
  - Running the dev server

- **[CONTRIBUTING.md](./guides/CONTRIBUTING.md)** - Development workflow
  - Getting Started
  - Project Structure
  - Development Workflow
  - Coding Standards
  - Testing Requirements

- **[DOCK_ADAPTER_GUIDE.md](./guides/DOCK_ADAPTER_GUIDE.md)** - Build dock adapters
  - Adapter Interface
  - Step-by-Step Tutorial
  - Universal Table Mapping
  - Rate Limiting
  - Publishing to Registry

- **[REGISTRY_GUIDE.md](./guides/REGISTRY_GUIDE.md)** - Build UI components
  - Component Philosophy
  - Provider-Agnostic Design
  - Building Components
  - Publishing to Registry

- **[CONVEX_SETUP.md](./guides/CONVEX_SETUP.md)** - Convex integration guide
- **[CLERK_SETUP.md](./guides/CLERK_SETUP.md)** - Clerk authentication setup

---

### Troubleshooting (`docs/troubleshooting/`)

Common issues and solutions:

- **[TROUBLESHOOTING.md](./troubleshooting/TROUBLESHOOTING.md)** - Common issues
  - TanStack Start setup
  - Convex connection problems
  - Clerk authentication issues
  - Import path errors

---

### Reference (`docs/reference/`)

System references and state tracking:

- **[STATE-README.md](./reference/STATE-README.md)** - State system guide
  - How state tracking works
  - State file format
  - Context persistence

- **[AI-HALL-OF-SHAME.md](../AI-HALL-OF-SHAME.md)** - Lessons learned (located in root - never move)
  - Retrospective of development mistakes
  - What went wrong and why
  - Prevention strategies

### Project Status (`docs/`)

Current state and progress tracking:

- **[PROGRESS.md](./PROGRESS.md)** - Current build progress
- **[BUILT.md](./BUILT.md)** - What's been built
- **[DOCS_ORGANIZED.md](./DOCS_ORGANIZED.md)** - Documentation organization notes

---

## 🚀 Quick Links

**New here?** Start with:
1. [Root README](../README.md) - Project overview
2. [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) - Understanding the system
3. [CONTRIBUTING.md](./guides/CONTRIBUTING.md) - How to contribute

**Building adapters?** Read:
1. [DOCK_ADAPTER_GUIDE.md](./guides/DOCK_ADAPTER_GUIDE.md)
2. [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) - Universal tables section

**Having issues?** Check:
1. [TROUBLESHOOTING.md](./troubleshooting/TROUBLESHOOTING.md)
2. [CLERK_SETUP.md](./guides/CLERK_SETUP.md) - Auth troubleshooting section

---

## 📝 Documentation Standards

All documentation follows:
- Clear structure
- Code examples
- Step-by-step instructions
- Troubleshooting sections
- No assumptions

---

**The vision is documented. The architecture is sound. The path is clear.**
