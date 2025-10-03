# Quick Reference Card

## 🎯 Before You Code

```
✅ Read CONVENTIONS.md
✅ Check if similar code exists (GridPane)
✅ Follow existing patterns
✅ Use design tokens only
✅ TypeScript: explicit types
✅ Server Actions: "use server" at top
```

## 🚫 Never Do

```
❌ console.log (debug)
❌ Hardcoded colors (bg-blue-500)
❌ any types
❌ New directory structures
❌ Different error patterns
❌ Commented code
```

## 📁 File Structure

```
src/lib/[provider]/
├── types.ts          # All types
├── config.ts         # Environment vars
├── utils.ts          # Errors & retry
├── rate-limiter.ts   # Optional
└── [resource]/
    ├── get*.ts       # GET operations
    ├── create*.ts    # POST operations
    ├── update*.ts    # PUT operations
    └── delete*.ts    # DELETE operations
```

## 🎨 Styling

```tsx
// ✅ Good
<div className="bg-card text-foreground">
<div className="bg-primary text-primary-foreground">
<div className="bg-destructive text-destructive-foreground">

// ❌ Bad
<div className="bg-blue-500 text-white">
<div className="bg-red-600 text-white">
```

## 🔧 Common Patterns

### Server Action
```typescript
"use server";

import { revalidateTag } from 'next/cache';

export async function myAction(id: number): Promise<Result> {
  try {
    const response = await withRetry(async () => {
      return await fetch(url, { method: 'POST' });
    }, endpoint);

    revalidateTag('my-resource');
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error instanceof ApiError ? error.message : 'Failed'
    };
  }
}
```

### Component
```tsx
"use client";

import { useTransition, useState } from 'react';

export function MyComponent({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleAction = () => {
    startTransition(async () => {
      const result = await myAction(id);
      setMessage(result.success ? 'Success' : result.error);
    });
  };
}
```

## 📦 Common Imports

```typescript
// Server Actions
import { revalidateTag } from 'next/cache';

// Components
import { useTransition, useState } from 'react';

// Types
import type { ComponentProps } from 'react';

// Utils
import { cn } from '@/lib/utils';
```

## 🧪 Testing Checklist

```
[ ] Success case works
[ ] Error case shows message
[ ] Loading state displays
[ ] Rate limit handled
[ ] Cache invalidated
[ ] No console logs
```

## 🔍 Quick Audit

```bash
# Debug logs
grep -r "console.log" src/

# Hardcoded colors
grep -r "bg-[a-z]*-[0-9]" src/

# Any types
grep -r ": any" src/

# Run all checks
npm run audit:all
```

## 📖 Full Docs

- **Standards:** `.github/instructions/CONVENTIONS.md`
- **Cleanup:** `.github/instructions/AUDIT.md`
- **Patterns:** `.github/instructions/API_PATTERNS.md`
- **Plan:** `.github/instructions/CLEANUP_PLAN.md`
- **AI Rules:** `.cursorrules`

---

**Remember:** When in doubt, check GridPane implementation! 🚀
