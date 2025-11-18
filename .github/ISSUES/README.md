# Local Issue Files

This directory contains markdown files that will be automatically synced to GitHub Issues when pushed to the `main` branch.

## Format

Each issue file must follow this format:

```markdown
---
title: Issue Title
labels: label1,label2,label3
assignees: username (optional, leave empty if none)
milestone: milestone-name (optional)
---

Issue body content here...
```

## Workflow

1. Create issue file in this directory (`.md` extension)
2. Commit and push to `main` branch
3. GitHub Action will automatically create the issue
4. After verification, you can delete the local file

## Testing

The issue sync workflow runs automatically when you push to `main`. To test locally, you can run the sync script directly:

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_token_here

# Run sync script directly
node .github/scripts/sync-issues.js
```

Or on Windows PowerShell:

```powershell
# Set your GitHub token
$env:GITHUB_TOKEN = "your_token_here"

# Run sync script directly
node .github/scripts/sync-issues.js
```

## Notes

- Issues are deduplicated by title (won't create duplicates)
- Labels must exist in GitHub or they'll be ignored
- Assignees must have access to the repo
- Milestones must exist or will be ignored
