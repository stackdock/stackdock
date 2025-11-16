# Stand-Downs System

> **Location**: `stand-downs/README.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/README.md`  
> **Last Updated**: November 12, 2025

## Overview

Stand-downs are the communication system between principle engineer agents and the Captain. All agents report findings, recommendations, and approval status in a single JSON file.

**Current Status**: Active system used for Mission 1-6. See `stand-downs/working/MISSION-STATUS.md` for current mission status.

## Folder Structure

```
stand-downs/
├── active/              # Open missions & reference docs (not actively worked on)
│   ├── OPEN-MISSIONS.md     # List of open/deferred missions (Mission 7-11)
│   └── [reference docs]     # Strategy, guides, technical references
├── working/             # Active work
│   ├── completed/       # ✅ Recently completed & tested
│   ├── in-progress/     # 🔄 Currently being worked on (empty - ready for Mission 7)
│   └── MISSION-STATUS.md    # Detailed mission breakdown (source of truth)
├── archived/            # Historical completed work
│   ├── mission-3-completed/  # GridPane integration (blockers archived here)
│   ├── mission-4-completed/  # Frontend tables
│   ├── mission-5-completed/  # Multi-provider integration
│   └── mission-6-completed/  # Navigation cleanup
├── agents/              # Agent session logs
│   ├── templates/       # Template files
│   └── [mission folders] # Mission-based agent reports
├── CHECKPOINT-*.md      # ✅ Checkpoint documents (success milestones)
├── SUCCESS-LOG.md       # 🏆 Success hall of fame (rapid progress)
├── OVERARCHING-GOALS.md # 🎯 Big picture vision & end goals
├── ORGANIZATION-SUMMARY.md # Organization guide
├── DOCS-ASSESSMENT-2025-11-12.md # Structure assessment
└── README.md            # This file
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
