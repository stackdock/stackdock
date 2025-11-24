# Theme System with Record Mode - Implementation Plan

**Mission**: Mission 13 - Theme System with Record Mode  
**Status**: Ready to implement  
**Priority**: Medium

## Overview

Implement a theme system with "Record Mode" that allows users to record demos with real data while protecting sensitive information through blur/randomization.

## Architecture

### Theme System
- **Base**: `next-themes` (already integrated)
- **Current themes**: `light`, `dark`, `system`
- **New theme**: `record` (for demo recordings)

### Record Mode Features
1. **CSS blur filters** - Visual obfuscation for sensitive data
2. **Text randomization** - Realistic-looking demo data
3. **Works with real data** - No need to set up fake data
4. **Easy toggle** - Switch between normal and record modes

## Implementation Steps

### Phase 1: Add Record Theme to ThemeProvider

**File**: `apps/web/src/components/dashboard/ThemeSwitch.tsx`
- Add "Record" option to dropdown menu
- Add icon (Video or Camera icon from lucide-react)
- Update theme selection logic

**File**: `apps/web/src/routes/__root.tsx`
- Update inline script to handle "record" theme
- Add `.record-mode` class to documentElement when record theme is active

### Phase 2: Create Record Mode Utilities

**New File**: `apps/web/src/lib/record-mode.ts`
- `useRecordMode()` hook - Check if record mode is active
- `obfuscateEmail(email: string): string` - Obfuscate email addresses
- `obfuscateDomain(domain: string): string` - Obfuscate domain names
- `obfuscateIP(ip: string): string` - Obfuscate IP addresses
- `obfuscateName(name: string): string` - Obfuscate names
- `obfuscateSHA(sha: string): string` - Obfuscate commit SHAs
- `obfuscateURL(url: string): string` - Obfuscate URLs

### Phase 3: Add CSS Blur Filters

**File**: `apps/web/src/styles.css`
- Add `.record-mode` CSS rules
- Add `[data-sensitive]` attribute styles
- Add different blur levels for `data-sensitive="high"`, `data-sensitive="medium"`, `data-sensitive="low"`

### Phase 4: Update Theme Settings Page

**File**: `apps/web/src/routes/dashboard/settings/theme.tsx`
- Add theme selector component
- Add record mode explanation
- Add preview/demo section

### Phase 5: Add data-sensitive Attributes

**Files to update** (add `data-sensitive` attributes to sensitive cells):
- `apps/web/src/components/projects/CommitsTable.tsx` - Commit SHAs, author names
- `apps/web/src/components/projects/RepositoriesTable.tsx` - Repository URLs, names
- `apps/web/src/components/resources/domains-table.tsx` - Domain names, DNS records
- `apps/web/src/components/resources/servers-table.tsx` - IP addresses, server names
- `apps/web/src/components/resources/web-services-table.tsx` - URLs, service names
- `apps/web/src/components/resources/databases-table.tsx` - Database names, connection strings
- `apps/web/src/components/projects/projects-table.tsx` - Project names, GitHub repos

## Data Types to Obfuscate

### High Sensitivity (Strong blur + randomization)
- **Emails**: `user@example.com` → `us***@ex***.com`
- **IPs**: `192.168.1.1` → `192.168.***.***`
- **Commit SHAs**: `a1b2c3d` → `a1b***`

### Medium Sensitivity (Moderate blur + partial randomization)
- **Domains**: `example.com` → `ex***.com`
- **URLs**: `https://example.com` → `https://ex***.com`
- **Names**: `John Doe` → `Jo*** Do***`

### Low Sensitivity (Light blur only)
- **Repository names**: `my-repo` → `my-***`
- **Project names**: `My Project` → `My ***`

## CSS Implementation

```css
/* Record mode base styles */
.record-mode {
  /* Optional: subtle overlay or indicator */
}

/* Blur filters for sensitive data */
.record-mode [data-sensitive] {
  filter: blur(4px);
  transition: filter 0.2s ease;
}

.record-mode [data-sensitive="high"] {
  filter: blur(8px);
}

.record-mode [data-sensitive="medium"] {
  filter: blur(4px);
}

.record-mode [data-sensitive="low"] {
  filter: blur(2px);
}

/* Optional: Add visual indicator */
.record-mode::before {
  content: "🔴 REC";
  position: fixed;
  top: 0;
  right: 0;
  background: red;
  color: white;
  padding: 4px 8px;
  font-size: 12px;
  z-index: 9999;
}
```

## Utility Functions

```typescript
// lib/record-mode.ts
export function useRecordMode(): boolean {
  const { theme } = useTheme()
  return theme === 'record'
}

export function obfuscateEmail(email: string): string {
  if (!useRecordMode()) return email
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  return `${local.substring(0, 2)}***@${domain.substring(0, 2)}***.com`
}

export function obfuscateDomain(domain: string): string {
  if (!useRecordMode()) return domain
  const parts = domain.split('.')
  if (parts.length < 2) return domain
  return `${parts[0].substring(0, 2)}***.${parts[parts.length - 1]}`
}

// ... more obfuscation functions
```

## Testing Checklist

- [ ] Theme switcher shows "Record" option
- [ ] Record mode applies `.record-mode` class to documentElement
- [ ] CSS blur filters work on `[data-sensitive]` elements
- [ ] Text obfuscation functions work correctly
- [ ] Can toggle between normal and record modes
- [ ] Record mode persists across page reloads
- [ ] All sensitive data in tables is properly marked
- [ ] Demo recording shows blurred/obfuscated data

## Files Summary

### New Files
- `apps/web/src/lib/record-mode.ts` - Obfuscation utilities

### Modified Files
- `apps/web/src/components/dashboard/ThemeSwitch.tsx` - Add record option
- `apps/web/src/routes/__root.tsx` - Handle record theme
- `apps/web/src/styles.css` - Add record mode CSS
- `apps/web/src/routes/dashboard/settings/theme.tsx` - Theme settings UI
- Table components - Add `data-sensitive` attributes

## Next Steps

1. Implement Phase 1 (Theme Switch)
2. Implement Phase 2 (Utilities)
3. Implement Phase 3 (CSS)
4. Implement Phase 4 (Settings Page)
5. Implement Phase 5 (Add attributes to tables)
6. Test and refine
