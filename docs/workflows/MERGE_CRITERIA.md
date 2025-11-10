# Merge Criteria

> **Location**: `docs/workflows/MERGE_CRITERIA.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/MERGE_CRITERIA.md`

## Overview

**ALL** criteria must pass before code can be merged. No exceptions. Standards will be followed.

## Required Checks

### 1. Local Pipeline Passes

**Script**: `scripts/pipeline/run-all-checks.sh`  
**Absolute Path**: `{REPO_ROOT}/scripts/pipeline/run-all-checks.sh`

**Must Pass**:
- ✅ Lint & Format Check
- ✅ Type Check
- ✅ Unit Tests (Vitest)
- ✅ E2E Tests (Playwright)
- ✅ Security Scan
- ✅ Build Verification

**Command**:
```bash
# From {REPO_ROOT}
./scripts/pipeline/run-all-checks.sh
```

**Exit Code**: Must be `0`

### 2. All Principle Engineer Reviews Approved

**Stand-Downs File**: `stand-downs/agents/agent-sessions.json`  
**Absolute Path**: `{REPO_ROOT}/stand-downs/agents/agent-sessions.json`

**All Agents Must Approve**:
- ✅ `frontend-shadcn` - `approved`
- ✅ `frontend-tailwind-v4` - `approved`
- ✅ `frontend-tanstack` - `approved`
- ✅ `frontend-xstate` - `approved`
- ✅ `backend-convex` - `approved`
- ✅ `backend-sst` - `approved`
- ✅ `devops` - `approved`
- ✅ `security` - `approved`

**Check Command**:
```bash
# From {REPO_ROOT}
cat stand-downs/agent-sessions.json | jq '.sessions[] | select(.approval != "approved")'
# Must return empty array
```

### 3. Stand-Downs Updated

**File**: `stand-downs/agents/agent-sessions.json`

**Required**:
- ✅ All agents have submitted stand-downs
- ✅ All findings documented with absolute file paths
- ✅ All blockers resolved or documented

### 4. No Security Vulnerabilities

**Security Scan**: `scripts/pipeline/security-scan.sh`

**Must Pass**:
- ✅ `npm audit` - No high/critical vulnerabilities
- ✅ Encryption checks - All API keys encrypted
- ✅ RBAC checks - All mutations/queries have RBAC
- ✅ No exposed secrets in code

### 5. Build Succeeds

**Build Verification**: `scripts/pipeline/build-verify.sh`

**Must Pass**:
- ✅ Production build completes without errors
- ✅ Build artifacts created in `apps/web/dist/`
- ✅ No build-time warnings (if configured)

### 6. Tests Pass

**Unit Tests**: `scripts/pipeline/vitest-unit.sh`  
**E2E Tests**: `scripts/pipeline/playwright-e2e.sh`

**Must Pass**:
- ✅ All unit tests pass
- ✅ All E2E tests pass
- ✅ No flaky tests
- ✅ Coverage meets thresholds (if configured)

### 7. Documentation Updated

**Required Documentation**:
- ✅ Code changes documented (if needed)
- ✅ API changes documented (if needed)
- ✅ Breaking changes documented (if applicable)
- ✅ Principle engineer SOPs followed

## Merge Checklist

Before merging, verify:

```bash
# From {REPO_ROOT}
# 1. Run pipeline
./scripts/pipeline/run-all-checks.sh
# Exit code must be 0

# 2. Check stand-downs
cat stand-downs/agent-sessions.json | jq '.sessions[] | {agentId, approval}'
# All must show "approved"

# 3. Check for blockers
cat stand-downs/agent-sessions.json | jq '.sessions[] | select(.blockers | length > 0)'
# Must return empty array

# 4. Verify security
npm audit
# No high/critical vulnerabilities

# 5. Verify build
cd apps/web && npm run build
# Must succeed

# 6. Verify tests
cd apps/web && npm run test:unit && npm run test:e2e
# All must pass
```

## Blocked Merges

A merge is **BLOCKED** if:

- ❌ Pipeline fails (any stage)
- ❌ Any agent approval is `blocked`
- ❌ Security vulnerabilities exist
- ❌ Tests fail
- ❌ Build fails
- ❌ Documentation missing (if required)

## Quick Reference

**Run Full Checklist**:
```bash
cd /path/to/stackdock
./scripts/pipeline/run-all-checks.sh && \
cat stand-downs/agent-sessions.json | jq '.sessions[] | select(.approval != "approved")' | wc -l
# Second command must return 0
```

**Check Specific Criterion**:
```bash
# Check pipeline
./scripts/pipeline/run-all-checks.sh
echo "Exit code: $?"

# Check approvals
cat stand-downs/agent-sessions.json | jq '.sessions[] | .approval'

# Check blockers
cat stand-downs/agent-sessions.json | jq '.sessions[] | .blockers'
```

## Exception Process

**There are no exceptions.**

If a check fails:
1. Fix the issue
2. Re-run the pipeline
3. Update stand-downs
4. Get agent re-approval

**Failure does not exist in this project.** Problems get solved.

---

**Remember**: All checks must pass. No exceptions. Standards will be followed.
