# StackDock Missions

**Last Updated**: November 17, 2025  
**MVP Status**: ✅ COMPLETE  
**Post-MVP Missions**: 12 missions defined

> **Note**: For machine-readable state, see [`.stackdock-state.json`](./.stackdock-state.json).

---

## Mission Overview

### Archived Missions (MVP Phase)

Missions 1-7 from the MVP phase have been archived. See `.stackdock-state.json` → `archivedMissions` for details.

**Summary**:
- ✅ Mission 1: Monorepo & Docs Setup
- ✅ Mission 2: Repo Lockdown
- ✅ Mission 3: GridPane Integration
- ✅ Mission 5: Multi-Provider Integration (16 providers)
- ✅ Mission 7: Read-Only Infrastructure MVP (COMPLETE)

---

## Active Missions (Post-MVP)

### Mission 1: Clear Issues
**Status**: 🔴 Pending  
**Priority**: High  
**Estimated Hours**: 26-37 hours

**Goal**: Complete all 8 GitHub issues from critical gaps review

**GitHub Issues**:
- Extract Universal Types
- Add Shared tsconfig.base.json
- Implement Adapter Contract Tests
- Wire CI/CD GitHub Actions
- Add Type/Lint Enforcement
- Create Provider Capability Matrix
- Implement Audit Log UI
- Create Fake Provider Adapter

**Dependencies**: None

**Files**: `.github/ISSUES/*.md`

---

### Mission 2: Scaffold CLI
**Status**: 🔴 Pending  
**Priority**: High

**Goal**: Build out CLI tool for registry management

**Scope**: `packages/cli/` implementation

**Dependencies**: None

**Notes**: Structure exists, needs implementation

---

### Mission 3: Test UI/Adapter Registry
**Status**: 🔴 Pending  
**Priority**: High

**Goal**: Implement test suite for adapters and UI components

**Scope**: Contract tests, integration tests

**Dependencies**: Mission 1 (extract types)

---

### Mission 4: Full Audit Sweep
**Status**: 🔴 Pending  
**Priority**: Medium

**Goal**: Comprehensive code review and cleanup

**Scope**: Remove orphaned code, fix technical debt

**Dependencies**: None

---

### Mission 5: Cleanup UI
**Status**: 🔴 Pending  
**Priority**: Medium

**Goal**: Polish UI components, improve UX

**Scope**: Component cleanup, accessibility improvements

**Dependencies**: None

---

### Mission 6: Add Linear
**Status**: 🔴 Pending  
**Priority**: Medium

**Goal**: Integrate Linear adapter

**Scope**: Linear API integration, adapter implementation

**Dependencies**: None

**Notes**: Previously shelved, now post-MVP priority

---

### Mission 7: Harden Project Resources and Linking
**Status**: 🔴 Pending  
**Priority**: High

**Goal**: Complete project resource linking system

**Scope**: Polymorphic resource linking, project management

**Dependencies**: Mission 1 (extract types)

---

### Mission 8: Docker Support
**Status**: 🔴 Pending  
**Priority**: Low

**Goal**: Add Docker support for development/deployment

**Scope**: Dockerfiles, docker-compose, deployment configs

**Dependencies**: None

---

### Mission 9: Dev/Build/Deploy Scripts
**Status**: 🔴 Pending  
**Priority**: Medium

**Goal**: Standardize development and deployment scripts

**Scope**: npm scripts, CI/CD improvements, deployment automation

**Dependencies**: Mission 1 (CI/CD setup)

---

### Mission 10: Version Number Management
**Status**: 🔴 Pending  
**Priority**: Low

**Goal**: Implement semantic versioning and release management

**Scope**: Versioning strategy, changelog, release process

**Dependencies**: None

---

### Mission 11: New Marketing Site
**Status**: 🟡 In Progress  
**Priority**: Medium

**Goal**: Complete marketing site/blog

**Scope**: `apps/marketing/` - content, blog posts, landing page

**Dependencies**: None

**Notes**: Structure exists, needs content

---

### Mission 12: Fill Blog Backlog
**Status**: 🔴 Pending  
**Priority**: Low

**Goal**: Create blog content for marketing site

**Scope**: Write blog posts, content strategy

**Dependencies**: Mission 11

---

## Mission Status Legend

- 🔴 **Pending** - Not started
- 🟡 **In Progress** - Currently working on
- 🟢 **Complete** - Finished

---

## Mission Dependencies

```
Mission 1 (Clear Issues)
├── Mission 3 (Test UI/Adapter Registry) depends on Mission 1
├── Mission 7 (Harden Project Resources) depends on Mission 1
└── Mission 9 (Dev/Build/Deploy Scripts) depends on Mission 1

Mission 11 (New Marketing Site)
└── Mission 12 (Fill Blog Backlog) depends on Mission 11
```

---

## Next Steps

1. **Start Mission 1** - Begin clearing GitHub issues
2. **Review Mission 11** - Continue marketing site work
3. **Plan Mission 2** - Prepare CLI implementation

---

**For detailed mission information, see `.stackdock-state.json` in the repository root.**
