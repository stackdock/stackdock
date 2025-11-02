# StackDock CLI

> **Command-line tool for managing StackDock components and adapters**

**Last Updated**: January 12, 2025

The StackDock CLI allows you to install components and adapters from the registry into your codebase, following the copy/paste/own model.

**Planned Commands**:
- `stackdock provision` - Provision infrastructure resources
- `stackdock deploy` - Deploy StackDock provisioning engine
- `stackdock add` - Install components/adapters from registry

## Installation

```bash
npm install -g @stackdock/cli
# or
npx @stackdock/cli
```

## Commands

### `stackdock add <component>`

Install a component or adapter from the registry.

```bash
# Install a UI component
npx stackdock add server-health-widget

# Install a dock adapter
npx stackdock add gridpane
```

**What it does:**
- Copies component/adapter files to your codebase
- Updates registry manifests
- Installs dependencies if needed
- You own the code - modify as needed

### `stackdock list`

List available components and adapters.

```bash
# List UI components
npx stackdock list components

# List dock adapters
npx stackdock list adapters

# List everything
npx stackdock list
```

### `stackdock init`

Initialize StackDock in your project.

```bash
npx stackdock init
```

**What it does:**
- Creates `.stackdock/` directory
- Sets up registry configuration
- Links to StackDock registries

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Running Locally

```bash
npm run dev
# or
node src/index.js
```

## Project Structure

```
packages/cli/
├── src/
│   ├── index.ts          # CLI entry point
│   ├── commands/         # Command implementations
│   │   ├── add.ts
│   │   ├── list.ts
│   │   └── init.ts
│   ├── utils/            # Utilities
│   └── types.ts          # TypeScript types
├── bin/
│   └── stackdock         # Executable (generated)
├── package.json
└── README.md
```

## Implementation Status

**⚠️ Pre-Alpha**: CLI is being developed. Commands are being designed.

Current status:
- ✅ Package structure created
- ✅ Command designs complete (provision, deploy) - See Mission 2.5 Step 5
- ⏳ CLI command implementation (pending)
- ⏳ Registry integration (planned)
- ⏳ Component installation (planned)

## Related Documentation

- [REGISTRY_GUIDE.md](../../docs/guides/REGISTRY_GUIDE.md) - How to build components
- [DOCK_ADAPTER_GUIDE.md](../../docs/guides/DOCK_ADAPTER_GUIDE.md) - How to build adapters
- [ARCHITECTURE.md](../../docs/architecture/ARCHITECTURE.md) - System architecture

---

**Remember**: Components and adapters are copy/paste/own. You install them, you own them, you customize them.
