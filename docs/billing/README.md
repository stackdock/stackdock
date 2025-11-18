# Autumn Billing Integration

This document provides an overview of the Autumn billing integration scaffold for StackDock.

## Current Status

**⚠️ Scaffold Only**: This integration is currently scaffolded but not fully functional. All billing functionality returns placeholder data or throws "not implemented" errors.

The platform currently operates as **free and open-source** with no access restrictions or billing requirements.

## Architecture

### Database Schema

New billing tables have been added to `convex/schema.ts`:

- **subscriptions**: Manages user/organization subscriptions
- **customers**: Stores billing account information
- **plans**: Defines pricing tiers and features
- **usageRecords**: Tracks usage for metering and billing
- **invoices**: Maintains billing history

### Backend (Convex)

Located in `convex/billing/`:

- **queries.ts**: Read operations for subscriptions, plans, usage, and invoices
- **mutations.ts**: Write operations for subscription management and usage tracking

All functions are currently placeholders that return mock data or throw "not implemented" errors.

### Frontend (Web App)

Located in `apps/web/src/`:

- **lib/billing.ts**: Utility functions for pricing, feature gating, and quota management
- **routes/dashboard/settings/billing/**: Billing UI components

The billing page displays a free plan with placeholder usage metrics.

## Configuration

### Environment Variables

Add to your `.env` file (see `env.example`):

```bash
# Autumn (Billing & Monetization) - Optional
VITE_AUTUMN_PUBLIC_KEY=pk_...
AUTUMN_SECRET_KEY=sk_...
```

### Dependencies

The following package has been added:

- `autumn-js@0.1.47`: Autumn JavaScript SDK

## Implementation Roadmap

To fully implement Autumn billing, complete the following:

### 1. Initialize Autumn SDK

Update `apps/web/src/lib/billing.ts`:

```typescript
import { Autumn } from 'autumn-js';

export function initAutumn() {
  const autumn = new Autumn({
    publicKey: import.meta.env.VITE_AUTUMN_PUBLIC_KEY,
    secretKey: import.meta.env.AUTUMN_SECRET_KEY,
  });
  return autumn;
}
```

### 2. Create Plans in Autumn Dashboard

1. Log in to [Autumn Dashboard](https://useautumn.com)
2. Create pricing plans matching the structure in `PLANS` constant
3. Note the plan IDs and update the code accordingly

### 3. Implement Subscription Management

In `convex/billing/mutations.ts`, implement:

- `createSubscription`: Create new subscriptions via Autumn API
- `updateSubscription`: Handle plan changes
- `cancelSubscription`: Process cancellations
- `upsertCustomer`: Manage billing customers

### 4. Implement Feature Gating

Add checks throughout the application:

```typescript
import { hasFeatureAccess } from '@/lib/billing';

// Before expensive operations
const canProvision = await hasFeatureAccess(orgId, 'multiCloudSupport');
if (!canProvision) {
  throw new Error('Upgrade required for multi-cloud support');
}
```

### 5. Add Usage Tracking

Instrument key operations to track usage:

```typescript
import { trackUsage } from 'convex/billing/mutations';

// After creating a dock
await ctx.runMutation(api.billing.mutations.trackUsage, {
  orgId,
  metricType: 'docks',
  quantity: 1,
});
```

### 6. Set Up Webhooks

Create a webhook endpoint to handle Autumn/Stripe events:

```typescript
// apps/web/src/routes/api/webhooks/autumn.ts
export async function POST(request: Request) {
  const signature = request.headers.get('autumn-signature');
  const payload = await request.text();
  
  // Verify signature
  if (!verifyWebhookSignature(payload, signature, secret)) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  // Process event
  const event = JSON.parse(payload);
  await processWebhook(event.type, event.data);
  
  return new Response('OK');
}
```

### 7. Build Billing UI

Complete the billing page with:

- Plan comparison and upgrade flows
- Payment method management
- Invoice history and downloads
- Usage dashboards with real-time data
- Subscription management (pause, resume, cancel)

### 8. Add Quota Enforcement

Implement quota checks before resource creation:

```typescript
import { isWithinQuota } from '@/lib/billing';

// Before creating a project
const projectCount = await getProjectCount(orgId);
const plan = await getCurrentPlan(orgId);

if (!isWithinQuota(projectCount, plan.features.maxProjects)) {
  throw new Error('Project limit reached. Please upgrade your plan.');
}
```

## Pricing Structure

Current plan definitions (in `apps/web/src/lib/billing.ts`):

### Free Plan ($0/month)
- 2 docks
- 5 projects
- 3 team members
- 1,000 API calls/month
- 1 GB storage

### Pro Plan ($29/month)
- 10 docks
- 50 projects
- 10 team members
- Multi-cloud support
- Advanced monitoring
- API access
- 10,000 API calls/month
- 10 GB storage

### Enterprise Plan ($99/month)
- Unlimited docks
- Unlimited projects
- Unlimited team members
- Multi-cloud support
- Advanced monitoring
- API access
- Priority support
- Custom integrations
- Unlimited API calls
- Unlimited storage

## Testing

Before going live:

1. Test in Stripe test mode
2. Verify webhook signature validation
3. Test upgrade/downgrade flows
4. Test quota enforcement
5. Test subscription cancellation
6. Verify invoice generation
7. Test payment failure scenarios

## Security Considerations

- ✅ Autumn SDK credentials stored in environment variables
- ✅ Schema includes proper indexes for performance
- ⚠️ Webhook signature verification not yet implemented
- ⚠️ Rate limiting on billing endpoints not yet added
- ⚠️ Audit logging for billing operations not yet enabled

## Alternative: Sponsor Button

If full billing integration is not needed initially, consider starting with a GitHub Sponsors button:

1. Set up [GitHub Sponsors](https://github.com/sponsors) for your account
2. Add a sponsor button to your repository
3. Display sponsor status in the UI
4. Manually grant features to sponsors

This allows you to accept support without the complexity of subscription management.

## Resources

- [Autumn Documentation](https://docs.useautumn.com)
- [Autumn JS SDK](https://www.npmjs.com/package/autumn-js)
- [Stripe Integration Guide](https://stripe.com/docs)
- [Convex Billing Patterns](https://docs.convex.dev/patterns/billing)

## Support

For questions about Autumn integration:
- Autumn: https://useautumn.com/support
- StackDock: Open an issue on GitHub

---

**Note**: This integration is scaffolded but not functional. All billing operations currently return placeholder data or errors. Implement the roadmap above to enable full billing functionality.
