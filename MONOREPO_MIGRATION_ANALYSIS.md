# Monorepo Migration Analysis

**Date:** October 25, 2025  
**Current Structure:** 3 separate repositories  
**Proposed Structure:** Single Turborepo monorepo

---

## Current State

### Repository 1: stackdock (Main Application)
**Location:** `C:\Users\veter\Desktop\DEV\github\next\stackdock`  
**Purpose:** Main StackDock Next.js application for multi-cloud management  
**Status:** Active development, currently on `debug/api-exploration` branch

**Key Features:**
- GridPane API integration
- Multi-provider dashboard (in development)
- Server Actions architecture
- shadcn/ui component library
- Rate limiting and request logging
- API endpoint mapper and explorer

**Technology Stack:**
- Next.js 15.5.6 (Turbopack)
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui components
- React Server Components

**Current Structure:**
```
stackdock/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── dashboard/    # Main dashboard
│   │   ├── gridpane-explorer/  # API testing UI
│   │   └── api/          # API routes
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── sidebar/     # Navigation
│   │   └── sites/       # Site-specific components
│   ├── lib/
│   │   └── gridpane/    # GridPane API integration
│   └── hooks/
├── docs/
│   └── gridpane/        # API documentation
├── public/
└── test-data/
```

---

### Repository 2: stackdock-waitlist (Landing Page)
**Location:** `C:\Users\veter\Desktop\DEV\github\next\stackdock-waitlist`  
**Purpose:** Official waitlist and marketing site  
**Status:** Active

**Key Features:**
- Double opt-in email verification
- CAN-SPAM compliant
- Resend audience management (currently suspended)
- Custom domain support
- Privacy policy

**Technology Stack:**
- Next.js
- TypeScript
- Email integration (Resend - suspended, alternative in progress)

**Current Structure:**
```
stackdock-waitlist/
├── app/
├── components/
├── docs/
├── lib/
├── public/
└── styles/
```

---

### Repository 3: gridpane-dashboard
**Location:** `C:\Users\veter\Desktop\DEV\github\next\gridpane-dashboard`  
**Purpose:** Legacy GridPane-specific dashboard  
**Status:** Superseded by main stackdock repo

**Decision:** **SKIP - Will not be migrated to monorepo**

**Notes:**
- This is an earlier version of what became the main stackdock application
- Functionality is fully replaced by current stackdock repo
- Will remain as separate repository for historical reference

---

## Shared Code Opportunities

### 1. UI Components
**Currently Duplicated:**
- Button, Card, Badge, Alert components (likely similar across projects)
- Form components (Input, Label, Textarea)
- Layout components (Sidebar, Navigation)
- Theme provider and dark mode logic

**Proposed:** `packages/ui`
- Export all shadcn/ui components as shared package
- Include theme provider and CSS custom properties
- Typography and spacing utilities

### 2. Configuration
**Currently Duplicated:**
- `tsconfig.json` settings
- ESLint configuration
- Prettier configuration
- Tailwind CSS configuration
- Next.js configuration patterns

**Proposed:** `packages/config`
- `@stackdock/config-typescript` - Shared TypeScript configs
- `@stackdock/config-eslint` - ESLint rules
- `@stackdock/config-tailwind` - Tailwind presets and design tokens

### 3. Utilities
**Currently Duplicated:**
- `cn()` utility for className merging
- Type definitions
- API error handling patterns
- Rate limiting logic (potentially reusable for other providers)

**Proposed:** `packages/utils`
- Shared utility functions
- Type definitions
- Common constants

### 4. API Integrations
**Could Be Shared:**
- GridPane API client (currently in main app)
- Future provider integrations (Kinsta, Cloudways, etc.)

**Proposed:** `packages/providers`
- `@stackdock/provider-gridpane`
- `@stackdock/provider-kinsta`
- `@stackdock/provider-cloudways`
- Shared provider interface/types

---

## Proposed Monorepo Structure

```
stackdock-monorepo/
├── apps/
│   ├── web/                    # Main StackDock application
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   ├── landing/                # Waitlist/marketing site
│   │   ├── app/
│   │   ├── components/
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   └── docs/                   # Documentation site (optional - Fumadocs)
│       └── ...
│
├── packages/
│   ├── ui/                     # Shared React components
│   │   ├── src/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── config/                 # Shared configurations
│   │   ├── eslint/
│   │   │   ├── index.js
│   │   │   └── package.json
│   │   ├── typescript/
│   │   │   ├── base.json
│   │   │   ├── nextjs.json
│   │   │   └── package.json
│   │   └── tailwind/
│   │       ├── index.js
│   │       └── package.json
│   │
│   ├── utils/                  # Shared utilities
│   │   ├── src/
│   │   │   ├── cn.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── providers/              # API provider integrations
│       ├── gridpane/
│       │   ├── src/
│       │   │   ├── client.ts
│       │   │   ├── rate-limiter.ts
│       │   │   ├── types.ts
│       │   │   └── index.ts
│       │   ├── package.json
│       │   └── tsconfig.json
│       ├── kinsta/
│       └── shared/             # Shared provider interfaces
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # Updated for monorepo
│       └── deploy.yml          # Updated for monorepo
│
├── docs/                       # Monorepo-level documentation
│   └── migration/
│       └── MIGRATION_GUIDE.md
│
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # pnpm workspaces config
├── turbo.json                  # Turborepo pipeline config
├── tsconfig.json               # Root TypeScript config
├── .gitignore
└── README.md
```

---

## Migration Strategy

### Phase 1: Setup Foundation (Week 1)
1. **Initialize Turborepo**
   ```bash
   cd C:\Users\veter\Desktop\DEV\github\next
   npx create-turbo@latest stackdock-monorepo
   ```

2. **Configure pnpm workspaces**
   - Create `pnpm-workspace.yaml`
   - Define workspace patterns

3. **Setup root configuration**
   - Root `package.json` with workspace dependencies
   - Root `tsconfig.json` with path mappings
   - Root `.gitignore`

### Phase 2: Migrate Main App (Week 1-2)
1. **Copy stackdock → apps/web**
   - Preserve git history if possible
   - Update `package.json` name to `@stackdock/web`
   - Update import paths for shared packages

2. **Extract shared components → packages/ui**
   - Identify all shadcn/ui components
   - Move to `packages/ui/src/`
   - Update imports in `apps/web`

3. **Extract configurations → packages/config**
   - ESLint, TypeScript, Tailwind configs
   - Create extendable base configurations

### Phase 3: Migrate Landing Page (Week 2)
1. **Copy stackdock-waitlist → apps/landing**
   - Update `package.json` name to `@stackdock/landing`
   - Use shared `packages/ui` components
   - Use shared `packages/config`

2. **Consolidate duplicated code**
   - Replace local components with `@stackdock/ui`
   - Update styling to use shared Tailwind config

### Phase 4: Extract Provider Logic (Week 2-3)
1. **Create packages/providers/gridpane**
   - Move GridPane API client from `apps/web`
   - Extract rate limiter, request logger
   - Define shared provider interface

2. **Create packages/providers/shared**
   - Define `HostingProvider` interface
   - Shared types and utilities

### Phase 5: Update CI/CD (Week 3)
1. **Update GitHub Actions**
   - Install pnpm in workflows
   - Use Turborepo's `turbo run` commands
   - Configure Vercel for monorepo deployments

2. **Setup deployment**
   - Configure Vercel projects for `apps/web` and `apps/landing`
   - Setup build caching with Turborepo

### Phase 6: Testing & Documentation (Week 3-4)
1. **End-to-end testing**
   - Test both applications
   - Verify shared packages work correctly
   - Test build and deployment processes

2. **Update documentation**
   - README with monorepo setup instructions
   - CONTRIBUTING guide for monorepo workflow
   - Migration notes for team members

---

## Decisions Made

### 1. gridpane-dashboard Repository
**Decision:** **SKIP** - Leave as separate repository
- Functionality is fully replaced by main stackdock application
- Will remain separate for historical reference only
- Not included in monorepo migration

### 2. Package Manager
**Decision:** **pnpm** ✓
- Best performance for monorepos
- Efficient disk space usage with content-addressable storage
- Strict dependency resolution prevents phantom dependencies
- Excellent workspace support
- Fast installation times

### 3. Monorepo Tool
**Decision:** **Turborepo** ✓
- Full-featured build system with intelligent caching
- Optimized for JavaScript/TypeScript monorepos
- Native Next.js and Vercel integration
- Remote caching capabilities for CI/CD
- Pipeline orchestration for complex builds

### 4. Shared Package Granularity
**Decision:** **Hybrid approach** ✓
- Bundled UI package: `@stackdock/ui` with all shadcn components
- Granular provider packages: `@stackdock/provider-gridpane`, etc.
- Bundled config packages: `@stackdock/config-typescript`, etc.
- Single utils package: `@stackdock/utils`

This balances simplicity with flexibility for future growth.

---

## Risk Assessment

### High Risk
- **CI/CD Pipeline Changes:** Deployment workflows need significant updates
  - **Mitigation:** Test in staging environment first
  
- **Import Path Changes:** Thousands of imports need updating
  - **Mitigation:** Use automated refactoring tools, thorough testing

### Medium Risk
- **Dependency Hoisting Issues:** Some packages may not work when hoisted
  - **Mitigation:** Use pnpm's `shamefully-hoist` or package-specific configs
  
- **Build Time Increase:** More packages = longer build times initially
  - **Mitigation:** Turborepo caching will offset this over time

### Low Risk
- **Team Learning Curve:** Developers need to understand monorepo concepts
  - **Mitigation:** Clear documentation, pair programming sessions

---

## Timeline Estimate

**Total Duration:** 3-4 weeks

- **Week 1:** Setup + Main app migration + Extract shared packages
- **Week 2:** Landing page migration + Provider extraction
- **Week 3:** CI/CD updates + Testing
- **Week 4:** Documentation + Buffer for issues

**Parallel Work:** Some migration work can happen while feature development continues on `debug/api-exploration` branch.

---

## Success Criteria

- [ ] Both `apps/web` and `apps/landing` build and run successfully
- [ ] Shared components from `packages/ui` work in both apps
- [ ] Shared configs applied correctly across all packages
- [ ] CI/CD pipelines successfully build and deploy both apps
- [ ] No code duplication between apps for shared functionality
- [ ] Local development workflow is smooth (`pnpm dev`)
- [ ] Build times are acceptable (with Turborepo caching)
- [ ] All tests pass after migration
- [ ] Documentation is complete and accurate

---

## Next Steps

1. **Create GitHub Issue** with this analysis and proposed structure
2. **Get team consensus** on:
   - Whether to proceed with monorepo migration
   - Package manager choice (pnpm recommended)
   - What to do with gridpane-dashboard repo
   - Timeline and priorities
3. **Create migration branch** from main
4. **Begin Phase 1** if approved

---

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Vercel Monorepo Guide](https://vercel.com/docs/concepts/monorepos)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
