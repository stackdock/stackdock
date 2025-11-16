# Stand-Downs System

> **Location**: `docs/workflows/STAND_DOWNS.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/STAND_DOWNS.md`

## Overview

Stand-downs are the communication system between principle engineer agents and the Captain. All agents report findings, recommendations, and approval status in a single JSON file.

## Stand-Downs File Location

**File**: `stand-downs/agents/agent-sessions.json`  
**Absolute Path**: `{REPO_ROOT}/stand-downs/agents/agent-sessions.json`

## File Structure

The stand-downs file contains an array of agent session reports:

```json
{
  "sessions": [
    {
      "agentId": "frontend-shadcn",
      "timestamp": "2024-01-15T10:30:00Z",
      "prNumber": "123",
      "branch": "feature/new-component",
      "status": "reviewing",
      "findings": [
        {
          "type": "violation",
          "severity": "error",
          "file": "/absolute/path/to/stackdock/apps/web/src/components/ui/button.tsx",
          "line": 45,
          "issue": "Component does not follow shadcn/ui patterns",
          "recommendation": "Use cn() utility for className merging",
          "fixed": false
        }
      ],
      "approval": "blocked",
      "blockers": [
        "Component API does not match shadcn/ui standards"
      ],
      "recommendations": [
        "Add variant prop",
        "Use forwardRef pattern"
      ]
    }
  ]
}
```

## Agent Session Format

Each agent session contains:

- **agentId** (string): Agent identifier
  - `frontend-shadcn`
  - `frontend-tailwind-v4`
  - `frontend-tanstack`
  - `frontend-xstate`
  - `backend-convex`
  - `backend-sst`
  - `devops`
  - `security`

- **timestamp** (ISO 8601): When the review was performed

- **prNumber** (string|number): Pull request number or branch name

- **branch** (string): Git branch being reviewed

- **status** (string): Current status
  - `reviewing` - Agent is reviewing
  - `completed` - Review complete
  - `waiting` - Waiting on fixes

- **findings** (array): List of findings
  - `type`: `violation` | `suggestion` | `approval`
  - `severity`: `error` | `warning` | `info`
  - `file`: **Absolute path** to file
  - `line`: Line number (if applicable)
  - `issue`: Description of the issue
  - `recommendation`: How to fix
  - `fixed`: Boolean indicating if fixed

- **approval** (string): Approval status
  - `approved` - Agent approves
  - `blocked` - Agent blocks merge
  - `pending` - Waiting for review

- **blockers** (array): List of blocking issues

- **recommendations** (array): General recommendations

## How Agents Use Stand-Downs

### 1. Starting a Review

When an agent begins reviewing:

```json
{
  "agentId": "frontend-shadcn",
  "timestamp": "2024-01-15T10:30:00Z",
  "prNumber": "123",
  "branch": "feature/new-component",
  "status": "reviewing",
  "findings": [],
  "approval": "pending",
  "blockers": [],
  "recommendations": []
}
```

### 2. Adding Findings

As the agent reviews, findings are added:

```json
{
  "findings": [
    {
      "type": "violation",
      "severity": "error",
      "file": "/absolute/path/to/stackdock/apps/web/src/components/ui/button.tsx",
      "line": 45,
      "issue": "Missing variant prop",
      "recommendation": "Add variant prop with default, destructive, outline, secondary, ghost, link",
      "fixed": false
    }
  ]
}
```

### 3. Completing Review

After review, agent updates status:

```json
{
  "status": "completed",
  "approval": "blocked",
  "blockers": [
    "Component missing required props",
    "Tests not covering all variants"
  ]
}
```

### 4. After Fixes

When fixes are applied, agent re-reviews:

```json
{
  "status": "reviewing",
  "findings": [
    {
      "type": "violation",
      "severity": "error",
      "file": "/absolute/path/to/stackdock/apps/web/src/components/ui/button.tsx",
      "line": 45,
      "issue": "Missing variant prop",
      "recommendation": "Add variant prop",
      "fixed": true  // Updated after fix
    }
  ],
  "approval": "approved",
  "blockers": []
}
```

## Captain Review Process

1. **Captain reads stand-downs**:
   ```bash
   # From {REPO_ROOT}
   cat stand-downs/agent-sessions.json
   ```

2. **Reviews all agent findings**

3. **Makes final decision**:
   - Approve merge (all agents approved)
   - Request fixes (blockers exist)
   - Request clarification (unclear findings)

4. **Democratic input**: Agents provide recommendations, Captain decides

## File Management

### Reading Stand-Downs

```bash
# From {REPO_ROOT}
cat stand-downs/agent-sessions.json | jq .
```

### Finding Agent Session

```bash
# From {REPO_ROOT}
cat stand-downs/agent-sessions.json | jq '.sessions[] | select(.agentId == "frontend-shadcn")'
```

### Checking Approval Status

```bash
# From {REPO_ROOT}
cat stand-downs/agent-sessions.json | jq '.sessions[] | {agentId, approval}'
```

## Template

See `stand-downs/templates/template.json` for a template agent session.

**Location**: `stand-downs/templates/template.json`  
**Absolute Path**: `{REPO_ROOT}/stand-downs/templates/template.json`

## Important Rules

1. **All file paths must be absolute** - No relative paths
2. **Timestamps must be ISO 8601** - Machine-readable
3. **One session per agent per PR** - Update existing, don't duplicate
4. **Captain makes final decision** - Agents recommend, Captain decides

## Quick Reference

**Stand-Downs File**: `{REPO_ROOT}/stand-downs/agent-sessions.json`

**View Stand-Downs**:
```bash
cd /path/to/stackdock
cat stand-downs/agent-sessions.json
```

**Check Specific Agent**:
```bash
cd /path/to/stackdock
cat stand-downs/agent-sessions.json | jq '.sessions[] | select(.agentId == "security")'
```

---

**Remember**: Stand-downs are the democratic input system. Agents report. Captain decides. Failure does not exist.
