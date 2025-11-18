# Testing Issue Sync

## Quick Test (Single Issue)

We're testing with **one issue first** before doing the full dump.

### Test Issue File

**File**: `.github/ISSUES/test-extract-universal-types.md`

This is a test issue that will be created on GitHub when pushed.

### Testing Steps

#### Option 1: Test Locally (Recommended First)

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Set GitHub token** (create one at https://github.com/settings/tokens):
   ```bash
   export GITHUB_TOKEN=your_token_here
   ```
   
   Or use inline:
   ```bash
   GITHUB_TOKEN=your_token_here npm run test:sync-issues
   ```

3. **Run local test**:
   ```bash
   npm run test:sync-issues
   ```
   
   This will:
   - Read the test issue file
   - Check if it already exists on GitHub
   - Create it if it doesn't exist
   - Show success/error messages

#### Option 2: Test via GitHub Actions

1. **Commit and push**:
   ```bash
   git add .github/ISSUES/test-extract-universal-types.md
   git add .github/workflows/sync-issues.yml
   git add .github/scripts/sync-issues.js
   git add package.json
   git commit -m "Add issue sync workflow and test issue"
   git push origin main
   ```

2. **Check GitHub Actions**:
   - Go to: https://github.com/stackdock/stackdock/actions
   - Find "Sync Local Issues to GitHub" workflow
   - Check if it ran successfully

3. **Verify issue created**:
   - Go to: https://github.com/stackdock/stackdock/issues
   - Look for "Extract Universal Types to packages/shared/src/schema.ts"

### What to Check

- ✅ Issue was created with correct title
- ✅ Labels were applied (if they exist in GitHub)
- ✅ Milestone was assigned (if it exists in GitHub)
- ✅ Body content is correct
- ✅ No duplicate issues created

### If Test Fails

1. **Check GitHub token permissions**:
   - Token needs `repo` scope
   - Or `public_repo` if repo is public

2. **Check labels exist**:
   - Labels must exist in GitHub before they can be applied
   - Go to: https://github.com/stackdock/stackdock/labels

3. **Check milestone exists**:
   - Milestone "Phase 1 - Foundation" must exist
   - Go to: https://github.com/stackdock/stackdock/milestones

4. **Check script output**:
   - Look for error messages in console
   - Check GitHub Actions logs

### After Successful Test

Once the test issue is created successfully:

1. ✅ Verify it looks correct on GitHub
2. ✅ Delete the test issue file locally (or keep for reference)
3. ✅ Create remaining issue files one by one
4. ✅ Push each one individually to verify

### Next Steps

After first successful sync:

1. Create remaining 7 issue files (one at a time)
2. Push each individually
3. Verify each is created correctly
4. Once all are created, you can delete local files
