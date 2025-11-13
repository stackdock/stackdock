# Mission 7: Neon Adapter - Convex Agent Prompt

**Date**: November 12, 2025  
**Mission**: Mission 7 - Read-Only Infrastructure MVP  
**Provider**: Neon (Database Provider)  
**Agent**: Convex Agent (Backend)  
**Priority**: High

---

## 🎯 Task

Implement Neon adapter following the Turso adapter pattern. Neon is a serverless PostgreSQL provider.

---

## 📋 Full Implementation Guide

**Read**: `stand-downs/active/mission-7-neon-adapter-convex-guide.md`

This guide includes:
- API structure and endpoints
- Field mapping to universal schema
- Complete implementation tasks
- Testing checklist

---

## ⚠️ Important: API Response Examples Needed

Before implementing, we need actual API response examples:

1. **Create `docks/neon/project/listProjects.json`** - Example response from `GET /projects`
2. **Create `docks/neon/branch/listBranches.json`** - Example response from `GET /projects/{id}/branches`
3. **Verify database endpoint** - Confirm `GET /projects/{id}/branches/{id}/databases` structure

Once we have these, update the TypeScript interfaces in `types.ts` to match the actual API responses.

---

## 🔗 Reference

- **Pattern**: Follow `convex/docks/adapters/turso/` structure exactly
- **API Base URL**: `https://console.neon.tech/api/v2`
- **Authentication**: Bearer token in `Authorization` header

---

**Ready to implement**: Pattern established, need API response examples to finalize types.
