# StackDock UI Registry

> **shadcn/ui model for infrastructure components**

**Last Updated**: November 11, 2025

The UI Registry is a collection of dashboard components that work with StackDock's universal resource tables. Components follow the copy/paste/own model - you install them into your codebase and own the code.

**Current Status**: Registry structure ready. Provisioning components added (provision-form, provision-status-card, resource-spec-form, provision-progress-indicator). Ready for component contributions.

## Quick Start

```bash
# Install a component (when CLI is ready)
npx stackdock add server-health-widget

# Component is copied to your apps/web/src/components/server-health-widget/
# You own it, modify it, customize it
```

## Registry Structure

```
packages/ui/
├── components/          # Component directories
│   ├── server-health-widget/
│   ├── deployment-timeline/
│   └── domain-status-card/
├── registry.json        # Registry manifest
└── README.md           # This file
```

## Component Philosophy

### Provider-Agnostic Design

Components use universal tables (`servers`, `webServices`, `domains`) - not provider-specific types. This means:

- ✅ Works with ANY provider (AWS, DigitalOcean, Vercel, GridPane, etc.)
- ✅ Shows universal fields (name, status, URL)
- ✅ Optionally shows provider-specific fields from `fullApiData`

### Example

```typescript
// ✅ GOOD: Uses universal table
function WebServiceCard({ service }: { service: Doc<"webServices"> }) {
  return (
    <Card>
      <h3>{service.name}</h3>
      <Badge>{service.provider}</Badge>
      <p>{service.productionUrl}</p>
      
      {/* Provider-specific (optional) */}
      {service.provider === "gridpane" && service.fullApiData && (
        <p>PHP: {service.fullApiData.phpVersion}</p>
      )}
    </Card>
  )
}
```

## Adding a Component

See [REGISTRY_GUIDE.md](../../docs/guides/REGISTRY_GUIDE.md) for complete instructions.

### Quick Steps

1. Create component directory: `packages/ui/components/my-component/`
2. Add component file: `my-component.tsx`
3. Add documentation: `README.md`
4. Add tests: `tests/my-component.test.tsx`
5. Update `registry.json` with component metadata

## Registry Format

See `registry.json` for the manifest format. Each component entry includes:

- `name`: Component identifier
- `title`: Display name
- `description`: What it does
- `version`: Semantic version
- `resourceTypes`: Universal tables it uses (`servers`, `webServices`, `domains`, `databases`)
- `files`: Files to copy
- `dependencies`: npm dependencies
- `registryDependencies`: Other registry components it needs

## Current Components

**Provisioning Components** (Mission 2.5):
- `provision-form` - Multi-step provisioning form with XState integration
- `provision-status-card` - Real-time provisioning status display
- `resource-spec-form` - Provider-specific resource configuration form
- `provision-progress-indicator` - Step-by-step progress visualization

**Registry**: See `packages/ui/registry.json` for complete component manifest.

## Contributing

1. Build your component following [REGISTRY_GUIDE.md](../../docs/guides/REGISTRY_GUIDE.md)
2. Ensure it uses universal tables (not provider-specific)
3. Follow shadcn/ui patterns
4. Add tests
5. Submit PR

## Related Documentation

- [REGISTRY_GUIDE.md](../../docs/guides/REGISTRY_GUIDE.md) - How to build components
- [ARCHITECTURE.md](../../docs/architecture/ARCHITECTURE.md) - System architecture
- [CONTRIBUTING.md](../../docs/guides/CONTRIBUTING.md) - Development workflow

---

**Remember**: Components are copy/paste/own. You install them, you own them, you customize them.
