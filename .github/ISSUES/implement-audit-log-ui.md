---
title: Implement Audit Log UI Page
labels: priority:medium,category:foundation,type:enhancement
assignees: 
milestone: Phase 2 - Medium Priority
---

## Goal

Allow users to view audit logs in the dashboard.

## Current State

- Audit log schema exists in `convex/schema.ts` (`auditLogs` table)
- `auditLog()` function exists in `convex/lib/audit.ts`
- Logs are being created (credential operations, provisioning, dock operations)
- No user-facing UI to view logs

## Implementation Steps

1. Create Convex query for audit logs
   - `convex/audit/queries.ts`
   - `listAuditLogs` query with filtering (by org, user, action type, date range)
   - Use RBAC to ensure users only see their org's logs

2. Create UI page
   - `apps/web/src/routes/dashboard/settings/audit.tsx`
   - Table showing: timestamp, user, action, resource, result
   - Filters: date range, action type, user
   - Pagination

3. Add navigation link
   - Add to Settings sidebar
   - Or create separate "Audit" section

## Files to Create

- `convex/audit/queries.ts`
- `apps/web/src/routes/dashboard/settings/audit.tsx`
- `apps/web/src/components/audit/audit-log-table.tsx`

## Files to Update

- Settings navigation/routing

## Success Criteria

- [ ] Audit log query created with RBAC
- [ ] UI page displays audit logs in table format
- [ ] Filtering works (date range, action type, user)
- [ ] Pagination implemented
- [ ] Navigation link added to settings

## Estimated Effort

4-6 hours

## Related

- Part of Critical Gaps Implementation Plan
- See: `docs/stand-downs/active/working/critical-gaps-implementation-plan.md`
- Related Gap: #7 - No Audit UI
- Note: Backend audit logging already exists, this is just the UI
