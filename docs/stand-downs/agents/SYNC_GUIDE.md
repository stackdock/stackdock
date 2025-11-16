# Stand-Downs ↔ System-State Sync Guide

> **Location**: `stand-downs/agents/SYNC_GUIDE.md`  
> **Absolute Path**: `{REPO_ROOT}/stand-downs/agents/SYNC_GUIDE.md`  
> **Last Updated**: January 11, 2025

## Overview

This guide explains how to keep `stand-downs/agents/` and `stand-downs/system-state.json` synchronized. Since we're using Cursor and agents (not automation scripts), this is a manual sync process that agents should follow.

## Sync Rules

### 1. When Agent Reports a Blocker

**Agent Action** (in `stand-downs/agents/{mission}/agent-sessions.json`):
```json
{
  "agentId": "backend-convex",
  "approval": "blocked",
  "blockers": [
    "TypeScript errors preventing Convex dev server from starting"
  ],
  "findings": [
    {
      "type": "violation",
      "severity": "error",
      "issue": "TypeScript compilation errors"
    }
  ]
}
```

**Required Sync** (update `stand-downs/system-state.json`):
```json
{
  "blockers": [
    {
      "id": "blocker-typescript-errors",
      "title": "TypeScript Errors Blocking Convex Dev Server",
      "status": "active",
      "priority": "critical",
      "mission": "mission-3",
      "assignedAgent": "backend-convex",
      "reportedAt": "2025-01-11T17:00:00Z",
      "documentation": "stand-downs/agents/mission-3/backend-convex.json"
    }
  ]
}
```

**Steps**:
1. Agent reports blocker in mission-specific file
2. Agent (or Captain) updates `system-state.json` blockers array
3. Add blocker with unique ID, mission reference, assigned agent

---

### 2. When Blocker is Resolved

**Agent Action** (in `stand-downs/agents/{mission}/agent-sessions.json`):
```json
{
  "agentId": "backend-convex",
  "approval": "approved",
  "blockers": [],
  "findings": [
    {
      "type": "violation",
      "severity": "error",
      "issue": "TypeScript compilation errors",
      "fixed": true
    }
  ]
}
```

**Required Sync** (update `stand-downs/system-state.json`):
```json
{
  "blockers": [
    {
      "id": "blocker-typescript-errors",
      "status": "resolved",
      "resolvedAt": "2025-01-11T18:00:00Z",
      "resolution": "All TypeScript errors fixed. Convex dev server starts successfully."
    }
  ]
}
```

**Steps**:
1. Agent marks blocker as resolved in mission file
2. Update `system-state.json` blocker status to "resolved"
3. Add `resolvedAt` timestamp and `resolution` description

---

### 3. When Mission Completes

**Agent Action** (all agents approve):
```json
// stand-downs/agents/mission-3/backend-convex.json
{
  "approval": "approved",
  "status": "completed"
}

// stand-downs/agents/mission-3/frontend-shadcn.json
{
  "approval": "approved",
  "status": "completed"
}
```

**Required Sync** (update `stand-downs/system-state.json`):
```json
{
  "activeMissions": [
    // Remove mission-3 from activeMissions
  ],
  "completedMissions": [
    {
      "id": "mission-3",
      "title": "Fix GridPane Auth & Data Tables",
      "completedAt": "2025-01-11T20:00:00Z",
      "verifiedBy": ["backend-convex", "frontend-shadcn"]
    }
  ]
}
```

**Steps**:
1. All agents approve mission
2. Move mission from `activeMissions` to `completedMissions`
3. Add completion timestamp
4. List verifying agents

---

### 4. When Mission Progress Updates

**Agent Action** (agent reports progress):
```json
{
  "agentId": "backend-convex",
  "mission": "mission-4",
  "status": "completed",
  "progress": {
    "step": "provider-integration",
    "completion": 50
  }
}
```

**Required Sync** (update `stand-downs/system-state.json`):
```json
{
  "activeMissions": [
    {
      "id": "mission-4",
      "progress": {
        "stepsCompleted": [
          "provider-integration-started"
        ],
        "currentStep": "provider-integration",
        "completion": 50
      }
    }
  ]
}
```

**Steps**:
1. Agent reports progress in mission file
2. Update `system-state.json` mission progress
3. Add completed steps to `stepsCompleted` array
4. Update `currentStep` and `completion` percentage

---

## Sync Checklist

When updating agent sessions, always check:

- [ ] **Blockers**: If agent reports blocker → add to `system-state.json` blockers array
- [ ] **Resolutions**: If blocker resolved → update blocker status in `system-state.json`
- [ ] **Mission Status**: If all agents approve → move mission to `completedMissions`
- [ ] **Progress**: If agent reports progress → update mission progress in `system-state.json`
- [ ] **Timestamps**: Always include ISO 8601 timestamps
- [ ] **References**: Link blocker/mission docs with absolute paths

---

## File Structure

```
stand-downs/
├── agents/
│   ├── mission-1/
│   │   ├── frontend-shadcn.json
│   │   ├── backend-convex.json
│   │   └── ...
│   ├── mission-2/
│   │   └── ...
│   ├── mission-3/
│   │   └── ...
│   ├── mission-4/
│   │   └── ...
│   ├── index.json          # Aggregated view (optional)
│   └── SYNC_GUIDE.md       # This file
└── system-state.json       # Source of truth for project state
```

---

## Quick Reference

**Add Blocker**:
1. Agent reports in `stand-downs/agents/{mission}/{agent}.json`
2. Add to `stand-downs/system-state.json` → `blockers[]`

**Resolve Blocker**:
1. Agent marks fixed in mission file
2. Update `system-state.json` → `blockers[].status = "resolved"`

**Complete Mission**:
1. All agents approve
2. Move from `activeMissions` → `completedMissions` in `system-state.json`

**Update Progress**:
1. Agent reports step completion
2. Update `system-state.json` → `activeMissions[].progress`

---

**Remember**: `system-state.json` is the source of truth for project state. Agent sessions are the detailed audit trail. Keep them synchronized.
