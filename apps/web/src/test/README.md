# Test Setup - COMPLETE ✅

## What's Configured

- ✅ **Vitest**: v3.0.5 (installed)
- ✅ **Testing Library**: React + DOM (installed)
- ✅ **jsdom**: Browser environment simulation
- ✅ **Config**: `vite.config.ts` has test config
- ✅ **Setup**: `src/test/setup.ts` for global mocks
- ✅ **First Test**: `src/lib/utils.test.ts` (smoke test)

## Running Tests

### Option 1: npm script
```bash
cd apps/web
npm test
```

### Option 2: PowerShell script
```powershell
cd apps/web
.\run-tests.ps1
```

### Option 3: Direct vitest
```bash
cd apps/web
npx vitest run
```

### Option 4: Watch mode (for development)
```bash
cd apps/web
npx vitest
```

## Test Structure

All tests follow this pattern:
```
src/
├── lib/
│   ├── utils.ts
│   └── utils.test.ts     ← Tests next to source
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx   ← Tests next to components
└── test/
    ├── setup.ts          ← Global setup (you are here)
    └── README.md         ← This file
```

## Writing Tests

### Example: Utility Function Test
```typescript
// src/lib/myUtil.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from './myUtil'

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(true)
  })
})
```

### Example: Component Test
```typescript
// src/components/Button.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders text', () => {
    const { getByText } = render(<Button>Click me</Button>)
    expect(getByText('Click me')).toBeDefined()
  })
})
```

## What's Available

### Vitest Globals
- `describe()` - Group tests
- `it()` / `test()` - Individual test
- `expect()` - Assertions
- `beforeEach()` / `afterEach()` - Setup/teardown
- `vi.mock()` - Mocking

### Testing Library
- `render()` - Render React components
- `screen` - Query DOM
- `fireEvent` - Trigger events
- `waitFor()` - Async assertions

### Example with Testing Library
```typescript
import { render, screen, fireEvent } from '@testing-library/react'

describe('Counter', () => {
  it('increments on button click', async () => {
    render(<Counter />)
    
    const button = screen.getByRole('button', { name: /increment/i })
    fireEvent.click(button)
    
    expect(screen.getByText('Count: 1')).toBeDefined()
  })
})
```

## Troubleshooting

### "Cannot find module '@/...'"
- Path aliases are configured in `vite.config.ts`
- `@/` maps to `src/`
- Should work automatically

### "Module not found: convex/_generated"
- Convex generated files alias is configured
- Make sure Convex is running (`npx convex dev`)

### Tests are slow
- Use `vi.mock()` to mock heavy dependencies
- Mock Convex hooks if not testing integration

### Need to debug a test
```bash
# Run single test file
npx vitest run src/lib/utils.test.ts

# Run in watch mode with UI
npx vitest --ui
```

## Next Steps

Now that tests are working:

1. **Add more smoke tests** - Test critical utilities
2. **Test components** - Start with simple ones
3. **Mock Convex** - Create mock hooks for testing
4. **Integration tests** - Test full flows

## Status

- ✅ Test infrastructure: WORKING
- ✅ First test: PASSING
- ✅ Config: COMPLETE
- 🚀 Ready to write tests!
