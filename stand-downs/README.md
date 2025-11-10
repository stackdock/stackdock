# Stand-Downs System

> **Location**: `stand-downs/README.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/README.md`  
> **Last Updated**: January 11, 2025

## Overview

Stand-downs are the communication system between principle engineer agents and the Captain. All agents report findings, recommendations, and approval status in a single JSON file.

**Current Status**: Active system used for Mission 1, 2, 2.5, 3, and 4. See `stand-downs/system-state.json` for current mission status.

## Folder Structure

```
stand-downs/
├── active/              # Current active missions
│   ├── mission-4-execution-plan.md
│   ├── mission-4-frontend-agent-prompt.md
│   ├── mission-4-frontend-audit-completion.md
│   ├── mission-4-frontend-table-review.md
│   └── mission-5-provider-integration-strategy.md
├── archived/            # Completed missions and historical docs
│   ├── mission-1-completion-log.json
│   ├── mission-2-state.json
│   ├── mission-2.5-execution-plan.md
│   ├── mission-3-backend-convex-brief.md
│   ├── mission-3-progress-summary.md
│   └── ...
├── blockers/           # Blocker documentation
│   ├── blocker-resolution-summary.md
│   └── blocker-typescript-errors-mission-3.md
├── agents/             # Agent session logs
│   └── agent-sessions.json
├── templates/          # Template files
│   └── template.json
├── system-state.json   # Current project state (source of truth)
└── README.md           # This file
```

## Stand-Downs File Structure

**Location**: `stand-downs/agents/`  
**Absolute Path**: `{REPO_ROOT}/stand-downs/agents/`

Agent sessions are organized by mission. Each mission folder contains agent-specific JSON files:
- `stand-downs/agents/{mission}/{agentId}.json`

**Legacy File**: `stand-downs/agents/agent-sessions.json` (being migrated to mission-based structure)

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

1. **Agent starts review** - Creates or updates their session in `agents/agent-sessions.json`
2. **Agent adds findings** - Documents violations, suggestions, approvals
3. **Agent completes review** - Sets approval status (approved/blocked/pending)
4. **Captain reviews** - Reads stand-downs and makes final decision

## Important Rules

1. **MISSION-BASED STRUCTURE** - Agents report to `agents/{mission}/{agentId}.json`
2. **Absolute paths** - All file paths must be absolute
3. **One session per agent per PR** - Update existing, don't duplicate
4. **Captain decides** - Agents recommend, Captain approves
5. **SYNC REQUIRED** - Always sync blockers/progress with `system-state.json` (see `agents/SYNC_GUIDE.md`)

## Quick Reference

**Stand-Downs File**: `{REPO_ROOT}/stand-downs/agents/agent-sessions.json`

**System State**: `{REPO_ROOT}/stand-downs/system-state.json`

**View Stand-Downs for Mission**:
```bash
# From {REPO_ROOT}
ls stand-downs/agents/mission-4/
cat stand-downs/agents/mission-4/backend-convex.json | jq .
```

**Check Specific Agent**:
```bash
# From {REPO_ROOT}
cat stand-downs/agents/mission-4/backend-convex.json | jq '.sessions[]'
```

**View Mission Index**:
```bash
# From {REPO_ROOT}
cat stand-downs/agents/index.json | jq .
```

**Template**: See `stand-downs/templates/template.json` for session format.

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

- [agents/README.md](agents/README.md) - Agent sessions directory structure
- [agents/SYNC_GUIDE.md](agents/SYNC_GUIDE.md) - Sync with system-state.json
- [STAND_DOWNS.md](../docs/workflows/STAND_DOWNS.md) - Detailed process documentation
- [AGENT_SYSTEM.md](../docs/workflows/AGENT_SYSTEM.md) - How agents work

---

**Remember**: Stand-downs are democratic input. Agents report. Captain decides. Failure does not exist.
