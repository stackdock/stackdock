# Agent Sessions Directory

> **Location**: `stand-downs/agents/README.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/agents/README.md`  
> **Last Updated**: January 11, 2025

## Structure

Agent sessions are now organized by mission. Each mission folder contains agent-specific JSON files.

```
stand-downs/agents/
├── mission-1/              # Completed missions
│   ├── frontend-shadcn.json
│   ├── backend-convex.json
│   └── ...
├── mission-2/
│   └── ...
├── mission-2.5/
│   └── ...
├── mission-3/              # Active missions
│   ├── backend-convex.json
│   └── ...
├── mission-4/
│   ├── frontend-agents.json
│   └── ...
├── mission-frontend-tables/
│   └── ...
├── agent-sessions.json     # Legacy file (being migrated)
├── agent-sessions.json.backup  # Backup of original
├── index.json              # Mission index
├── SYNC_GUIDE.md          # Sync with system-state.json
└── README.md               # This file
```

## File Format

Each agent file (`{mission}/{agentId}.json`) contains:

```json
{
  "sessions": [
    {
      "agentId": "backend-convex",
      "timestamp": "2025-01-11T20:00:00Z",
      "prNumber": "mission-3",
      "branch": "main",
      "status": "completed",
      "mission": "mission-3",
      "findings": [],
      "approval": "approved",
      "blockers": [],
      "recommendations": []
    }
  ]
}
```

## Migration Status

**Legacy File**: `agent-sessions.json` (5,360+ lines)  
**Status**: Being migrated to mission-based structure  
**Backup**: `agent-sessions.json.backup`

New agent sessions should be created in mission-specific folders:
- `stand-downs/agents/{mission}/{agentId}.json`

## Syncing with System State

See `SYNC_GUIDE.md` for instructions on keeping agent sessions synchronized with `stand-downs/system-state.json`.

**Key Sync Points**:
1. **Blockers**: When agent reports blocker → update `system-state.json`
2. **Resolutions**: When blocker resolved → update `system-state.json`
3. **Mission Completion**: When all agents approve → move to `completedMissions`
4. **Progress**: When agent reports progress → update mission progress

## Benefits of Mission-Based Structure

1. **Scalability**: No single massive file
2. **Organization**: Easy to find mission-specific sessions
3. **Performance**: Faster to load specific mission data
4. **Maintainability**: Clear separation of concerns
5. **History**: Completed missions can be archived easily

## Quick Reference

**Find agent sessions for a mission**:
```bash
ls stand-downs/agents/mission-4/
```

**View specific agent's sessions**:
```bash
cat stand-downs/agents/mission-4/backend-convex.json | jq .
```

**Check all missions**:
```bash
cat stand-downs/agents/index.json | jq .
```

---

**Remember**: Always sync blockers and mission status with `stand-downs/system-state.json`. See `SYNC_GUIDE.md` for details.
