# StackDock Development Workflow

> **Location**: `docs/workflows/WORKFLOW.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/WORKFLOW.md`

 consecutive failures or a blocker that requires manual intervention.

## Agent Stand-Downs

After each review cycle, agents report findings via stand-downs:

**Location**: `stand-downs/agent-sessions.json`  
**Absolute Path**: `{REPO_ROOT}/stand-downs/agent-sessions.json`

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
cat stand-downs/agent-sessions.json
```

**View principle engineer docs**:
```bash
# Current directory must be: {REPO_ROOT}
ls docs/workflows/principle-engineers/
```

---

**Remember**: Standards will be followed. No exception. There is a solution to every problem.
