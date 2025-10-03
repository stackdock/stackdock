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

## Error Handling Standards

### Custom Error Class
All GridPane API errors use `GridPaneApiError` for consistency:
```typescript
export class GridPaneApiError extends Error {
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

### Try/Catch Pattern
All API functions follow this standard pattern:
```typescript
export async function getResource(id: number): Promise<Resource> {
  const startTime = performance.now();
  const endpoint = `resource/${id}`;
  
  try {
    // Perform API operation
    const response = await fetch(url);
    const data = await handleResponse(response, endpoint);
    
    // Log success with duration
    const duration = Math.round(performance.now() - startTime);
    logApiCall(endpoint, undefined, duration);
    
    return data;
    
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    
    // Re-throw GridPaneApiError as-is
    if (error instanceof GridPaneApiError) {
      console.error(`[GridPane API Error] ${endpoint}: ${error.message} (${duration}ms)`);
      throw error;
    }
    
    // Wrap unexpected errors in GridPaneApiError
    const unexpectedError = new GridPaneApiError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
      endpoint,
      undefined,
      error
    );
    console.error(`[GridPane Unexpected Error] ${endpoint}:`, unexpectedError);
    throw unexpectedError;
  }
}
```

### Mutation Functions (POST/PUT/DELETE)
Return success/error objects instead of throwing:
```typescript
export async function updateResource(id: number, data: UpdateInput): Promise<UpdateResult> {
  try {
    const response = await withRetry(async () => {
      return await fetch(url, { method: 'PUT', body: JSON.stringify(data) });
    }, endpoint);
    
    const result = await handleResponse(response, endpoint);
    
    // Revalidate cache
    revalidateTag(`resource-${id}`);
    
    return {
      success: true,
      message: 'Successfully updated',
      data: result
    };
    
  } catch (error) {
    console.error(`[UPDATE FAILED] ${endpoint}:`, error);
    
    if (error instanceof GridPaneApiError) {
      return {
        success: false,
        message: error.message,
        error: 'GRIDPANE_API_ERROR'
      };
    }
    
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'UNEXPECTED_ERROR'
    };
  }
}
```

### Component Error Handling
```typescript
// Server Component
export default async function Page() {
  let data = null;
  let fetchError: string | null = null;
  
  try {
    data = await getResource();
  } catch (error) {
    console.error('Error fetching resource:', error);
    fetchError = error instanceof Error ? error.message : 'An error occurred';
  }
  
  return (
    <div>
      {fetchError && (
        <div className="border border-destructive text-destructive px-4 py-3 rounded">
          <strong>Error:</strong> {fetchError}
        </div>
      )}
    </div>
  );
}

// Client Component
export function ResourceEditor() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateResource(id, data);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.error || 'Update failed' });
      }
    });
  };
}
```

### Error Message Standards
- **API Errors:** Use the actual error message from GridPane API
- **Rate Limit Errors:** Include wait time and reset information
- **Validation Errors:** Be specific about what's invalid
- **Unexpected Errors:** Prefix with "Unexpected error:" + details
- **Fallback:** "An error occurred" or "Unknown error"

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
