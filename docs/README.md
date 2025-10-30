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

- **[RBAC.md](./architecture/RBAC.md)** - Role-Based Access Control
  - Permission Model
  - Enforcement Architecture
  - Common Scenarios
  - API Reference

---

### Guides (`docs/guides/`)

Step-by-step guides for contributors:

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

---

### Troubleshooting (`docs/troubleshooting/`)

Common issues and solutions:

- **[TROUBLESHOOTING.md](./troubleshooting/TROUBLESHOOTING.md)** - Common issues
  - TanStack Start issues
  - pnpm vs npm problems
  - Auth issues
  - Convex connection problems

- **[CURRENT_ISSUE.md](./troubleshooting/CURRENT_ISSUE.md)** - Active issues
  - Current blockers
  - Work in progress
  - Known issues

---

### Reference (`docs/reference/`)

System references and state tracking:

- **[STATE-README.md](./reference/STATE-README.md)** - State system guide
  - How state tracking works
  - State file format
  - Context persistence

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
2. [CURRENT_ISSUE.md](./troubleshooting/CURRENT_ISSUE.md)

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
