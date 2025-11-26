# StackDock Plugin System

Composable full-stack plugin system for React frameworks. Add complete features to your StackDock app in minutes, not weeks.

## Architecture

**The Primitive**: Plugin system (composable full-stack features as npm packages)
**The Assembly**: Framework-agnostic plugins that provide routes, APIs, database schemas, components, hooks, and SSR loaders

**Inspired by**: [Better Stack](https://www.better-stack.ai/) - Composable full-stack plugin system for modern React frameworks

## Philosophy

**"Composable Features"**: Mix and match plugins like LEGO blocks. Add blog + scheduling + feedback + newsletters, all working together seamlessly.

**"Framework Agnostic"**: Works with Next.js, React Router, TanStack Router, Remix. Switch frameworks without rewriting features.

**"Full-Stack in One Package"**: Each plugin includes routes, API endpoints, database schemas, React components, hooks, loaders, and metadata generation.

**"Zero Boilerplate"**: Configure plugins and they work. No wiring up routes, API handlers, or query clients.

## Tech Stack

- **TypeScript** - TypeScript-first DX with strong types across plugins
- **React** - Modern React with hooks and concurrent features
- **TanStack Query** - Server-side prefetching and client-side data fetching
- **Zod** - TypeScript-first schema validation
- **Framework Adapters** - Next.js, React Router, TanStack Router, Remix support
- **Database Agnostic** - Prisma, Drizzle, Kysely, MongoDB, or in-memory
- **shadcn/ui** - Component primitives (copy/paste/own)
- **Tailwind CSS v4** - Utility-first styling

## Monorepo Integration

### Shared Packages

- `packages/shared` - Encryption, RBAC, schema types
- `packages/ui` - React components (shadcn/ui model)
- `packages/docks` - Dock adapters (provider integrations)
- `packages/plugins` - Plugin system (this package)

### Code Sharing Strategy

```typescript
// Import shared utilities
import { encryptApiKey } from "@stackdock/shared/encryption"
import { withRBAC } from "@stackdock/shared/rbac"

// Import shared components
import { Button } from "@stackdock/ui/button"
import { Table } from "@stackdock/ui/table"

// Import plugins
import { blogPlugin } from "@stackdock/plugins/blog"
import { schedulingPlugin } from "@stackdock/plugins/scheduling"
```

## Plugin Architecture

### Plugin Structure

Each plugin is a complete, self-contained full-stack feature:

```
packages/plugins/
├── blog/
│   ├── src/
│   │   ├── backend.ts        # Backend plugin (schema + API handler)
│   │   ├── client.ts         # Client plugin (routes + components + hooks)
│   │   ├── types.ts          # TypeScript types
│   │   └── components/       # React components
│   ├── package.json
│   └── README.md
├── scheduling/
│   ├── src/
│   │   ├── backend.ts
│   │   ├── client.ts
│   │   └── ...
│   └── package.json
└── registry.ts               # Plugin registry
```

### Backend Plugin

Exports database schema + API request handler:

```typescript
// packages/plugins/blog/src/backend.ts
import { definePlugin } from "@stackdock/plugins/core"

export const blogBackendPlugin = definePlugin({
  name: "blog",
  
  // Database schema (Prisma, Drizzle, etc.)
  schema: {
    posts: {
      id: "string",
      title: "string",
      slug: "string",
      content: "text",
      published: "boolean",
      createdAt: "datetime",
      updatedAt: "datetime"
    }
  },
  
  // API request handler
  handler: async (req, res) => {
    // CRUD operations
    if (req.method === "GET") {
      return await getPosts(req.query)
    }
    if (req.method === "POST") {
      return await createPost(req.body)
    }
    // ...
  }
})
```

### Client Plugin

Provides routes, page components, React Query hooks, and SSR loaders:

```typescript
// packages/plugins/blog/src/client.ts
import { defineClientPlugin } from "@stackdock/plugins/core"

export const blogClientPlugin = defineClientPlugin({
  name: "blog",
  
  // Routes
  routes: {
    "/blog": BlogListPage,
    "/blog/[slug]": BlogPostPage,
    "/blog/new": BlogCreatePage,
    "/blog/[slug]/edit": BlogEditPage
  },
  
  // React Query hooks
  hooks: {
    usePosts: () => useQuery({ queryKey: ["posts"], queryFn: fetchPosts }),
    usePost: (slug: string) => useQuery({ queryKey: ["post", slug], queryFn: () => fetchPost(slug) })
  },
  
  // SSR loaders (for data prefetching)
  loaders: {
    "/blog": async () => ({ posts: await fetchPosts() }),
    "/blog/[slug]": async ({ slug }) => ({ post: await fetchPost(slug) })
  }
})
```

### Plugin Usage

```typescript
// apps/web/src/lib/plugins.ts
import { createPluginStack } from "@stackdock/plugins/core"
import { blogBackendPlugin } from "@stackdock/plugins/blog/backend"
import { blogClientPlugin } from "@stackdock/plugins/blog/client"
import { schedulingBackendPlugin } from "@stackdock/plugins/scheduling/backend"
import { schedulingClientPlugin } from "@stackdock/plugins/scheduling/client"

// Backend stack
export const backendStack = createPluginStack({
  basePath: "/api/data",
  plugins: {
    blog: blogBackendPlugin(),
    scheduling: schedulingBackendPlugin()
  },
  adapter: prismaAdapter() // or drizzleAdapter(), kyselyAdapter()
})

// Client stack
export const clientStack = createPluginStack({
  basePath: "/api/data",
  plugins: {
    blog: blogClientPlugin({
      Link: NextLink,        // Framework-specific components
      Image: NextImage,
      navigate: router.push,
      refresh: router.refresh
    }),
    scheduling: schedulingClientPlugin({})
  }
})
```

## Framework Adapters

### Next.js App Router

```typescript
// app/api/data/[...path]/route.ts
import { backendStack } from "@/lib/plugins"

export async function GET(request: Request) {
  return backendStack.handle(request)
}

export async function POST(request: Request) {
  return backendStack.handle(request)
}
```

```typescript
// app/layout.tsx
import { BetterStackProvider } from "@stackdock/plugins/react"
import { clientStack } from "@/lib/plugins"

export default function Layout({ children }) {
  return (
    <BetterStackProvider stack={clientStack}>
      {children}
    </BetterStackProvider>
  )
}
```

### TanStack Router

```typescript
// src/routes/__root.tsx
import { BetterStackProvider } from "@stackdock/plugins/react"
import { clientStack } from "@/lib/plugins"

export const Route = createRootRoute({
  component: () => (
    <BetterStackProvider stack={clientStack}>
      <Outlet />
    </BetterStackProvider>
  )
})
```

### React Router

```typescript
// src/main.tsx
import { BetterStackProvider } from "@stackdock/plugins/react"
import { clientStack } from "@/lib/plugins"

createBrowserRouter([
  {
    path: "/",
    element: (
      <BetterStackProvider stack={clientStack}>
        <Outlet />
      </BetterStackProvider>
    )
  }
])
```

## Available Plugins

### Blog Plugin

**Features**:
- Content management with MDX support
- Draft/publish workflow
- SEO metadata generation
- RSS feed generation
- Sitemap generation

**Routes**:
- `/blog` - Post listing page
- `/blog/[slug]` - Individual post pages
- `/blog/new` - Create post editor
- `/blog/[slug]/edit` - Edit post page

**API**:
- `GET /api/data/blog` - List posts
- `GET /api/data/blog/[id]` - Get post
- `POST /api/data/blog` - Create post
- `PUT /api/data/blog/[id]` - Update post
- `DELETE /api/data/blog/[id]` - Delete post

**Hooks**:
- `usePosts()` - List posts
- `usePost(slug)` - Get post by slug
- `useCreatePost()` - Create post mutation
- `useUpdatePost()` - Update post mutation
- `useDeletePost()` - Delete post mutation

### Scheduling Plugin (Planned)

**Features**:
- Calendar view
- Event management
- Timezone support
- Recurring events
- Availability management

### Feedback Plugin (Planned)

**Features**:
- Feedback collection
- Feature requests
- Voting system
- Status tracking
- Public roadmap

### Newsletter Plugin (Planned)

**Features**:
- Subscriber management
- Email campaigns
- Templates
- Analytics
- Unsubscribe handling

## Plugin Development

### Creating a New Plugin

```typescript
// packages/plugins/my-plugin/src/backend.ts
import { definePlugin } from "@stackdock/plugins/core"

export const myBackendPlugin = definePlugin({
  name: "my-plugin",
  schema: {
    // Database schema
  },
  handler: async (req, res) => {
    // API handler
  }
})
```

```typescript
// packages/plugins/my-plugin/src/client.ts
import { defineClientPlugin } from "@stackdock/plugins/core"

export const myClientPlugin = defineClientPlugin({
  name: "my-plugin",
  routes: {
    // Route definitions
  },
  hooks: {
    // React Query hooks
  },
  loaders: {
    // SSR loaders
  }
})
```

### Plugin Interface

```typescript
// packages/plugins/core/types.ts
export interface BackendPlugin {
  name: string
  schema: DatabaseSchema
  handler: (req: Request, res: Response) => Promise<Response>
}

export interface ClientPlugin {
  name: string
  routes: Record<string, React.ComponentType>
  hooks: Record<string, Function>
  loaders: Record<string, Function>
}
```

## Integration with StackDock

### RBAC Integration

```typescript
// Plugins can use StackDock RBAC
import { withRBAC } from "@stackdock/shared/rbac"

export const blogBackendPlugin = definePlugin({
  handler: withRBAC("blog:write")(async (req, res) => {
    // Protected handler
  })
})
```

### Dock Integration

```typescript
// Plugins can use dock adapters
import { vercelAdapter } from "@stackdock/docks/vercel"

export const blogClientPlugin = defineClientPlugin({
  hooks: {
    useDeployBlog: () => {
      return useMutation({
        mutationFn: async (postId: string) => {
          await vercelAdapter.deploy({ projectId: "blog" })
        }
      })
    }
  }
})
```

## Development

### Prerequisites

- Node.js 18+
- TypeScript 5+
- Your chosen framework (Next.js, React Router, TanStack Router, Remix)

### Setup

```bash
cd packages/plugins
npm install
```

### Building Plugins

```bash
# Build all plugins
npm run build

# Build specific plugin
npm run build -- --filter=@stackdock/plugins-blog
```

### Testing Plugins

```bash
# Run tests
npm test

# Test specific plugin
npm test -- --filter=@stackdock/plugins-blog
```

## Architecture Decisions

### Why Composable Plugins?

1. **Reusability**: Share complete features across projects
2. **Speed**: Add features in minutes, not weeks
3. **Consistency**: Same patterns across all features
4. **Maintainability**: Update plugins independently

### Why Framework Agnostic?

1. **Flexibility**: Use your preferred framework
2. **Migration**: Switch frameworks without rewriting features
3. **Adoption**: Works with existing projects
4. **Future-proof**: New frameworks supported via adapters

### Why Full-Stack in One Package?

1. **Completeness**: Everything needed for a feature in one place
2. **Simplicity**: No wiring up routes, APIs, databases separately
3. **Type Safety**: End-to-end TypeScript types
4. **SSR**: Built-in server-side rendering support

## Comparison with Better Stack

**Similarities**:
- Composable plugin architecture
- Framework-agnostic design
- Full-stack features in one package
- TypeScript-first DX
- Zero boilerplate approach

**Differences**:
- **StackDock Integration**: Uses shared packages (RBAC, encryption, docks)
- **Registry Model**: Plugins follow copy/paste/own pattern (like dock adapters)
- **Convex Support**: Optional Convex integration for real-time features
- **Dock Integration**: Plugins can trigger deployments via dock adapters

## Future Considerations

### Plugin Marketplace

- Community-contributed plugins
- Plugin discovery and installation
- Plugin versioning and updates
- Plugin compatibility checking

### Advanced Features

- **Plugin Dependencies**: Plugins can depend on other plugins
- **Plugin Overrides**: Customize plugin behavior
- **Plugin Composition**: Combine plugins for complex features
- **Plugin Analytics**: Track plugin usage

### Integration Enhancements

- **Convex Real-time**: Real-time updates via Convex subscriptions
- **Dock Automation**: Auto-deploy on plugin data changes
- **Monitoring**: Plugin health monitoring
- **Audit Logs**: Plugin action audit logging

## Status

**Current**: Prototype/Planning phase
**Reference**: [Better Stack](https://www.better-stack.ai/) - MIT licensed, well-architected

**Next Steps**:
1. Scaffold plugin core system
2. Implement framework adapters (Next.js, TanStack Router, React Router)
3. Create blog plugin (reference implementation)
4. Add database adapter support (Prisma, Drizzle, Kysely)
5. Integrate with StackDock RBAC/auth
6. Add plugin registry and discovery

## References

- [Better Stack](https://www.better-stack.ai/) - Inspiration and reference implementation
- [Better Stack Docs](https://www.better-stack.ai/docs) - Documentation
- [Better Stack GitHub](https://github.com/better-stack-ai/better-stack) - Source code
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Zod](https://zod.dev) - Schema validation
- [shadcn/ui](https://ui.shadcn.com) - Component primitives
