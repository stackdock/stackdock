---
title: Create Provider Capability Matrix Table
labels: priority:medium,category:documentation,type:documentation
assignees: 
milestone: Phase 2 - Medium Priority
---

## Goal

Document which providers support which universal tables and operations.

## Current State

- 16 providers integrated
- No centralized documentation of provider capabilities
- Users must check code to see what each provider supports

## Implementation Steps

1. Create `docs/architecture/PROVIDERS.md`
   - Table showing provider → universal table mappings
   - Columns: Provider | Servers | Web Services | Domains | Databases | Projects | Issues | Monitors | Mode
   - Mark with ✅/❌ for each resource type

2. Generate from code (optional)
   - Script to scan adapters and generate table
   - Or manually maintain (simpler for MVP)

## Files to Create

- `docs/architecture/PROVIDERS.md`

## Files to Update

- `docs/INDEX.md` (add link to PROVIDERS.md)

## Success Criteria

- [ ] Provider capability matrix table created
- [ ] All 16 providers documented
- [ ] All universal tables covered
- [ ] Table is easy to read and maintain

## Estimated Effort

1-2 hours

## Related

- Part of Critical Gaps Implementation Plan
- See: `docs/stand-downs/active/working/critical-gaps-implementation-plan.md`
- Related Gap: #6 - No Provider Capability Matrix
