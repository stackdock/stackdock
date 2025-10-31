# StackDock Quick Start

## Quick Start

Install dependencies and get started:

```bash
# From repo root
npm install

# This installs dependencies for all workspaces (apps/web, etc.)
```

---

## After Dependencies Install

### 1. Setup Environment Variables

```bash
# Copy template
cp env.example apps/web/.env.local

# Edit apps/web/.env.local and add:
```

```bash
# Convex (get from dashboard.convex.dev)
CONVEX_DEPLOYMENT=dev:your-deployment
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk (get from dashboard.clerk.com)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# App
VITE_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Initialize Convex

```bash
# Install Convex CLI globally (if not installed)
npm install -g convex

# Initialize Convex project
npx convex dev
```

This will:
- Open browser to create/link Convex project
- Push your schema.ts to Convex
- Start Convex dev server

### 3. Setup Clerk

1. Go to https://dashboard.clerk.com
2. Create new application
3. Enable "Organizations" feature
4. Copy API keys to `.env.local`
5. Set up webhook:
   - Endpoint: `http://localhost:3000/api/webhooks/clerk` (or use ngrok)
   - Events: `user.created`, `user.updated`
   - Copy webhook secret to `.env.local`

### 4. Start Development Server

```bash
# Terminal 1: Convex (should already be running from step 2)
npx convex dev

# Terminal 2: App
cd apps/web
npm run dev
```

### 5. Open Browser

Go to http://localhost:3000

You should see:
- Landing page with StackDock branding
- "Get Started" button
- Clicking it redirects to Clerk sign-up
- After signing in, you'll see the dashboard

---

## What You'll See

### Landing Page
- Beautiful hero section
- 3 feature cards (Docks, UI, Platform registries)
- Call-to-action buttons

### Dashboard (After Auth)
- Sidebar navigation
- User button (Clerk)
- Dashboard home with stats (all zeros for now)
- Getting started checklist

### All Routes Scaffolded
- **Docks**: Labeled "Under Construction"
- **Projects**: Labeled "Under Construction"
- **Infrastructure**: Shows resource types (all zero)
- **Settings**: 
  - Organization (shows Clerk org name)
  - Teams (scaffolded)
  - Clients (scaffolded)
  - Roles & Permissions (shows permission model)

---

## Troubleshooting

### TypeScript Errors Won't Go Away
```bash
# Restart TypeScript server in VSCode
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Port 3000 Already in Use
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port:
PORT=3001 npm run dev
```

### Convex Not Connecting
- Check `VITE_CONVEX_URL` in `.env.local`
- Make sure `npx convex dev` is running
- Check browser console for errors

### Clerk Auth Not Working
- Check `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local`
- Make sure Clerk app has Organizations enabled
- Check browser console for errors

---

## Current State Summary

✅ **Built**:
- Complete documentation (ARCHITECTURE, SECURITY, RBAC, etc.)
- TanStack Start app structure with file-based routing
- Clerk authentication flow (working!)
- Convex backend connected and authenticated
- User auto-sync from Clerk to Convex
- All dashboard routes (scaffolded with labels)
- Monorepo structure (npm workspaces)

❌ **Not Built** (By Design):
- Encryption system (coming next)
- Dock adapters (requires encryption)
- Real resource syncing
- Full RBAC UI (scaffolded only)

---

## Next Steps After Getting It Running

1. **Test Auth Flow**: Sign up, log in, see dashboard
2. **Explore Routes**: Navigate through all scaffolded pages
3. **Read Documentation**: Review ARCHITECTURE.md
4. **Plan Demo**: Prepare talking points for GridPane CEO

---

## For GridPane CEO Demo (Wednesday)

### Show:
1. Landing page (vision)
2. Dashboard structure (all routes visible)
3. Settings pages (RBAC architecture)
4. Documentation (ARCHITECTURE.md, SECURITY.md)

### Explain:
1. Universal table pattern (no provider-specific tables)
2. Dock adapter concept (how GridPane plugs in)
3. The three registries (Docks, UI, Platform)
4. Why this is revolutionary (infrastructure's WordPress moment)

### Ask:
1. API access for testing
2. Feedback on architecture
3. Partnership opportunities
4. Beta program interest

---

**Need help? The foundation is solid. Just need dependencies installed!** 🚀
