# StackDock™

Open source developer multi-cloud infrastructure management platform.

**Trademark Notice**: StackDock™ is a trademark with an intent-to-use application filed in October 2025. See [TRADEMARK.md](./TRADEMARK.md) for usage policy.

## What It Is

StackDock provides a unified interface for managing infrastructure across multiple providers. You own the code.

**Three Registries:**
1. **Docks Registry** (`packages/docks/`) - Infrastructure adapters (copy/paste/own)
2. **UI Registry** (`packages/ui/`) - Dashboard components (shadcn/ui model)
3. **The Platform** (`convex/`, `apps/web/`) - Orchestration layer (RBAC, encryption, audit)

## Architecture

**Universal Tables** (Provider-Agnostic):
- `servers` - Vultr, DigitalOcean, Linode, Hetzner, Coolify
- `webServices` - Vercel, Netlify, Cloudflare, Coolify
- `domains` - Cloudflare
- `databases` - Turso, Neon, Convex, PlanetScale, Coolify
- `projects` - GitHub (repositories, branches, issues, commits)
- `issues` - Sentry (monitoring)
- `monitors` - Better Stack (uptime)

**Dock Adapters** translate provider APIs to universal schema. Provider-specific data preserved in `fullApiData` field.

See [docs/architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md) for complete details.

## Quick Start

**Prerequisites**: Node.js 18+, npm 9+

```bash
# Clone & install
git clone https://github.com/stackdock/stackdock.git
cd stackdock
npm install

# Setup environment
node scripts/generate-encryption-key.js
# Create apps/web/.env.local with your Convex + Clerk values
# Paste the generated ENCRYPTION_MASTER_KEY into apps/web/.env.local

# Start Convex (terminal 1)
npm run dev:convex

# Start app (terminal 2)
cd apps/web
npm run dev
```

Create `apps/web/.env.local`:

```
VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
CONVEX_DEPLOYMENT=dev:<your-deployment>
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
ENCRYPTION_MASTER_KEY=<64-char-hex-from-generator>
VITE_APP_URL=http://localhost:3000
NODE_ENV=development
```

Open http://localhost:3000

## Current Status

**Status**: Pre-alpha. Read-only mode.

**What Works:**
- 16 providers integrated (Vercel, Netlify, Cloudflare, Turso, Neon, Convex, PlanetScale, Vultr, DigitalOcean, Linode, Hetzner, Coolify, GitHub, Sentry, Better Stack)
- Universal schema validated across provider types
- Real-time sync via Convex subscriptions
- RBAC, encryption, audit logging

**What Doesn't:**
- Write operations (create, modify, delete, provision) are not implemented
- All functionality is view-only

## Documentation

- [Architecture](./docs/architecture/ARCHITECTURE.md) - System design
- [Security](./docs/architecture/SECURITY.md) - Security patterns
- [RBAC](./docs/architecture/RBAC.md) - Permission system
- [Contributing](./docs/guides/CONTRIBUTING.md) - Development workflow
- [Dock Adapter Guide](./docs/guides/DOCK_ADAPTER_GUIDE.md) - Build adapters
- [Registry Guide](./docs/guides/REGISTRY_GUIDE.md) - Build UI components

## Tech Stack

- [TanStack Start](https://tanstack.com/start) - Full-stack React framework
- [Convex](https://convex.dev) - Real-time database
- [Clerk](https://clerk.com) - Authentication & orgs
- [XState](https://xstate.js.org) - State machines
- [shadcn/ui](https://ui.shadcn.com) - Component primitives
- [Tailwind CSS 4](https://tailwindcss.com) - Styling

## License

MIT License - see [LICENSE](LICENSE) for details.

## Security

Report vulnerabilities to security@stackdock.dev. Do not create public GitHub issues for security vulnerabilities.

See [SECURITY.md](./docs/architecture/SECURITY.md) for complete security documentation.
