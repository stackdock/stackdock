# StackDock Scripts

> **Radically modular, cross-platform scripts for StackDock**

All scripts are Node.js for cross-platform compatibility (Windows, Mac, Linux).

## Directory Structure

```
scripts/
├── core/              # Shared utilities (DON'T RUN DIRECTLY)
│   ├── logger.js     # Colored console logging
│   ├── run-command.js # Command execution
│   └── paths.js      # Path resolution
│
├── dev/              # Development scripts
│   ├── start-web.js
│   └── start-convex.js
│
├── test/             # Testing scripts
│   ├── run-tests.js
│   ├── test-watch.js
│   └── test-coverage.js
│
├── build/            # Build scripts
│   └── build-all.js
│
├── pipeline/         # CI/CD scripts
│   └── run-all-checks.js
│
└── utils/            # Utility scripts
    ├── cleanup.js
    └── health-check.js
```

## Usage

**Run via npm scripts** (recommended):

```bash
# Development
npm run dev              # Start web app
npm run dev:convex       # Start Convex

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage

# Building
npm run build            # Build all

# Utilities
npm run clean            # Clean node_modules
npm run health           # Health check

# Pipeline
npm run pipeline         # Run all checks
```

**Or run directly**:

```bash
node scripts/test/run-tests.js apps/web
node scripts/utils/health-check.js
```

## Writing New Scripts

### 1. Use Core Utilities

```javascript
#!/usr/bin/env node
import { logger } from '../core/logger.js'
import { runCommand } from '../core/run-command.js'
import { fromRoot } from '../core/paths.js'

logger.header('My Script')

await runCommand('npm', ['install'], {
  cwd: fromRoot('apps/web'),
  label: 'install dependencies',
})
```

### 2. Make it Executable

Add shebang at top:
```javascript
#!/usr/bin/env node
```

### 3. Add to package.json

```json
{
  "scripts": {
    "my-script": "node scripts/category/my-script.js"
  }
}
```

## Core Utilities

### Logger

```javascript
import { logger } from '../core/logger.js'

logger.info('Information')      // Blue ℹ
logger.success('Success')        // Green ✓
logger.error('Error')            // Red ✗
logger.warning('Warning')        // Yellow ⚠
logger.header('Big Header')      // Cyan bold
logger.section('Section')        // Bold
logger.plain('Plain text')       // No formatting
```

### Run Command

```javascript
import { runCommand, runNpmScript, runNpx } from '../core/run-command.js'

// Run any command
await runCommand('npm', ['install'], {
  cwd: '/path/to/dir',
  silent: false,
  label: 'install deps',
})

// Run npm script in workspace
await runNpmScript('build', 'apps/web')

// Run with npx
await runNpx('vitest', ['run'], { cwd: 'apps/web' })
```

### Paths

```javascript
import { paths, fromRoot } from '../core/paths.js'

console.log(paths.root)      // /repo/root
console.log(paths.web)       // /repo/root/apps/web
console.log(fromRoot('convex')) // /repo/root/convex
```

## Principles

1. **Cross-Platform**: Works on Windows, Mac, Linux
2. **Modular**: One script = one purpose
3. **Shared Core**: Reuse utilities, no duplication
4. **Self-Documenting**: Clear names and logging
5. **npm Interface**: Run via `npm run`, not direct paths

## Migration from Bash/PowerShell

### Before (scattered)
```
scripts/pipeline/*.sh       ← Bash (not Windows)
apps/web/run-tests.ps1      ← PowerShell (scattered)
```

### After (modular)
```
scripts/test/run-tests.js   ← Node.js (cross-platform)
npm test                     ← Simple interface
```

## Adding New Scripts

1. **Choose category**: `dev/`, `test/`, `build/`, `pipeline/`, `utils/`
2. **Create file**: `scripts/category/my-script.js`
3. **Import utilities**: Use `core/` utilities
4. **Add shebang**: `#!/usr/bin/env node`
5. **Update package.json**: Add npm script
6. **Test**: Run on Windows AND Mac/Linux

## Standards

- All scripts use ES modules (`.js` with `import`)
- All scripts have `#!/usr/bin/env node` shebang
- All scripts use `core/` utilities (no duplication)
- All scripts have proper error handling
- All scripts exit with correct codes (0 = success)

---

**Remember**: Scripts are code. Modular, tested, maintainable.
