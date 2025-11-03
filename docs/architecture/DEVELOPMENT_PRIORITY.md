# Development Priority Strategy

**Last Updated**: November 11, 2025  
**Status**: Active Strategy  
**Applies To**: Mission 3+ (Multi-Provider Integration)

---

## Overview

This document outlines the strategic development priority for StackDock: **Convex/Translation Layer → TanStack Tables → XState State Machines**. This approach prioritizes validating and refining the universal schema across multiple providers before optimizing frontend components.

---

## Core Principle

> **Tighten the translation layer first, optimize the frontend second.**

The universal schema is the foundation of StackDock. If it's not stable, frontend optimizations will require rework when schema changes are needed to support additional providers.

---

## Priority Order

### Phase 1: Convex/Translation Layer ⚡ **CURRENT FOCUS**

**Goal**: Validate universal schema across 2-3 providers before frontend optimization.

**Why First?**
- Universal schema may need refinement as we see different provider patterns
- Field mappings need validation across diverse APIs
- Status mappings must work universally
- Edge cases only appear with multiple providers

**What to Build:**
- [ ] Add Vercel adapter (quick win, different API structure)
- [ ] Add AWS adapter (complex case, validates robustness)
- [ ] Add DigitalOcean adapter (IaaS focus, tests server abstraction)
- [ ] Refine universal schema based on real patterns
- [ ] Standardize field mappings across providers
- [ ] Validate status mappings work universally
- [ ] Document translation patterns and edge cases

**Success Criteria:**
- [ ] 3+ providers successfully integrated
- [ ] Universal schema stable (no breaking changes needed)
- [ ] Field mappings consistent across providers
- [ ] Status mappings comprehensive
- [ ] Edge cases documented

**Timeline**: Current sprint through next sprint

---

### Phase 2: TanStack Tables Optimization 🎨 **AFTER PHASE 1**

**Goal**: Optimize table performance and features after schema is stable.

**Why Second?**
- Tables can assume stable schema (no field guessing)
- Filtering/sorting logic can rely on consistent data types
- Bulk operations can use validated field names
- No rework needed when schema changes

**What to Build:**
- [ ] Advanced filtering (multi-column, complex queries)
- [ ] Column customization (save column preferences)
- [ ] Bulk operations (delete, update, sync multiple resources)
- [ ] Performance optimization (virtual scrolling for large datasets)
- [ ] Export functionality (CSV, JSON)
- [ ] Keyboard shortcuts for power users

**Success Criteria:**
- [ ] Tables handle 1000+ rows smoothly
- [ ] Advanced filtering works across all providers
- [ ] Bulk operations performant
- [ ] User preferences persist

**Timeline**: After Phase 1 completion

---

### Phase 3: XState State Machines 🤖 **AFTER PHASE 2**

**Goal**: Complex workflows and state management after data layer is proven.

**Why Third?**
- State machines assume consistent data shapes
- Workflows rely on validated field mappings
- Error handling needs stable error patterns
- No state machine refactoring when schema changes

**What to Build:**
- [ ] Complex provisioning workflows (multi-step forms)
- [ ] Real-time status monitoring machines
- [ ] Error recovery and retry logic
- [ ] Multi-resource operations (provision server + web service + domain)
- [ ] Workflow orchestration (dependency management)
- [ ] State persistence and recovery

**Success Criteria:**
- [ ] Multi-step provisioning flows work end-to-end
- [ ] Real-time status updates reliable
- [ ] Error recovery handles edge cases
- [ ] Workflows composable across providers

**Timeline**: After Phase 2 completion

---

## What to Validate in Phase 1

### 1. Field Coverage

**Question**: Do all providers have equivalent fields?

**Examples**:
- `productionUrl`: GridPane has `primary_domain`, Vercel has `url`, AWS has `distribution.domain`
- `gitRepo`: GridPane has `git_repo`, Vercel has `git.repository`, AWS doesn't have it
- `environment`: GridPane doesn't have it, Vercel has `target`, AWS has `stage`

**Validation Process**:
1. Map fields from each provider's API response
2. Identify gaps (missing fields in some providers)
3. Decide: Add to universal schema or handle via `fullApiData`?
4. Document field mapping decisions

**Documentation**: `docs/architecture/FIELD_MAPPINGS.md` (to be created)

---

### 2. Status Consistency

**Question**: Do all providers map cleanly to universal statuses?

**Examples**:
- GridPane: `active` → `running`, `inactive` → `stopped`
- Vercel: `READY` → `running`, `BUILDING` → `pending`, `ERROR` → `error`
- AWS: `InService` → `running`, `Pending` → `pending`, `Failed` → `error`

**Potential Issues**:
- Provider-specific statuses (e.g., Vercel's `QUEUED`, `CANCELED`)
- Status transitions differ (e.g., some have `provisioning`, others don't)
- Status granularity varies (e.g., some have `degraded`, others don't)

**Validation Process**:
1. List all statuses from each provider
2. Map to universal status enum
3. Identify unmappable statuses
4. Decide: Expand universal enum or use `fullApiData`?
5. Document status mapping patterns

**Documentation**: `docs/architecture/STATUS_MAPPINGS.md` (to be created)

---

### 3. Data Types

**Question**: Are data types consistent across providers?

**Examples**:
- **Dates**: GridPane uses ISO strings, AWS uses timestamps, Vercel uses Unix seconds
- **URLs**: GridPane uses absolute URLs, AWS uses relative paths, Vercel uses full URLs
- **IDs**: GridPane uses numbers, Vercel uses strings, AWS uses ARNs

**Validation Process**:
1. Identify all data types used
2. Standardize in universal schema (convert on insert)
3. Document conversion patterns
4. Add type validation

**Documentation**: `docs/architecture/DATA_TYPES.md` (to be created)

---

### 4. Edge Cases

**Question**: What edge cases appear with multiple providers?

**Examples**:
- **Missing Fields**: GridPane server might not have `region`, AWS always has it
- **Nested Data**: Vercel deployments have nested `config`, GridPane sites are flat
- **Pagination**: GridPane uses offset/limit, Vercel uses cursor, AWS uses tokens

**Validation Process**:
1. Test each provider adapter thoroughly
2. Document edge cases as they appear
3. Create adapter test suite
4. Add edge case handling patterns

**Documentation**: `docs/architecture/EDGE_CASES.md` (to be created)

---

## Concrete Next Steps

### Step 1: Add Vercel Adapter (Quick Win)

**Why Vercel?**
- Different API structure (REST with different auth)
- Different resource model (deployments vs sites)
- Tests the abstraction with a real-world provider

**Tasks**:
- [ ] Create `convex/docks/adapters/vercel/` directory
- [ ] Implement `VercelAPI` class (API client)
- [ ] Implement `vercelAdapter` (translation layer)
- [ ] Map Vercel deployments → `webServices` table
- [ ] Map Vercel projects → `webServices` table (or new table?)
- [ ] Test status mappings (`READY` → `running`, etc.)
- [ ] Document field mappings

**Estimated Time**: 1-2 days

---

### Step 2: Add AWS Adapter (Complex Case)

**Why AWS?**
- Many resource types (EC2, CloudFront, RDS, Route53)
- Complex status mappings
- Tests robustness of universal schema

**Tasks**:
- [ ] Create `convex/docks/adapters/aws/` directory
- [ ] Implement `AWSAPI` class (AWS SDK wrapper)
- [ ] Implement `awsAdapter` for EC2 (servers)
- [ ] Implement `awsAdapter` for CloudFront (webServices)
- [ ] Implement `awsAdapter` for Route53 (domains)
- [ ] Implement `awsAdapter` for RDS (databases)
- [ ] Test complex status mappings
- [ ] Document AWS-specific patterns

**Estimated Time**: 3-5 days

---

### Step 3: Refine Schema Based on Findings

**Tasks**:
- [ ] Review field mappings across all providers
- [ ] Identify missing universal fields
- [ ] Expand status enum if needed
- [ ] Document edge cases
- [ ] Update schema migration if needed
- [ ] Update adapter guide with patterns

**Estimated Time**: 1-2 days

---

### Step 4: Then Optimize Frontend

**Only After Phase 1 Complete**:
- Tables can assume stable schema
- XState machines can rely on consistent data
- Less rework needed

---

## Benefits of This Approach

### 1. Less Rework
- Frontend builds on stable foundation
- No schema changes after frontend optimization
- Fewer breaking changes

### 2. Better Abstraction
- Learn from multiple providers before abstracting
- Real patterns emerge, not assumptions
- Universal schema validated by real-world usage

### 3. Faster Iteration
- Easier to fix Convex/adapters than refactor frontend
- Adapter changes don't affect frontend
- Frontend can assume stable contracts

### 4. Real-World Validation
- Multiple providers reveal real patterns
- Edge cases discovered early
- Production-ready schema

---

## Current Status

**Phase**: Phase 1 (Convex/Translation Layer)  
**Progress**: GridPane adapter complete, validating pattern  
**Next**: Add Vercel adapter to test abstraction  

**GridPane Status**:
- ✅ API authentication working
- ✅ Data syncing successfully
- ✅ Universal schema populated correctly
- ✅ Tables displaying data
- ⚠️ Need to validate pattern with 2-3 more providers

---

## Decision Log

### November 11, 2025: Architecture Priority Decision

**Decision**: Prioritize Convex/translation layer before frontend optimization.

**Rationale**:
- Universal schema needs validation across multiple providers
- Field mappings need real-world testing
- Status mappings must work universally
- Frontend optimizations assume stable data shape

**Impact**:
- Frontend tables are "good enough" for validation
- Focus shifts to adding providers (Vercel, AWS, DigitalOcean)
- Frontend optimization deferred until schema stabilizes

**Status**: Active strategy

---

## Related Documents

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) - Overall architecture overview
- [`SCHEMA_DESIGN.md`](./SCHEMA_DESIGN.md) - Universal schema design
- [`../guides/DOCK_ADAPTER_GUIDE.md`](../guides/DOCK_ADAPTER_GUIDE.md) - Adapter implementation guide
- [`../workflows/AGENT_SYSTEM.md`](../workflows/AGENT_SYSTEM.md) - Agent workflow system

---

## Questions or Concerns?

If you have questions about this priority strategy or think it needs adjustment, please:
1. Document your concern in `stand-downs/`
2. Discuss with the team
3. Update this document with the decision

---

**Remember**: The universal schema is StackDock's foundation. Validate it thoroughly before building on top of it.

