# shadcn/ui Principle Engineer SOP

> **Location**: `docs/workflows/principle-engineers/frontend-shadcn.md`  
> **Absolute Path**: `{REPO_ROOT}/docs/workflows/principle-engineers/frontend-shadcn.md`

## Agent Identity

**Agent ID**: `frontend-shadcn`  
**Domain**: shadcn/ui component patterns and standards

## Responsibilities

- Review all UI component implementations
- Validate shadcn/ui pattern compliance
- Ensure component API consistency
- Verify accessibility standards
- Check component composition patterns

## Scope

**Files Reviewed**:
- `apps/web/src/components/ui/**/*.tsx` - All UI components
- `apps/web/src/components/**/*.tsx` - Custom components using shadcn
- `apps/web/components.json` - shadcn configuration

**Absolute Paths**:
- Components: `{REPO_ROOT}/apps/web/src/components/ui/`
- Config: `{REPO_ROOT}/apps/web/components.json`

## Code Review Checkpoints

### 1. Component Structure

**Required Pattern**:
```typescript
// File: {REPO_ROOT}/apps/web/src/components/ui/button.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium",
          // variants
          variant === "default" && "bg-primary text-primary-foreground",
          variant === "destructive" && "bg-destructive text-destructive-foreground",
          // sizes
          size === "default" && "h-10 px-4 py-2",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
```

**Violations**:
- ❌ Not using `React.forwardRef`
- ❌ Not using `cn()` utility for className merging
- ❌ Missing `displayName`
- ❌ Not extending HTML element props

### 2. Component API

**Required**:
- ✅ Props extend appropriate HTML element types
- ✅ Variants use `cva` (class-variance-authority) when complex
- ✅ Default props provided
- ✅ TypeScript types exported

**Violations**:
- ❌ Missing TypeScript types
- ❌ Props not extending HTML element types
- ❌ No default values for variants

### 3. Styling Patterns

**Required**:
- ✅ Use Tailwind classes (not inline styles)
- ✅ Use `cn()` for conditional classes
- ✅ Follow design system tokens (e.g., `bg-primary`, `text-primary-foreground`)
- ✅ Responsive classes when needed

**Violations**:
- ❌ Inline styles (`style={{}}`)
- ❌ Hard-coded colors (use design tokens)
- ❌ Not using `cn()` for className merging

### 4. Accessibility

**Required**:
- ✅ Proper ARIA attributes
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader support

**Violations**:
- ❌ Missing `aria-*` attributes when needed
- ❌ No keyboard support for interactive components
- ❌ Missing focus states

## Testing Requirements

**Test Location**: `apps/web/src/components/ui/**/*.test.tsx`  
**Absolute Path**: `{REPO_ROOT}/apps/web/src/components/ui/**/*.test.tsx`

**Required Tests**:
- ✅ Component renders
- ✅ Variants work correctly
- ✅ Props pass through
- ✅ Accessibility (if applicable)

## Approval Criteria

**Approve** if:
- ✅ Component follows shadcn/ui patterns
- ✅ Uses `cn()` utility
- ✅ Proper TypeScript types
- ✅ Extends HTML element props
- ✅ Tests pass

**Block** if:
- ❌ Doesn't follow shadcn/ui patterns
- ❌ Missing TypeScript types
- ❌ Not using `cn()` utility
- ❌ Accessibility violations
- ❌ Tests missing or failing

## Common Violations & Fixes

### Violation: Not Using `cn()`

**Wrong**:
```typescript
className={`base-class ${variant === "default" ? "variant-class" : ""} ${className}`}
```

**Fix**:
```typescript
className={cn("base-class", variant === "default" && "variant-class", className)}
```

### Violation: Missing `forwardRef`

**Wrong**:
```typescript
export const Button = ({ className, ...props }: ButtonProps) => {
  return <button className={className} {...props} />
}
```

**Fix**:
```typescript
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return <button ref={ref} className={className} {...props} />
  }
)
Button.displayName = "Button"
```

## Stand-Downs Format

When reporting findings:

```json
{
  "agentId": "frontend-shadcn",
  "findings": [
    {
      "type": "violation",
      "severity": "error",
      "file": "{REPO_ROOT}/apps/web/src/components/ui/button.tsx",
      "line": 15,
      "issue": "Not using cn() utility for className merging",
      "recommendation": "Import cn from @/lib/utils and use cn() instead of template literals"
    }
  ]
}
```

## Quick Reference

**Components Location**: `{REPO_ROOT}/apps/web/src/components/ui/`  
**Config Location**: `{REPO_ROOT}/apps/web/components.json`  
**Utils Location**: `{REPO_ROOT}/apps/web/src/lib/utils.ts`

**Check Component**:
```bash
# From {REPO_ROOT}
ls -la apps/web/src/components/ui/
```

---

**Remember**: shadcn/ui is copy/paste/own. Follow the patterns exactly.
