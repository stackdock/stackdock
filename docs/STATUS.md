# StackDock Status
**Last Updated**: November 16, 2025  
**Project Start**: October 22, 2025

## Current State

### What's Working (Verified)
- ✅ **13 Providers Integrated** - All syncing successfully
  - GridPane, Vercel, Netlify, Cloudflare, Turso, Neon, Convex, PlanetScale, Vultr, DigitalOcean, Linode, Hetzner, Coolify, GitHub
- ✅ **Read-Only MVP Functional** - All providers syncing, universal tables displaying data
- ✅ **Core Platform** - TanStack Start, Convex, Clerk all working
- ✅ **RBAC System** - Full coverage, all queries/mutations protected
- ✅ **Encryption** - AES-256-GCM for API keys
- ✅ **Audit Logging** - Comprehensive audit trail
- ✅ **Continuous Sync** - Provider-aware intervals (60s+)
- ✅ **Code Table** - Working correctly, queries `repositories` table (universal table for GitHub, GitLab, etc.)
- ✅ **Projects Feature** - Backend complete, UI 60% complete (create/edit/link resources working)

### What's In Progress
- 🔄 **Projects Feature** - 60% complete (UI remaining 40%)
- 🔄 **Monitoring Feature** - 0% complete (Linear/Sentry adapters next)

### What's Next
- **Immediate**: Complete Projects UI remaining 40%
- **High Priority**: Linear adapter integration
- **High Priority**: Sentry adapter integration
- **High Priority**: Monitoring pages (activity, alerts, errors)
- **Medium Priority**: Complex auth IaaS providers (AWS/GCP/Azure)
- **Low Priority**: Insights board, documentation cleanup, testing

---

## MVP Progress

### ✅ Core Platform (100%)
- [x] TanStack Start app setup
- [x] Convex integration
- [x] Clerk authentication
- [x] User sync (Clerk → Convex)
- [x] RBAC system with full coverage
- [x] Encryption (AES-256-GCM)
- [x] Audit logging
- [x] Navigation structure
- [x] Continuous sync (60s+ intervals)
- [x] Rate limit tracking

### ✅ Provider Integration (13/13 - 100%)
- [x] GridPane (servers, web services, domains, backups)
- [x] Vercel (web services)
- [x] Netlify (web services)
- [x] Cloudflare (zones, pages, workers, DNS)
- [x] Turso (databases)
- [x] Neon (databases, snapshots)
- [x] Convex (databases, projects, deployments)
- [x] PlanetScale (databases)
- [x] Vultr (servers, block volumes)
- [x] DigitalOcean (servers, block volumes)
- [x] Linode (servers, buckets)
- [x] Hetzner (servers)
- [x] Coolify (servers, web services, databases)
- [x] GitHub (repositories, branches, issues, commits)

### ✅ Universal Tables (100%)
- [x] `servers` - 6 providers
- [x] `webServices` - 5 providers
- [x] `domains` - 2 providers
- [x] `databases` - 5 providers
- [x] `blockVolumes` - 2 providers
- [x] `buckets` - 1 provider
- [x] `backupSchedules` - 2 providers
- [x] `deployments` - 1 provider
- [x] `repositories` - 1 provider (GitHub, universal table)

### 🔄 Projects Feature (60%)
- [x] Projects schema
- [x] GitHub adapter integration
- [x] Code page with repositories table
- [x] RBAC protection (projects:read, projects:full)
- [x] Create project UI (`/dashboard/projects/new`)
- [x] Edit project UI (EditProjectDialog component)
- [x] Link resources to projects UI (LinkResourceDialog component)
- [x] Project detail pages (`/dashboard/projects/$projectSlug`)
- [x] Project resource management (link/unlink)
- [ ] Project activity/overview pages (remaining UI polish)
- [ ] Project settings page

**Note**: Projects feature is organizational (linking resources together), separate from `repositories` table (universal table for GitHub/GitLab).

### 📋 Monitoring Feature (0%)
- [ ] Linear adapter
- [ ] Sentry adapter
- [ ] Monitoring pages (activity, alerts, errors)
- [ ] RBAC protection (monitoring:read, monitoring:full)

---

## Next Steps

### Immediate Priorities

#### 1. Complete Projects UI (Remaining 40%)
**Status**: Backend complete, UI 60% complete

**Remaining Tasks**:
- [ ] Project activity/overview pages polish
- [ ] Project settings page
- [ ] UI improvements and polish

**Estimated Time**: 2-3 hours

#### 2. Linear Integration (High Priority)
**Status**: Not started

**Tasks**:
- [ ] Linear adapter (`convex/docks/adapters/linear/adapter.ts`)
- [ ] Linear API client (GraphQL)
- [ ] Linear dock registration
- [ ] Linear sync action

**API Documentation**: https://linear.app/docs/api

**Estimated Time**: 3-4 hours

#### 3. Sentry Integration (High Priority)
**Status**: Not started

**Tasks**:
- [ ] Sentry adapter (`convex/docks/adapters/sentry/adapter.ts`)
- [ ] Sentry API client (REST)
- [ ] Sentry dock registration
- [ ] Sentry sync action
- [ ] Monitoring schema (alerts table if needed)

**API Documentation**: https://docs.sentry.io/api/

**Estimated Time**: 3-4 hours

#### 4. Monitoring Pages (High Priority)
**Status**: Routes exist, need content

**Tasks**:
- [ ] Activity page (audit logs)
- [ ] Alerts page (Sentry alerts)
- [ ] Errors page (Sentry errors)
- [ ] Audit log queries
- [ ] Alerts queries

**Estimated Time**: 4-5 hours

### Medium Priority

#### 5. Complex Auth IaaS Providers
**Status**: Not started

**Providers**: AWS, GCP, Azure

**Tasks**:
- [ ] Multi-field authentication UI
- [ ] IAM role/service account handling
- [ ] Read-only instance fetching
- [ ] Universal table mapping

**Estimated Time**: 8-12 hours per provider

#### 6. Insights Board
**Status**: Not started

**Tasks**:
- [ ] Data visualization components
- [ ] Cross-provider analytics
- [ ] Aggregated dashboards
- [ ] Charts and graphs

**Estimated Time**: 10-15 hours

---

## Progress Summary

- **Core Platform**: 100% ✅
- **Provider Integration**: 100% ✅ (13 providers)
- **Projects Feature**: 60% 🔄
- **Monitoring Feature**: 0% 📋
- **Overall MVP**: ~85% complete

**Estimated Time to MVP**: 15-20 hours

---

## Technical Notes

- **RBAC**: All queries/mutations protected. New features must include RBAC checks.
- **Monitoring Permission**: Added to schema, ready for Sentry/Linear integration.
- **Continuous Sync**: Working with provider-aware intervals. No changes needed.
- **Rate Limits**: Comprehensive tracking in place. Monitor logs for optimization.
- **Architecture**: Translation layer working correctly. Universal tables validated across all providers.
- **Projects vs Repositories**: Projects are organizational (StackDock feature), repositories are universal table (provider data).

---

## Quick Wins (Can be done in parallel)

1. **Project Activity/Overview Pages** (2 hours)
   - Polish existing project detail pages
   - Add activity feed

2. **Audit Log Queries** (1 hour)
   - Add `listAuditLogs` query
   - Basic filtering

3. **Project Settings Page** (1 hour)
   - Settings UI for project configuration

---

**Note**: MVP focuses on read-only observability. Write operations (provisioning, modifications) are post-MVP.
