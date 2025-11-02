# Stand-Downs System

> **Location**: `stand-downs/README.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/README.md`  
> **Last Updated**: January 12, 2025

## Overview

Stand-downs are the communication system between principle engineer agents and the Captain. All agents report findings, recommendations, and approval status in a single JSON file.

**Current Status**: Active system used for Mission 1, 2, and 2.5. Mission 2.5 (SST Core Refactoring) completed January 12, 2025. See `stand-downs/system-state.json` for current mission status.

## Stand-Downs File

**File**: `stand-downs/agent-sessions.json`  
**Absolute Path**: `{REPO_ROOT}/stand-downs/agent-sessions.json`

This is a **SINGLE FILE** containing all agent session reports. Agents update their sessions in this file. Do not create separate files per agent.

## File Structure

The stand-downs file contains an array of agent session reports. Each agent has one session per PR/branch being reviewed.

```json
{
  "sessions": [
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
  ]
}
```

## How Agents Use Stand-Downs

1. **Agent starts review** - Creates or updates their session in `agent-sessions.json`
2. **Agent adds findings** - Documents violations, suggestions, approvals
3. **Agent completes review** - Sets approval status (approved/blocked/pending)
4. **Captain reviews** - Reads stand-downs and makes final decision

## Important Rules

1. **SINGLE FILE** - All agents report to `agent-sessions.json`
2. **Absolute paths** - All file paths must be absolute
3. **One session per agent per PR** - Update existing, don't duplicate
4. **Captain decides** - Agents recommend, Captain approves

## Quick Reference

**Stand-Downs File**: `{REPO_ROOT}/stand-downs/agent-sessions.json`

**View Stand-Downs**:
```bash
# From {REPO_ROOT}
cat stand-downs/agent-sessions.json
```

**Check Specific Agent**:
```bash
# From {REPO_ROOT}
cat stand-downs/agent-sessions.json | jq '.sessions[] | select(.agentId == "security")'
```

**Template**: See `stand-downs/template.json` for session format.

## Agent IDs

- `frontend-shadcn`
- `frontend-tailwind-v4`
- `frontend-tanstack`
- `frontend-xstate`
- `backend-convex`
- `backend-sst`
- `devops`
- `security`

## See Also

- [STAND_DOWNS.md](../docs/workflows/STAND_DOWNS.md) - Detailed process documentation
- [AGENT_SYSTEM.md](../docs/workflows/AGENT_SYSTEM.md) - How agents work

---

**Remember**: Stand-downs are democratic input. Agents report. Captain decides. Failure does not exist.
