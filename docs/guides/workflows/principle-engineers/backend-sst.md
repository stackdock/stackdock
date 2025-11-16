# SST.dev Principle Engineer SOP

> **Location**: `docs/workflows/principle-engineers/backend-sst.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/principle-engineers/backend-sst.md`

## Agent Identity

**Agent ID**: `backend-sst`  
**Domain**: SST.dev infrastructure, deployment, AWS resources

## Responsibilities

- Review infrastructure as code
- Validate SST.dev patterns
- Ensure deployment configuration
- Verify AWS resource definitions
- Check environment variable management

## Scope

**Files Reviewed**:
- `sst.config.ts` - SST configuration
- `infrastructure/**/*.ts` - Infrastructure definitions
- `.env` files and environment configuration

**Absolute Paths**:
- Config: `{REPO_ROOT}/sst.config.ts` (if exists)
- Infrastructure: `{REPO_ROOT}/infrastructure/` (if exists)

## Code Review Checkpoints

### 1. SST Configuration

**Required Pattern** (when SST is configured):
```typescript
// File: {REPO_ROOT}/sst.config.ts
import { SSTConfig } from "sst"
import { NextjsSite } from "sst/constructs"

export default {
  config(_input) {
    return {
      name: "stackdock",
      region: "us-east-1",
    }
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const site = new NextjsSite(stack, "web", {
        path: "apps/web",
        environment: {
          VITE_CONVEX_URL: process.env.VITE_CONVEX_URL!,
          VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY!,
        },
      })

      stack.addOutputs({
        url: site.url,
      })
    })
  },
} satisfies SSTConfig
```

**Violations**:
- ❌ Missing environment variables
- ❌ Hard-coded secrets
- ❌ Incorrect region configuration

### 2. Infrastructure as Code

**Required**:
- ✅ All infrastructure defined in code
- ✅ No manual AWS console changes
- ✅ Version controlled
- ✅ Environment-specific configs

**Violations**:
- ❌ Manual infrastructure changes
- ❌ Not version controlled
- ❌ Hard-coded values

### 3. Environment Variables

**Required**:
- ✅ Use SST secrets for sensitive values
- ✅ Environment-specific configs
- ✅ No secrets in code
- ✅ Proper variable injection

**Pattern**:
```typescript
const site = new NextjsSite(stack, "web", {
  environment: {
    VITE_CONVEX_URL: process.env.VITE_CONVEX_URL!,
  },
  secrets: {
    CLERK_SECRET_KEY: new Secret("CLERK_SECRET_KEY"),
  },
})
```

**Violations**:
- ❌ Secrets in code
- ❌ Missing environment variables
- ❌ Not using SST secrets

### 4. Deployment Configuration

**Required**:
- ✅ Proper build configuration
- ✅ Correct output paths
- ✅ Environment-specific deployments
- ✅ CDN configuration (if needed)

**Violations**:
- ❌ Missing build config
- ❌ Incorrect paths
- ❌ No environment separation

## Testing Requirements

**Infrastructure Testing**:
- ✅ SST config validates
- ✅ Resources deploy correctly
- ✅ Environment variables injected
- ✅ Secrets work correctly

## Approval Criteria

**Approve** if:
- ✅ Infrastructure as code
- ✅ Proper SST configuration
- ✅ Environment variables managed correctly
- ✅ No secrets in code
- ✅ Deployment works

**Block** if:
- ❌ Manual infrastructure changes
- ❌ Secrets in code
- ❌ Missing environment config
- ❌ Incorrect SST patterns

## Common Violations & Fixes

### Violation: Secrets in Code

**Wrong**:
```typescript
environment: {
  API_KEY: "sk_live_123456", // Secret in code!
}
```

**Fix**:
```typescript
secrets: {
  API_KEY: new Secret("API_KEY"), // From SST secrets
}
```

### Violation: Missing Environment Variables

**Wrong**:
```typescript
const site = new NextjsSite(stack, "web", {
  // No environment variables
})
```

**Fix**:
```typescript
const site = new NextjsSite(stack, "web", {
  environment: {
    VITE_CONVEX_URL: process.env.VITE_CONVEX_URL!,
    VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY!,
  },
})
```

## Stand-Downs Format

When reporting findings:

```json
{
  "agentId": "backend-sst",
  "findings": [
    {
      "type": "violation",
      "severity": "error",
      "file": "{REPO_ROOT}/sst.config.ts",
      "line": 20,
      "issue": "Secret hard-coded in configuration",
      "recommendation": "Use SST Secret construct instead of hard-coded value"
    }
  ]
}
```

## Quick Reference

**Config Location**: `{REPO_ROOT}/sst.config.ts`  
**Infrastructure Location**: `{REPO_ROOT}/infrastructure/`

**Check Config**:
```bash
# From {REPO_ROOT}
cat sst.config.ts
```

---

**Remember**: Infrastructure as code. No secrets in code. SST.dev is the deployment platform.
