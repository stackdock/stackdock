# Autumn Billing - Quick Start Guide

This guide helps you get started with the Autumn billing integration scaffold in StackDock.

## What's Been Implemented

A **complete scaffold** for Autumn billing integration including:

### ✅ Database Schema
- 5 new billing tables in `convex/schema.ts`
- Proper indexes for performance
- Support for subscriptions, customers, plans, usage tracking, and invoices

### ✅ Backend Structure
- `convex/billing/queries.ts` - Read operations
- `convex/billing/mutations.ts` - Write operations
- All functions are placeholders ready for implementation

### ✅ Frontend Components
- Billing utility functions in `apps/web/src/lib/billing.ts`
- Billing UI page at `/dashboard/settings/billing`
- Plan definitions (Free, Pro, Enterprise)

### ✅ Configuration
- Environment variable examples in `env.example`
- `autumn-js` SDK installed and ready

## Current State

🔶 **Important**: This is a scaffold only. All billing functions currently:
- Return placeholder/mock data, OR
- Throw "not implemented" errors

The platform continues to operate as **free and open-source** with no restrictions.

## Quick Access

### View the Billing Page
1. Start the development server: `npm run dev`
2. Navigate to: `/dashboard/settings/billing`
3. You'll see a Free Plan page with placeholder usage metrics

### File Locations
```
convex/
  schema.ts               # Billing tables added here
  billing/
    queries.ts            # Read operations (placeholders)
    mutations.ts          # Write operations (placeholders)

apps/web/src/
  lib/
    billing.ts            # Utility functions and plan definitions
  routes/dashboard/settings/billing/
    index.tsx             # Billing UI page

docs/billing/
  README.md               # Complete implementation guide
  QUICKSTART.md           # This file
```

## Implementation Options

### Option 1: Start with GitHub Sponsors (Simplest)

Perfect for initial monetization without complex billing:

1. Set up [GitHub Sponsors](https://github.com/sponsors)
2. Add sponsor button to your repository
3. Manually grant features to sponsors based on tier
4. Build sponsor-only features in your dashboard

**Pros**: Simple, no billing infrastructure needed
**Cons**: Manual feature management, limited to GitHub ecosystem

### Option 2: Full Autumn Integration

Complete subscription-based billing with automation:

1. **Get Autumn API Keys**
   - Sign up at [useautumn.com](https://useautumn.com)
   - Get your API keys from dashboard
   - Add to `.env`:
     ```bash
     VITE_AUTUMN_PUBLIC_KEY=pk_...
     AUTUMN_SECRET_KEY=sk_...
     ```

2. **Create Plans in Autumn Dashboard**
   - Create Free, Pro, and Enterprise plans
   - Match the features defined in `PLANS` constant
   - Note the plan IDs

3. **Implement Core Functions**
   - Start with `convex/billing/mutations.ts`
   - Implement `createSubscription`
   - Implement `upsertCustomer`
   - Add real Autumn API calls

4. **Add Feature Gating**
   - Import `hasFeatureAccess` from billing utils
   - Add checks before premium features
   - Example:
     ```typescript
     const hasAccess = await ctx.runQuery(
       api.billing.queries.hasFeatureAccess,
       { orgId, feature: 'multiCloudSupport' }
     );
     if (!hasAccess) throw new Error('Upgrade required');
     ```

5. **Set Up Webhooks**
   - Create webhook endpoint
   - Handle subscription events
   - Update local subscription records

6. **Complete the UI**
   - Add upgrade/downgrade flows
   - Implement payment method management
   - Build usage dashboards

**Pros**: Full automation, professional billing, scales well
**Cons**: More complex, requires Autumn subscription

## Testing Your Changes

### Before Going Live
1. ✅ Test in Stripe test mode
2. ✅ Verify webhook signatures
3. ✅ Test upgrade flows
4. ✅ Test quota enforcement
5. ✅ Test cancellation flows
6. ✅ Verify invoice generation

### Development Testing
```bash
# Run the dev server
npm run dev

# In another terminal, run tests (when available)
npm test

# Check types
npm run type-check

# Build to verify production
npm run build
```

## Plan Definitions

### Current Pricing Structure

**Free Plan** - $0/month
- 2 docks
- 5 projects
- 3 team members
- 1,000 API calls/month
- 1 GB storage

**Pro Plan** - $29/month
- 10 docks
- 50 projects
- 10 team members
- Multi-cloud support ✨
- Advanced monitoring ✨
- API access ✨
- 10,000 API calls/month
- 10 GB storage

**Enterprise Plan** - $99/month
- Unlimited docks
- Unlimited projects
- Unlimited team members
- Multi-cloud support ✨
- Advanced monitoring ✨
- API access ✨
- Priority support ✨
- Custom integrations ✨
- Unlimited API calls
- Unlimited storage

### Modify Plans

Edit `apps/web/src/lib/billing.ts` to change:
- Pricing
- Features
- Quotas
- Plan names

## Common Tasks

### Add a New Feature Flag
1. Add to `FEATURE_FLAGS` in `billing.ts`
2. Add to plan features
3. Use `hasFeatureAccess` to check

### Add Usage Tracking
1. Call `trackUsage` mutation after operations
2. Example:
   ```typescript
   await ctx.runMutation(api.billing.mutations.trackUsage, {
     orgId,
     metricType: 'docks',
     quantity: 1,
   });
   ```

### Add a New Quota Type
1. Add to `QUOTA_TYPES` in `billing.ts`
2. Add to plan features
3. Use `isWithinQuota` to check before operations

## Need Help?

- 📚 **Full Documentation**: See `docs/billing/README.md`
- 🔗 **Autumn Docs**: [docs.useautumn.com](https://docs.useautumn.com)
- 🐛 **Issues**: Open an issue on GitHub

## Next Steps

1. Decide on monetization approach (Sponsors vs Full Billing)
2. If Sponsors: Set up GitHub Sponsors and add button
3. If Billing: Get Autumn API keys and start implementation
4. Test thoroughly before going live
5. Monitor usage and billing in production

---

**Remember**: The scaffold is complete and tested. All placeholders are marked with TODO comments. Pick the monetization approach that fits your needs and start implementing!
