![Image of Stackdock logo](/docs/stackdock-logo-dark-mode.svg "Stackdock logo")

<div align="center">
  <h1>StackDock</h1>
  <p><strong>Open Source Multi-Cloud Management Platform</strong></p>
  <p>Manage websites, apps, databases, servers, and APM tools across multiple providers from a unified interface.</p>
  <p>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript"/>
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License"/>
    </a>
     <a href="https://github.com/stackdock/stackdock/stargazers">
      <img src="https://img.shields.io/github/stars/stackdock/stackdock?style=flat-square&logo=github" alt="GitHub stars"/>
    </a>
  </p>
</div>

---

## The Vision

**Remember how shadcn/ui changed UI development?**

```bash
npx shadcn add button
# → Copies component into YOUR codebase
# → You own the code
# → No vendor lock-in
```

**StackDock does the same for infrastructure.**

```bash
npx stackdock add gridpane
# → Copies infrastructure adapter into YOUR codebase
# → You own the dock adapter
# → Customize, fork, publish your own
```

### Why This Matters

- **WordPress democratized content management**
- **StackDock democratizes infrastructure management**
- **True FOSS**: You own the code (docks, UI, everything)
- **Composable**: Build your perfect control plane
- **Extensible**: If it has an API, it can be a dock

---

## Welcome Aboard Captain! ⚓️

You're early – but welcome to the shipyard! The blueprints are evolving, the vision is locked in, and we're building in public.

**This isn't just another tool.** It's infrastructure's WordPress moment.

Star the repo to watch the build! ⭐

---

## ⚠️ PRE-ALPHA WARNING ⚠️

**This is pre-alpha software. NOT ready for production.**

- Breaking changes frequent
- Core features under development
- Database schema evolving
- DO NOT use with critical infrastructure

**For early contributors only.** Star for updates on stable releases.

---

## 🧭 Vision & Architecture

### The Three Registries

1. **Docks Registry**: Infrastructure adapters (copy/paste/own)
   - GridPane, Vercel, AWS, DigitalOcean, Cloudflare, etc.
   - Community-built and official adapters
   - Translates provider APIs to universal schema

2. **UI Registry**: Dashboard components (shadcn/ui model)
   - Server health widgets, deployment timelines, etc.
   - Works with ANY provider (provider-agnostic)
   - Copy, customize, own

3. **The Platform**: Orchestration layer
   - Universal data model (schema.ts)
   - RBAC enforcement (unlimited users)
   - Encryption & security (AES-256-GCM)
   - Audit logging
   - Real-time sync

### Core Architecture

**Universal Tables** (Provider-Agnostic):
- `servers`: AWS, DigitalOcean, Vultr, Hetzner → ONE table
- `webServices`: Vercel, Netlify, Railway, GridPane → ONE table
- `domains`: Cloudflare, Route53, Namecheap → ONE table

**Dock Adapters** (Translators):
- GridPane API → Universal `webServices` table
- Vercel API → Universal `webServices` table
- Provider-specific data in `fullApiData` field

**See [ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md) for complete details.**

---

## 🚀 Quick Start

**Prerequisites**: Node.js 18+, npm 9+

```bash
# Clone & install
git clone https://github.com/stackdock/stackdock.git
cd stackdock
npm install

# Setup environment
node scripts/generate-encryption-key.js
# Create apps/web/.env.local with your Convex + Clerk values (see below)
# Paste the generated ENCRYPTION_MASTER_KEY into apps/web/.env.local

# Start Convex (terminal 1)
npm run dev:convex

# Start app (terminal 2)
cd apps/web
npm run dev
```

Create `apps/web/.env.local` with values like:

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

**Open http://localhost:3000**

You should see:
- Landing page with StackDock branding
- **Green "Connected" status** if Convex is configured correctly
- Connection status indicator shows: "Connected • Convex is connected!"

---

## ✅ Current Status

- ✅ **TanStack Start** - Fully configured with file-based routing
- ✅ **Convex** - Connected and working (test query available)
- ✅ **Clerk** - Authentication integrated and working
- ✅ **User Sync** - Auto-syncs users from Clerk to Convex
- ⏳ **Dock Adapters** - Ready to build once encryption is added

---

## 📚 Documentation

All documentation is organized in `docs/`:

### Architecture
- **[ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md)** - Complete system design
- **[SECURITY.md](./docs/architecture/SECURITY.md)** - Security patterns
- **[RBAC.md](./docs/architecture/RBAC.md)** - Permission system

### Guides
- **[CONTRIBUTING.md](./docs/guides/CONTRIBUTING.md)** - Development workflow
- **[CONVEX_SETUP.md](./docs/guides/CONVEX_SETUP.md)** - Convex integration guide ⭐
- **[CLERK_SETUP.md](./docs/guides/CLERK_SETUP.md)** - Clerk authentication setup ⭐
- **[DOCK_ADAPTER_GUIDE.md](./docs/guides/DOCK_ADAPTER_GUIDE.md)** - Build adapters
- **[REGISTRY_GUIDE.md](./docs/guides/REGISTRY_GUIDE.md)** - Build UI components

### Troubleshooting
- **[TROUBLESHOOTING.md](./docs/troubleshooting/TROUBLESHOOTING.md)** - Common issues
- **[CURRENT_ISSUE.md](./docs/troubleshooting/CURRENT_ISSUE.md)** - Active issues

### Reference
- **[docs/README.md](./docs/README.md)** - Documentation index
- **[.cursorrules](./.cursorrules)** - AI assistant rules
- **[AI-HALL-OF-SHAME.md](./AI-HALL-OF-SHAME.md)** - Lessons learned (ALWAYS stays in root)

---

## 🎯 MVP Roadmap (First Demo)

**Goal**: Multi-provider read-only dashboard

- [x] Architecture documentation
- [x] TanStack Start app setup
- [x] Convex integration ⭐
- [x] Clerk authentication ⭐
- [x] User auto-sync to Convex ⭐
- [ ] RBAC implementation
- [ ] Encryption system
- [ ] GridPane dock adapter
- [ ] Vercel dock adapter
- [ ] DigitalOcean dock adapter
- [ ] Unified infrastructure dashboard
- [ ] Project resource linking
- [ ] Client portal

**Target**: Working demo with 3-5 providers

---

## 🔌 Provider Support

### Planned Docks (Adapters)

**PaaS/Server Management**:
GridPane, Kinsta, Rocket.net, RunCloud, Coolify, Cloudways, Vercel, Netlify, Render, Fly.io, Railway, Laravel Forge, Ploi, InstaWP

**IaaS**:
AWS, GCP, Azure, Hetzner, DigitalOcean, Linode, Vultr

**DNS/Domains**:
Cloudflare, Route53, Namecheap

**APM/Monitoring**:
Posthog, New Relic, Sentry, Datadog

**If it has an API, it can be a dock.**

---

## 🛠️ Tech Stack

- **[TanStack Start](https://tanstack.com/start)** - Full-stack React framework
- **[Convex](https://convex.dev)** - Real-time database
- **[Clerk](https://clerk.com)** - Authentication & orgs
- **[XState](https://xstate.js.org)** - State machines
- **[shadcn/ui](https://ui.shadcn.com)** - Component primitives
- **[Tailwind CSS 4](https://tailwindcss.com)** - Styling


## 🤝 Contributing

We welcome contributions! Please read:

- [CONTRIBUTING.md](./docs/guides/CONTRIBUTING.md) - Development workflow
- [DOCK_ADAPTER_GUIDE.md](./docs/guides/DOCK_ADAPTER_GUIDE.md) - Build adapters
- [REGISTRY_GUIDE.md](./docs/guides/REGISTRY_GUIDE.md) - Build UI components

**Ways to contribute**:
1. Build dock adapters for new providers
2. Create UI components for the registry
3. Improve documentation
4. Report bugs
5. Share feedback

---

## 🔒 Security

**Reporting Vulnerabilities**: security@stackdock.dev

**DO NOT** create public GitHub issues for security vulnerabilities.

See [SECURITY.md](./docs/architecture/SECURITY.md) for complete security documentation.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 📞 Contact

- **Website**: [stackdock.dev](https://stackdock.dev)
- **Security**: security@stackdock.dev
- **General**: contact@stackdock.dev
- **Issues**: [GitHub Issues](https://github.com/stackdock/stackdock/issues)

---

<div align="center">

**StackDock** - Infrastructure's WordPress Moment

[Website](https://stackdock.dev) • [Documentation](./docs/architecture/ARCHITECTURE.md) • [Contributing](./docs/guides/CONTRIBUTING.md)

*Built with ⚓️ for the captains navigating the multi-cloud ocean*

</div>
