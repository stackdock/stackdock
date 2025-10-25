# [Refactor] Migrate App and Landing Page to Monorepo

**Labels:** `refactor`, `architecture`, `chore`, `DX`  
**Priority:** Medium  
**Effort:** Large (3-4 weeks)

---

## Problem Statement

Currently, the StackDock application and the marketing landing page (stackdock-waitlist) reside in separate repositories at:
- `stackdock/` - Main application
- `stackdock-waitlist/` - Landing page

*(Note: The legacy `gridpane-dashboard/` repository will remain separate and is not included in this migration.)*

This separation leads to several inefficiencies:

### Code Duplication
Shared components (UI elements, branding, utilities) need to be maintained in multiple places or published as separate packages, increasing overhead.

### Configuration Drift
Maintaining consistent configurations (ESLint, Prettier, TypeScript, Tailwind) across multiple repos is error-prone and time-consuming.

### Dependency Management
Managing shared dependencies across projects becomes more complex, with version mismatches and duplicate installations.

### Coordination Overhead
Making changes that affect both the app and the landing page (e.g., branding updates, shared components) requires coordinating changes across multiple repositories.

### CI/CD Complexity
Setting up and maintaining separate build/deployment pipelines for each repo adds unnecessary complexity.

---

## Proposed Solution: Adopt a Monorepo Structure

We will migrate both the main StackDock application and the landing page into a single monorepo. This will allow for:
- Better code sharing
- Streamlined configuration
- Simplified dependency management
- More cohesive development
- Unified CI/CD pipeline

### Chosen Tool: Turborepo + pnpm

**Why Turborepo:**
- Optimized for JavaScript/TypeScript monorepos
- Integrates perfectly with Next.js and Vercel
- Offers build caching and incremental builds
- Simplifies scripting across packages
- Remote caching for CI/CD acceleration
- Robust framework for managing workspaces

**Why pnpm:**
- Most efficient package manager for monorepos
- Fast installation with content-addressable storage
- Strict dependency resolution prevents phantom dependencies
- Excellent workspace support
- Saves disk space across projects
- Better security with isolated node_modules

---

## Proposed Structure

```
stackdock-monorepo/
├── apps/
│   ├── web/                    # Main StackDock Next.js Application
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   └── landing/                # Next.js Landing Page/Marketing Site
│       ├── app/
│       ├── components/
│       ├── package.json
│       └── next.config.ts
│
├── packages/
│   ├── ui/                     # Shared React components (shadcn/ui)
│   │   ├── src/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
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
│   ├── utils/                  # Shared utility functions/types
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
│       │   └── package.json
│       └── shared/             # Shared provider interfaces
│
├── package.json                # Root package.json (defines workspaces)
├── pnpm-workspace.yaml         # pnpm workspaces configuration
├── turbo.json                  # Turborepo pipeline configuration
├── tsconfig.json               # Root tsconfig.json
└── README.md
```

---

## Acceptance Criteria

- [ ] A single GitHub repository contains the code for both the web application and the landing page
- [ ] Both `apps/web` and `apps/landing` can be built and run successfully from within the monorepo structure
- [ ] Shared components from `packages/ui` are successfully imported and used in both applications
- [ ] Shared configurations (`packages/config`) are correctly applied to both applications
- [ ] Dependencies are correctly managed within the workspace structure with pnpm
- [ ] CI/CD pipelines (GitHub Actions) are updated to correctly build, test, and deploy both applications from the monorepo
- [ ] Local development workflows work correctly (`pnpm dev:web`, `pnpm dev:landing`)
- [ ] Build times are acceptable with Turborepo caching enabled
- [ ] All existing tests pass after migration
- [ ] Documentation is updated to reflect the new monorepo structure

---

## Tasks

### Phase 1: Foundation Setup
- [ ] Initialize new monorepo structure using Turborepo (`npx create-turbo@latest`)
- [ ] Configure pnpm workspaces (`pnpm-workspace.yaml`)
- [ ] Setup root `package.json` with workspace dependencies
- [ ] Configure root `tsconfig.json` with path mappings
- [ ] Setup `turbo.json` with initial pipeline configuration

### Phase 2: Main Application Migration
- [ ] Move existing `stackdock` code into `apps/web` directory
- [ ] Update `package.json` in `apps/web` to reference workspace packages
- [ ] Identify and extract shared UI components into `packages/ui`
- [ ] Update imports in `apps/web` to use `@stackdock/ui`
- [ ] Extract shared configurations (ESLint, TSConfig, Tailwind) into `packages/config`
- [ ] Update `apps/web` configurations to extend shared configs

### Phase 3: Landing Page Migration
- [ ] Move existing `stackdock-waitlist` code into `apps/landing` directory
- [ ] Update `package.json` in `apps/landing` to reference workspace packages
- [ ] Replace local components with shared `@stackdock/ui` components
- [ ] Apply shared configurations from `packages/config`
- [ ] Update imports and resolve any conflicts

### Phase 4: Provider Extraction
- [ ] Move GridPane API integration from `apps/web/src/lib/gridpane` to `packages/providers/gridpane`
- [ ] Extract rate limiter and request logger into provider package
- [ ] Create `packages/providers/shared` with common provider interfaces
- [ ] Identify and move shared utility functions/types into `packages/utils`

### Phase 5: CI/CD Updates
- [ ] Update GitHub Actions workflows to install pnpm
- [ ] Configure Turborepo commands in CI (`turbo run build lint test`)
- [ ] Setup Vercel monorepo deployment configuration
- [ ] Configure separate deployments for `apps/web` and `apps/landing`
- [ ] Test deployment pipeline in staging environment

### Phase 6: Testing & Documentation
- [ ] Run full build across entire monorepo
- [ ] Run linting and type checking across all packages
- [ ] Test both applications end-to-end after migration
- [ ] Verify Turborepo caching is working correctly
- [ ] Update README.md with monorepo setup instructions
- [ ] Update CONTRIBUTING.md to reflect new monorepo workflow
- [ ] Create migration guide for team members (`docs/migration/MIGRATION_GUIDE.md`)

---

## Considerations

### Merge Conflicts
This migration should ideally happen on a dedicated branch (`refactor/monorepo-migration`) and might conflict significantly with ongoing feature work. We should:
- Coordinate with team on timing
- Consider feature freeze during migration
- Have clear rollback plan

### CI/CD Changes
Updating deployment pipelines is critical and requires careful configuration:
- Vercel has native Turborepo support
- GitHub Actions needs pnpm setup
- Build caching configuration is essential for performance
- Separate deployment configs for each app

### Dependency Hoisting
pnpm handles dependencies differently than npm/yarn:
- Strict mode prevents phantom dependencies
- Some packages may need `public-hoist-pattern` configuration
- Test thoroughly after migration

### Learning Curve
Team members unfamiliar with monorepo concepts will need:
- Clear documentation
- Pair programming sessions for complex scenarios
- Understanding of Turborepo pipelines and caching

### TypeScript Paths
Setting up TypeScript correctly is crucial:
- Root `tsconfig.json` with path mappings
- Each package needs proper `tsconfig.json`
- Project references for optimal IDE performance

### gridpane-dashboard Decision
We need to decide what to do with the `gridpane-dashboard` repository:
- **Option 1:** Archive it (if fully replaced by main app)
- **Option 2:** Move to `apps/legacy` for reference
- **Option 3:** Skip migration (leave as separate repo)

---

## Timeline Estimate

**Total Duration:** 3-4 weeks

| Phase | Duration | Depends On |
|-------|----------|------------|
| Phase 1: Foundation | 2-3 days | None |
| Phase 2: Main App | 4-5 days | Phase 1 |
| Phase 3: Landing Page | 3-4 days | Phase 1, 2 |
| Phase 4: Provider Extraction | 3-4 days | Phase 2 |
| Phase 5: CI/CD | 3-4 days | Phase 2, 3 |
| Phase 6: Testing & Docs | 3-5 days | All phases |

**Buffer:** 2-3 days for unexpected issues

---

## Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| CI/CD pipeline failures | High | Test in staging first, have rollback plan |
| Import path changes break functionality | High | Automated refactoring tools, thorough testing |
| Dependency hoisting issues | Medium | Use pnpm's configuration options, test extensively |
| Build time increases | Medium | Turborepo caching will offset over time |
| Team learning curve | Low | Documentation, pair programming |

---

## Success Metrics

- **Build Time:** Should improve over time with Turborepo caching
- **Developer Experience:** Faster to add shared components, consistent configs
- **CI/CD:** Single pipeline for all apps, easier to maintain
- **Code Reuse:** No duplication of UI components or configurations
- **Onboarding:** New developers can understand entire codebase structure

---

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces Guide](https://pnpm.io/workspaces)
- [Vercel Monorepo Documentation](https://vercel.com/docs/concepts/monorepos)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [MONOREPO_MIGRATION_ANALYSIS.md](./MONOREPO_MIGRATION_ANALYSIS.md) - Detailed technical analysis

---

## Related Issues

- None yet

---

## Questions to Resolve Before Starting

1. Are we ready for a potential feature freeze during migration?
2. Who will be the primary owner/reviewer for this migration?
3. Do we have staging environments set up for testing?
4. Are there any known dependencies or integrations that might be affected?
5. Should we merge the `debug/api-exploration` branch before starting, or migrate both branches separately?

**Note:** Decision made to skip `gridpane-dashboard` repository - it will remain separate for historical reference.
