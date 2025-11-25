# StackDock CMS

Content Management System for static site generators. Built on the "Registry Model" - you own the code.

## Architecture

**The Primitive**: CMS adapter system (copy/paste/own pattern, like dock adapters)
**The Assembly**: User-friendly editing interface for content files

**Inspired by**: [Pages CMS](https://github.com/pages-cms/pages-cms) - The No-Hassle CMS for Static Site Generators

## Philosophy

**"You Own the Code"**: CMS adapters are TypeScript files copied into your repo. Edit them. Customize them. Own them.

**"The Registry Model"**: We don't build a platform. We build building blocks. If you need custom logic, you edit the adapter source code.

## Tech Stack

- **Next.js** - Web framework (SSR-capable)
- **TanStack Router** - File-based routing
- **shadcn/ui** - Component primitives (copy/paste/own)
- **Tailwind CSS** - Styling
- **Drizzle ORM** - Database abstraction
- **GitHub API** - File management (via GitHub App)
- **Convex** - Optional real-time sync (when configured)

## Monorepo Integration

### Shared Packages

- `packages/shared` - Encryption, RBAC, schema types
- `packages/ui` - React components (shadcn/ui model)
- `packages/docks` - Dock adapters (can integrate with CMS for deployment)

### Code Sharing Strategy

```typescript
// Import shared utilities
import { encryptApiKey } from "@stackdock/shared/encryption"
import { withRBAC } from "@stackdock/shared/rbac"

// Import shared components
import { Button } from "@stackdock/ui/button"
import { Editor } from "@stackdock/ui/editor"

// Import dock adapters (for deployment integration)
import { vercelAdapter } from "@stackdock/docks/vercel"
```

## CMS Adapter Pattern

### The Primitive: CMS Adapter

Each static site generator gets a CMS adapter:

```
packages/cms-adapters/
├── jekyll/
│   ├── adapter.ts        # Jekyll-specific logic
│   ├── fields.ts         # Field definitions
│   └── README.md
├── nextjs/
│   ├── adapter.ts        # Next.js-specific logic
│   ├── fields.ts
│   └── README.md
├── hugo/
│   ├── adapter.ts        # Hugo-specific logic
│   ├── fields.ts
│   └── README.md
└── astro/
    ├── adapter.ts        # Astro-specific logic
    ├── fields.ts
    └── README.md
```

### Adapter Interface

```typescript
// packages/cms-adapters/_types.ts
export interface CMSAdapter {
  // Detect if adapter applies to a repository
  detect(repo: GitHubRepo): boolean
  
  // Parse content structure
  parseStructure(files: GitHubFile[]): ContentStructure
  
  // Read content file
  readContent(file: GitHubFile): Promise<Content>
  
  // Write content file
  writeContent(file: GitHubFile, content: Content): Promise<void>
  
  // Get field definitions for content type
  getFields(contentType: string): FieldDefinition[]
  
  // Validate content
  validate(content: Content, fields: FieldDefinition[]): ValidationResult
}
```

### Example: Jekyll Adapter

```typescript
// packages/cms-adapters/jekyll/adapter.ts
export const jekyllAdapter: CMSAdapter = {
  detect(repo) {
    return repo.hasFile("_config.yml") || repo.hasDirectory("_posts")
  },
  
  parseStructure(files) {
    // Parse Jekyll structure (_posts, _pages, _collections)
    return {
      collections: ["posts", "pages"],
      frontMatterFormat: "yaml",
      contentFormat: "markdown"
    }
  },
  
  readContent(file) {
    // Parse front matter + content
    const { frontMatter, content } = parseFrontMatter(file.content)
    return { frontMatter, content }
  },
  
  writeContent(file, content) {
    // Combine front matter + content
    const combined = combineFrontMatter(content.frontMatter, content.content)
    return writeFile(file.path, combined)
  },
  
  getFields(contentType) {
    // Return field definitions for Jekyll content type
    return jekyllFields[contentType] || []
  },
  
  validate(content, fields) {
    // Validate against Jekyll schema
    return validateJekyllContent(content, fields)
  }
}
```

## Project Structure

```
apps/cms/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (cms)/             # CMS routes
│   │   │   ├── collections/   # Collection management
│   │   │   ├── media/         # Media library
│   │   │   └── settings/      # CMS settings
│   │   └── api/               # API routes
│   │       ├── github/        # GitHub integration
│   │       ├── content/       # Content CRUD
│   │       └── webhook/       # GitHub webhooks
│   ├── components/
│   │   ├── editor/            # Content editor
│   │   ├── fields/            # Field components
│   │   └── media/             # Media components
│   ├── lib/
│   │   ├── adapters/          # CMS adapter registry
│   │   ├── github/            # GitHub API client
│   │   └── content/           # Content parsing/writing
│   └── types/
│       └── cms.ts             # CMS types
├── db/
│   ├── schema.ts              # Drizzle schema
│   └── migrations/            # Database migrations
├── package.json
├── next.config.mjs
└── README.md
```

## Integration with StackDock

### GitHub Dock Integration

CMS can use existing GitHub dock adapter:

```typescript
// Use GitHub dock for authentication
import { useGitHubDock } from "@stackdock/docks/github"

// Access GitHub API through dock
const github = useGitHubDock()
const files = await github.listFiles(repo, path)
```

### Deployment Integration

CMS can trigger deployments via dock adapters:

```typescript
// After content update, trigger deployment
import { vercelAdapter } from "@stackdock/docks/vercel"

await vercelAdapter.deploy({
  projectId: "my-project",
  trigger: "cms-update"
})
```

## Features

### Content Management

- **File-based editing**: Edit markdown, YAML, JSON files directly
- **Front matter editing**: Visual editor for front matter fields
- **Media library**: Upload and manage images/assets
- **Collection management**: Organize content by collections
- **Preview**: Preview content before publishing

### Static Site Generator Support

**Planned Adapters**:
- ✅ Jekyll (reference implementation)
- 📋 Next.js (App Router + Pages Router)
- 📋 Hugo
- 📋 Astro
- 📋 VuePress/VitePress
- 📋 Docusaurus
- 📋 11ty (Eleventy)
- 📋 Gatsby

### GitHub Integration

- **GitHub App**: Authenticate via GitHub App (like Pages CMS)
- **File operations**: Read/write files via GitHub API
- **Webhooks**: Real-time updates via GitHub webhooks
- **Branch support**: Edit on branches, merge via PR

### Authentication & Authorization

- **Clerk**: User authentication (shared with StackDock)
- **RBAC**: Role-based access control (shared with StackDock)
- **GitHub permissions**: Repository-level permissions

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase)
- GitHub App (for GitHub integration)

### Setup

```bash
cd apps/cms
npm install

# Copy environment variables
cp .env.example .env.local

# Setup database
npm run db:migrate

# Run development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cms

# GitHub App (for file operations)
GITHUB_APP_ID=your_app_id
GITHUB_APP_PRIVATE_KEY=your_private_key
GITHUB_APP_CLIENT_ID=your_client_id
GITHUB_APP_CLIENT_SECRET=your_client_secret
GITHUB_APP_WEBHOOK_SECRET=your_webhook_secret

# Clerk (shared with StackDock)
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex (optional, for real-time sync)
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Encryption (shared with StackDock)
ENCRYPTION_MASTER_KEY=your_64_char_hex_key
```

## Architecture Decisions

### Why GitHub API?

1. **Universal**: Works with any static site generator
2. **Version control**: Content is versioned automatically
3. **Collaboration**: PR workflow for content reviews
4. **No vendor lock-in**: Content stays in your repo

### Why Adapter Pattern?

1. **Extensibility**: Add new SSG support via adapters
2. **Ownership**: Users copy adapters into their repo
3. **Customization**: Edit adapter code for custom needs
4. **Registry model**: Same pattern as dock adapters

### Why File-Based?

1. **Simplicity**: No database for content (GitHub is the source of truth)
2. **Portability**: Content can be used outside CMS
3. **Versioning**: Git history for all changes
4. **Independence**: Works without CMS if needed

## Comparison with Pages CMS

**Similarities**:
- GitHub-based file editing
- Static site generator support
- User-friendly interface
- MIT licensed

**Differences**:
- **Adapter pattern**: CMS adapters are copy/paste/own (like dock adapters)
- **StackDock integration**: Uses shared packages (RBAC, encryption, docks)
- **Deployment integration**: Can trigger deployments via dock adapters
- **Registry model**: Adapters live in registry, users copy them

## Future Considerations

### Multi-Provider Support

Beyond GitHub:
- GitLab adapter
- Bitbucket adapter
- Local file system adapter (for desktop)

### Advanced Features

- **Content scheduling**: Schedule content publication
- **Content templates**: Reusable content templates
- **Content relationships**: Link related content
- **Content search**: Full-text search across content
- **Content analytics**: Track content performance

### Integration with StackDock Platform

- **Deployment automation**: Auto-deploy on content update
- **Infrastructure monitoring**: Monitor site health
- **Multi-site management**: Manage multiple sites from one dashboard

## Status

**Current**: Prototype/Planning phase
**Reference**: [Pages CMS](https://github.com/pages-cms/pages-cms) - MIT licensed, well-architected

**Next Steps**:
1. Scaffold Next.js app structure
2. Implement GitHub App integration
3. Create Jekyll adapter (reference implementation)
4. Build content editor UI
5. Add media library
6. Integrate with StackDock RBAC/auth

## References

- [Pages CMS](https://github.com/pages-cms/pages-cms) - Inspiration and reference implementation
- [Pages CMS Docs](https://pagescms.org/docs) - Documentation
- [GitHub App API](https://docs.github.com/en/apps) - GitHub App documentation
- [Drizzle ORM](https://orm.drizzle.team) - Database ORM
- [shadcn/ui](https://ui.shadcn.com) - Component primitives
