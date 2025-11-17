# PowerShell script to resolve merge conflicts
# Run this in PowerShell from the repo root

Write-Host "=== Resolving Merge Conflicts ===" -ForegroundColor Cyan

# Step 1: Check current state
Write-Host "`nStep 1: Checking git state..." -ForegroundColor Yellow
git status --short

# Step 2: Remove conflict markers from git index
Write-Host "`nStep 2: Checking out files from HEAD to clear conflicts..." -ForegroundColor Yellow

# Checkout conflicted files from our branch (HEAD)
git checkout --ours convex/docks/actions.ts
git checkout --ours convex/docks/adapters/sentry/adapter.ts
git checkout --ours convex/docks/adapters/sentry/api.ts
git checkout --ours convex/docks/mutations.ts
git checkout --ours convex/monitoring/queries.ts

# Step 3: Stage resolved files
Write-Host "`nStep 3: Staging resolved files..." -ForegroundColor Yellow
git add convex/docks/actions.ts
git add convex/docks/adapters/sentry/adapter.ts
git add convex/docks/adapters/sentry/api.ts
git add convex/docks/mutations.ts
git add convex/monitoring/queries.ts

# Step 4: Remove alerts.tsx if it exists
Write-Host "`nStep 4: Removing alerts.tsx..." -ForegroundColor Yellow
if (Test-Path "apps/web/src/routes/dashboard/monitoring/alerts.tsx") {
    git rm apps/web/src/routes/dashboard/monitoring/alerts.tsx
} else {
    Write-Host "  alerts.tsx already removed" -ForegroundColor Green
}

# Step 5: Stage all other changes
Write-Host "`nStep 5: Staging all changes..." -ForegroundColor Yellow
git add -A

# Step 6: Complete merge
Write-Host "`nStep 6: Completing merge..." -ForegroundColor Yellow
git commit -m "Merge main: resolve conflicts, keep Issues page and Sentry fixes"

# Step 7: Verify
Write-Host "`nStep 7: Verifying clean state..." -ForegroundColor Yellow
git status

Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "If conflicts remain, run: git merge --abort" -ForegroundColor Yellow
