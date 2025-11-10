# Accessibility Standards & Guidelines

> **Location**: `docs/architecture/ACCESSIBILITY.md`  
> **Last Updated**: January 11, 2025  
> **Status**: Active  
> **Compliance Target**: WCAG 2.1 AA

---

## Overview

StackDock is committed to building an accessible, inclusive platform. This document outlines our accessibility standards, implementation guidelines, and testing requirements.

**Compliance Level**: WCAG 2.1 Level AA (minimum standard)

---

## Core Principles

### 1. Perceivable
- All content must be perceivable to users with disabilities
- Text alternatives for images and icons
- Sufficient color contrast ratios
- Content can be presented in different ways without losing information

### 2. Operable
- All functionality must be keyboard accessible
- No seizure-inducing content
- Sufficient time to read and use content
- Clear navigation and orientation

### 3. Understandable
- Text is readable and understandable
- Content appears and operates in predictable ways
- Input assistance for errors

### 4. Robust
- Content must be compatible with assistive technologies
- Valid HTML and semantic markup
- Proper ARIA attributes where needed

---

## Implementation Standards

### Semantic HTML

**Required**: Use semantic HTML5 elements instead of generic `<div>` elements.

```tsx
// ✅ GOOD: Semantic HTML
<main>
  <header>
    <nav>
      <ul>
        <li><a href="/dashboard">Dashboard</a></li>
      </ul>
    </nav>
  </header>
  <section>
    <h1>Page Title</h1>
    <article>Content</article>
  </section>
</main>

// ❌ BAD: Generic divs
<div>
  <div>
    <div>Navigation</div>
  </div>
  <div>
    <div>Content</div>
  </div>
</div>
```

**Semantic Elements to Use**:
- `<main>` - Main content area
- `<header>` - Page header/navigation
- `<nav>` - Navigation menus
- `<section>` - Thematic content groups
- `<article>` - Standalone content
- `<aside>` - Sidebar content
- `<footer>` - Page footer
- `<h1>` through `<h6>` - Proper heading hierarchy

### ARIA Labels

**Required**: All interactive elements without visible text must have `aria-label`.

```tsx
// ✅ GOOD: Icon-only button with aria-label
<Button size="icon" aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</Button>

// ✅ GOOD: Icon with visible text (aria-hidden on icon)
<Button>
  <SearchIcon aria-hidden="true" />
  <span>Search</span>
</Button>

// ❌ BAD: Icon-only button without label
<Button size="icon">
  <TrashIcon />
</Button>
```

**ARIA Attributes**:
- `aria-label` - Descriptive label for interactive elements
- `aria-describedby` - Links to descriptive text
- `aria-hidden="true"` - Hides decorative icons from screen readers
- `aria-live` - Announces dynamic content changes
- `aria-expanded` - Indicates collapsible state
- `aria-invalid` - Indicates form field errors

### Keyboard Navigation

**Required**: All interactive elements must be keyboard accessible.

```tsx
// ✅ GOOD: Keyboard support for sortable headers
<div
  role="button"
  tabIndex={0}
  onClick={handleSort}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleSort()
    }
  }}
  aria-label="Sort by name"
>
  Name
</div>

// ✅ GOOD: Native button (always keyboard accessible)
<button onClick={handleClick}>Click me</button>
```

**Keyboard Standards**:
- `Tab` - Navigate between interactive elements
- `Enter` / `Space` - Activate buttons and links
- `Escape` - Close modals and dropdowns
- `Arrow keys` - Navigate within components (menus, lists)
- Focus indicators must be visible (use `focus-visible:ring-2`)

### Focus Management

**Required**: Visible focus indicators and proper focus management.

```tsx
// ✅ GOOD: Visible focus ring
<Button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Submit
</Button>

// ✅ GOOD: Focus trap in modal
<Dialog>
  <DialogContent onEscapeKeyDown={handleClose}>
    {/* Focus trapped inside modal */}
  </DialogContent>
</Dialog>
```

**Focus Requirements**:
- All interactive elements must have visible focus indicators
- Focus order must be logical (top to bottom, left to right)
- Focus must be trapped in modals and dialogs
- Focus must return to trigger element when modal closes
- Skip links must be provided for main content

### Skip Links

**Required**: Skip to main content link for keyboard users.

```tsx
// ✅ GOOD: Skip link component
<SkipLink href="#content">Skip to main content</SkipLink>

// In layout:
<main id="content">
  {/* Main content */}
</main>
```

**Implementation**: See `apps/web/src/components/ui/skip-link.tsx`

### Color Contrast

**Required**: All text must meet WCAG AA contrast ratios.

**Contrast Ratios**:
- **Normal text** (smaller than 18pt): 4.5:1 minimum
- **Large text** (18pt+ or 14pt+ bold): 3:1 minimum
- **UI components** (buttons, form controls): 3:1 minimum

**Design Tokens**: Always use semantic color tokens that automatically meet contrast requirements:

```tsx
// ✅ GOOD: Semantic tokens (contrast handled by design system)
<p className="text-foreground">Main text</p>
<p className="text-muted-foreground">Secondary text</p>
<button className="bg-primary text-primary-foreground">Button</button>

// ❌ BAD: Hard-coded colors (may not meet contrast)
<p className="text-gray-500">Text</p>
<button className="bg-blue-500 text-white">Button</button>
```

**Testing**: Use browser DevTools Accessibility panel or WebAIM Contrast Checker.

### Form Accessibility

**Required**: All form fields must have proper labels and error messages.

```tsx
// ✅ GOOD: Properly labeled form field
<FormItem>
  <FormLabel htmlFor="email">Email</FormLabel>
  <FormControl>
    <Input
      id="email"
      type="email"
      aria-describedby="email-error email-description"
      aria-invalid={!!errors.email}
    />
  </FormControl>
  <FormDescription id="email-description">
    We'll never share your email
  </FormDescription>
  {errors.email && (
    <FormMessage id="email-error">{errors.email}</FormMessage>
  )}
</FormItem>

// ❌ BAD: Missing label
<Input type="email" placeholder="Email" />
```

**Form Requirements**:
- All inputs must have associated `<label>` or `aria-label`
- Error messages must be linked via `aria-describedby`
- Required fields must be indicated (`aria-required` or visual indicator)
- Form validation errors must be announced to screen readers

### Table Accessibility

**Required**: Tables must have proper structure and labels.

```tsx
// ✅ GOOD: Accessible table
<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Name</TableHead>
      <TableHead scope="col">Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Server 1</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>

// ✅ GOOD: Sortable headers with keyboard support
<TableHead>
  <div
    role="button"
    tabIndex={0}
    onClick={handleSort}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        handleSort()
      }
    }}
    aria-label={`Sort by ${columnName}`}
  >
    {columnName}
  </div>
</TableHead>
```

**Table Requirements**:
- Use `<th>` for headers with `scope="col"` or `scope="row"`
- Provide `aria-label` for sortable columns
- Ensure keyboard navigation works
- For complex tables, provide `aria-describedby` linking to table description

### Icon Accessibility

**Required**: Icons must not interfere with screen readers.

```tsx
// ✅ GOOD: Decorative icon (hidden from screen readers)
<Button>
  <SearchIcon aria-hidden="true" />
  <span>Search</span>
</Button>

// ✅ GOOD: Icon-only button (aria-label required)
<Button size="icon" aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</Button>

// ✅ GOOD: Icon with meaning (no aria-hidden)
<Button>
  <AlertIcon />
  <span>Warning</span>
</Button>
```

**Icon Rules**:
- Decorative icons: `aria-hidden="true"`
- Icon-only buttons: Must have `aria-label`
- Icons with meaning: Include in accessible name or provide description

---

## Component Patterns

### Button Component

```tsx
// ✅ GOOD: Accessible button
<Button
  variant="default"
  size="default"
  aria-label="Save changes" // Required for icon-only
  className="focus-visible:ring-2 focus-visible:ring-ring"
>
  <SaveIcon aria-hidden="true" />
  <span>Save</span>
</Button>
```

### Input Component

```tsx
// ✅ GOOD: Accessible input
<FormItem>
  <FormLabel htmlFor="username">Username</FormLabel>
  <FormControl>
    <Input
      id="username"
      type="text"
      aria-describedby="username-error username-help"
      aria-invalid={!!errors.username}
      className="focus-visible:ring-2 focus-visible:ring-ring"
    />
  </FormControl>
  <FormDescription id="username-help">
    Choose a unique username
  </FormDescription>
  {errors.username && (
    <FormMessage id="username-error">{errors.username}</FormMessage>
  )}
</FormItem>
```

### Modal/Dialog Component

```tsx
// ✅ GOOD: Accessible dialog
<Dialog>
  <DialogTrigger asChild>
    <Button aria-label="Open settings dialog">Settings</Button>
  </DialogTrigger>
  <DialogContent
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
    onEscapeKeyDown={handleClose}
  >
    <DialogHeader>
      <DialogTitle id="dialog-title">Settings</DialogTitle>
      <DialogDescription id="dialog-description">
        Manage your account settings
      </DialogDescription>
    </DialogHeader>
    {/* Focus trapped inside */}
  </DialogContent>
</Dialog>
```

---

## Testing Requirements

### Automated Testing

**Tools**:
- Browser DevTools Accessibility panel
- axe DevTools extension
- WAVE browser extension
- Lighthouse accessibility audit

**Checklist**:
- [ ] No accessibility violations in axe DevTools
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Semantic HTML used correctly

### Manual Testing

**Keyboard Navigation**:
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] Arrow keys navigate menus/lists
- [ ] Focus order is logical

**Screen Reader Testing**:
- [ ] NVDA (Windows) or VoiceOver (Mac) announces content correctly
- [ ] All interactive elements have accessible names
- [ ] Form errors are announced
- [ ] Dynamic content changes are announced
- [ ] Tables are navigable

**Visual Testing**:
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast sufficient (test with DevTools)
- [ ] Content readable at 200% zoom
- [ ] No information conveyed by color alone

---

## Common Violations & Fixes

### Violation: Missing ARIA Labels

**Problem**:
```tsx
<Button size="icon">
  <TrashIcon />
</Button>
```

**Fix**:
```tsx
<Button size="icon" aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</Button>
```

### Violation: Non-Semantic HTML

**Problem**:
```tsx
<div onClick={handleClick}>Click me</div>
```

**Fix**:
```tsx
<button onClick={handleClick}>Click me</button>
```

### Violation: Missing Form Labels

**Problem**:
```tsx
<Input type="email" placeholder="Email" />
```

**Fix**:
```tsx
<FormItem>
  <FormLabel htmlFor="email">Email</FormLabel>
  <FormControl>
    <Input id="email" type="email" />
  </FormControl>
</FormItem>
```

### Violation: Hard-Coded Colors

**Problem**:
```tsx
<p className="text-gray-500">Secondary text</p>
```

**Fix**:
```tsx
<p className="text-muted-foreground">Secondary text</p>
```

---

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Testing
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [VoiceOver (Mac)](https://www.apple.com/accessibility/vision/)
- [JAWS Screen Reader](https://www.freedomscientific.com/products/software/jaws/)

---

## Compliance Checklist

Before marking a component as "accessible", verify:

- [ ] Semantic HTML used (not generic divs)
- [ ] All interactive elements have `aria-label` or visible text
- [ ] All form fields have associated labels
- [ ] Keyboard navigation works for all functionality
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI)
- [ ] Screen reader testing completed
- [ ] No accessibility violations in automated tools
- [ ] Skip links provided for main content
- [ ] Dynamic content changes announced to screen readers

---

## Current Status

**Last Audit**: January 11, 2025

**Completed**:
- ✅ Skip link component implemented
- ✅ Semantic HTML (`<main>`, `<header>`, `<nav>`) added to routes
- ✅ ARIA labels added to icon-only buttons (pagination, row actions)
- ✅ Keyboard navigation support for sortable table headers
- ✅ Color tokens replace hard-coded colors (meets contrast requirements)
- ✅ Focus indicators on all interactive elements
- ✅ Form components follow accessibility patterns

**In Progress**:
- 🔄 Comprehensive accessibility audit of all components
- 🔄 Screen reader testing

**Next Steps**:
- Complete accessibility audit of all resource tables
- Add `aria-live` regions for dynamic content
- Implement focus management for modals
- Add table captions and descriptions where needed

---

**Remember**: Accessibility is not optional. Every component must be accessible by default.
