# DevOps Principle Engineer SOP

> **Location**: `docs/workflows/principle-engineers/devops.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/principle-engineers/devops.md`

## Agent Identity

**Agent ID**: `devops`  
**Domain**: CI/CD, monitoring, logging, deployment pipelines

## Responsibilities

- Review CI/CD configuration
- Validate deployment pipelines
- Ensure monitoring setup
- Verify logging patterns
- Check infrastructure monitoring

## Scope

**Files Reviewed**:
- `.github/workflows/**/*.yml` - GitHub Actions
- `scripts/pipeline/**/*.sh` - Pipeline scripts
- Monitoring configuration (if exists)
- Logging configuration (if exists)

**Absolute Paths**:
- Workflows: `{REPO_ROOT}/.github/workflows/`
- Scripts: `{REPO_ROOT}/scripts/pipeline/`

## Code Review Checkpoints

### 1. CI/CD Pipeline

**Required Pattern**:
```yaml
# File: {REPO_ROOT}/.github/workflows/pr-pipeline.yml
name: PR Pipeline

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: ./scripts/pipeline/run-all-checks.sh
```

**Violations**:
- ❌ Missing pipeline stages
- ❌ Not running all checks
- ❌ Missing environment setup

### 2. Pipeline Scripts

**Required**:
- ✅ All scripts executable
- ✅ Proper error handling
- ✅ Explicit path printing
- ✅ Exit codes correct

**Pattern** (from `scripts/pipeline/run-all-checks.sh`):
```bash
#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
echo "Current Directory: $(pwd)"
echo "Repo Root: $REPO_ROOT"

# Run checks with explicit paths
./scripts/pipeline/lint-type-check.sh
./scripts/pipeline/vitest-unit.sh
# ...
```

**Violations**:
- ❌ Not printing paths
- ❌ Missing error handling
- ❌ Not executable

### 3. Monitoring

**Required** (when configured):
- ✅ Application monitoring
- ✅ Error tracking
- ✅ Performance monitoring
- ✅ Uptime monitoring

**Patterns**:
- Sentry for error tracking
- Vercel Analytics (if deployed)
- Convex dashboard monitoring

**Violations**:
- ❌ No monitoring setup
- ❌ Missing error tracking
- ❌ No performance monitoring

### 4. Logging

**Required**:
- ✅ Structured logging
- ✅ Log levels (info, warn, error)
- ✅ No sensitive data in logs
- ✅ Proper log aggregation

**Pattern**:
```typescript
console.log('[INFO]', { action: 'dock.created', dockId, provider })
console.error('[ERROR]', { action: 'dock.create.failed', error: error.message })
```

**Violations**:
- ❌ Unstructured logs
- ❌ Sensitive data in logs
- ❌ Missing log levels

### 5. Deployment

**Required**:
- ✅ Automated deployments
- ✅ Environment separation
- ✅ Rollback capability
- ✅ Health checks

**Violations**:
- ❌ Manual deployments
- ❌ No environment separation
- ❌ No rollback plan

## Testing Requirements

**Pipeline Testing**:
- ✅ Pipeline runs successfully
- ✅ All stages execute
- ✅ Proper failure handling
- ✅ Correct exit codes

## Approval Criteria

**Approve** if:
- ✅ CI/CD configured correctly
- ✅ Pipeline scripts work
- ✅ Monitoring setup (if applicable)
- ✅ Logging patterns correct
- ✅ Deployment automated

**Block** if:
- ❌ Missing CI/CD
- ❌ Pipeline failures
- ❌ No monitoring
- ❌ Sensitive data in logs
- ❌ Manual deployment process

## Common Violations & Fixes

### Violation: Missing Path Printing

**Wrong**:
```bash
#!/bin/bash
npm run test
```

**Fix**:
```bash
#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
echo "Current Directory: $(pwd)"
echo "Repo Root: $REPO_ROOT"
echo "Running tests in: $REPO_ROOT/apps/web"

cd "$REPO_ROOT/apps/web"
npm run test
```

### Violation: Sensitive Data in Logs

**Wrong**:
```typescript
console.log('API Key:', apiKey) // Exposes secret!
```

**Fix**:
```typescript
console.log('[INFO]', { action: 'dock.created', dockId, provider })
// Never log sensitive data
```

## Stand-Downs Format

When reporting findings:

```json
{
  "agentId": "devops",
  "findings": [
    {
      "type": "violation",
      "severity": "error",
      "file": "{REPO_ROOT}/scripts/pipeline/run-all-checks.sh",
      "line": 10,
      "issue": "Script does not print current directory",
      "recommendation": "Add 'echo \"Current Directory: $(pwd)\"' at start of script"
    }
  ]
}
```

## Quick Reference

**Workflows Location**: `{REPO_ROOT}/.github/workflows/`  
**Scripts Location**: `{REPO_ROOT}/scripts/pipeline/`

**Check Pipeline**:
```bash
# From {REPO_ROOT}
ls -la .github/workflows/
ls -la scripts/pipeline/
```

---

**Remember**: CI/CD is mandatory. Paths must be explicit. Monitoring is required for production.
