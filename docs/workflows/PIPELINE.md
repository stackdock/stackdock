# Testing Pipeline Documentation

> **Location**: `docs/workflows/PIPELINE.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/PIPELINE.md`

## Overview

StackDock uses a local-first testing pipeline that runs comprehensive checks before code can be merged. The pipeline is seamless to developers and can optionally run in CI.

## Pipeline Location

**Main Script**: `scripts/pipeline/run-all-checks.sh`  
**Absolute Path**: `{REPO_ROOT}/scripts/pipeline/run-all-checks.sh`

## Pipeline Stages

### 1. Lint & Format Check

**Script**: `scripts/pipeline/lint-type-check.sh`  
**Absolute Path**: `{REPO_ROOT}/scripts/pipeline/lint-type-check.sh`

**Checks**:
- ESLint validation
- Prettier formatting
- Tailwind CSS class sorting

**Outputs**:
- Console: Errors with file paths
- Exit code: 0 (pass) or 1 (fail)

### 2. Type Check

**Script**: `scripts/pipeline/lint-type-check.sh` (includes type check)  
**Absolute Path**: `{REPO_ROOT}/scripts/pipeline/lint-type-check.sh`

**Checks**:
- TypeScript compilation (`tsc --noEmit`)
- Type errors across entire project

**Scopes**:
- `apps/web/` - Frontend TypeScript
- `convex/` - Backend TypeScript
- `packages/*/` - Shared packages

**Outputs**:
- Console: Type errors with file paths and line numbers
- Exit code: 0 (pass) or 1 (fail)

### 3. Unit Tests (Vitest)

**Script**: `scripts/pipeline/vitest-unit.sh`  
**Absolute Path**: `{REPO_ROOT}/scripts/pipeline/vitest-unit.sh`

**Framework**: Vitest (works seamlessly with Vite/TanStack Start)

**Test Locations**:
- `apps/web/src/**/*.test.ts` - Frontend unit tests
- `apps/web/src/**/*.test.tsx` - Frontend component tests
- `convex/**/*.test.ts` - Backend function tests

**Command**:
```bash
# From {REPO_ROOT}
cd apps/web && npm run test:unit
cd ../../
cd convex && npm run test:unit
```

**Outputs**:
- Console: Test results with file paths
- Coverage report (if configured)
- Exit code: 0 (pass) or 1 (fail)

### 4. E2E Tests (Playwright)

**Script**: `scripts/pipeline/playwright-e2e.sh`  
**Absolute Path**: `{REPO_ROOT}/scripts/pipeline/playwright-e2e.sh`

**Framework**: Playwright

**Test Location**: `apps/web/e2e/**/*.spec.ts`

**Command**:
```bash
# From {REPO_ROOT}
cd apps/web && npm run test:e2e
```

**Outputs**:
- Console: Test results
- Screenshots/videos on failure (in `apps/web/test-results/`)
- Exit code: 0 (pass) or 1 (fail)

### 5. Security Scan

**Script**: `scripts/pipeline/security-scan.sh`  
**Absolute Path**: `{REPO_ROOT}/scripts/pipeline/security-scan.sh`

**Checks**:
- `npm audit` - Dependency vulnerabilities
- Encryption usage validation
- RBAC enforcement checks
- API key exposure checks

**Outputs**:
- Console: Security findings with file paths
- Exit code: 0 (pass) or 1 (fail)

### 6. Build Verification

**Script**: `scripts/pipeline/build-verify.sh`  
**Absolute Path**: `{REPO_ROOT}/scripts/pipeline/build-verify.sh`

**Checks**:
- Production build succeeds (`npm run build`)
- Build artifacts created
- No build-time errors

**Output Location**: `apps/web/dist/`

**Outputs**:
- Console: Build status
- Exit code: 0 (pass) or 1 (fail)

### 7. Principle Engineer Reviews

**Automated checks** run as part of the pipeline, validating:
- Frontend patterns (shadcn, Tailwind, TanStack, XState)
- Backend patterns (Convex, SST)
- DevOps standards
- Security standards

## Running the Pipeline

### Local Execution

**From repository root** (`{REPO_ROOT}`):

```bash
# Ensure you're in the repo root
cd /path/to/stackdock

# Print current directory (for verification)
pwd

# Run all checks
./scripts/pipeline/run-all-checks.sh
```

**Expected Output**:
```
========================================
StackDock Pipeline: Running All Checks
========================================
Current Directory: /absolute/path/to/stackdock
Repo Root: /absolute/path/to/stackdock

[1/6] Lint & Format Check...
Working Directory: /absolute/path/to/stackdock
Checking: apps/web/src/**/*.{ts,tsx}
Checking: convex/**/*.ts
...
```

### Individual Stage Execution

Run individual stages:

```bash
# From {REPO_ROOT}
./scripts/pipeline/lint-type-check.sh
./scripts/pipeline/vitest-unit.sh
./scripts/pipeline/playwright-e2e.sh
./scripts/pipeline/security-scan.sh
./scripts/pipeline/build-verify.sh
```

## CI Integration (Scaffold)

**GitHub Actions**: `.github/workflows/pr-pipeline.yml`  
**Absolute Path**: `{REPO_ROOT}/.github/workflows/pr-pipeline.yml`

The CI workflow mirrors the local pipeline. It's ready but not required for development.

## Pipeline Output Format

Every script prints:

1. **Current Working Directory** (absolute path)
2. **Repo Root** (absolute path)
3. **Files Being Checked** (with paths)
4. **Test File Locations** (absolute paths)
5. **Output Locations** (absolute paths)
6. **Results** (pass/fail with details)

Example:
```
========================================
Lint & Format Check
========================================
Current Directory: /Users/dev/stackdock
Repo Root: /Users/dev/stackdock
Checking files in: /Users/dev/stackdock/apps/web/src
Found 45 files to check
✓ All files pass linting
✓ All files formatted correctly
========================================
```

## Exit Codes

- `0` - All checks passed
- `1` - One or more checks failed
- `2` - Script error (wrong directory, missing dependencies)

## Pre-commit Integration

**Optional**: Set up pre-commit hooks to run pipeline automatically.

**Location**: `.husky/pre-commit` (if using husky)  
**Absolute Path**: `{REPO_ROOT}/.husky/pre-commit`

Or use Git hooks directly:
**Location**: `.git/hooks/pre-commit`  
**Absolute Path**: `{REPO_ROOT}/.git/hooks/pre-commit`

## Troubleshooting

### Pipeline Fails - How to Debug

1. **Check current directory**:
   ```bash
   pwd
   # Must be: {REPO_ROOT}
   ```

2. **Run individual stages** to isolate the issue

3. **Check file paths** in error messages (all absolute)

4. **Verify dependencies**:
   ```bash
   npm install
   ```

## Quick Reference

**Pipeline Scripts Location**: `{REPO_ROOT}/scripts/pipeline/`

**Run All Checks**:
```bash
cd /path/to/stackdock && ./scripts/pipeline/run-all-checks.sh
```

**Check Script Permissions**:
```bash
ls -la scripts/pipeline/*.sh
```

---

**Remember**: The pipeline is seamless to developers. It just works. Paths are always explicit.
