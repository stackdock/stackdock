# Setup Guide

> Complete setup instructions for StackDock

---

## Prerequisites

- Node.js 18+
- npm 9+
- Convex account (https://convex.dev)
- Clerk account (https://clerk.com)

---

## Quick Setup

### 1. Clone & Install

```bash
git clone https://github.com/stackdock/stackdock.git
cd stackdock
npm install
```

### 2. Create Environment File

Generate an encryption key and create `apps/web/.env.local`:

```bash
# Encryption (copy output into ENCRYPTION_MASTER_KEY below)
node scripts/generate-encryption-key.js

# Convex (from npx convex dev output or dashboard)
VITE_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment

# Clerk (from dashboard.clerk.com → API Keys)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Encryption
ENCRYPTION_MASTER_KEY=<64-char-hex-from-generator>

# App
VITE_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Initialize Convex

```bash
npm run dev:convex
```

This will:
- Open browser to create/link Convex project
- Push your schema
- Start dev server (keep this terminal open)

### 4. Configure Clerk

**See [CLERK_SETUP.md](./docs/guides/CLERK_SETUP.md) for complete guide.**

Quick steps:
1. Go to https://dashboard.clerk.com
2. Create application: "StackDock Dev"
3. **Enable Organizations** (left sidebar → Organizations → Toggle ON)
4. Create JWT template named `convex` with claim `{ "aud": "convex" }`
5. Go to "API Keys" → Copy keys to `.env.local`
6. **IMPORTANT**: Check Convex dashboard → Environment Variables → Remove or fix `CLERK_DOMAIN` if set incorrectly

### 5. Start App

```bash
# New terminal
cd apps/web
npm run dev
```

### 6. Open Browser

http://localhost:3000

---

## Verification

### You Should See

1. **Landing page** with StackDock branding
2. **Convex Status Indicator** (below the description):
   - 🟢 **Green "Connected"** = Convex is working! You'll see "Connected • Convex is connected!"
   - 🟡 **Yellow "Connecting..."** = Convex URL is set but connection pending
   - ⚪ **Gray "Not configured"** = Need to add `VITE_CONVEX_URL` to `.env.local`
3. If Clerk is configured: Click "Get Started" → Clerk sign-up page
4. Navigate all routes (all working)

### In Terminal

**Terminal 1 (Convex)**:
```
✓ Convex functions ready!
Watching for changes...
```

**Terminal 2 (App)**:
```
✓ routeTree.gen.ts generated
➜ Local: http://localhost:3000/
```

---

## Troubleshooting

See [TROUBLESHOOTING.md](./troubleshooting/TROUBLESHOOTING.md)

Common issues:
- **Convex import errors** → See "Convex Import Path" below
- Missing routeTree.gen.ts → Check vite.config.ts exists
- Clerk errors → Check .env.local has both keys (Clerk is optional)
- Convex connection → Make sure `npm run dev:convex` is running and URL is in `.env.local`

---

## Current Status

See `.stackdock-state.json` for:
- What's completed
- Current blockers
- Next steps

---

**For complete documentation, see [docs/README.md](./docs/README.md)**
