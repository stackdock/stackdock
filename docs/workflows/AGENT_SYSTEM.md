# Principle Engineer Agent System

> **Location**: `docs/workflows/AGENT_SYSTEM.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/AGENT_SYSTEM.md`

## Overview

StackDock uses a principle engineer agent system where specialized agents review code according to their domain expertise. All agents report to the Captain (project owner) via stand-downs.

## Principle Engineers

### Frontend Agents

1. **shadcn/ui Principle Engineer**
   - **Doc**: `docs/workflows/principle-engineers/frontend-shadcn.md`
   - **Scope**: Component patterns, shadcn/ui integration, component API design

2. **Tailwind CSS 4 Principle Engineer**
   - **Doc**: `docs/workflows/principle-engineers/frontend-tailwind-v4.md`
   - **Scope**: Styling, Tailwind classes, responsive design, theme consistency

3. **TanStack Principle Engineer**
   - **Doc**: `docs/workflows/principle-engineers/frontend-tanstack.md`
   - **Scope**: TanStack Start, TanStack Router, routing patterns, SSR

4. **XState Principle Engineer**
   - **Doc**: `docs/workflows/principle-engineers/frontend-xstate.md`
   - **Scope**: State machines, workflow orchestration, complex UI states

### Backend Agents

5. **Convex DB Principle Engineer**
   - **Doc**: `docs/workflows/principle-engineers/backend-convex.md`
   - **Scope**: Database schema, queries, mutations, real-time patterns

6. **SST.dev Principle Engineer**
   - **Doc**: `docs/workflows/principle-engineers/backend-sst.md`
   - **Scope**: Infrastructure as code, deployment, AWS resources

### Platform Agents

7. **DevOps Principle Engineer**
   - **Doc**: `docs/workflows/principle-engineers/devops.md`
   - **Scope**: CI/CD, monitoring, logging, deployment pipelines

8. **Security Principle Engineer**
   - **Doc**: `docs/workflows/principle-engineers/security.md`
   - **Scope**: Encryption, RBAC, API security, vulnerability scanning

## How Agents Work

### 1. Code Review Process

When code is submitted for review:

1. **Local Pipeline Runs** (`scripts/pipeline/run-all-checks.sh`)
   - All automated checks execute
   - Results printed with explicit paths

2. **Principle Engineers Review**
   - Each agent checks their domain
   - Reviews against their SOP document
   - Validates automated checks passed

3. **Stand-Downs Report**
   - Agents report findings to `stand-downs/agent-sessions.json`
   - Captain reviews all stand-downs
   - Democratic input, Captain decides

### 2. Agent Responsibilities

Each principle engineer:

- **Reviews** code changes in their domain
- **Validates** automated pipeline checks
- **Documents** findings in stand-downs
- **Recommends** fixes or improvements
- **Approves** or **Blocks** based on criteria

### 3. Stand-Downs Location

**File**: `stand-downs/agent-sessions.json`  
**Absolute Path**: `{REPO_ROOT}/stand-downs/agent-sessions.json`

See [STAND_DOWNS.md](./STAND_DOWNS.md) for format and process.

## Agent Identification

Agents identify themselves in stand-downs:

- `frontend-shadcn`
- `frontend-tailwind-v4`
- `frontend-tanstack`
- `frontend-xstate`
- `backend-convex`
- `backend-sst`
- `devops`
- `security`

## Violation Handling

When an agent finds a violation:

1. **Document** in stand-downs with:
   - File path (absolute)
   - Line numbers
   - Violation type
   - Required fix

2. **Block** merge until fixed
3. **Provide** example of correct pattern

## Agent SOP Documents

All agents have detailed SOP documents:

**Location**: `docs/workflows/principle-engineers/`  
**Absolute Path**: `{REPO_ROOT}/docs/workflows/principle-engineers/`

Each SOP includes:
- Responsibilities and scope
- Code review checkpoints
- Testing requirements
- Approval criteria
- Common violations and fixes
- **Explicit file paths** for all references

## Quick Reference

**Check agent SOPs**:
```bash
# Current directory must be: {REPO_ROOT}
ls -la docs/workflows/principle-engineers/
```

**View stand-downs**:
```bash
# Current directory must be: {REPO_ROOT}
cat stand-downs/agent-sessions.json
```

**Run agent review simulation**:
```bash
# Current directory must be: {REPO_ROOT}
./scripts/pipeline/run-all-checks.sh
```

---

**Remember**: Agents are advanced technology. They read the docs. They know where they are. They execute perfectly.
