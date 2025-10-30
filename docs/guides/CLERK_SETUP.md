# Clerk Setup Guide

> Complete guide for setting up Clerk authentication with Convex in StackDock

---

## Prerequisites

- Clerk account (free tier available): https://clerk.com
- Convex already configured (see [CONVEX_SETUP.md](./CONVEX_SETUP.md))

---

## Step 1: Create Clerk Application

1. Go to https://dashboard.clerk.com
2. Click **"Create Application"**
3. Name it: **"StackDock Dev"** (or your preferred name)
4. Choose authentication methods:
   - Email/Password ✅ (recommended for testing)
   - Social providers (optional)
5. Click **"Create Application"**

---

## Step 2: Enable Organizations (CRITICAL)

**Organizations are required for StackDock's multi-tenant architecture.**

1. In Clerk dashboard, go to **"Organizations"** (left sidebar)
2. Toggle **"Enable Organizations"** to **ON**
3. Configure organization settings:
   - **Allowed domains**: Leave empty for development
   - **Personal accounts**: Allow personal accounts ✅
   - **Memberships**: Default settings are fine

---

## Step 3: Create JWT Template for Convex

**This is required for Convex to validate Clerk tokens.**

1. In Clerk dashboard, go to **"Configure"** → **"JWT Templates"**
2. Click **"New Template"**
3. Name it: **`convex`** (exactly this name - required!)
4. Token lifetime: **60 minutes** (default is fine)
5. Add claims (if needed - defaults usually work):
   ```json
   {
     "sub": "{{user.id}}"
   }
   ```
6. Click **"Save"**

**Important**: The template name **must** be `convex` - this is what Convex looks for.

---

## Step 4: Get API Keys

1. In Clerk dashboard, go to **"API Keys"**
2. Copy these values:
   - **Publishable Key**: Starts with `pk_test_...` or `pk_live_...`
   - **Secret Key**: Starts with `sk_test_...` or `sk_live_...`

---

## Step 5: Add to Environment Variables

Add to `apps/web/.env.local`:

```bash
# Clerk (from dashboard.clerk.com → API Keys)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: For webhooks (we'll set this up later)
CLERK_WEBHOOK_SECRET=whsec_...
```

**Note**: Only `VITE_CLERK_PUBLISHABLE_KEY` is required for basic auth. The secret key is for server-side operations (webhooks).

---

## Step 6: Restart Dev Server

```bash
# Stop current server (Ctrl+C), then:
npm run dev
```

---

## Step 7: Verify Integration

Open http://localhost:3000 and check:

1. **Auth Status Indicator** should appear (if `VITE_CLERK_PUBLISHABLE_KEY` is set)
2. **"Get Started"** button should open Clerk sign-in modal
3. Click **"Get Started"** → Clerk modal opens
4. Sign up with email/password
5. After sign-in, you should see:
   - ✅ **Green "Authenticated"** status
   - ✅ **"Welcome! You're signed in."** message

---

## How It Works

### Provider Hierarchy

```
ClerkProvider (from @clerk/clerk-react)
  └─ ConvexProviderWithClerk (from convex/react-clerk)
      └─ Your App Components
```

### Token Flow

1. User signs in via Clerk
2. Clerk issues JWT token (using `convex` template)
3. `ConvexProviderWithClerk` automatically:
   - Fetches token from Clerk (`getToken({ template: 'convex' })`)
   - Attaches token to Convex requests
   - Refreshes token when needed
4. Convex validates token using `convex/auth.config.ts`
5. Convex functions can access user via `ctx.auth.getUserIdentity()`

### Auth Components

**Convex provides auth components** (use these, not Clerk's):

```typescript
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'

<Authenticated>
  {/* User is signed in */}
</Authenticated>

<Unauthenticated>
  {/* User is not signed in */}
</Unauthenticated>

<AuthLoading>
  {/* Auth state is loading */}
</AuthLoading>
```

**Why Convex components?**
- They ensure the auth token is fetched and validated before rendering
- They work seamlessly with Convex queries/mutations
- They handle token refresh automatically

---

## Using Authenticated Queries

Once Clerk is configured, you can use authenticated Convex queries:

```typescript
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

function MyComponent() {
  // This query requires authentication
  const user = useQuery(api.users.getCurrent)
  
  if (user === undefined) {
    return <div>Loading...</div>
  }
  
  if (user === null) {
    return <div>Not authenticated</div>
  }
  
  return <div>Welcome, {user.name}!</div>
}
```

---

## Troubleshooting

### "JWT template 'convex' not found"

**Error**: Convex can't validate Clerk tokens

**Solution**:
1. Check Clerk dashboard → JWT Templates
2. Verify template is named exactly `convex` (lowercase)
3. Restart dev server after creating template

### "Not authenticated" in Convex queries

**Error**: User signed in to Clerk but Convex queries fail

**Solution**:
1. Check `VITE_CLERK_PUBLISHABLE_KEY` is in `.env.local`
2. Verify JWT template `convex` exists in Clerk
3. Check browser console for errors
4. Restart dev server

### Sign-in modal doesn't open

**Error**: Clicking "Get Started" does nothing

**Solution**:
1. Check `VITE_CLERK_PUBLISHABLE_KEY` is set
2. Verify Clerk application is active (not deleted)
3. Check browser console for Clerk errors
4. Ensure `ClerkProvider` is wrapping your app (check `__root.tsx`)

### User not found in database

**Error**: After sign-in, Convex queries return "User not found in database"

**Solution**:
1. This is expected initially - users need to be synced from Clerk
2. Set up webhook (see next section) OR
3. Call `api.users.syncFromClerk` mutation manually for testing

---

## Next Steps

### 1. Set Up Webhook (User Sync)

When a user signs up in Clerk, we need to sync them to Convex's `users` table.

**In Clerk Dashboard**:
1. Go to **"Webhooks"**
2. Click **"Add Endpoint"**
3. Endpoint URL: `http://localhost:3000/api/webhooks/clerk` (or use ngrok for testing)
4. Subscribe to events:
   - `user.created`
   - `user.updated`
5. Copy webhook secret → Add to `.env.local` as `CLERK_WEBHOOK_SECRET`

**Create webhook handler** (we'll do this next):
- `apps/web/src/routes/api/webhooks/clerk.ts`
- Verifies webhook signature
- Calls `api.users.syncFromClerk` mutation

### 2. Create Protected Routes

Use auth guards to protect dashboard routes:

```typescript
// apps/web/src/routes/dashboard/_layout.tsx
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInButton } from '../../components/auth/SignInButton'

export function DashboardLayout({ children }) {
  return (
    <Authenticated>
      {children}
    </Authenticated>
    <Unauthenticated>
      <div>Please sign in to access the dashboard</div>
      <SignInButton />
    </Unauthenticated>
  )
}
```

### 3. Test Authenticated Queries

Try calling `api.users.getCurrent` after signing in - it should return your user data.

---

## Configuration Checklist

- [ ] Clerk application created
- [ ] Organizations enabled
- [ ] JWT template `convex` created
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` added to `.env.local`
- [ ] Dev server restarted
- [ ] Can sign up/sign in via Clerk modal
- [ ] Auth status shows "Authenticated" after sign-in
- [ ] Convex queries work with authentication

---

**For more info**: 
- [Clerk Docs](https://clerk.com/docs)
- [Convex Clerk Integration](https://docs.convex.dev/auth/clerk)

