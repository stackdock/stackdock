# StackDock Next Steps

**Last Updated**: November 16, 2025

## 🎯 Immediate Priorities

### 1. Projects Feature Completion (High Priority)

**Status**: Backend complete, UI 60% complete

**Remaining Tasks**:
- [ ] **Create Project UI** (`apps/web/src/routes/dashboard/projects/new.tsx`)
  - Form with: name, team, client, optional Linear ID, optional GitHub repo
  - Uses `projects/mutations:createProject` (already has RBAC)
  - Redirect to project detail page after creation

- [ ] **Edit Project UI** (`apps/web/src/routes/dashboard/projects/[projectId]/edit.tsx`)
  - Edit form (similar to create)
  - Uses `projects/mutations:updateProject` (needs to be created)
  - Pre-populate with existing project data

- [ ] **Project Detail Page** (`apps/web/src/routes/dashboard/projects/[projectId]/index.tsx`)
  - Show project info (name, team, client, linked resources)
  - Display linked resources table (servers, webServices, domains, databases)
  - Add/remove resource links UI
  - Uses `projects/queries:getProject` and `projects/queries:getProjectResources`

- [ ] **Link Resources UI** (component or modal)
  - Resource selector (filter by type: servers, webServices, domains, databases)
  - Multi-select or single-select
  - Uses `projects/mutations:linkResource` and `projects/mutations:unlinkResource`

- [ ] **Update Project Mutation** (`convex/projects/mutations.ts`)
  - Add `updateProject` mutation
  - RBAC: `projects:full` permission
  - Allow updating: name, teamId, clientId, linearId, githubRepo

**Files to Create/Update**:
- `apps/web/src/routes/dashboard/projects/new.tsx` (NEW)
- `apps/web/src/routes/dashboard/projects/[projectId]/edit.tsx` (NEW)
- `apps/web/src/routes/dashboard/projects/[projectId]/index.tsx` (NEW)
- `apps/web/src/components/projects/LinkResourceDialog.tsx` (NEW)
- `convex/projects/mutations.ts` (ADD `updateProject`)

**Estimated Time**: 4-6 hours

---

### 2. Linear Integration (High Priority)

**Status**: Not started

**Tasks**:
- [ ] **Linear Adapter** (`convex/docks/adapters/linear/adapter.ts`)
  - API client for Linear GraphQL API
  - Fetch projects (teams) and issues
  - Map to `projects` table (Linear teams → StackDock projects)
  - Map issues to `projects` table with `fullApiData`

- [ ] **Linear Dock Registration** (`convex/docks/registry.ts`)
  - Add Linear to provider list
  - Register adapter

- [ ] **Linear Sync Action** (`convex/docks/actions.ts`)
  - Add Linear API fetching logic
  - Call adapter sync methods

- [ ] **Linear API Client** (`convex/docks/adapters/linear/client.ts`)
  - GraphQL client for Linear API
  - Handle authentication (API key)
  - Rate limit handling

**API Documentation**: https://linear.app/docs/api

**Files to Create**:
- `convex/docks/adapters/linear/adapter.ts` (NEW)
- `convex/docks/adapters/linear/client.ts` (NEW)
- `convex/docks/adapters/linear/types.ts` (NEW)

**Estimated Time**: 3-4 hours

---

### 3. Sentry Integration (High Priority - Tomorrow)

**Status**: Not started (planned for tomorrow)

**Tasks**:
- [ ] **Sentry Adapter** (`convex/docks/adapters/sentry/adapter.ts`)
  - API client for Sentry REST API
  - Fetch projects and alerts
  - Map to monitoring structure (new table or extend existing)

- [ ] **Sentry Dock Registration** (`convex/docks/registry.ts`)
  - Add Sentry to provider list
  - Register adapter

- [ ] **Sentry Sync Action** (`convex/docks/actions.ts`)
  - Add Sentry API fetching logic
  - Call adapter sync methods

- [ ] **Monitoring Schema** (if needed)
  - Consider: `alerts` table or extend `projects` table
  - Decision: Use `projects` table for Sentry projects, create `alerts` table for errors/alerts

**API Documentation**: https://docs.sentry.io/api/

**Files to Create**:
- `convex/docks/adapters/sentry/adapter.ts` (NEW)
- `convex/docks/adapters/sentry/client.ts` (NEW)
- `convex/docks/adapters/sentry/types.ts` (NEW)
- `convex/schema.ts` (ADD `alerts` table if needed)

**Estimated Time**: 3-4 hours

---

### 4. Monitoring Pages (High Priority)

**Status**: Routes exist, need content

**Tasks**:
- [ ] **Activity Page** (`apps/web/src/routes/dashboard/monitoring/activity.tsx`)
  - Show audit logs
  - Filter by action type, user, date
  - Uses `audit/queries:listAuditLogs` (needs to be created)

- [ ] **Alerts Page** (`apps/web/src/routes/dashboard/monitoring/alerts.tsx`)
  - Show alerts from Sentry (and future providers)
  - Filter by severity, status, project
  - Uses `alerts/queries:listAlerts` (needs to be created)

- [ ] **Errors Page** (`apps/web/src/routes/dashboard/monitoring/errors.tsx`)
  - Show errors from Sentry
  - Filter by project, environment, date
  - Uses `alerts/queries:listErrors` (needs to be created)

- [ ] **Audit Log Queries** (`convex/lib/audit.ts` or new file)
  - `listAuditLogs` query with RBAC (`monitoring:read`)
  - Filtering and pagination

- [ ] **Alerts Queries** (`convex/alerts/queries.ts` - NEW)
  - `listAlerts` query with RBAC (`monitoring:read`)
  - `listErrors` query with RBAC (`monitoring:read`)

**Files to Create/Update**:
- `apps/web/src/routes/dashboard/monitoring/activity.tsx` (UPDATE)
- `apps/web/src/routes/dashboard/monitoring/alerts.tsx` (UPDATE)
- `apps/web/src/routes/dashboard/monitoring/errors.tsx` (UPDATE)
- `convex/lib/audit.ts` (ADD queries)
- `convex/alerts/queries.ts` (NEW)

**Estimated Time**: 4-5 hours

---

## 📋 Medium Priority

### 5. Complex Auth IaaS Providers

**Status**: Not started

**Providers**: AWS, GCP, Azure

**Tasks**:
- [ ] Multi-field authentication UI
- [ ] IAM role/service account handling
- [ ] Read-only instance fetching
- [ ] Universal table mapping

**Estimated Time**: 8-12 hours per provider

---

### 6. Insights Board

**Status**: Not started

**Tasks**:
- [ ] Data visualization components
- [ ] Cross-provider analytics
- [ ] Aggregated dashboards
- [ ] Charts and graphs

**Estimated Time**: 10-15 hours

---

## 🔧 Technical Debt & Improvements

### Documentation
- [ ] Consolidate duplicate docs
- [ ] Update architecture docs with latest changes
- [ ] Add RBAC examples to docs
- [ ] Document monitoring permission usage

### Testing
- [ ] Add unit tests for RBAC functions
- [ ] Add integration tests for sync
- [ ] Add E2E tests for critical flows

### Performance
- [ ] Optimize sync queries (batch operations)
- [ ] Add caching for frequently accessed data
- [ ] Optimize resource queries (pagination)

---

## 📊 Progress Tracking

**Current MVP Completion**: ~85%

- ✅ Core Platform: 100%
- ✅ Provider Integration: 100%
- 🔄 Projects Feature: 60%
- 📋 Monitoring Feature: 0%

**Estimated Time to MVP**: 15-20 hours

---

## 🚀 Quick Wins (Can be done in parallel)

1. **Update Project Mutation** (1 hour)
   - Add `updateProject` to `convex/projects/mutations.ts`
   - Simple CRUD operation

2. **Audit Log Queries** (1 hour)
   - Add `listAuditLogs` query
   - Basic filtering

3. **Project Detail Page** (2 hours)
   - Read-only view of project
   - Display linked resources

---

## 📝 Notes

- **RBAC**: All queries/mutations now protected. New features must include RBAC checks.
- **Monitoring Permission**: Added to schema, ready for Sentry/Linear integration.
- **Continuous Sync**: Working with provider-aware intervals. No changes needed.
- **Rate Limits**: Comprehensive tracking in place. Monitor logs for optimization.

---

**Next Session Focus**: Complete Projects UI, then Linear integration, then Sentry (tomorrow).

