---
title: Implement Convex Enhancements from Quality Review
labels: post-mvp,quality-review,enhancement,backend
priority: medium
category: backend
estimated-hours: 8-12
related-plan: docs/stand-downs/active/convex-recommendations.md
---

## Goal

Implement enhancements identified in Convex quality review (Score: 9/10). While Convex integration is exemplary, there are opportunities to leverage additional features.

## Current State

Convex is excellently utilized as the primary backend:
- ✅ 29 type-safe tables
- ✅ Real-time subscriptions throughout UI
- ✅ Proper RBAC and encryption
- ✅ Scheduled functions for auto-sync
- ✅ Clean, composable architecture

## Recommendations

### 1. Convex File Storage for User Uploads
**Priority**: Medium

Currently uses `v.bytes()` for encrypted credentials. Could leverage Convex file storage for:
- User-uploaded configuration files
- Backup files
- Attachments

**Implementation**:
- Integrate `ctx.storage.store()` for user-generated content
- Add file upload UI components
- Update schema to reference file storage IDs

### 2. Optimistic Updates
**Priority**: Medium

Mutations use standard `useMutation()` pattern. Could implement optimistic UI updates for better perceived performance.

**Implementation**:
- Add optimistic update handlers for common operations (create project, link resource)
- Update UI immediately before server confirmation
- Rollback on error

### 3. Subscription Pagination
**Priority**: Low

Some queries load all results (e.g., `listDocks`, `listProjects`). For large datasets, could implement cursor-based pagination.

**Implementation**:
- Add `.paginate()` to resource lists when counts exceed 100
- Implement cursor-based pagination for servers, domains, etc.
- Add "Load More" UI components

## Files to Update

- `convex/lib/storage.ts` - File storage utilities (new)
- `convex/projects/mutations.ts` - Add optimistic updates
- `convex/resources/queries.ts` - Add pagination support
- `apps/web/src/components/projects/*` - Optimistic UI updates
- `apps/web/src/components/resources/*` - Pagination UI

## Success Criteria

- [ ] File storage integrated for user uploads
- [ ] Optimistic updates working for common mutations
- [ ] Pagination implemented for large resource lists
- [ ] Documentation updated with new patterns

## Related Documentation

See `docs/stand-downs/active/convex-recommendations.md` for full analysis.
