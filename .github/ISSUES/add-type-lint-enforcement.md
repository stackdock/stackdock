---
title: Add TypeScript/Lint Enforcement for Encryption and RBAC
labels: priority:high,category:enforcement,type:enhancement
assignees: 
milestone: Phase 1 - Foundation
---

## Goal

Make it impossible (or very difficult) to accidentally bypass encryption or RBAC checks.

## Current State

- Encryption functions exist but usage is manual
- RBAC middleware exists but usage is manual
- No type-level or lint-level enforcement

## Implementation Steps

1. Create branded types for encrypted data
   - `packages/shared/src/encryption.ts`
   - `type EncryptedApiKey = string & { __brand: 'EncryptedApiKey' }`
   - `type PlaintextApiKey = string & { __brand: 'PlaintextApiKey' }`
   - Force type conversions through encryption functions

2. Update `convex/lib/encryption.ts`
   - Return `EncryptedApiKey` from `encryptApiKey()`
   - Accept `PlaintextApiKey` in `encryptApiKey()`
   - Accept `EncryptedApiKey` in `decryptApiKey()`
   - Return `PlaintextApiKey` from `decryptApiKey()`

3. Update schema to use branded types
   - `docks.encryptedApiKey: EncryptedApiKey` (if possible with Convex)
   - Or document that `v.bytes()` should only contain `EncryptedApiKey`

4. Create RBAC helper types
   - `packages/shared/src/rbac.ts`
   - `type Permission = "resources:read" | "resources:write" | ...`
   - `type RBACProtected<T> = T & { __rbac: true }`

5. Create ESLint rule (optional, advanced)
   - Rule: "convex-mutations-must-use-rbac"
   - Detect mutations without `withRBAC()` wrapper
   - Or create a codemod to add RBAC

6. Update documentation
   - Add to `SECURITY.md`: "How to add a new secret field safely"
   - Add to `RBAC.md`: "How RBAC must be used in every mutation"

## Files to Create

- `packages/shared/src/encryption.ts` (types)
- `packages/shared/src/rbac.ts` (types)
- `.eslintrc.js` (if creating custom rule)

## Files to Update

- `convex/lib/encryption.ts`
- `convex/lib/rbac.ts`
- `docs/architecture/SECURITY.md`
- `docs/architecture/RBAC.md`
- All dock mutations to use branded types

## Success Criteria

- [ ] Branded types prevent accidental raw string usage
- [ ] Encryption functions enforce type conversions
- [ ] RBAC types defined and documented
- [ ] Documentation updated with enforcement patterns
- [ ] TypeScript compilation enforces usage

## Estimated Effort

4-6 hours

## Related

- Part of Critical Gaps Implementation Plan
- See: `docs/stand-downs/active/working/critical-gaps-implementation-plan.md`
- Related Gap: #5 - No Type Enforcement
