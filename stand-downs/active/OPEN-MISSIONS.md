# Open Missions & Tasks

**Last Updated**: January 12, 2025

Missions and tasks that are open but not actively being worked on.

---

## ⏸️ DEFERRED MISSIONS

### Mission 5: DNS Records UI Enhancements
**Status**: ⏸️ Deferred  
**Priority**: Low  
**Location**: `stand-downs/working/in-progress/mission-5-dns-records-sheet-refactor.md`

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

### Mission 5: DigitalOcean Adapter
**Status**: 📋 Open (Not Started)  
**Priority**: Medium  
**Dependencies**: After cleanup complete

**Summary**: 
- Next provider adapter to implement
- IaaS provider (servers)
- Will follow Vercel/Netlify/Cloudflare pattern

**Why Not Started**: 
- User wants to clean up first (top-level nav concerns)
- Will lay out final MVP adapters after cleanup

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

- **Mission 3**: GridPane Domains Dashboard Display (HIGH PRIORITY)
- DNS Records Sheet Refactor (deferred, but file still in in-progress)

---

## ✅ COMPLETED (See `working/completed/`)

- GridPane Pagination
- Backup System (Database + Frontend) - GridPane read-only working
- Backup Frontend Agent Guide

---

## 🧹 CLEANUP PRIORITIES

**Before Adding More Adapters**:
1. Fix GridPane domains dashboard display (HIGH)
2. Clean up top-level navigation (User Priority)
3. User will lay out final MVP adapters after cleanup

---

**Note**: Open missions are available for work but not currently prioritized. Check `working/in-progress/` for active work.
