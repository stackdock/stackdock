# Open Missions & Tasks

**Last Updated**: November 14, 2025

Missions and tasks that are open but not actively being worked on.

---

## ⏸️ DEFERRED MISSIONS

### Mission 5: DNS Records UI Enhancements
**Status**: ⏸️ Deferred  
**Priority**: Low  
**Location**: `stand-downs/active/mission-5-dns-records-sheet-refactor.md`

**Summary**: 
- Sheet transition complete ✅
- UI enhancements (copy-to-clipboard, search/filter, etc.) deferred
- Can wait - not blocking other work

**Why Deferred**: 
- Sheet refactor complete and functional
- Enhancements are nice-to-have
- Focus on core functionality first

---

### Mission 5: Backups Page Refactor
**Status**: ⏸️ Deferred  
**Priority**: Low  
**Location**: `stand-downs/active/mission-5-backups-page-refactor-frontend-guide.md`

**Summary**: 
- Refactor Operations > Backups page to be provider-agnostic
- Add provider badges to tables
- Fix missing data in backup schedules table
- Guide exists with full implementation plan

**Why Deferred**: 
- Backup system is functional for GridPane read-only
- Good enough for now
- Can be improved later when more providers added

---

## 📋 OPEN MISSIONS

### Storage and Buckets Implementation
**Status**: 📋 **PLANNED** - Ready for Implementation  
**Priority**: High  
**Dependencies**: None

**Summary**: 
- Implement storage resource tables for block volumes (Vultr blocks + DigitalOcean volumes) and object storage buckets (Linode buckets)
- Follows universal table pattern established for servers, webServices, domains, databases
- Requires both Convex backend agent and Frontend agent

**Agents**:
- **Convex Agent**: `stand-downs/active/storage-buckets-convex-agent-prompt.md`
- **Frontend Agent**: `stand-downs/active/storage-buckets-frontend-agent-prompt.md`

**Plan**: `docs/plans/STORAGE_AND_BUCKETS_IMPLEMENTATION.md`

**Goal**: Display block volumes and buckets in Storage page under Infrastructure

**Why Now**: 
- Storage page scaffolded but empty
- JSON response files available for all three providers
- Pattern well-established (universal tables)
- Straightforward implementation following existing patterns

---

### Mission 7: Read-Only Infrastructure MVP
**Status**: 🔄 **IN PROGRESS** - Phase 3 Next  
**Priority**: High  
**Dependencies**: Mission 6 checkpoint complete ✅

**Summary**: 
- ✅ Phase 1: Database providers (Turso, Neon, Convex, PlanetScale) - COMPLETE
- ✅ Phase 2: Simple auth IaaS providers (Vultr, DO, Linode) - COMPLETE
- 🔄 Phase 3: Projects & Monitoring providers (GitHub ✅, Linear - NEXT, Sentry) - IN PROGRESS
- 📋 Phase 4: Complex auth IaaS providers (AWS, GCP, Azure) - AFTER Phase 3
- Auth schema finalized (multi-field credentials pattern)

**Goal**: Solo developer can see all billable accounts/resources in one interface

**Why Phase 3 Next**: 
- Builds Projects and Monitoring pages with real data
- Keeps momentum on simple API key auth
- Establishes UI patterns before complex auth
- Separates complex auth into its own phase

---

### Mission 8: Insights Board
**Status**: 📋 **PLANNED** - After Mission 7  
**Priority**: Medium  
**Dependencies**: Mission 7 checkpoint complete

**Summary**: 
- Data visualization
- Aggregated dashboards
- Analytics from collected data

**Goal**: Solo developer can see all data in one place

---

### Mission 9: RBAC Hardening & Refinement
**Status**: 📋 **PLANNED** - After Mission 8  
**Priority**: Medium  
**Dependencies**: Mission 8 checkpoint complete (solo developer MVP first)

**Summary**: 
- RBAC improvements
- Permission refinement
- Security hardening
- Teams + roles activation

**Goal**: Multi-user support (deferred until after solo developer MVP)

---

### Mission 10: Dynamic Routes
**Status**: 📋 **PLANNED** - After Mission 9 (Last Priority)  
**Priority**: Low  
**Dependencies**: Mission 9 checkpoint complete

**Summary**: 
- Resource detail pages
- Breadcrumb navigation
- Detail page patterns

**Goal**: Polish - detail views for resources

---

## 📚 REFERENCE DOCUMENTS

These documents are available for reference but don't represent active work:

### Strategy & Planning
- `mission-5-provider-integration-strategy.md` - Main strategy document
- `mission-5-status.md` - Consolidated Mission 5 status

### Technical References
- `mission-5-refactor-adapter-pattern.md` - Adapter pattern reference
- `mission-5-gridpane-backup-api-implementation.md` - Backup API reference
- `mission-5-frontend-dynamic-providers-guide.md` - Dynamic providers guide

### User Guides
- `mission-5-dns-records-viewing-guide.md` - How to view DNS records

---

## 🔄 IN PROGRESS (See `working/in-progress/`)

**Mission 7 Phase 3**: GitHub ✅, Linear + Sentry adapters (Projects & Monitoring providers) - NEXT

---

## ✅ COMPLETED (See `working/completed/`)

- GridPane Pagination ✅
- Backup System (Database + Frontend) ✅
- Backup Frontend Agent Guide ✅
- Navigation Cleanup ✅ (Mission 6 checkpoint complete)

---

**Note**: Open missions are available for work but not currently prioritized. Check `working/in-progress/` for active work.
