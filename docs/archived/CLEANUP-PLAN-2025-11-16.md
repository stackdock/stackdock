# StackDock Repository Cleanup Plan
**Date**: November 16, 2025  
**Project Start**: October 22, 2025  
**Goal**: Clean up documentation and state tracking without breaking functionality

---

## Phase 0: Pre-Cleanup Verification (CRITICAL - DO FIRST)

### 0.1 Verify What's Actually Working
**Purpose**: Establish baseline before cleanup

**Checklist**:
- [ ] **Sync Functionality**: Verify 13 providers can sync (test at least 2-3)
  - [ ] GridPane sync works
  - [ ] GitHub sync works  
  - [ ] Vercel sync works
- [ ] **Code Table**: Verify `/dashboard/projects/code` displays repositories
  - [ ] Page loads without errors
  - [ ] Repositories table displays data
  - [ ] Queries `repositories` table (not `projects` table)
- [ ] **Projects System**: Verify StackDock projects work
  - [ ] `/dashboard/projects/view` displays projects
  - [ ] `/dashboard/projects/new` creates projects
  - [ ] `/dashboard/projects/$projectSlug` displays project detail
  - [ ] Link/unlink resources works
- [ ] **Universal Tables**: Verify data displays
  - [ ] Servers table shows data
  - [ ] Web Services table shows data
  - [ ] Domains table shows data
  - [ ] Databases table shows data
- [ ] **Security**: Verify RBAC and encryption
  - [ ] RBAC checks working (test permission denied)
  - [ ] API keys encrypted in database
  - [ ] No API keys exposed to client

**Documentation**: Create `CLEANUP-BASELINE-2025-11-16.md` with verification results

---

## Phase 1: State File Consolidation (HIGH PRIORITY)

### 1.1 Update `.stackdock-state.json` with Current Reality
**Purpose**: Single source of truth

**Current State** (to document):
- Project started: October 22, 2025
- Current date: November 16, 2025
- 13 providers integrated and syncing
- Read-only MVP functional
- Projects feature implemented (organizational, separate from repositories)
- Code table working (queries repositories table)
- RBAC, encryption, audit logging functional

**Update Checklist**:
- [ ] Update `lastUpdated` to `"2025-11-16T00:00:00Z"`
- [ ] Update `setup.services.convex` with current deployment
- [ ] Update `setup.services.clerk` with current keys
- [ ] Add `missions.mission-7` status (Projects & Monitoring phase)
- [ ] Document 13 providers in `setup.providers` array
- [ ] Update `completedSteps` with verified completions
- [ ] Update `nextSteps` with actual next priorities
- [ ] Clear `blockers[]` if none exist (or document actual blockers)
- [ ] Add note: "Projects feature implemented Nov 16 - organizational feature, separate from repositories table"

**File**: `.stackdock-state.json`

### 1.2 Archive Old State Files
**Purpose**: Remove duplicates, preserve history

**Checklist**:
- [ ] Move `stand-downs/system-state.json` → `stand-downs/archived/system-state-2025-01-11.json`
- [ ] Move `stand-downs/archived/mission-2-state.json` → `stand-downs/archived/mission-2-state-2025-01-12.json` (already archived, just rename)
- [ ] Verify `.stackdock-state.json` is the ONLY active state file

**Result**: Only `.stackdock-state.json` remains as active state file

---

## Phase 2: Hall of Shame File Cleanup (ACCOUNTABILITY LAYER)

### 2.1 Merge Duplicate Hall of Shame Files
**Purpose**: Fix accountability layer

**Checklist**:
- [ ] Read `how HEADAI-HALL-OF-SHAME.md` completely
- [ ] Identify any unique content not in `AI-HALL-OF-SHAME.md`
- [ ] Merge unique content into `AI-HALL-OF-SHAME.md` (if any)
- [ ] Add entry for Nov 16: "Projects feature implementation cascaded failures - fixed by restoring repositories table architecture"
- [ ] Update last entry date to November 16, 2025
- [ ] Delete `how HEADAI-HALL-OF-SHAME.md` (encoding issues, duplicate)

**File**: `AI-HALL-OF-SHAME.md` (root directory - MUST STAY IN ROOT)

---

## Phase 3: Documentation Consolidation (ORGANIZE OR ARCHIVE)

### 3.1 Create Single STATUS.md File
**Purpose**: Consolidate MVP_STATUS.md + NEXT_STEPS.md

**New File**: `STATUS.md` (root directory)

**Structure**:
```markdown
# StackDock Status
**Last Updated**: November 16, 2025
**Project Start**: October 22, 2025

## Current State
- What's working (verified)
- What's in progress
- What's next

## MVP Progress
- Core Platform: 100%
- Provider Integration: 100% (13 providers)
- Projects Feature: 60% (UI complete, backend complete)
- Monitoring Feature: 0%

## Next Steps
- Immediate priorities
- Medium priorities
- Future work
```

**Checklist**:
- [ ] Create `STATUS.md` consolidating MVP_STATUS.md + NEXT_STEPS.md
- [ ] Fix all dates to November 16, 2025
- [ ] Remove duplicate information
- [ ] Archive `MVP_STATUS.md` → `docs/archived/MVP_STATUS-2025-11-16.md`
- [ ] Archive `NEXT_STEPS.md` → `docs/archived/NEXT_STEPS-2025-11-16.md`

### 3.2 Organize Stand-Downs Documentation
**Purpose**: Clear structure for mission tracking

**Current Structure** (keep):
- `stand-downs/active/` - Open missions, reference docs
- `stand-downs/working/` - Active work
- `stand-downs/archived/` - Historical completed work
- `stand-downs/agents/` - Agent session logs

**Cleanup Checklist**:
- [ ] Review `stand-downs/ORGANIZATION-SUMMARY.md` - Archive if redundant
- [ ] Review `stand-downs/SUCCESS-LOG.md` - Keep if useful, archive if redundant
- [ ] Update `stand-downs/working/MISSION-STATUS.md` dates to Nov 16, 2025
- [ ] Consolidate duplicate mission docs in `stand-downs/archived/`
- [ ] Create `stand-downs/UNKNOWN/` folder for files needing review
- [ ] Move any unclear/unorganized docs to `stand-downs/UNKNOWN/` for later review

### 3.3 Fix Date Inconsistencies Across All Docs
**Purpose**: Accurate timeline

**Files to Update**:
- [ ] `README.md` - Update "Last Updated" to November 16, 2025
- [ ] `STATUS.md` - Set to November 16, 2025
- [ ] `stand-downs/working/MISSION-STATUS.md` - Update to November 16, 2025
- [ ] `stand-downs/SUCCESS-LOG.md` - Update dates
- [ ] `stand-downs/ORGANIZATION-SUMMARY.md` - Update dates
- [ ] `docs/architecture/ARCHITECTURE.md` - Update if has "Last Updated"
- [ ] Remove all references to "January 2025" (incorrect dates)
- [ ] Remove all references to "November 12, 2025" unless actually accurate

---

## Phase 4: Route File Cleanup (FIX DUPLICATE ROUTES)

### 4.1 Identify Correct Project Route Pattern
**Purpose**: Fix duplicate/conflicting route files

**Current Situation**:
- `apps/web/src/routes/dashboard/projects/[projectId]/index.tsx` - Uses literal "projectId" (WRONG)
- `apps/web/src/routes/dashboard/projects/$projectId/` - Multiple files
- `apps/web/src/routes/dashboard/projects/$projectSlug/` - Multiple files

**Investigation Checklist**:
- [ ] Check which route pattern is actually working (`$projectSlug` vs `$projectId`)
- [ ] Verify `convex/projects/queries.ts` has `getProjectBySlug` (it does)
- [ ] Check which route files are actually being used
- [ ] Identify duplicate/conflicting routes

**Fix Checklist**:
- [ ] Delete `apps/web/src/routes/dashboard/projects/[projectId]/index.tsx` (wrong pattern)
- [ ] Keep `apps/web/src/routes/dashboard/projects/$projectSlug/` (correct pattern)
- [ ] Delete `apps/web/src/routes/dashboard/projects/$projectId/` if duplicate
- [ ] Verify all project routes use `$projectSlug` consistently
- [ ] Test navigation: `/dashboard/projects/new` → `/dashboard/projects/$projectSlug`

**Files to Check**:
- `apps/web/src/routes/dashboard/projects/$projectSlug/index.tsx` (should exist)
- `apps/web/src/routes/dashboard/projects/$projectId/` (should be deleted if duplicate)

---

## Phase 5: Documentation Organization (CONSOLIDATE OR ARCHIVE)

### 5.1 Root Directory Cleanup
**Purpose**: Clean root, organized structure

**Files to Keep in Root**:
- `README.md` - Project overview
- `STATUS.md` - Current status (NEW)
- `AI-HALL-OF-SHAME.md` - Accountability layer (MUST STAY IN ROOT)
- `.stackdock-state.json` - State file (MUST STAY IN ROOT)
- `.cursorrules` - AI rules
- `package.json`, `LICENSE`, etc. - Standard files

**Files to Archive**:
- [ ] `MVP_STATUS.md` → `docs/archived/MVP_STATUS-2025-11-16.md`
- [ ] `NEXT_STEPS.md` → `docs/archived/NEXT_STEPS-2025-11-16.md`
- [ ] `operation-bitskrieg.md` → `docs/archived/operation-bitskrieg-2025-11-16.md` (if exists)

**Files to Delete**:
- [ ] `how HEADAI-HALL-OF-SHAME.md` - Duplicate, encoding issues

### 5.2 Create Unknown/Review Folder
**Purpose**: Temporary holding for unclear docs

**Checklist**:
- [ ] Create `docs/UNKNOWN-FOR-REVIEW/` folder
- [ ] Move any docs that don't clearly fit anywhere
- [ ] Add `README.md` in folder explaining: "Files moved here for review. Purpose unclear. Review and organize or delete."
- [ ] Document what was moved and why

### 5.3 Update README.md
**Purpose**: Accurate project overview

**Checklist**:
- [ ] Update "Last Updated" to November 16, 2025
- [ ] Fix project start date (October 22, 2025)
- [ ] Verify all provider counts are accurate (13 providers)
- [ ] Update status sections to match reality
- [ ] Remove outdated information
- [ ] Add reference to `STATUS.md` for current status

---

## Phase 6: Verification (CRITICAL - DO AFTER CLEANUP)

### 6.1 Verify Functionality Still Works
**Purpose**: Ensure cleanup didn't break anything

**Checklist**:
- [ ] Sync still works (test 2-3 providers)
- [ ] Code table still displays repositories
- [ ] Projects system still works (create, view, link resources)
- [ ] Universal tables still display data
- [ ] RBAC still works (test permission denied)
- [ ] Navigation still works (all routes accessible)

### 6.2 Verify Documentation Accuracy
**Purpose**: Ensure docs match reality

**Checklist**:
- [ ] `.stackdock-state.json` reflects current reality
- [ ] `STATUS.md` is accurate
- [ ] `README.md` is accurate
- [ ] All dates are November 16, 2025 or earlier (no future dates)
- [ ] No conflicting information between docs

### 6.3 Verify Context Preservation
**Purpose**: Ensure no context lost

**Checklist**:
- [ ] All important information preserved in `STATUS.md` or `README.md`
- [ ] Archived files maintain history
- [ ] State file has complete current state
- [ ] Hall of Shame has all failures documented

---

## Phase 7: Final Organization

### 7.1 Create Cleanup Summary Document
**Purpose**: Document what was done

**File**: `CLEANUP-2025-11-16.md` (root directory)

**Content**:
- What was cleaned up
- What was archived
- What was deleted
- What was consolidated
- Verification results
- Current state summary

### 7.2 Update .cursorrules Reference
**Purpose**: Ensure rules reference correct files

**Checklist**:
- [ ] Verify `.cursorrules` references `.stackdock-state.json` correctly
- [ ] Verify `.cursorrules` references `AI-HALL-OF-SHAME.md` correctly
- [ ] Update any outdated file references

---

## Execution Order (CRITICAL)

1. Phase 0: Pre-Cleanup Verification (MUST DO FIRST)
2. Phase 1: State File Consolidation
3. Phase 2: Hall of Shame Cleanup
4. Phase 4: Route File Cleanup (fix broken routes)
5. Phase 3: Documentation Consolidation
6. Phase 5: Documentation Organization
7. Phase 6: Verification (MUST DO AFTER CLEANUP)
8. Phase 7: Final Organization

---

## Success Criteria

**Cleanup is successful when**:
- [ ] Only ONE state file exists (`.stackdock-state.json`)
- [ ] Only ONE Hall of Shame file exists (`AI-HALL-OF-SHAME.md`)
- [ ] Only ONE status file exists (`STATUS.md`)
- [ ] All dates are accurate (November 16, 2025 or earlier)
- [ ] All functionality still works (verified)
- [ ] No duplicate/conflicting route files
- [ ] Documentation is organized (consolidated or archived)
- [ ] Context is preserved (nothing important lost)

---

## Risk Mitigation

**Before starting**:
- [ ] Git commit current state (safety checkpoint)
- [ ] Document current working state (Phase 0)
- [ ] Create backup of critical files

**During cleanup**:
- [ ] Test after each phase
- [ ] Don't delete anything without archiving first
- [ ] Verify functionality after route cleanup (Phase 4)

**After cleanup**:
- [ ] Full verification (Phase 6)
- [ ] Git commit cleanup changes
- [ ] Document cleanup in `CLEANUP-2025-11-16.md`
