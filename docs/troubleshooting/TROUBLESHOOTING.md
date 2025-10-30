# Troubleshooting Guide

> Common issues and their solutions, documented step-by-step

## TanStack Start: Missing routeTree.gen.ts

### Symptoms
```
SyntaxError: The requested module '@tanstack/router-generator' does not provide an export named 'CONSTANTS'
```

Or:
```
Cannot find module './routeTree.gen'
```

### Root Cause

**TanStack Router requires a Vite plugin to auto-generate the route tree file.**

Without it:
- `routeTree.gen.ts` is never created
- Router can't find the file
- Dev server crashes

### Solution

#### Step 1: Create vite.config.ts

Create `apps/web/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin'

export default defineConfig({
  plugins: [
    nitroV2Plugin(),
    tailwindcss(),
    tanstackStart(), // Auto-generates routeTree.gen.ts
    viteReact(),
  ],
})
```

#### Step 2: Create Missing Components

Create `apps/web/src/components/DefaultCatchBoundary.tsx`:

```typescript
import { ErrorComponent } from '@tanstack/react-router'

export function DefaultCatchBoundary({ error }: { error: Error }) {
  return <ErrorComponent error={error} />
}
```

Create `apps/web/src/components/NotFound.tsx`:

```typescript
export function NotFound() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
      <p className="text-slate-600 mt-2">The page you're looking for doesn't exist.</p>
    </div>
  )
}
```

#### Step 3: Start Dev Server

```bash
cd apps/web
npm run dev
```

The Vite plugin will:
1. Scan `src/routes/` folder
2. Generate `src/routeTree.gen.ts`
3. Dev server starts successfully

### Verification

After dev server starts, verify:
```bash
# Check file was created
ls apps/web/src/routeTree.gen.ts
```

Should see the auto-generated file with your route tree.

---

## Legacy pnpm Network Errors (Windows)

### Symptoms
```
ERR_INVALID_THIS: Value of "this" must be of type URLSearchParams
```

### What Happened

Older iterations of the project used pnpm workspaces. On Windows that surfaced a pnpm 8.x bug (`ERR_INVALID_THIS`) that made installs impossible.

### Current Status

StackDock now ships with **npm workspaces** by default. Fresh clones should only use npm; mixing package managers will reintroduce the issue.

### Resolution Checklist

1. Remove any leftover pnpm artifacts (`pnpm-lock.yaml`, `pnpm-workspace.yaml`, cached `node_modules`).
2. Verify `package.json` declares `"packageManager": "npm@..."` (already set in this repo).
3. Run a clean install with `npm install` from the repo root.
4. Use workspace flags when adding packages (e.g. `npm install <pkg> --workspace apps/web`).

If the error persists, ensure no shell profile aliases still call pnpm and confirm running processes (`Get-Process pnpm`) are terminated.

---

## Infinite app.config.timestamp Files

### Symptoms

Thousands of files like:
```
app.config.timestamp_1761813075021.js
app.config.timestamp_1761813075023.js
app.config.timestamp_1761813075026.js
...
```

### Root Cause

1. `app.config.ts` imports package that's missing (or shouldn't exist)
2. Vite/Nitro plugin tries to load config
3. Fails, creates temp file, retries
4. Creates infinite temp files

### Solution

#### Step 1: Kill Node Processes
```bash
Stop-Process -Name node -Force
```

#### Step 2: Delete Temp Files
```bash
Remove-Item apps\web\app.config.timestamp*.js -Force
```

#### Step 3: Fix Config

**TanStack Start doesn't require `app.config.ts`** - configuration is in `vite.config.ts`. If you have an `app.config.ts`, either:
- Remove it entirely (recommended)
- Or keep it minimal with no imports

The `vite.config.ts` should have:
```typescript
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
// ... other plugins
tanstackStart(), // This handles everything
```

#### Step 4: Install Missing Dependencies
```bash
cd apps/web
npm install
```

### Prevention

**Add to .gitignore**:
```
app.config.timestamp*.js
```

**Note**: TanStack Start uses `vite.config.ts` with `tanstackStart()` plugin. No separate `app.config.ts` needed.

---

## Clerk Auth Not Working

### Symptoms
- Redirect loops
- "Clerk is not defined" errors
- Can't sign up

### Checklist

1. **Environment variables exist?**
   ```bash
   # apps/web/.env.local must have:
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

2. **Clerk package installed?**
   ```bash
   # Install Clerk for TanStack Start
   npm install @clerk/tanstack-react-start --workspace apps/web
   ```

3. **Organizations enabled?**
   - Go to dashboard.clerk.com
   - Left sidebar → Organizations
   - Toggle ON

4. **Import statements correct?**
   ```typescript
   import { ClerkProvider } from '@clerk/tanstack-react-start'
   // NOT from '@clerk/tanstack-start'
   ```

### Solution

Clerk integration is optional for now. The app works without it. When ready, wrap `ConvexProvider` with `ClerkProvider` in `src/routes/__root.tsx`.

---

## Convex Not Connecting

### Symptoms
```
[Convex] Connection failed
```

### Checklist

1. **Convex dev running?**
   ```bash
   npx convex dev
   ```

2. **Environment variables?**
   ```bash
   # apps/web/.env.local must have:
   VITE_CONVEX_URL=https://your-deployment.convex.cloud
   ```

3. **Schema pushed?**
   - Check Convex dashboard → Data
   - Should see tables from schema.ts

### Solution

1. Make sure `npx convex dev` is running
2. Check URL in `.env.local` matches terminal output
3. Restart dev server

---

## TypeScript Errors After Install

### Symptoms
```
Cannot find module '@tanstack/react-router'
Cannot find type definition for 'node'
```

### Solution

**Restart TypeScript server**:
- VSCode: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

**If that doesn't work**:
```bash
cd apps/web
npm install
```

Then restart TS server.

---

## Port 3000 Already in Use

### Symptoms
```
Error: listen EADDRINUSE: address already in use :::3000
```

### Solution

**Option 1: Kill process on port 3000**
```bash
# Windows
netstat -ano | findstr :3000
# Note the PID, then:
taskkill /PID <PID> /F
```

**Option 2: Use different port**
```bash
npm run dev -- --port 3001
```

**Note**: Update `VITE_APP_URL` in `.env.local` if you change the port.

---

## When to Ask for Help

If you see errors:

1. ✅ **DO**: Copy error to me and ASK "what is this?"
2. ✅ **DO**: Tell me what you tried already
3. ✅ **DO**: Let me assess before I fix

4. ❌ **DON'T**: Assume I know it's still broken
5. ❌ **DON'T**: Let me jump to solutions
6. ❌ **DON'T**: Let me assume anything

---

**Remember**: Troubleshooting > Band-aids. Diagnosis > Guessing.
