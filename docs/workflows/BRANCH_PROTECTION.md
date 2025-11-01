# GitHub Branch Protection Configuration

> **Location**: `docs/workflows/BRANCH_PROTECTION.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/BRANCH_PROTECTION.md`

## Mission 2: Repo Lockdown for Best Development Workflow

**Core Principle**: Main branch is sacred - owner holds the only key

**Balance**: Protection + Owner productivity. Main is sacred but owner needs speed.

## Configuration Overview

Branch protection rules protect the `main` branch while allowing the repository owner to work rapidly without friction.

### Key Configuration

- **Protected Branch**: `main`
- **Owner Bypass**: Enabled (owner can push directly)
- **Others**: Must use Pull Requests with review/approval
- **Status Checks**: Required on all PRs

## Step-by-Step Configuration

### 1. Navigate to Branch Protection Settings

1. Go to GitHub repository: `https://github.com/stackdock/stackdock`
2. Click **Settings** tab
3. Click **Branches** in left sidebar
4. Under **Branch protection rules**, click **Add rule** or edit existing rule for `main`

### 2. Branch Protection Rule Configuration

**Branch name pattern**: `main`

#### Required Settings

- ✅ **Require pull request reviews before merging**
  - Required approving reviews: `1`
  - Dismiss stale pull request approvals when new commits are pushed: ✅ Enabled
  - Require review from Code Owners: Optional (can enable later)

- ✅ **Require status checks to pass before merging**
  - Required status checks:
    - `lint-type-check` (or `pipeline:lint`)
    - `vitest-unit` (or `pipeline:test`)
    - `playwright-e2e` (or `pipeline:e2e`)
    - `security-scan` (or `pipeline:security`)
    - `build-verify` (or `pipeline:build`)
  - Require branches to be up to date before merging: ✅ Enabled

- ✅ **Include administrators** (CRITICAL: Owner bypass)
  - This allows the repository owner to bypass all protection rules
  - Owner can push directly to `main`
  - Owner can merge without PR reviews
  - Owner can bypass status checks

#### Optional Settings

- ✅ **Restrict pushes that create matching branches**
  - Prevents others from creating branches named `main`

- ❌ **Do not allow bypassing the above settings**
  - **MUST BE DISABLED** to allow owner bypass
  - If enabled, even owner cannot bypass protection

- ✅ **Require conversation resolution before merging**
  - Optional: Can enable to require all PR comments to be resolved

- ✅ **Require linear history**
  - Optional: Can enable to prevent merge commits

### 3. Save Configuration

Click **Create** or **Save changes** to apply the branch protection rule.

## Verification Steps

### Test 1: Owner Direct Push (Should Work)

```bash
# Owner should be able to push directly to main
git checkout main
git pull origin main
# Make a small change
echo "# Test" >> test.md
git add test.md
git commit -m "Test: Owner direct push"
git push origin main  # Should succeed (bypass works)
```

### Test 2: Non-Owner Direct Push (Should Fail)

```bash
# Non-owner trying to push directly should fail
git checkout main
git pull origin main
# Make a change
echo "# Test" >> test.md
git add test.md
git commit -m "Test: Non-owner direct push"
git push origin main  # Should fail with protection error
```

Expected error: `remote: error: GH006: Protected branch update failed for refs/heads/main.`

### Test 3: Non-Owner PR (Should Require Review)

1. Non-owner creates feature branch
2. Makes changes
3. Creates PR to `main`
4. PR should show:
   - ✅ Requires review
   - ✅ Requires status checks to pass
   - ✅ Cannot merge until checks pass and review approved

## Owner Workflow

**Owner can**:
- Push directly to `main` (bypass protection)
- Merge PRs without waiting for reviews
- Skip status checks if needed
- Work at rapid pace without friction

**Owner workflow**:
```bash
# Direct push (works)
git checkout main
git pull origin main
# Make changes
git add .
git commit -m "Owner rapid development"
git push origin main  # ✅ Works (bypass enabled)
```

## Contributor Workflow

**Contributors must**:
- Create feature branches
- Use Pull Requests
- Get PR review/approval
- Wait for status checks to pass
- Cannot push directly to `main`

**Contributor workflow**:
```bash
# Feature branch (required)
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "Add feature"
git push origin feature/my-feature

# Create PR via GitHub UI
# Wait for review and status checks
# Merge when approved
```

## Status Checks Configuration

Status checks run automatically via `.github/workflows/pr-pipeline.yml`:

- **Lint & Type Check**: `npm run pipeline:lint`
- **Unit Tests**: `npm run pipeline:test`
- **E2E Tests**: `npm run pipeline:e2e`
- **Security Scan**: `npm run pipeline:security`
- **Build Verification**: `npm run pipeline:build`

All checks must pass before PR can be merged (except owner bypass).

## Troubleshooting

### Owner Cannot Push Directly

**Problem**: Owner bypass not working

**Solution**:
1. Verify "Include administrators" is enabled in branch protection settings
2. Verify "Do not allow bypassing" is **disabled**
3. Verify user is repository owner/admin
4. Check GitHub repository permissions

### Status Checks Not Running

**Problem**: PR status checks not appearing

**Solution**:
1. Verify `.github/workflows/pr-pipeline.yml` exists
2. Verify workflow triggers on `pull_request` events
3. Check GitHub Actions tab for workflow runs
4. Ensure workflow file syntax is correct

### Too Restrictive

**Problem**: Want to allow more direct pushes

**Solution**:
- Owner can always bypass (if configured correctly)
- Can adjust required approvals (reduce from 1 to 0)
- Can disable status check requirements
- Can add specific users/teams to bypass list

## Security Considerations

- Owner bypass is intentional for rapid development
- Main branch is protected from accidental pushes
- PRs require review and approval
- All code changes go through status checks
- Owner can always adjust settings if needed

## Related Documentation

- [WORKFLOW.md](./WORKFLOW.md) - Development workflow
- [MERGE_CRITERIA.md](./MERGE_CRITERIA.md) - Merge requirements
- [CONTRIBUTING.md](../guides/CONTRIBUTING.md) - Contributor guide

---

**Remember**: Main branch is sacred - owner holds the only key. Protection for others, speed for owner.
