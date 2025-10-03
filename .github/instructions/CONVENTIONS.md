# Stackdock Code Conventions

## File Structure
```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # shadcn components (don't modify)
│   └── [feature]/   # Feature-specific components
├── lib/             # Business logic & utilities
│   ├── [provider]/  # API client code (gridpane, kinsta, etc.)
│   └── utils/       # Shared utilities
└── types/           # Global TypeScript types
```

## Naming Conventions
- **Files:** `kebab-case.ts` (e.g., `php-version-selector.tsx`)
- **Components:** `PascalCase` (e.g., `PhpVersionSelector`)
- **Functions:** `camelCase` (e.g., `updateSitePhpVersion`)
- **Constants:** `SCREAMING_SNAKE_CASE` (e.g., `AVAILABLE_PHP_VERSIONS`)
- **Types/Interfaces:** `PascalCase` (e.g., `PhpVersion`, `UpdatePhpVersionResult`)

## API Client Structure
Each provider follows this pattern:
```
lib/[provider]/
├── types.ts              # All types for this provider
├── config.ts             # Configuration & validation
├── utils.ts              # Shared utilities (fetch wrapper, error handling)
├── rate-limiter.ts       # Rate limiting (if needed)
└── [resource]/           # Resource-specific files
    ├── get[Resource].ts
    ├── create[Resource].ts
    ├── update[Resource].ts
    └── delete[Resource].ts
```

## Server Actions
- ✅ Always use `"use server"` at **file level** if file ONLY exports async functions
- ✅ Keep types in separate `types.ts` file
- ✅ One action per file for clarity
- ✅ Named exports (not default exports)

## Error Handling
```typescript
// Custom error class per provider
class GridPaneApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public page?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'GridPaneApiError';
  }
}
```

## Logging Standards
```typescript
// Production logging (KEEP)
console.error('[ERROR_PREFIX]', error);
console.warn('[WARN_PREFIX]', message);

// Development logging (REMOVE before production)
console.log('[DEBUG]', data);           // ❌ Remove
console.log('=== RATE LIMIT ===', ...); // ❌ Remove
```

## Rate Limiting Pattern
```typescript
// Standard rate limiter interface
interface RateLimiter {
  checkLimit(endpoint: string): { allowed: boolean; waitTime?: number };
  updateFromHeaders(endpoint: string, headers: Headers): void;
  getRateLimitStatus(): RateLimitStatus;
}
```

## Styling
- ✅ Use design system tokens from `globals.css`
- ✅ Use Tailwind utilities: `bg-card`, `text-foreground`, etc.
- ❌ NO hardcoded colors: `bg-blue-500`, `text-red-600`
- ✅ Minimal classes, let design system handle it

## TypeScript
- ✅ Explicit return types on exported functions
- ✅ No `any` types (use `unknown` if truly dynamic)
- ✅ Interfaces for objects, Types for unions/primitives
- ✅ Co-locate types with usage when possible

## Comments
```typescript
// ✅ Good: Explains WHY
// GridPane returns null for reset time on successful requests
// Estimate 60s window based on retry-after patterns
const estimatedReset = Date.now() + 60000;

// ❌ Bad: Explains WHAT (code already shows this)
// Set the estimated reset to current time plus 60000ms
const estimatedReset = Date.now() + 60000;
```

## Testing (Future)
- Unit tests: `[filename].test.ts` next to source
- Integration tests: `__tests__/integration/`
- E2E tests: `__tests__/e2e/`
