/**
 * Billing Utilities
 * 
 * Helper functions for billing, pricing, and Autumn integration.
 * Scaffolded for future implementation.
 * 
 * TODO:
 * - Initialize Autumn SDK
 * - Implement feature gating helpers
 * - Add quota checking utilities
 * - Create plan comparison helpers
 * - Add usage formatting utilities
 */

/**
 * Plan configuration
 * Define your pricing tiers here
 */
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    displayName: 'Free Plan',
    description: 'Perfect for getting started',
    price: 0,
    currency: 'usd',
    interval: 'month' as const,
    features: {
      maxDocks: 2,
      maxProjects: 5,
      maxTeamMembers: 3,
      multiCloudSupport: false,
      advancedMonitoring: false,
      apiAccess: false,
      prioritySupport: false,
      customIntegrations: false,
      maxApiCallsPerMonth: 1000,
      maxStorageGB: 1,
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    displayName: 'Professional Plan',
    description: 'For growing teams',
    price: 2900, // $29.00
    currency: 'usd',
    interval: 'month' as const,
    features: {
      maxDocks: 10,
      maxProjects: 50,
      maxTeamMembers: 10,
      multiCloudSupport: true,
      advancedMonitoring: true,
      apiAccess: true,
      prioritySupport: false,
      customIntegrations: false,
      maxApiCallsPerMonth: 10000,
      maxStorageGB: 10,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    displayName: 'Enterprise Plan',
    description: 'For large organizations',
    price: 9900, // $99.00
    currency: 'usd',
    interval: 'month' as const,
    features: {
      maxDocks: -1, // Unlimited
      maxProjects: -1, // Unlimited
      maxTeamMembers: -1, // Unlimited
      multiCloudSupport: true,
      advancedMonitoring: true,
      apiAccess: true,
      prioritySupport: true,
      customIntegrations: true,
      maxApiCallsPerMonth: -1, // Unlimited
      maxStorageGB: -1, // Unlimited
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = typeof PLANS[PlanId];
export type PlanFeatures = Plan['features'];

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

/**
 * Check if a feature is available on a plan
 */
export function hasFeature(plan: Plan, feature: keyof PlanFeatures): boolean {
  const value = plan.features[feature];
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value > 0 || value === -1; // -1 means unlimited
  }
  return false;
}

/**
 * Check if usage is within quota
 * Returns true if within quota, false if over
 */
export function isWithinQuota(
  usage: number,
  limit: number | undefined
): boolean {
  if (limit === undefined || limit === -1) {
    return true; // Unlimited
  }
  return usage < limit;
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(
  usage: number,
  limit: number | undefined
): number {
  if (limit === undefined || limit === -1) {
    return 0; // Unlimited
  }
  return Math.min((usage / limit) * 100, 100);
}

/**
 * Get quota status for display
 */
export function getQuotaStatus(
  usage: number,
  limit: number | undefined
): 'healthy' | 'warning' | 'critical' | 'unlimited' {
  if (limit === undefined || limit === -1) {
    return 'unlimited';
  }
  const percentage = getUsagePercentage(usage, limit);
  if (percentage >= 90) return 'critical';
  if (percentage >= 75) return 'warning';
  return 'healthy';
}

/**
 * Format usage for display
 */
export function formatUsage(
  usage: number,
  limit: number | undefined
): string {
  if (limit === undefined || limit === -1) {
    return `${usage.toLocaleString()} (unlimited)`;
  }
  return `${usage.toLocaleString()} / ${limit.toLocaleString()}`;
}

/**
 * Initialize Autumn SDK
 * 
 * @placeholder - Implement when ready to integrate Autumn
 */
export function initAutumn() {
  // TODO: Initialize Autumn SDK with API keys
  // import { Autumn } from 'autumn-js';
  // 
  // const autumn = new Autumn({
  //   publicKey: import.meta.env.VITE_AUTUMN_PUBLIC_KEY,
  //   secretKey: import.meta.env.AUTUMN_SECRET_KEY,
  // });
  // 
  // return autumn;
  
  console.warn('Autumn SDK not yet initialized. Add your API keys to enable billing.');
  return null;
}

/**
 * Autumn webhook signature verification
 * 
 * @placeholder - Implement when setting up webhooks
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // TODO: Implement signature verification
  // Use Autumn's webhook signature verification
  
  console.warn('Webhook verification not implemented');
  return false;
}

/**
 * Feature flags - centralized feature access control
 */
export const FEATURE_FLAGS = {
  MULTI_CLOUD: 'multiCloudSupport',
  ADVANCED_MONITORING: 'advancedMonitoring',
  API_ACCESS: 'apiAccess',
  PRIORITY_SUPPORT: 'prioritySupport',
  CUSTOM_INTEGRATIONS: 'customIntegrations',
} as const;

/**
 * Quota types - for usage tracking
 */
export const QUOTA_TYPES = {
  DOCKS: 'maxDocks',
  PROJECTS: 'maxProjects',
  TEAM_MEMBERS: 'maxTeamMembers',
  API_CALLS: 'maxApiCallsPerMonth',
  STORAGE: 'maxStorageGB',
} as const;

/**
 * Get default plan (Free tier)
 */
export function getDefaultPlan(): Plan {
  return PLANS.FREE;
}

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): Plan | null {
  const plan = PLANS[planId.toUpperCase() as PlanId];
  return plan || null;
}

/**
 * Compare two plans
 * Returns -1 if plan1 < plan2, 0 if equal, 1 if plan1 > plan2
 */
export function comparePlans(plan1: Plan, plan2: Plan): number {
  const order: PlanId[] = ['FREE', 'PRO', 'ENTERPRISE'];
  const index1 = order.findIndex(id => PLANS[id].id === plan1.id);
  const index2 = order.findIndex(id => PLANS[id].id === plan2.id);
  return index1 - index2;
}
