# Webhooks

Webhook handlers for provider integrations.

## Purpose

This directory will contain webhook handlers for:
- Provider webhook callbacks (deployment status, resource updates)
- Clerk webhook handlers (user/organization sync)
- Third-party service webhooks

## Status

**Currently empty** - Webhook handlers will be added as providers are integrated.

## Planned Structure

```
convex/webhooks/
├── clerk.ts          # Clerk webhook handlers
├── vercel.ts         # Vercel webhook handlers
├── netlify.ts        # Netlify webhook handlers
└── gridpane.ts       # GridPane webhook handlers (if supported)
```

## Usage

Webhook handlers will be registered in `convex/http.ts` and handle provider-specific webhook events.

---

**Note**: Webhook support is planned for future provider integrations. Currently, resource syncing is done via manual sync actions.

