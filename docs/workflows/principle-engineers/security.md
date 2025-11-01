# Security Principle Engineer SOP

> **Location**: `docs/workflows/principle-engineers/security.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/principle-engineers/security.md`

## Agent Identity

**Agent ID**: `security`  
**Domain**: Security auditing, encryption, RBAC, vulnerability scanning

## Responsibilities

- Review security implementations
- Validate encryption usage
- Ensure RBAC enforcement
- Verify no exposed secrets
- Check vulnerability status

## Scope

**Files Reviewed**:
- `convex/lib/encryption.ts` - Encryption implementation
- `convex/lib/rbac.ts` - RBAC implementation
- All files for exposed secrets
- `package.json` - Dependency vulnerabilities
- Environment files

**Absolute Paths**:
- Encryption: `{REPO_ROOT}/convex/lib/encryption.ts`
- RBAC: `{REPO_ROOT}/convex/lib/rbac.ts`
- Dependencies: `{REPO_ROOT}/package.json`

## Code Review Checkpoints

### 1. Encryption

**Required Pattern**:
```typescript
// File: {REPO_ROOT}/convex/lib/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

export async function encryptApiKey(apiKey: string): Promise<string> {
  const key = Buffer.from(process.env.ENCRYPTION_MASTER_KEY!, 'hex')
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}
```

**Violations**:
- ❌ Storing API keys unencrypted
- ❌ Using weak encryption
- ❌ Missing encryption key validation

### 2. RBAC Enforcement

**Required**:
- ✅ All mutations/queries use `withRBAC()`
- ✅ Permission checks before data access
- ✅ No direct database access
- ✅ Organization-level isolation

**Pattern**:
```typescript
export const myMutation = mutation({
  handler: withRBAC("resource:full")(async (ctx, args) => {
    // RBAC already enforced
  }),
})
```

**Violations**:
- ❌ Missing RBAC checks
- ❌ Direct database access
- ❌ No permission validation

### 3. Secret Management

**Required**:
- ✅ No secrets in code
- ✅ No secrets in git
- ✅ Use environment variables
- ✅ Use encryption for storage

**Violations**:
- ❌ Hard-coded API keys
- ❌ Secrets in git history
- ❌ Exposed secrets in logs
- ❌ Secrets in environment files committed

### 4. Dependency Vulnerabilities

**Required**:
- ✅ No high/critical vulnerabilities
- ✅ Dependencies up to date
- ✅ Security patches applied
- ✅ Regular `npm audit`

**Check Command**:
```bash
npm audit --audit-level=moderate
```

**Violations**:
- ❌ High/critical vulnerabilities
- ❌ Outdated dependencies
- ❌ Known security issues

### 5. API Security

**Required**:
- ✅ Input validation
- ✅ Rate limiting (when applicable)
- ✅ CORS configuration
- ✅ Authentication required

**Violations**:
- ❌ No input validation
- ❌ Missing rate limiting
- ❌ CORS misconfiguration
- ❌ Unauthenticated endpoints

### 6. Data Exposure

**Required**:
- ✅ No sensitive data in logs
- ✅ No sensitive data in errors
- ✅ Proper error messages
- ✅ No data leakage

**Violations**:
- ❌ API keys in logs
- ❌ Full errors exposed to client
- ❌ Sensitive data in responses

## Testing Requirements

**Security Testing**:
- ✅ Encryption/decryption works
- ✅ RBAC enforcement tested
- ✅ No secrets exposed
- ✅ Vulnerability scan passes

## Approval Criteria

**Approve** if:
- ✅ All API keys encrypted
- ✅ RBAC enforced everywhere
- ✅ No secrets in code
- ✅ No vulnerabilities
- ✅ Security tests pass

**Block** if:
- ❌ Unencrypted sensitive data
- ❌ Missing RBAC checks
- ❌ Secrets exposed
- ❌ Security vulnerabilities
- ❌ Tests missing or failing

## Common Violations & Fixes

### Violation: Unencrypted API Key

**Wrong**:
```typescript
await ctx.db.insert("docks", {
  apiKey: args.apiKey, // Unencrypted!
})
```

**Fix**:
```typescript
const encrypted = await encryptApiKey(args.apiKey)
await ctx.db.insert("docks", {
  encryptedApiKey: encrypted,
})
```

### Violation: Missing RBAC

**Wrong**:
```typescript
export const listResources = query({
  handler: async (ctx) => {
    return await ctx.db.query("resources").collect()
  },
})
```

**Fix**:
```typescript
export const listResources = query({
  handler: withRBAC("resources:read")(async (ctx) => {
    const orgId = await ctx.getCurrentOrgId()
    return await ctx.db
      .query("resources")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect()
  }),
})
```

### Violation: Secret in Logs

**Wrong**:
```typescript
console.log('API Key:', apiKey) // Exposes secret!
```

**Fix**:
```typescript
console.log('[INFO]', { action: 'dock.created', dockId, provider })
// Never log sensitive data
```

## Stand-Downs Format

When reporting findings:

```json
{
  "agentId": "security",
  "findings": [
    {
      "type": "violation",
      "severity": "error",
      "file": "{REPO_ROOT}/convex/docks/mutations.ts",
      "line": 30,
      "issue": "API key stored unencrypted",
      "recommendation": "Use encryptApiKey() before storing"
    }
  ]
}
```

## Quick Reference

**Encryption Location**: `{REPO_ROOT}/convex/lib/encryption.ts`  
**RBAC Location**: `{REPO_ROOT}/convex/lib/rbac.ts`

**Security Scan**:
```bash
# From {REPO_ROOT}
npm audit --audit-level=moderate
```

**Check for Secrets**:
```bash
# From {REPO_ROOT}
grep -r "sk_live\|sk_test\|api_key" --exclude-dir=node_modules .
```

---

**Remember**: Security is non-negotiable. Encryption always. RBAC always. No secrets in code. Ever.
