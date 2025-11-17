# Admin Scaffold Migration Plan

## Overview

We're migrating components from `docks/shadcn-admin-1.0.0/` (Next.js) to our TanStack Start application. This is a **reference implementation** - we're extracting components like LEGOs and adapting them to our stack.

## Tech Stack Alignment

| Scaffold (Next.js) | Our Stack (TanStack Start) |
|-------------------|---------------------------|
| Next.js App Router | TanStack Start File-Based Routes |
| `pages/` directory | `src/routes/` directory |
| `getServerSideProps` | Route `loader` functions |
| `next/link` | `@tanstack/react-router` `Link` |
| `useRouter()` | `useNavigate()`, `useRouter()` |
| Next.js API Routes | Convex queries/mutations |

## Migration Strategy: Incremental & UI/UX First

### Phase 1: Foundation Components ✅ (HIGH PRIORITY)
**Goal**: Extract core layout components that improve UX immediately

1. **Sidebar** (`components/layout/app-sidebar.tsx`)
   - Extract to `apps/web/src/components/dashboard/AppSidebar.tsx`
   - Adapt to TanStack Start routing
   - Keep existing navigation structure
   - Integration: Replace current `Sidebar` component

2. **Header** (`components/layout/header.tsx`)
   - Extract to `apps/web/src/components/dashboard/Header.tsx`
   - Adapt to TanStack Start
   - Integration: Enhance current `TopNav` component

3. **Layout Components**
   - `nav-user.tsx` → User menu component
   - `team-switcher.tsx` → Organization switcher
   - `nav-group.tsx` → Navigation grouping

### Phase 2: UI Component Library (NEXT)
**Goal**: Expand shadcn/ui components we're missing

- Extract missing shadcn components we don't have yet
- Add to `apps/web/src/components/ui/`
- Components to prioritize:
  - `chart.tsx` - For dashboard visualizations
  - `command.tsx` - Command menu (already exists)
  - `drawer.tsx` - Slide-out panels
  - `skeleton.tsx` - Loading states
  - `tabs.tsx` - Tab navigation
  - `toast.tsx` - Notifications

### Phase 3: Feature Pages (LATER)
**Goal**: Migrate full feature pages as needed

- Dashboard pages (stats, charts, analytics)
- Tasks management
- Users management
- Settings pages
- Developers/API section

## Component Extraction Process

For each component:

1. **Read** scaffold component
2. **Convert** Next.js imports → TanStack Start equivalents
3. **Adapt** routing (`next/link` → `@tanstack/react-router`)
4. **Integrate** with Convex (replace mock data with queries)
5. **Test** in our dashboard
6. **Iterate** based on UX feedback

## Key Conversion Patterns

### Next.js → TanStack Start

```typescript
// Next.js
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// TanStack Start
import { Link } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
```

### Data Fetching

```typescript
// Next.js
export async function getServerSideProps() {
  const data = await fetchData()
  return { props: { data } }
}

// TanStack Start
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const data = await ctx.query(api.resources.listServers)
    return { data }
  },
  component: DashboardPage,
})
```

## Current Status

- ✅ `.gitignore` updated - scaffold is ignored
- ⏳ **Phase 1**: Starting foundation components
- ⏳ **Phase 2**: UI component library (pending)
- ⏳ **Phase 3**: Feature pages (pending)

## Next Steps

1. Extract `app-sidebar.tsx` and adapt to TanStack Start
2. Extract `header.tsx` and enhance current TopNav
3. Test in dashboard and iterate based on UX
4. Continue incrementally with highest-impact components first

---

**Remember**: UI/UX is paramount. We're building incrementally, testing each component, and ensuring it improves the user experience before moving to the next.
