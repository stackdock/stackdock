Autumn - Score: 1
Analysis Summary
The codebase demonstrates zero integration with Autumn. There is no billing, pricing, or monetization infrastructure present in the application whatsoever. StackDock appears to be a multi-cloud infrastructure management platform focused exclusively on resource provisioning and monitoring, with no revenue or usage-based access control mechanisms.

Critical Findings
Complete Absence of Autumn Integration
No Autumn Dependencies

Searched all package.json files across the monorepo (root, apps/web, apps/marketing, and all packages)
No Autumn SDK or client libraries found in dependencies
No imports, API calls, or references to Autumn anywhere in the codebase
No Billing Infrastructure

Zero code related to pricing, billing, payments, or subscriptions
No Stripe integration or webhook handlers
No payment processing logic of any kind
Comprehensive search for terms: billing, pricing, stripe, payment, subscription, plan, tier, checkout, purchase, upgrade, downgrade returned zero relevant results
Missing Core Autumn Capabilities
No Feature Gating or Usage Limits

Search for feature.*gate, usage.*limit, quota, metering, entitlement found only provider-level infrastructure quotas (e.g., Linode transfer quotas in convex/docks/adapters/linode/types.ts:35)
These are external provider limits, not application-level access controls
No enforcement of feature access based on billing status or subscription tier
No usage metering or tracking for billing purposes
No Pricing Schema or Data Model

Convex schema (convex/schema.ts) contains no billing-related tables:
No subscriptions table
No customers or billing_accounts table
No plans or pricing_tiers table
No usage_records or invoices table
Schema focuses entirely on organizations, users, projects, and infrastructure resources (servers, databases, domains, etc.)
No User Journey Integration

No signup/upgrade flows
No subscription management UI
No usage dashboards showing quota consumption
No billing portal or payment method management
Application appears to operate without access restrictions
What's Present Instead
The codebase implements:

Multi-cloud resource management: Servers, domains, databases, web services across providers (Vultr, AWS, Vercel, etc.)
Convex backend: Comprehensive schema for infrastructure resources, not billing
Organization/team structure: RBAC for access control, but not tied to paid plans
Provider API integration: Encrypted API keys for cloud providers in convex/docks adapters
Impact Assessment
Score Justification: 1.0/10.0

According to the evaluation criteria:

❌ Pricing and billing NOT delegated to Autumn (no Autumn present at all)
❌ Feature access and usage limits NOT enforced via Autumn
❌ Pricing/plans do NOT live in Autumn (no pricing exists)
❌ Autumn NOT integrated into user journey
❌ No attach/check/track or equivalent Autumn API calls
❌ No alternative billing system (not even hand-rolled Stripe+webhooks)
Recommendations
To meet the Autumn integration criteria, the team would need to:

Install and Configure Autumn

Add Autumn SDK to dependencies
Configure API keys and environment variables
Set up pricing plans in Autumn dashboard
Implement Billing Schema

Create subscription tracking in Convex or defer to Autumn
Add customer-to-organization mapping
Implement usage metering for billable resources
Integrate Feature Gating

Add Autumn checks before resource provisioning (convex/docks/mutations.ts, convex/projects/mutations.ts)
Enforce resource limits based on subscription tier
Gate advanced features (multi-cloud, team collaboration, etc.) by plan
Build Billing User Journey

Add signup/subscription flow in apps/web
Implement upgrade/downgrade UI
Create usage dashboard showing quota consumption
Add billing portal for payment method management
Meter Usage

Track resource creation/usage events
Send metering data to Autumn
Display usage relative to plan limits in UI
Current State: The application has sophisticated infrastructure management capabilities but operates completely outside any monetization framework. Autumn integration is non-existent.
