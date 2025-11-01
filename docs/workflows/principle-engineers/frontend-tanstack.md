# TanStack Principle Engineer SOP

> **Location**: `docs/workflows/principle-engineers/frontend-tanstack.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/principle-engineers/frontend-tanstack.md`

## Agent Identity

**Agent ID**: `frontend-tanstack`  
**Domain**: TanStack Start, TanStack Router, routing patterns, SSR

## Responsibilities

- Review routing implementations
- Validate TanStack Start patterns
- Ensure SSR correctness
- Verify data loading patterns
- Check route organization

## Scope

**Files Reviewed**:
- `apps/web/src/routes/**/*.tsx` - All route files
- `apps/web/src/router.tsx` - Router configuration
- `apps/web/src/routes/__root.tsx` - Root route

**Absolute Paths**:
- Routes: `{REPO_ROOT}/apps/web/src/routes/`
- Router: `{REPO_ROOT}/apps/web/src/router.tsx`

## Code Review Checkpoints

### 1. Route File Structure

**Required Pattern**:
```typescript
// File: {REPO_ROOT}/apps/web/src/routes/dashboard/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-router-ssr-query'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
  loader: async ({ context }) => {
    // Data loading
    return { data: await fetchData() }
  },
})

function DashboardPage() {
  const { data } = Route.useLoaderData()
  return <div>Dashboard</div>
}
```

**Violations**:
- ❌ Not using `createFileRoute`
- ❌ Missing route export
- ❌ Not using file-based routing

### 2. Data Loading

**Required Patterns**:
- ✅ Use `loader` for SSR data loading
- ✅ Use `useQuery` for client-side data
- ✅ Use `useSuspenseQuery` for suspense boundaries
- ✅ Handle loading/error states

**Pattern**:
```typescript
export const Route = createFileRoute('/dashboard/')({
  loader: async ({ context }) => {
    // Server-side data loading
    return await context.convex.query(api.resources.list)
  },
})

function DashboardPage() {
  const data = Route.useLoaderData()
  // Data is available synchronously
}
```

**Violations**:
- ❌ Using `useEffect` for data loading (use loader instead)
- ❌ Not handling loading states
- ❌ Not handling error states

### 3. Route Organization

**Required Structure**:
```
routes/
├── __root.tsx          # Root layout
├── index.tsx           # Home page
├── dashboard.tsx       # Dashboard layout
├── dashboard/
│   ├── index.tsx       # Dashboard home
│   ├── projects.tsx    # Projects list
│   └── $projectId.tsx  # Dynamic route
└── auth.tsx            # Auth layout
```

**Violations**:
- ❌ Incorrect nesting
- ❌ Missing layout routes
- ❌ Incorrect file naming

### 4. SSR Patterns

**Required**:
- ✅ Components are SSR-compatible
- ✅ No browser-only APIs in render
- ✅ Proper hydration handling
- ✅ Theme initialization in `__root.tsx`

**Pattern** (from `__root.tsx`):
```typescript
export const Route = createFileRoute('/__root')({
  component: RootComponent,
})

function RootComponent() {
  return (
    <html>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Outlet />
      </body>
    </html>
  )
}
```

**Violations**:
- ❌ Using `window` in render
- ❌ Missing SSR checks
- ❌ Hydration mismatches

### 5. Navigation

**Required**:
- ✅ Use `Link` from `@tanstack/react-router`
- ✅ Use `useNavigate` for programmatic navigation
- ✅ Use `useRouter` for route utilities

**Pattern**:
```typescript
import { Link, useNavigate } from '@tanstack/react-router'

function Component() {
  const navigate = useNavigate()
  
  return (
    <Link to="/dashboard">Dashboard</Link>
    <button onClick={() => navigate({ to: '/dashboard' })}>Go</button>
  )
}
```

**Violations**:
- ❌ Using `<a>` tags instead of `Link`
- ❌ Using `window.location` instead of `navigate`
- ❌ Not using TanStack Router navigation

## Testing Requirements

**Test Location**: `apps/web/src/routes/**/*.test.tsx`  
**Absolute Path**: `{REPO_ROOT}/apps/web/src/routes/**/*.test.tsx`

**Required Tests**:
- ✅ Route renders
- ✅ Loader executes
- ✅ Navigation works
- ✅ SSR compatibility

## Approval Criteria

**Approve** if:
- ✅ Uses `createFileRoute`
- ✅ Proper data loading patterns
- ✅ SSR-compatible
- ✅ Correct route organization
- ✅ Tests pass

**Block** if:
- ❌ Not using TanStack Router patterns
- ❌ SSR violations
- ❌ Incorrect data loading
- ❌ Route organization issues
- ❌ Tests missing or failing

## Common Violations & Fixes

### Violation: Not Using File-Based Routing

**Wrong**:
```typescript
// router.tsx
const router = createRouter({
  routeTree,
  routes: [
    { path: '/dashboard', component: Dashboard }
  ]
})
```

**Fix**:
```typescript
// routes/dashboard/index.tsx
export const Route = createFileRoute('/dashboard/')({
  component: Dashboard,
})
```

### Violation: Using useEffect for Data Loading

**Wrong**:
```typescript
function DashboardPage() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    fetchData().then(setData)
  }, [])
  
  return <div>{data}</div>
}
```

**Fix**:
```typescript
export const Route = createFileRoute('/dashboard/')({
  loader: async () => {
    return await fetchData()
  },
})

function DashboardPage() {
  const data = Route.useLoaderData()
  return <div>{data}</div>
}
```

## Stand-Downs Format

When reporting findings:

```json
{
  "agentId": "frontend-tanstack",
  "findings": [
    {
      "type": "violation",
      "severity": "error",
      "file": "{REPO_ROOT}/apps/web/src/routes/dashboard/index.tsx",
      "line": 10,
      "issue": "Using useEffect for data loading instead of loader",
      "recommendation": "Move data fetching to loader function in Route definition"
    }
  ]
}
```

## Quick Reference

**Routes Location**: `{REPO_ROOT}/apps/web/src/routes/`  
**Router Location**: `{REPO_ROOT}/apps/web/src/router.tsx`

**Check Routes**:
```bash
# From {REPO_ROOT}
find apps/web/src/routes -name "*.tsx" -type f
```

---

**Remember**: TanStack Start is the framework. File-based routing is mandatory. SSR is required.
