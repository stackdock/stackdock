# StackDock CLI

> **Command-line tool for managing StackDock components and adapters**

**Last Updated**: November 11, 2025

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

## System Requirements

The StackDock CLI uses OpenTUI for its interactive terminal interface, which requires **Zig** to be installed on your system.

### Installing Zig

#### macOS

```bash
# Using Homebrew
brew install zig

# Or download from https://ziglang.org/download/
```

#### Linux

```bash
# Download and extract Zig
wget https://ziglang.org/download/0.12.0/zig-linux-x86_64-0.12.0.tar.xz
tar -xf zig-linux-x86_64-0.12.0.tar.xz
sudo mv zig-linux-x86_64-0.12.0 /usr/local/zig
export PATH=$PATH:/usr/local/zig
```

#### Windows

1. Download Zig from https://ziglang.org/download/
2. Extract to a directory (e.g., `C:\zig`)
3. Add `C:\zig` to your system PATH environment variable

### Verifying Zig Installation

```bash
zig version
```

If Zig is not installed, the CLI will fall back to non-interactive mode (text output only).

## Interactive TUI Mode

The StackDock CLI features a rich terminal user interface (TUI) powered by OpenTUI, providing an interactive experience for managing components and adapters.

### Starting TUI Mode

Simply run the CLI without any arguments:

```bash
npx stackdock
```

This will launch the interactive menu where you can:
- Browse and install components/adapters
- List available items with search and filtering
- Initialize StackDock in your project
- Access help and keyboard shortcuts

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate up/down in menus and lists |
| `←` / `→` | Navigate left/right in dialogs and tables |
| `Enter` | Select item or confirm action |
| `Esc` | Go back or exit |
| `Tab` | Move to next field |
| `Backspace` | Delete character in input fields |

### TUI Features

- **Interactive Menus**: Navigate through commands with arrow keys
- **Search & Filter**: Quickly find components and adapters
- **Progress Indicators**: Visual feedback during installation
- **Error Handling**: Clear error messages with retry options
- **Help System**: Built-in help with examples and shortcuts

## Commands

### `stackdock add <component>`

Install a component or adapter from the registry.

**Interactive Mode:**
```bash
npx stackdock
# Select "Add" from the menu
# Choose component or adapter type
# Select item from list
# Confirm installation
```

**Non-Interactive Mode:**
```bash
# Install a UI component
npx stackdock add server-health-widget --type component

# Install a dock adapter
npx stackdock add gridpane --type adapter
```

**What it does:**
- Copies component/adapter files to your codebase
- Updates registry manifests
- Installs dependencies if needed
- You own the code - modify as needed

### `stackdock list`

List available components and adapters.

**Interactive Mode:**
```bash
npx stackdock
# Select "List" from the menu
# Filter by type (all/components/adapters)
# Browse items in table view
```

**Non-Interactive Mode:**
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

**Interactive Mode:**
```bash
npx stackdock
# Select "Init" from the menu
# Enter project name (optional)
# Confirm initialization
```

**Non-Interactive Mode:**
```bash
npx stackdock init --name my-project
```

**What it does:**
- Creates `.stackdock/` directory
- Sets up registry configuration
- Links to StackDock registries

### Disabling TUI Mode

To use the CLI in non-interactive mode (useful for scripts):

```bash
npx stackdock --no-tui add component-name
```

## Development

### Prerequisites

- **Bun**: Required runtime (OpenTUI needs Bun's WASM support)
- **Zig**: Required for OpenTUI (for building native components)

### Installing Bun

**Windows (PowerShell):**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

After installation, restart your terminal and verify:
```bash
bun --version
```

### Installing Zig

See [System Requirements](#system-requirements) section above for Zig installation instructions.

### Testing

```bash
npm test
```

### Type Checking

```bash
npm run type-check --workspace=packages/cli
```

### Running Locally

**From packages/cli directory:**
```powershell
.\run.ps1
.\run.ps1 list
.\run.ps1 init --name my-project
```

**From workspace root:**
```powershell
.\run-cli.ps1
.\run-cli.ps1 list
```

**Using npm script:**
```bash
npm run dev --workspace=packages/cli
```

### Why Bun?

OpenTUI uses Bun-specific features that Node.js cannot handle:
- WASM file imports (`.wasm` files)
- Scheme syntax files (`.scm` files)
- Native FFI support (`bun:ffi`)

This is why Bun is required for the CLI. The CLI will automatically fall back to text mode if Bun is not found.

## Troubleshooting

### TUI Mode Not Working

If the TUI doesn't start:

1. **Check Bun Installation**
   ```bash
   bun --version
   ```
   If Bun is not installed, install it using the instructions above. Bun is required for TUI mode.

2. **Check Zig Installation**
   ```bash
   zig version
   ```
   If Zig is not installed, install it using the instructions above.

3. **Check Terminal Compatibility**
   - Ensure you're using a TTY terminal (not a pipe or redirect)
   - Try running: `.\run.ps1 --no-tui` to use text mode

4. **Fallback to Text Mode**
   ```bash
   .\run.ps1 --no-tui
   ```

### Common Issues

**Issue**: "Bun not found" or "TUI mode unavailable"

**Solution**: 
- Install Bun (see Prerequisites above) - Bun is required for TUI mode
- Install Zig (see System Requirements above) - Zig is required for OpenTUI
- Or use `--no-tui` flag for text mode

**Issue**: "Registry not found"

**Solution**: Ensure you're running the CLI from the StackDock monorepo root, or configure registry paths in `.stackdock/config.json`.

**Issue**: "Component installation fails"

**Solution**: 
- Check file permissions
- Ensure target directory exists
- Verify registry item exists in `packages/ui/registry.json` or `packages/docks/registry.json`

## Project Structure

```
packages/cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── tui/                  # TUI components
│   │   ├── App.tsx           # Main TUI application
│   │   ├── components/       # TUI components
│   │   │   ├── CommandMenu.tsx
│   │   │   ├── AddCommand.tsx
│   │   │   ├── ListCommand.tsx
│   │   │   ├── InitCommand.tsx
│   │   │   ├── HelpMenu.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Progress.tsx
│   │   │   └── Dialog.tsx
│   │   ├── hooks/            # React hooks
│   │   │   ├── useTerminal.ts
│   │   │   └── useKeyboard.ts
│   │   └── utils/            # TUI utilities
│   │       ├── colors.ts
│   │       └── layout.ts
│   ├── commands/             # Command implementations
│   │   ├── add.ts
│   │   ├── list.ts
│   │   └── init.ts
│   └── utils/                # Utilities
│       ├── registry.ts
│       └── installer.ts
├── tests/                    # Test files
│   ├── tui.test.ts
│   └── commands.test.ts
├── bin/
│   └── stackdock.js          # Executable (generated)
├── package.json
└── README.md
```

## Implementation Status

**✅ TUI Implementation Complete**: CLI now features interactive TUI mode with OpenTUI.

Current status:
- ✅ Package structure created
- ✅ OpenTUI dependencies installed
- ✅ TUI components implemented (CommandMenu, AddCommand, ListCommand, InitCommand, HelpMenu)
- ✅ Reusable TUI components (Table, Input, Select, Progress, Dialog)
- ✅ Command logic extracted (add, list, init)
- ✅ Registry utilities implemented
- ✅ Styling utilities (colors, layout)
- ✅ Keyboard navigation and terminal handling
- ✅ Help system with shortcuts
- ⏳ Full OpenTUI integration (requires Zig setup)
- ⏳ Component installation logic (basic structure ready)

## Related Documentation

- [REGISTRY_GUIDE.md](../../docs/guides/REGISTRY_GUIDE.md) - How to build components
- [DOCK_ADAPTER_GUIDE.md](../../docs/guides/DOCK_ADAPTER_GUIDE.md) - How to build adapters
- [ARCHITECTURE.md](../../docs/architecture/ARCHITECTURE.md) - System architecture

---

**Remember**: Components and adapters are copy/paste/own. You install them, you own them, you customize them.
