# Security Guide

> Security is paramount. API keys are crown jewels. This document details StackDock's security architecture and best practices.

## Table of Contents

1. [Threat Model](#threat-model)
2. [Encryption](#encryption)
3. [Authentication & Authorization](#authentication--authorization)
4. [RBAC Enforcement](#rbac-enforcement)
5. [Audit Logging](#audit-logging)
6. [Network Security](#network-security)
7. [Data Protection](#data-protection)
8. [Security Best Practices](#security-best-practices)
9. [Vulnerability Reporting](#vulnerability-reporting)

---

## Threat Model

### Assets to Protect

1. **API Keys** (CROWN JEWELS)
   - GridPane, Vercel, AWS, DigitalOcean, etc.
   - Full infrastructure access
   - Highest priority

2. **User Data**
   - Email addresses
   - Names
   - Organization memberships

3. **Resource Metadata**
   - Server IPs
   - Domain names
   - Application URLs

4. **Audit Logs**
   - Who did what
   - Historical actions
   - Compliance data

### Attack Vectors

| Attack | Risk | Mitigation |
|--------|------|------------|
| **API Key Exposure** | Critical | AES-256-GCM encryption, never sent to client |
| **Horizontal Privilege Escalation** | High | RBAC checks on every operation |
| **XSS Attacks** | High | CSP headers, React auto-escaping |
| **CSRF Attacks** | Medium | Clerk JWT validation |
| **SQL Injection** | N/A | Using Convex (not SQL) |
| **Compromised User Account** | High | MFA, session management |
| **Insider Threat** | Medium | Audit logs, RBAC, encryption |

---

## Encryption

### Algorithm: AES-256-GCM

**Why AES-256-GCM?**
- **AES-256**: Industry standard, FIPS approved
- **GCM Mode**: Provides both confidentiality and authenticity
- **Authenticated Encryption**: Prevents tampering

### Implementation

```typescript
// convex/lib/encryption.ts
import { webcrypto } from "crypto"

const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY! // 64-char hex (256 bits)

export async function encryptApiKey(plaintext: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  
  // Generate random 96-bit IV (12 bytes)
  const iv = webcrypto.getRandomValues(new Uint8Array(12))
  
  // Import master key
  const keyData = Buffer.from(MASTER_KEY, 'hex')
  const key = await webcrypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  
  // Encrypt with authenticated encryption
  const encrypted = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  
  // Combine IV + ciphertext (IV needed for decryption)
  const result = new Uint8Array(iv.length + encrypted.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(encrypted), iv.length)
  
  return result
}

export async function decryptApiKey(encrypted: Uint8Array): Promise<string> {
  // Extract IV (first 12 bytes)
  const iv = encrypted.slice(0, 12)
  const ciphertext = encrypted.slice(12)
  
  // Import master key
  const keyData = Buffer.from(MASTER_KEY, 'hex')
  const key = await webcrypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  
  // Decrypt
  const decrypted = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}
```

### Key Management

#### Generating Master Key

```bash
# Run this once to generate master key
node scripts/generate-encryption-key.js

# Output: 64-character hex string
# Add to .env.local as ENCRYPTION_MASTER_KEY
```

**generate-encryption-key.js**:
```javascript
const crypto = require('crypto')

// Generate 256-bit (32 byte) key
const key = crypto.randomBytes(32).toString('hex')
console.log('ENCRYPTION_MASTER_KEY=' + key)
```

#### Key Storage

**Development**:
```bash
# .env.local
ENCRYPTION_MASTER_KEY=<64-char-hex>
```

**Production**:
- Store in Convex environment variables
- Use secrets manager (AWS Secrets Manager, Doppler, etc.)
- **NEVER** commit to git
- **NEVER** log the key

#### Key Rotation

**When to rotate**:
- Every 90 days (best practice)
- On suspected compromise
- When team member leaves

**How to rotate**:
1. Generate new key: `node scripts/generate-encryption-key.js`
2. Add `ENCRYPTION_MASTER_KEY_V2` to environment
3. Update encryption function to use version field:
   ```typescript
   docks: defineTable({
     encryptedApiKey: v.bytes(),
     keyVersion: v.number(), // Track which key was used
   })
   ```
4. Background job re-encrypts all docks with new key
5. Remove old key after re-encryption complete

### What We Encrypt

| Data | Encrypted? | Storage |
|------|------------|---------|
| API keys (docks) | ✅ | Convex `docks.encryptedApiKey` |
| User passwords | ✅ (Clerk) | Clerk (not in our DB) |
| User emails | ❌ (searchable) | Convex `users.email` |
| Resource metadata | ❌ (queryable) | Convex (servers, webServices, etc.) |
| Audit logs | ❌ (queryable) | Convex `auditLogs` |

### Security Rules

1. **NEVER send API keys to client**
   ```typescript
   // ❌ BAD
   export const getDock = query({
     handler: async (ctx, args) => {
       const dock = await ctx.db.get(args.dockId)
       return dock // Includes encryptedApiKey!
     }
   })
   
   // ✅ GOOD
   export const getDock = query({
     handler: async (ctx, args) => {
       const dock = await ctx.db.get(args.dockId)
       const { encryptedApiKey, ...safeDock } = dock
       return safeDock
     }
   })
   ```

2. **Only decrypt in Convex server functions**
   ```typescript
   // ✅ Correct: Decryption in internalMutation
   export const syncDock = internalMutation({
     handler: async (ctx, args) => {
       const dock = await ctx.db.get(args.dockId)
       const apiKey = await decryptApiKey(dock.encryptedApiKey)
       // Use apiKey to call provider API
     }
   })
   ```

3. **NEVER log decrypted values**
   ```typescript
   // ❌ NEVER DO THIS
   console.log('API key:', apiKey)
   
   // ✅ Safe logging
   console.log('API key length:', apiKey.length)
   console.log('API key prefix:', apiKey.substring(0, 4) + '****')
   ```

---

## Authentication & Authorization

### Authentication: Clerk

**JWT-Based Authentication**:
```typescript
// Clerk issues JWT on login
// JWT contains:
{
  sub: "user_abc123",     // Clerk user ID
  iss: "clerk",
  exp: 1234567890,        // Expiration
  iat: 1234567890,        // Issued at
}

// Convex validates JWT on every request
const identity = await ctx.auth.getUserIdentity()
// identity.subject = "user_abc123"
```

**User Sync (Webhook)**:
```typescript
// app/routes/api/webhooks/clerk.ts
export async function POST(request: Request) {
  const payload = await request.text()
  const headers = Object.fromEntries(request.headers)
  
  // Verify webhook signature (CRITICAL)
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
  
  try {
    const evt = wh.verify(payload, headers)
    
    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      // Sync to Convex users table
      await convex.mutation(api.users.syncFromClerk, {
        clerkId: evt.data.id,
        name: evt.data.first_name + ' ' + evt.data.last_name,
        email: evt.data.email_addresses[0].email_address,
      })
    }
    
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }
}
```

### Authorization: RBAC

See [RBAC.md](./RBAC.md) for complete details.

**Zero-Trust Model**:
- Every operation validates permissions
- No assumptions about user access
- Defense in depth

---

## RBAC Enforcement

### Convex Middleware

```typescript
// convex/lib/rbac.ts
export function withRBAC(permission: string) {
  return (handler: any) => async (ctx: MutationCtx, args: any) => {
    // 1. Get current user
    const user = await getCurrentUser(ctx)
    if (!user) throw new ConvexError("Not authenticated")
    
    // 2. Check permission
    const hasPermission = await checkPermission(
      ctx,
      user._id,
      args.orgId,
      permission
    )
    
    if (!hasPermission) {
      // Log denial
      await auditLog(ctx, "rbac.deny", "error", {
        permission,
        userId: user._id,
        orgId: args.orgId,
      })
      throw new ConvexError(`Permission denied: ${permission}`)
    }
    
    // 3. Log grant
    await auditLog(ctx, "rbac.grant", "success", { permission })
    
    // 4. Execute handler
    return handler(ctx, args, user)
  }
}
```

### Usage Example

```typescript
// convex/docks/mutations.ts
export const createDock = mutation({
  args: {
    orgId: v.id("organizations"),
    provider: v.string(),
    name: v.string(),
    apiKey: v.string(),
  },
  handler: withRBAC("docks:full")(async (ctx, args, user) => {
    // User has been validated
    // Permission has been checked
    // Safe to proceed
    
    const encrypted = await encryptApiKey(args.apiKey)
    
    return await ctx.db.insert("docks", {
      orgId: args.orgId,
      provider: args.provider,
      name: args.name,
      encryptedApiKey: encrypted,
      lastSyncStatus: "pending",
    })
  }),
})
```

### Multi-Tenant Isolation

**Every query filters by orgId**:
```typescript
export const listServers = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Verify user belongs to org
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_org_user", q =>
        q.eq("orgId", args.orgId).eq("userId", user._id)
      )
      .first()
    
    if (!membership) {
      throw new ConvexError("Not a member of organization")
    }
    
    // Only return org's servers (no cross-org leakage)
    return await ctx.db
      .query("servers")
      .withIndex("by_orgId", q => q.eq("orgId", args.orgId))
      .collect()
  },
})
```

---

## Audit Logging

### What We Log

1. **All mutations** (create, update, delete)
2. **RBAC decisions** (granted/denied with reason)
3. **Authentication events** (login, logout, failed attempts)
4. **Dock syncs** (success/failure)
5. **Security events** (permission changes, key rotation)

### Schema

```typescript
auditLogs: defineTable({
  orgId: v.id("organizations"),
  userId: v.id("users"),
  action: v.string(),              // "dock.create", "rbac.deny", etc.
  resourceType: v.optional(v.string()),
  resourceId: v.optional(v.string()),
  metadata: v.any(),               // Action-specific data
  result: v.union(v.literal("success"), v.literal("error")),
  errorMessage: v.optional(v.string()),
  timestamp: v.number(),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
})
  .index("by_org", ["orgId", "timestamp"])
  .index("by_user", ["userId", "timestamp"])
  .index("by_resource", ["resourceType", "resourceId"])
```

### Logging Function

```typescript
// convex/lib/audit.ts
export async function auditLog(
  ctx: MutationCtx,
  action: string,
  result: "success" | "error",
  metadata?: Record<string, any>
) {
  const user = await getCurrentUser(ctx)
  
  await ctx.db.insert("auditLogs", {
    orgId: user.defaultOrgId!,
    userId: user._id,
    action,
    result,
    metadata: metadata || {},
    timestamp: Date.now(),
  })
}
```

### Usage

```typescript
export const createDock = mutation({
  handler: withRBAC("docks:full")(async (ctx, args, user) => {
    try {
      const dockId = await ctx.db.insert("docks", { ... })
      
      // Log success
      await auditLog(ctx, "dock.create", "success", {
        dockId,
        provider: args.provider,
      })
      
      return dockId
    } catch (error) {
      // Log failure
      await auditLog(ctx, "dock.create", "error", {
        error: error.message,
        provider: args.provider,
      })
      throw error
    }
  }),
})
```

### Querying Logs

```typescript
// Admin can view all logs for org
export const getAuditLogs = query({
  args: { orgId: v.id("organizations"), limit: v.optional(v.number()) },
  handler: withRBAC("settings:read")(async (ctx, args) => {
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_org", q => q.eq("orgId", args.orgId))
      .order("desc")
      .take(args.limit || 100)
  }),
})
```

---

## Network Security

### HTTPS Only

**Production**: Enforce HTTPS
```typescript
// middleware.ts
if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https://')) {
  return Response.redirect('https://' + request.url.substring(7))
}
```

### Content Security Policy (CSP)

```typescript
// app.config.ts
export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://clerk.com https://convex.cloud",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://clerk.com https://*.convex.cloud",
        "frame-ancestors 'none'",
      ].join('; '),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
})
```

### CORS Configuration

**Convex**: Whitelist allowed origins
```typescript
// convex.json
{
  "functions": "convex/",
  "cors": {
    "allowedOrigins": [
      "http://localhost:3000",
      "https://app.stackdock.dev"
    ]
  }
}
```

### Rate Limiting

**Convex Built-In**:
- 1000 requests/second per deployment
- Automatic throttling

**Custom Rate Limiting** (per user):
```typescript
const rateLimits = new Map<string, number[]>()

export const createDock = mutation({
  handler: withRBAC("docks:full")(async (ctx, args, user) => {
    // Check rate limit (5 docks per minute)
    const userId = user._id
    const now = Date.now()
    const userRequests = rateLimits.get(userId) || []
    
    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter(time => now - time < 60000)
    
    if (recentRequests.length >= 5) {
      throw new ConvexError("Rate limit exceeded. Please try again later.")
    }
    
    recentRequests.push(now)
    rateLimits.set(userId, recentRequests)
    
    // Proceed with creation
    // ...
  }),
})
```

---

## Data Protection

### Data at Rest

- **Encrypted**: API keys (AES-256-GCM)
- **Unencrypted**: User data, resource metadata (queryable)
- **Handled by Convex**: Database encryption at rest

### Data in Transit

- **HTTPS**: All communication encrypted (TLS 1.3)
- **Clerk**: JWT tokens (signed and verified)
- **Convex**: WebSocket over TLS

### Data Deletion

**User Requests Deletion**:
```typescript
export const deleteUserData = mutation({
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    
    // Delete user's data
    await ctx.db.delete(user._id)
    
    // Cascade delete memberships
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_userId", q => q.eq("userId", user._id))
      .collect()
    
    for (const membership of memberships) {
      await ctx.db.delete(membership._id)
    }
    
    // Audit log deletion
    await auditLog(ctx, "user.delete", "success", { userId: user._id })
  },
})
```

### Backup Strategy

1. **Convex Automatic Backups**: Daily snapshots
2. **Export Critical Data**: Weekly exports to S3
3. **Disaster Recovery**: RPO <24 hours, RTO <4 hours

---

## Security Best Practices

### For Developers

1. **Always use RBAC middleware**
   ```typescript
   export const myMutation = mutation({
     handler: withRBAC("resource:action")(async (ctx, args) => {
       // Your logic
     }),
   })
   ```

2. **Never expose sensitive data**
   ```typescript
   // Remove encryptedApiKey before returning
   const { encryptedApiKey, ...safeDock } = dock
   return safeDock
   ```

3. **Validate all inputs**
   ```typescript
   if (!isValidProviderName(args.provider)) {
     throw new ConvexError("Invalid provider name")
   }
   ```

4. **Log security events**
   ```typescript
   await auditLog(ctx, "security.event", "success", { ... })
   ```

5. **Handle errors securely**
   ```typescript
   // ❌ Don't expose internal details
   throw new Error(`Database error: ${dbError.message}`)
   
   // ✅ Generic error messages
   throw new ConvexError("Unable to create dock. Please try again.")
   ```

### For Operations

1. **Rotate encryption keys** quarterly
2. **Review audit logs** weekly
3. **Monitor failed auth attempts**
4. **Update dependencies** monthly
5. **Security audit** annually

---

## Vulnerability Reporting

### Reporting a Vulnerability

**DO NOT create a public GitHub issue for security vulnerabilities.**

**Email**: security@stackdock.dev

**Include**:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **24 hours**: Acknowledge receipt
- **7 days**: Triage and assess severity
- **30 days**: Fix and deploy patch
- **Public disclosure**: After patch deployed (coordinated)

### Bug Bounty

**Coming Soon**: Bug bounty program details

---

## Security Checklist

### Before Deployment

- [ ] All API keys encrypted
- [ ] RBAC enforced on all mutations
- [ ] Audit logging enabled
- [ ] CSP headers configured
- [ ] HTTPS enforced
- [ ] Webhook signatures verified
- [ ] Rate limiting implemented
- [ ] Error messages don't expose internals
- [ ] No console.log of sensitive data
- [ ] Dependencies up to date
- [ ] Security scan passed

### Regular Maintenance

- [ ] Rotate encryption keys (90 days)
- [ ] Review audit logs (weekly)
- [ ] Update dependencies (monthly)
- [ ] Security audit (annually)
- [ ] Penetration test (annually)

---

**Security is everyone's responsibility. When in doubt, ask.**

**Contact**: security@stackdock.dev
