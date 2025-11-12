# Open Missions & Tasks

**Last Updated**: November 12, 2025

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

### Mission 7: Read-Only Infrastructure MVP
**Status**: 📋 **PLANNED** - Next Mission  
**Priority**: High  
**Dependencies**: Mission 6 checkpoint complete ✅

**Summary**: 
- Database providers: Turso, Neon, Convex
- IaaS providers: Vultr, DO, AWS, GCP, Azure
- Monitoring: Sentry (alerts)
- Auth schema finalized

**Goal**: Solo developer can see all billable accounts/resources in one interface

**Why Next**: 
- Mission 6 checkpoint complete ✅
- Ready to build out read-only infrastructure MVP
- Focus: Solo developer workflow first

---

### Mission 8: Projects Feature (Linear + GitHub)
**Status**: 📋 **PLANNED** - After Mission 7  
**Priority**: High  
**Dependencies**: Mission 7 checkpoint complete

**Summary**: 
- Linear adapter (read-only)
- GitHub adapter (read-only)
- Resource linking (projects → resources)
- Project-level organization

**Goal**: Organize resources by project (solo developer workflow)

---

### Mission 9: Insights Board
**Status**: 📋 **PLANNED** - After Mission 8  
**Priority**: Medium  
**Dependencies**: Mission 8 checkpoint complete

**Summary**: 
- Data visualization
- Aggregated dashboards
- Analytics from collected data

**Goal**: Solo developer can see all data in one place

---

### Mission 10: RBAC Hardening & Refinement
**Status**: 📋 **PLANNED** - After Mission 9  
**Priority**: Medium  
**Dependencies**: Mission 9 checkpoint complete (solo developer MVP first)

**Summary**: 
- RBAC improvements
- Permission refinement
- Security hardening
- Teams + roles activation

**Goal**: Multi-user support (deferred until after solo developer MVP)

---

### Mission 11: Dynamic Routes
**Status**: 📋 **PLANNED** - After Mission 10 (Last Priority)  
**Priority**: Low  
**Dependencies**: Mission 10 checkpoint complete

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

**Currently Empty** - Mission 6 checkpoint complete, Mission 7 ready to start

---

## ✅ COMPLETED (See `working/completed/`)

- GridPane Pagination ✅
- Backup System (Database + Frontend) ✅
- Backup Frontend Agent Guide ✅
- Navigation Cleanup ✅ (Mission 6 checkpoint complete)

---

**Note**: Open missions are available for work but not currently prioritized. Check `working/in-progress/` for active work.
