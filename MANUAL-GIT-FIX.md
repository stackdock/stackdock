# Manual Git Fix - Commands You Can Run

## Current State (From .git Files)

**Merge in progress:**
- MERGE_HEAD exists - merge is active
- MERGE_MSG shows conflicts in:
  - `apps/web/src/routeTree.gen.ts`
  - `apps/web/src/routes/dashboard/monitoring/alerts.tsx` (already deleted)

## Step-by-Step Fix

### Step 1: Check Current State
Run these commands in your terminal (PowerShell):

```powershell
# Set pager to cat to avoid pagers
$env:GIT_PAGER = 'cat'

# Check status
git status

# Check what's staged
git diff --cached --name-only

# Check what's unstaged
git diff --name-only
```

### Step 2: Resolve Conflicts

**If alerts.tsx still exists:**
```powershell
git rm apps/web/src/routes/dashboard/monitoring/alerts.tsx
```

**If routeTree.gen.ts has conflicts:**
- Open the file
- Look for `<<<<<<<`, `=======`, `>>>>>>>` markers
- Remove conflict markers and keep the correct version
- Save the file

### Step 3: Stage All Resolved Files

```powershell
git add -A
```

### Step 4: Complete the Merge

```powershell
git commit -m "Merge main: resolve conflicts, keep Issues page"
```

### Step 5: Verify Clean State

```powershell
git status
# Should show: "nothing to commit, working tree clean"
```

## Alternative: Abort Merge and Start Fresh

If you want to abort the merge completely:

```powershell
git merge --abort
git reset --hard HEAD
git clean -fd
```

**WARNING**: This will lose all uncommitted changes!

## What I Found

- ✅ `alerts.tsx` is already deleted
- ✅ `routeTree.gen.ts` appears clean (no conflict markers found)
- ✅ Only 3 monitoring routes exist: `issues.tsx`, `logs.tsx`, `uptime.tsx`

**The merge is likely ready to complete - just need to stage and commit.**
