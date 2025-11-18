---
title: Wire Pipeline Scripts to GitHub Actions CI
labels: priority:high,category:ci-cd,type:infrastructure
assignees: 
milestone: Phase 1 - Foundation
---

## Goal

Automate code quality checks, tests, and builds via GitHub Actions on every push and PR.

## Current State

- Pipeline scripts exist in `scripts/pipeline/`
- Scripts are functional but not automated
- `.github/workflows/pr-pipeline.yml` exists but only runs on PRs
- No CI workflow for main branch pushes

## Implementation Steps

1. Create `.github/workflows/ci.yml`
   - Trigger on push to main and PRs
   - Run lint/type-check job
   - Run test job
   - Run build job
   - Run security scan job (optional)

2. Set up job dependencies
   - Lint job runs first
   - Test job runs after lint (if lint passes)
   - Build job runs after tests (if tests pass)

3. Configure caching
   - Cache `node_modules` for faster runs
   - Cache Convex generated files if possible

4. Add status badges to README
   - Show CI status badge
   - Show test coverage badge (if added)

5. Test the workflow
   - Push a test commit
   - Verify all checks run
   - Fix any issues

## Files to Create

- `.github/workflows/ci.yml`

## Files to Update

- `README.md` (add CI badges)

## Success Criteria

- [ ] CI workflow runs on every push to main
- [ ] CI workflow runs on every PR
- [ ] All pipeline checks run successfully
- [ ] Status badges added to README
- [ ] Caching configured for faster runs

## Estimated Effort

2-3 hours

## Related

- Part of Critical Gaps Implementation Plan
- See: `docs/stand-downs/active/working/critical-gaps-implementation-plan.md`
- Related Gap: #4 - No CI/CD
- Note: `pr-pipeline.yml` already exists, but we need a full CI workflow
