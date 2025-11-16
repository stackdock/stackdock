# Tailwind CSS 4 Principle Engineer SOP

> **Location**: `docs/workflows/principle-engineers/frontend-tailwind-v4.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/principle-engineers/frontend-tailwind-v4.md`

## Agent Identity

**Agent ID**: `frontend-tailwind-v4`  
**Domain**: Tailwind CSS 4 styling standards and patterns

## Responsibilities

- Review all styling implementations
- Validate Tailwind CSS 4 usage
- Ensure design system consistency
- Verify responsive design patterns
- Check theme token usage

## Scope

**Files Reviewed**:
- `apps/web/src/**/*.{tsx,ts}` - All component files
- `apps/web/src/styles.css` - Global styles
- `apps/web/tailwind.config.*` - Tailwind configuration (if exists)

**Absolute Paths**:
- Styles: `{REPO_ROOT}/apps/web/src/styles.css`
- Components: `{REPO_ROOT}/apps/web/src/components/`

## Code Review Checkpoints

### 1. Tailwind CSS 4 Usage

**Required**:
- ✅ Use Tailwind utility classes (not custom CSS)
- ✅ Use design system tokens (e.g., `bg-primary`, `text-foreground`)
- ✅ Follow Tailwind 4 conventions
- ✅ Use CSS variables for theming

**Violations**:
- ❌ Custom CSS classes when Tailwind utilities exist
- ❌ Hard-coded colors instead of design tokens
- ❌ Not using Tailwind 4 features

### 2. Design System Tokens

**Required Tokens** (from `styles.css`):
- `bg-primary` / `bg-primary-foreground`
- `bg-secondary` / `bg-secondary-foreground`
- `bg-muted` / `bg-muted-foreground`
- `bg-accent` / `bg-accent-foreground`
- `bg-destructive` / `bg-destructive-foreground`
- `text-foreground` / `text-muted-foreground`
- `border` / `border-input`
- `ring` / `ring-ring`

**Violations**:
- ❌ Hard-coded colors: `bg-[#ff0000]` instead of `bg-destructive`
- ❌ Not using semantic tokens
- ❌ Custom color values

### 3. Responsive Design

**Required**:
- ✅ Mobile-first approach
- ✅ Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- ✅ Proper responsive utilities

**Pattern**:
```tsx
<div className="p-4 md:p-6 lg:p-8">
  {/* Mobile: p-4, Tablet: p-6, Desktop: p-8 */}
</div>
```

**Violations**:
- ❌ Desktop-first responsive classes
- ❌ Missing responsive variants
- ❌ Inconsistent breakpoint usage

### 4. Class Organization

**Required Order**:
1. Layout (flex, grid, etc.)
2. Spacing (padding, margin)
3. Sizing (width, height)
4. Typography
5. Colors
6. Effects (shadows, borders)
7. Transitions

**Example**:
```tsx
className="flex items-center justify-center p-4 w-full text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-sm transition-colors"
```

**Violations**:
- ❌ Random class order
- ❌ Missing spacing utilities
- ❌ Conflicting classes

### 5. Theme Consistency

**Required**:
- ✅ Use theme variables for dark mode
- ✅ Consistent spacing scale
- ✅ Consistent border radius
- ✅ Consistent shadows

**Theme Variables** (from `styles.css`):
- `--radius` - Border radius
- `--spacing-*` - Spacing scale
- Color variables for light/dark modes

## Testing Requirements

**Visual Testing**:
- ✅ Components render correctly in light mode
- ✅ Components render correctly in dark mode
- ✅ Responsive layouts work on all breakpoints
- ✅ No layout shifts

## Approval Criteria

**Approve** if:
- ✅ Uses Tailwind CSS 4 utilities
- ✅ Uses design system tokens
- ✅ Responsive design implemented
- ✅ Classes properly organized
- ✅ Theme consistency maintained

**Block** if:
- ❌ Custom CSS when Tailwind utilities exist
- ❌ Hard-coded colors
- ❌ Not using design tokens
- ❌ Missing responsive design
- ❌ Theme inconsistencies

## Common Violations & Fixes

### Violation: Hard-coded Colors

**Wrong**:
```tsx
<div className="bg-[#3b82f6] text-white">
```

**Fix**:
```tsx
<div className="bg-primary text-primary-foreground">
```

### Violation: Custom CSS Classes

**Wrong**:
```css
/* styles.css */
.custom-button {
  padding: 1rem;
  background: blue;
}
```

**Fix**:
```tsx
<button className="p-4 bg-primary">
```

### Violation: Missing Responsive Design

**Wrong**:
```tsx
<div className="p-8">
```

**Fix**:
```tsx
<div className="p-4 md:p-6 lg:p-8">
```

## Stand-Downs Format

When reporting findings:

```json
{
  "agentId": "frontend-tailwind-v4",
  "findings": [
    {
      "type": "violation",
      "severity": "error",
      "file": "{REPO_ROOT}/apps/web/src/components/ui/button.tsx",
      "line": 20,
      "issue": "Using hard-coded color instead of design token",
      "recommendation": "Replace bg-[#3b82f6] with bg-primary"
    }
  ]
}
```

## Quick Reference

**Styles Location**: `{REPO_ROOT}/apps/web/src/styles.css`  
**Components Location**: `{REPO_ROOT}/apps/web/src/components/`

**Check Styles**:
```bash
# From {REPO_ROOT}
cat apps/web/src/styles.css | grep -E "--(primary|secondary|muted|accent|destructive)"
```

---

**Remember**: Tailwind CSS 4 is the styling system. Use it consistently. Design tokens are mandatory.
