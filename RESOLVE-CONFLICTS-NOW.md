# RESOLVE CONFLICTS NOW

## The Problem
Build errors show conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) in:
- `convex/docks/actions.ts:667`
- `convex/docks/adapters/sentry/adapter.ts:146`
- `convex/docks/adapters/sentry/api.ts:78, 233, 309, 382`
- `convex/docks/mutations.ts:284`
- `convex/monitoring/queries.ts:152, 162`

But the files on disk don't show conflict markers - they're in git's index (staged).

## Solution: Run This PowerShell Script

I've created `fix-merge-conflicts.ps1` - run it:

```powershell
.\fix-merge-conflicts.ps1
```

## OR Manual Steps

### Option 1: Accept Our Version (Keep Your Changes)
```powershell
git checkout --ours convex/docks/actions.ts
git checkout --ours convex/docks/adapters/sentry/adapter.ts
git checkout --ours convex/docks/adapters/sentry/api.ts
git checkout --ours convex/docks/mutations.ts
git checkout --ours convex/monitoring/queries.ts

git add -A
git commit -m "Merge main: resolve conflicts"
```

### Option 2: Abort Merge (Start Over)
```powershell
git merge --abort
git reset --hard HEAD
git clean -fd
```

## What The Script Does

1. Checks out conflicted files from HEAD (your branch)
2. Stages them
3. Removes alerts.tsx
4. Completes the merge
5. Verifies clean state

## After Running

Your build should work. The conflict markers will be gone from git's index.
