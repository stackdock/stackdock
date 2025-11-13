# Mission 7: Convex Adapter - Convex Agent Prompt

**Date**: November 12, 2025  
**Mission**: Mission 7 - Read-Only Infrastructure MVP  
**Provider**: Convex (Database Provider + Deployments)  
**Agent**: Convex Agent (Backend)  
**Priority**: High

---

## 🎯 Task

Implement Convex adapter following the Turso/Neon adapter pattern. **This is the LAST database provider** before moving to IaaS.

**Special Requirement**: Convex has **deployments** that need a new `deployments` table.

---

## 📋 Full Implementation Plan

**Read**: `stand-downs/active/mission-7-convex-adapter-plan.md`

This comprehensive plan includes:
- API structure (3-step flow: Token → Projects → Deployments)
- Schema changes (NEW `deployments` table)
- Field mapping to universal schema
- Complete implementation tasks
- Testing checklist

---

## 🔑 Key Differences from Turso/Neon

1. **Three-Step Flow**:
   - Step 1: `GET /token` → Get `teamId`
   - Step 2: `GET /projects?teamId={teamId}` → Get projects
   - Step 3: `GET /deployments?projectId={projectId}` → Get deployments

2. **New Table**: `deployments` table (first provider with deployments)

3. **Two Resource Types**:
   - Projects → `databases` table
   - Deployments → `deployments` table

---

## 📁 API Response Files Available

- ✅ `docks/convex/getTokenDetails.json` - Token details with teamId
- ✅ `docks/convex/listProjects.json` - Projects list
- ✅ `docks/convex/listDeployments.json` - Deployments list

---

## 🔗 Reference

- **Pattern**: Follow `convex/docks/adapters/turso/` and `convex/docks/adapters/neon/` structure
- **API Base URL**: `https://cloud.convex.dev/api/v1`
- **Authentication**: Bearer token in `Authorization` header
- **Schema Pattern**: See `backupSchedules` table for similar structure

---

**Ready to implement**: Pattern established, API responses available, comprehensive plan ready.
