---
title: Integrate Autumn for Billing and Monetization
labels: post-mvp,quality-review,enhancement,monetization
priority: low
category: monetization
estimated-hours: 20-30
related-plan: docs/stand-downs/active/autmn-recommendations.md
---

## Goal

Implement Autumn for billing, pricing, and monetization infrastructure.

## Current State

**Score**: 1/10

- ❌ No Autumn dependencies
- ❌ No billing infrastructure
- ❌ No feature gating or usage limits
- ❌ No pricing schema or data model
- ❌ No user journey integration

## Current Architecture

StackDock is currently **free and open-source**:
- No billing or payment processing
- No subscription tiers
- No usage limits or quotas
- Organization/team structure exists but not tied to paid plans

## Implementation Requirements

### 1. Schema Updates
**New Tables**:
- `subscriptions` - User/organization subscriptions
- `customers` - Billing account information
- `plans` - Pricing tiers and features
- `usage_records` - Metering and usage tracking
- `invoices` - Billing history

### 2. Feature Gating
**Implementation**:
- Add usage limits based on subscription tier
- Implement feature flags for premium features
- Add quota enforcement
- Track usage for billing purposes

### 3. User Journey
**Implementation**:
- Signup/upgrade flows
- Subscription management UI
- Usage dashboards
- Billing portal
- Payment method management

### 4. Integration Points
**Implementation**:
- Install Autumn SDK
- Add webhook handlers for subscription events
- Integrate with Stripe (or payment provider)
- Add usage metering for API calls, resources, etc.

## Files to Create/Update

- `convex/schema.ts` - Add billing tables
- `convex/billing/` - Billing mutations and queries (new)
- `apps/web/src/routes/dashboard/settings/billing/` - Billing UI (new)
- `apps/web/src/lib/billing.ts` - Billing utilities (new)
- `.env.example` - Add Autumn API keys

## Success Criteria

- [ ] Autumn SDK integrated
- [ ] Subscription management working
- [ ] Feature gating implemented
- [ ] Usage tracking and billing functional
- [ ] Payment processing integrated

## Related Documentation

See `docs/stand-downs/active/autmn-recommendations.md` for full analysis.

## Note

This is a **low priority** enhancement. Only implement if monetization is planned for StackDock. Currently, the platform operates without access restrictions.
