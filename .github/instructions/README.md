# Documentation Overview

## Purpose
This folder contains internal documentation for Stackdock development. These documents establish standards, patterns, and processes for maintaining code quality across multiple AI assistant sessions.

---

## Documents

### 1. [CONVENTIONS.md](./CONVENTIONS.md)
**What:** Code standards, naming conventions, and architectural patterns
**When to use:** Before writing any new code or reviewing existing code
**Key sections:**
- File structure and naming
- Server Actions patterns
- Styling with design tokens
- TypeScript standards
- Error handling patterns

### 2. [AUDIT.md](./AUDIT.md)
**What:** Checklist of files requiring cleanup and quality standards
**When to use:** During code review and cleanup sprints
**Key sections:**
- Quick audit commands
- Files requiring cleanup
- Anti-patterns to fix
- Definition of "done"
- Progress tracking

### 3. [CLEANUP_PLAN.md](./CLEANUP_PLAN.md)
**What:** 2-week structured cleanup roadmap
**When to use:** Planning cleanup work and tracking daily progress
**Key sections:**
- Week-by-week breakdown
- Time estimates per task
- Success criteria
- Git workflow strategy

### 4. [API_PATTERNS.md](./API_PATTERNS.md)
**What:** Standard patterns for integrating API providers (Kinsta, Rocket, etc.)
**When to use:** Adding any new API provider integration
**Key sections:**
- Directory structure
- Configuration pattern
- Error handling
- CRUD operations templates
- Component integration

---

## Quick Start

### For AI Assistants
1. Read [CONVENTIONS.md](./CONVENTIONS.md) at session start
2. Check [AUDIT.md](./AUDIT.md) for current cleanup status
3. Follow [API_PATTERNS.md](./API_PATTERNS.md) when adding providers
4. Reference root [`.cursorrules`](../../.cursorrules) for behavioral guidelines

### For Developers
1. Review [CONVENTIONS.md](./CONVENTIONS.md) before contributing
2. Use [AUDIT.md](./AUDIT.md) for code review checklist
3. Follow [CLEANUP_PLAN.md](./CLEANUP_PLAN.md) for cleanup work
4. Use [API_PATTERNS.md](./API_PATTERNS.md) as template for new providers

---

## Workflow Integration

### Adding New Feature
```bash
1. Check CONVENTIONS.md for patterns
2. Look for similar existing code (GridPane as reference)
3. Follow same structure
4. Test manually
5. Update AUDIT.md if needed
```

### Code Cleanup
```bash
1. Review AUDIT.md checklist
2. Follow CLEANUP_PLAN.md schedule
3. Create feature branch
4. Make small, focused commits
5. Test after each change
6. Update AUDIT.md progress
```

### Adding New Provider
```bash
1. Open API_PATTERNS.md
2. Copy structure from GridPane
3. Follow checklist in API_PATTERNS.md
4. Implement CRUD operations
5. Test thoroughly
6. Document provider-specific quirks
```

---

## Maintenance

### Weekly Review
- [ ] Check AUDIT.md progress
- [ ] Update completed items
- [ ] Add new issues discovered
- [ ] Verify conventions are being followed

### After Major Changes
- [ ] Update CONVENTIONS.md if new patterns emerge
- [ ] Update AUDIT.md with new cleanup items
- [ ] Document lessons learned

---

## Tools & Commands

### Audit Commands
```bash
# Type checking
npm run audit:types

# Linting
npm run audit:lint

# Find unused code
npm run audit:unused

# Format code
npm run audit:format

# Run all audits
npm run audit:all
```

### Search Commands
```bash
# Find debug logging
grep -r "console.log" src/

# Find hardcoded colors
grep -r "bg-.*-[0-9]" src/

# Find any types
grep -r ": any" src/

# Find TODOs
grep -r "// TODO\|// FIXME" src/
```

---

## Current State

**Status:** 🔴 Cleanup Required
**Last Updated:** October 3, 2025
**Focus:** GridPane API implementation + code cleanup

### Completed
- ✅ GridPane GET endpoints (sites, servers, domains, etc.)
- ✅ GridPane PUT endpoint (PHP version update)
- ✅ Rate limiting system (per-endpoint + global)
- ✅ Documentation structure established

### In Progress
- 🔄 Code cleanup (debug logging, type consolidation)
- 🔄 GridPane POST endpoints
- 🔄 GridPane DELETE endpoints

### Pending
- ⏳ Auth implementation (Better Auth)
- ⏳ Database setup (Drizzle + Postgres)
- ⏳ Additional API providers
- ⏳ Testing framework
- ⏳ CI/CD setup

---

## Questions?

If these documents don't answer your question:
1. Check existing GridPane implementation for examples
2. Ask in development session with context
3. Document the answer here for future reference

---

## Philosophy

> "Convention over configuration. Consistency over cleverness."

These documents exist to:
- Reduce cognitive load when switching between AI assistants
- Maintain consistent code quality
- Speed up development by providing clear patterns
- Prevent accumulation of technical debt
- Make onboarding faster for new contributors
