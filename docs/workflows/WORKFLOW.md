# StackDock Development Workflow

> **Location**: `docs/workflows/WORKFLOW.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/WORKFLOW.md`

## Branch Protection

**Core Principle**: Main branch is sacred - owner holds the only key.

The `main` branch is protected via GitHub branch protection rules. This ensures code quality while maintaining owner productivity.

### Owner Workflow

**Repository owner can**:
- Push directly to `main` (bypass protection enabled)
- Merge PRs without waiting for reviews
- Work at rapid pace without friction

### Contributor Workflow

**Contributors must**:
- Create feature branches
- Use Pull Requests
- Get PR review/approval (minimum 1 approval)
- Wait for status checks to pass
- Cannot push directly to `main`

### Branch Protection Configuration

See [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md) for complete configuration guide.

**Key Settings**:
- ✅ Require pull request reviews (1 approval minimum)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators (owner bypass enabled)
- ✅ Restrict pushes to matching branches
- ❌ Do not allow bypassing (disabled - allows owner bypass)

### Status Checks

All PRs must pass these checks before merging:
1. Lint & Type Check (`pipeline:lint`)
2. Unit Tests (`pipeline:test`)
3. E2E Tests (`pipeline:e2e`)
4. Security Scan (`pipeline:security`)
5. Build Verification (`pipeline:build`)

Status checks run automatically via `.github/workflows/pr-pipeline.yml`.

**Note**: Owner can bypass status checks (bypass protection enabled).

## Agent Stand-Downs

After each review cycle, agents report findings via stand-downs:

**Location**: `stand-downs/agents/agent-sessions.json`  
**Absolute Path**: `{REPO_ROOT}/stand-downs/agents/agent-sessions.json`

See [STAND_DOWNS.md](./STAND_DOWNS.md) for detailed process.

## Merge Criteria

**ALL** of the following must pass before merge:

1. ✅ Local pipeline passes (`scripts/pipeline/run-all-checks.sh`)
2. ✅ All principle engineer reviews approved
3. ✅ Stand-downs updated with agent findings
4. ✅ No security vulnerabilities
5. ✅ Build succeeds
6. ✅ Tests pass (unit + E2E)
7. ✅ Documentation updated

See [MERGE_CRITERIA.md](./MERGE_CRITERIA.md) for complete checklist.

## Quick Reference

**Run local checks**:
```bash
# Current directory must be: {REPO_ROOT}
cd /path/to/stackdock
./scripts/pipeline/run-all-checks.sh
```

**Check stand-downs**:
```bash
# Current directory must be: {REPO_ROOT}
cat stand-downs/agents/agent-sessions.json
```

**View principle engineer docs**:
```bash
# Current directory must be: {REPO_ROOT}
ls docs/workflows/principle-engineers/
```

---

**Remember**: Standards will be followed. No exception. There is a solution to every problem.
