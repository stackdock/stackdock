# Navigation Architecture - Final Plan

**Status**: ✅ **IMPLEMENTED - CHECKPOINT REACHED**  
**Last Updated**: January 12, 2025  
**Implementation**: Collapsible dropdown navigation structure  
**End Goal**: Scalable navigation with detail pages accessed via tables

---

## 🎯 Implemented Approach: Collapsible Dropdown Navigation

### Core Principle
- **Top-level collapsible parents** in sidebar navigation
- **No redundant group labels** (removed duplication)
- **Sub-routes** under each collapsible parent
- **Detail pages** accessed via table row clicks (not in sidebar)
- **Scalable** for future additions (Monitoring, etc.)

### Current Implementation (Working)
- Dashboard ▼ → Insights, Projects
- Infrastructure ▼ → Compute, Data, Networking
- Operations ▼ → Backups, Workflows
- Settings ▼ → Organization, User, Theme, Docks

---

## 📐 End Goal: Scalable Navigation Structure

### Complete Route Structure

```
Dashboard
├── Insights          → /dashboard (overview/stats)
└── Projects          → /dashboard/projects (list)
    └── $projectId    → /dashboard/projects/$projectId (detail + sub-routes)

Infrastructure
├── Compute           → /dashboard/infrastructure/compute (servers + web services tables)
│   ├── Servers       → /dashboard/infrastructure/servers (servers table - FUTURE)
│   │   └── $serverId → /dashboard/infrastructure/servers/$serverId (server detail)
│   └── Web Services  → /dashboard/infrastructure/web-services (web services table - FUTURE)
│       └── $webServiceId → /dashboard/infrastructure/web-services/$webServiceId (detail)
├── Data              → /dashboard/infrastructure/data (databases table)
│   └── Databases     → /dashboard/infrastructure/databases (databases table - FUTURE)
│       └── $databaseId → /dashboard/infrastructure/databases/$databaseId (detail)
└── Networking        → /dashboard/infrastructure/networking (domains table)
    └── Domains       → /dashboard/infrastructure/domains (domains table - FUTURE)
        └── $domainId → /dashboard/infrastructure/domains/$domainId (detail)

Operations
├── Backups           → /dashboard/operations/backups (backup schedules + integrations)
│   └── $backupId     → /dashboard/operations/backups/$backupId (backup detail - FUTURE)
└── Workflows         → /dashboard/operations/workflows (workflows table)
    └── $workflowId   → /dashboard/operations/workflows/$workflowId (workflow detail - FUTURE)

Monitoring (FUTURE)
├── Activity          → /dashboard/monitoring/activity (activity feed)
│   └── $activityId   → /dashboard/monitoring/activity/$activityId (activity detail)
├── Alerts            → /dashboard/monitoring/alerts (alerts table)
│   └── $alertId     → /dashboard/monitoring/alerts/$alertId (alert detail)
└── Logs              → /dashboard/monitoring/logs (logs viewer)
    └── $logId        → /dashboard/monitoring/logs/$logId (log detail)

Settings
├── Organization      → /dashboard/settings/organization
├── User              → /dashboard/settings/user
├── Theme             → /dashboard/settings/theme
└── Docks             → /dashboard/settings/docks
```

---

## 🎨 Sidebar Navigation Structure (What Users See)

### Current Implementation (Working - CHECKPOINT)

```
Dashboard ▼ (collapsible parent)
├── Insights          → /dashboard
└── Projects          → /dashboard/projects

Infrastructure ▼ (collapsible parent)
├── Compute           → /dashboard/infrastructure/compute
├── Data              → /dashboard/infrastructure/data
└── Networking        → /dashboard/infrastructure/networking

Operations ▼ (collapsible parent)
├── Backups           → /dashboard/operations/backups
└── Workflows         → /dashboard/operations/workflows

Settings ▼ (collapsible parent)
├── Organization      → /dashboard/settings/organization
├── User              → /dashboard/settings/user
├── Theme             → /dashboard/settings/theme
└── Docks             → /dashboard/settings/docks

Monitoring ▼ (FUTURE - collapsible parent)
├── Activity          → /dashboard/monitoring/activity
├── Alerts            → /dashboard/monitoring/alerts
└── Logs              → /dashboard/monitoring/logs
```

**Key Points**:
- ✅ Collapsible dropdown structure (no redundant group labels)
- ✅ Detail pages NOT in sidebar (accessed via table clicks)
- ✅ Consistent structure across all nav groups
- ✅ Scalable for future additions

---

## 🔄 Detail Page Access Pattern

### How Users Access Detail Pages

1. **Click table row** → Navigate to detail page
2. **Detail page URL** → `/dashboard/infrastructure/servers/$serverId`
3. **Breadcrumb navigation** → Shows path back to list
4. **Back button** → Returns to table view

### Example Flow

```
User clicks "Servers" in sidebar
  ↓
Sees servers table at /dashboard/infrastructure/compute
  ↓
Clicks a server row
  ↓
Navigates to /dashboard/infrastructure/servers/$serverId
  ↓
Sees server detail page with tabs (Overview, Metrics, Logs, etc.)
  ↓
Breadcrumb: Infrastructure > Compute > Servers > Server Name
```

---

## ⚠️ Conflict Points & Decision Points

### 1. **Infrastructure > Compute** - Current vs. Future

**Current State**:
- `/dashboard/infrastructure/compute` shows both servers AND web services tables

**Future State**:
- Option A: Keep combined view (current)
- Option B: Split into separate routes:
  - `/dashboard/infrastructure/servers` (servers only)
  - `/dashboard/infrastructure/web-services` (web services only)

**Decision**: **Keep combined view** for now. Split only if:
- Tables become too large
- Users need separate navigation
- Different permissions required

**Impact**: Detail page routes already support split (`/servers/$serverId`, `/web-services/$webServiceId`)

---

### 2. **Detail Pages in Sidebar** - Never Do This

**Conflict**: Future developers might want to add detail pages to sidebar

**Decision**: **NEVER add detail pages to sidebar navigation**

**Reasoning**:
- Sidebar would become cluttered
- Detail pages are contextual (only relevant when viewing that resource)
- Table navigation is standard pattern
- Matches Projects pattern (detail not in sidebar)

**Enforcement**: Code review checklist item

---

### 3. **Nested Navigation Groups** - Avoid

**Conflict**: Future developers might want collapsible nested groups

**Decision**: **Keep flat structure** - no nested collapsibles

**Reasoning**:
- Simpler UX (one click to any page)
- Easier to scan
- Less cognitive load
- Scales better (no nesting depth limits)

**Exception**: Only if we have 10+ items in a group (unlikely)

---

### 4. **Monitoring Group** - Future Addition

**Conflict**: Where does Monitoring fit?

**Decision**: **Add as new top-level group** between Operations and Settings

**Structure**:
```
Operations
Monitoring (NEW)
Settings
```

**Routes**:
- `/dashboard/monitoring/activity`
- `/dashboard/monitoring/alerts`
- `/dashboard/monitoring/logs`

**Impact**: No conflicts - clean addition

---

### 5. **Resource-Specific Routes** - When to Create

**Conflict**: When should we create separate routes for servers vs. web services?

**Decision**: **Create separate routes when**:
- Tables have 50+ items each
- Different filtering/search needs
- Different permissions
- User feedback requests separation

**Current**: Combined view is fine (servers + web services together)

---

### 6. **Projects Pattern** - Consistency

**Current**: Projects has detail pages with sub-routes:
- `/dashboard/projects/$projectId/overview`
- `/dashboard/projects/$projectId/resources`
- `/dashboard/projects/$projectId/activity`
- `/dashboard/projects/$projectId/settings`

**Decision**: **Apply same pattern to resource detail pages**

**Example**:
- `/dashboard/infrastructure/servers/$serverId/overview`
- `/dashboard/infrastructure/servers/$serverId/metrics`
- `/dashboard/infrastructure/servers/$serverId/logs`
- `/dashboard/infrastructure/servers/$serverId/settings`

**Impact**: Consistent UX across all detail pages

---

## 📋 Implementation Checklist

### Phase 1: Current Structure (✅ Complete)
- [x] Dashboard group with Insights and Projects
- [x] Infrastructure group with Compute, Data, Networking
- [x] Operations group with Backups, Workflows
- [x] Settings group with Organization, User, Theme, Docks

### Phase 2: Detail Pages (🔄 In Progress)
- [ ] Server detail page (`/dashboard/infrastructure/servers/$serverId`)
- [ ] Web Service detail page (`/dashboard/infrastructure/web-services/$webServiceId`)
- [ ] Database detail page (`/dashboard/infrastructure/databases/$databaseId`)
- [ ] Domain detail page (`/dashboard/infrastructure/domains/$domainId`)

### Phase 3: Monitoring Group (📅 Future)
- [ ] Create Monitoring navigation group
- [ ] Activity page (`/dashboard/monitoring/activity`)
- [ ] Alerts page (`/dashboard/monitoring/alerts`)
- [ ] Logs page (`/dashboard/monitoring/logs`)

### Phase 4: Optional Splits (📅 Future - If Needed)
- [ ] Split Compute into Servers and Web Services routes
- [ ] Split Data into Databases route
- [ ] Split Networking into Domains route

---

## 🚨 Critical Rules (Never Violate)

### Rule 1: No Detail Pages in Sidebar
**Never add** resource detail pages (`/$resourceId`) to sidebar navigation.

**Why**: Sidebar stays clean, detail pages are contextual.

### Rule 2: Flat Structure Only
**Never add** nested collapsible groups in sidebar.

**Why**: Simpler UX, easier to scan, scales better.

### Rule 3: Consistent Detail Pattern
**Always use** Projects pattern for detail pages:
- List page in sidebar
- Detail page accessed via table click
- Detail page has sub-routes (overview, metrics, logs, settings)

### Rule 4: Top-Level Groups Only
**Only add** new top-level groups when:
- It's a major functional area (like Monitoring)
- It has 2+ distinct pages
- It doesn't fit in existing groups

**Examples**:
- ✅ Monitoring (new functional area)
- ❌ "Servers" (fits in Infrastructure)
- ❌ "Backup Details" (fits in Operations)

---

## 📊 Navigation Group Guidelines

### When to Create a New Group

**Create new group if**:
- It's a major functional area (Dashboard, Infrastructure, Operations, Monitoring, Settings)
- It has 2+ distinct pages
- It doesn't logically fit in existing groups

**Don't create new group if**:
- It's a resource type (servers, databases, etc.) → Goes in Infrastructure
- It's an operation type (backups, workflows) → Goes in Operations
- It's a setting type (organization, user) → Goes in Settings

### Group Ordering

1. **Dashboard** - Overview and projects
2. **Infrastructure** - Resources (servers, databases, domains)
3. **Operations** - Actions and workflows
4. **Monitoring** - Observability (future)
5. **Settings** - Configuration

**Rationale**: Most used → Least used, Logical flow

---

## 🔍 Detail Page Route Patterns

### Standard Pattern

```
/dashboard/{group}/{resource-type}/$resourceId/{sub-route}
```

### Examples

```
/dashboard/infrastructure/servers/$serverId/overview
/dashboard/infrastructure/servers/$serverId/metrics
/dashboard/infrastructure/servers/$serverId/logs
/dashboard/infrastructure/servers/$serverId/settings

/dashboard/infrastructure/web-services/$webServiceId/overview
/dashboard/infrastructure/databases/$databaseId/overview
/dashboard/infrastructure/domains/$domainId/overview
```

### Sub-Route Options

**Standard sub-routes for resource detail pages**:
- `overview` - General info, status, quick stats
- `metrics` - Performance metrics, charts
- `logs` - Logs viewer (if applicable)
- `settings` - Resource-specific settings

**Optional sub-routes**:
- `activity` - Activity feed (if applicable)
- `backups` - Backup history (if applicable)
- `alerts` - Alert history (if applicable)

---

## 🎯 Future Considerations

### Scalability

**Current structure supports**:
- ✅ Adding Monitoring group (no conflicts)
- ✅ Adding new resource types (add to Infrastructure)
- ✅ Adding new operations (add to Operations)
- ✅ Adding new settings (add to Settings)

**Limits**:
- Max ~8 items per group (before considering split)
- Max ~6 top-level groups (before considering reorganization)

### Potential Future Additions

**Possible new groups**:
- **Analytics** - Reports, dashboards, insights (if separate from Monitoring)
- **Integrations** - Third-party integrations (if separate from Settings)

**Decision**: Add only if they become major functional areas with 3+ pages

---

## 📝 Implementation Notes

### Navigation Component Structure

```typescript
const navGroups = [
  {
    title: "Dashboard",
    items: [
      { title: "Insights", url: "/dashboard", icon: LayoutDashboard },
      { title: "Projects", url: "/dashboard/projects", icon: FolderKanban },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      { title: "Compute", url: "/dashboard/infrastructure/compute", icon: Server },
      { title: "Data", url: "/dashboard/infrastructure/data", icon: Database },
      { title: "Networking", url: "/dashboard/infrastructure/networking", icon: Network },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Backups", url: "/dashboard/operations/backups", icon: HardDrive },
      { title: "Workflows", url: "/dashboard/operations/workflows", icon: Workflow },
    ],
  },
  // Monitoring group added when implemented
  {
    title: "Settings",
    items: [
      { title: "Organization", url: "/dashboard/settings/organization", icon: Building2 },
      { title: "User", url: "/dashboard/settings/user", icon: User },
      { title: "Theme", url: "/dashboard/settings/theme", icon: Palette },
      { title: "Docks", url: "/dashboard/settings/docks", icon: Plug },
    ],
  },
]
```

### Table Row Click Handler Pattern

```typescript
// In table component
const handleRowClick = (resource: Resource) => {
  router.navigate({
    to: `/dashboard/infrastructure/${resource.type}/${resource.id}/overview`,
  })
}
```

---

## ✅ Validation Checklist

Before adding any navigation item, verify:

- [ ] Is it a top-level functional area? (If yes, new group)
- [ ] Does it fit in existing group? (If yes, add to that group)
- [ ] Is it a detail page? (If yes, NOT in sidebar - accessed via table)
- [ ] Does it follow flat structure? (No nested collapsibles)
- [ ] Does it match Projects pattern? (List in nav, detail via click)
- [ ] Will it scale? (Consider future additions)

---

## 📚 Related Documents

- `docs/architecture/ROUTING.md` - Routing patterns and conventions
- `docs/architecture/UI_COMPONENTS.md` - Component patterns
- `stand-downs/working/MISSION-STATUS.md` - Current mission status

---

**This document is the source of truth for navigation architecture decisions.**
