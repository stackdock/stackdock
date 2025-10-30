# 🚀 Start StackDock

## ✅ Dependencies Installed!

TypeScript errors should be gone. If not, restart TS server:
- VSCode: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

---

## Quick Start (3 Steps)

### 1. Setup Convex

```bash
# Install Convex CLI (if needed)
npm install -g convex

# Initialize Convex
npx convex dev
```

This will:
- Open browser to dashboard.convex.dev
- Let you create/link project
- Push your schema to Convex
- Keep running (leave this terminal open)

### 2. Setup Clerk

1. Go to https://dashboard.clerk.com
2. Create application: "StackDock Dev"
3. Enable: **Organizations** feature (critical!)
4. Copy keys from "API Keys" page

### 3. Add Environment Variables

Create `apps/web/.env.local`:

```bash
# From Convex (terminal output or dashboard)
VITE_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment

# From Clerk dashboard
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional (for webhooks later)
CLERK_WEBHOOK_SECRET=whsec_...

# App config
VITE_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Run It

### Terminal 1: Convex (Already Running)
```bash
# Should already be running from step 1
npx convex dev
```

### Terminal 2: App
```bash
cd apps/web
npm run dev
```

### Open Browser
http://localhost:3000

---

## What You'll See

### Landing Page
- Hero section: "Infrastructure's WordPress Moment"
- 3 feature cards (Docks, UI, Platform)
- "Get Started" button

### Click "Get Started"
- Redirects to Clerk sign-up
- Create account (email + password or OAuth)

### After Sign In
- Dashboard with sidebar navigation
- User button (top right → manage account)
- Stats cards (all zeros for now)
- Getting started checklist

### Try Navigation
- **Dashboard**: Home with stats
- **Docks**: Scaffolded (Under Construction label)
- **Projects**: Scaffolded (Under Construction label)
- **Infrastructure**: Resource type cards (Servers, Sites, Domains)
- **Settings**: 
  - Organization (shows your Clerk org)
  - Teams (scaffolded)
  - Clients (scaffolded)
  - Roles & Permissions (shows RBAC model)

---

## It's Working When...

✅ Landing page loads  
✅ Can sign up with Clerk  
✅ Dashboard appears after login  
✅ Can navigate all routes  
✅ User button works (Clerk profile)  
✅ No console errors  

---

## Common Issues

### "Cannot find module '@tanstack/react-router'"
```bash
cd apps/web
npm install
```

### "Convex URL is not defined"
Add `VITE_CONVEX_URL` to `apps/web/.env.local`

### "Clerk is not defined"
Add `VITE_CLERK_PUBLISHABLE_KEY` to `apps/web/.env.local`

### Port 3000 in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm run dev
```

---

## For Wednesday Demo

### What to Show
1. **Landing Page** - Vision statement
2. **Auth Flow** - Sign up experience
3. **Dashboard** - Navigation structure
4. **Settings/Roles** - RBAC architecture
5. **Documentation** - Open ARCHITECTURE.md

### What to Say
> "This is StackDock - infrastructure's WordPress moment. Just like WordPress democratized content management, StackDock democratizes infrastructure management."

> "See these scaffolded routes? Each one is labeled. We're building this right - documentation first, architecture solid, no shortcuts."

> "The key innovation is the universal table pattern. One table for ALL PaaS providers. GridPane, Vercel, Railway - they all go into the same webServices table."

> "Your dock adapter will be a translator. It takes GridPane's API response and outputs our universal format. Then the dashboard just works - it doesn't know or care about GridPane-specific fields."

### What to Ask
- "Can we get API access for testing the integration?"
- "What are the key features you want to see first?"
- "Would GridPane be interested in being a launch partner?"

---

## Next Phase (After Meeting)

With your feedback, we'll build:

1. **Encryption System** - Secure API key storage
2. **GridPane Adapter** - Sync sites & servers
3. **Resource Dashboard** - View real infrastructure
4. **Project Linking** - Tie resources together

---

**You're ready. The foundation is solid. Go show them the future.** ⚓️

**Need help? Read: `QUICKSTART.md`, `ARCHITECTURE.md`, `PROGRESS.md`**
