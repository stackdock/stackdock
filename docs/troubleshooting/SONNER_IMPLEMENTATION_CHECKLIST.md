# Sonner Toast Component Implementation Checklist

> **Purpose**: Step-by-step checklist for successfully implementing Sonner toast notifications using the official shadcn/ui guide.

**Reference**: [shadcn/ui Sonner Documentation](https://ui.shadcn.com/docs/components/sonner)

---

## Pre-Implementation: Environment Scan ✅

**CRITICAL**: Always scan environment FIRST before any action.

- [ ] **Check current directory** - Know where you are (`Get-Location` or `pwd`)
- [ ] **Verify `components.json` exists** - Located at `apps/web/components.json`
- [ ] **Verify `sonner` package installed** - Check `apps/web/package.json` for `"sonner": "^2.0.7"`
- [ ] **Check if component exists** - Search for `apps/web/src/components/ui/sonner.tsx`
- [ ] **Identify root layout** - For TanStack Start: `apps/web/src/routes/__root.tsx`
- [ ] **Verify theme provider** - Check if `ThemeProvider` uses `next-themes`

---

## Step 1: Install Component ✅

**Command**: Run from `apps/web` directory

```bash
# From repo root, navigate to apps/web
Set-Location "C:\Users\veter\Desktop\DEV\github\next\stackdock\apps\web"
# Or use relative path if already in repo root
cd apps/web

# Install sonner component
npx shadcn@latest add sonner --yes
```

**Verification**:
- [ ] Component file created: `apps/web/src/components/ui/sonner.tsx`
- [ ] File uses `"use client"` directive
- [ ] File imports from `lucide-react` (icons)
- [ ] File imports `useTheme` from `next-themes`
- [ ] File exports `{ Toaster }` component

---

## Step 2: Verify Component Pattern ✅

**Check component matches official pattern**:

- [ ] Uses Lucide icons: `CircleCheck`, `Info`, `LoaderCircle`, `OctagonX`, `TriangleAlert`
- [ ] Uses `useTheme()` hook from `next-themes`
- [ ] Passes `theme` prop to `<Sonner>` component
- [ ] Includes `className="toaster group"`
- [ ] Configures icons object with proper Lucide components
- [ ] Includes `toastOptions` with proper classNames for theming

**Reference**: [Official Sonner Component Code](https://ui.shadcn.com/docs/components/sonner#changelog)

---

## Step 3: Integrate Toaster in Root Layout ✅

**File**: `apps/web/src/routes/__root.tsx`

**Actions**:
1. Add import: `import { Toaster } from '@/components/ui/sonner'`
2. Add `<Toaster />` inside `<ThemeProvider>` wrapper (after content, before closing tag)

**Verification**:
- [ ] Import path uses alias: `@/components/ui/sonner`
- [ ] `<Toaster />` is inside `<ThemeProvider>` (needs theme access)
- [ ] No linting errors
- [ ] Component renders without errors

**Example**:
```tsx
<ThemeProvider>
  <ConvexClerkProvider>{content}</ConvexClerkProvider>
  <Toaster />
</ThemeProvider>
```

---

## Step 4: Use Toast in Components ✅

**Import**: `import { toast } from "sonner"`

**Usage Examples**:

```tsx
// Success toast
toast.success("IP Address copied to clipboard")

// Error toast
toast.error("Failed to copy IP address")

// Default toast
toast("Event has been created")

// With description
toast("Event has been created", {
  description: "Sunday, December 03, 2023 at 9:00 AM"
})

// With action
toast("Event has been created", {
  description: "Sunday, December 03, 2023 at 9:00 AM",
  action: {
    label: "Undo",
    onClick: () => console.log("Undo"),
  },
})
```

**Verification**:
- [ ] Import `toast` from `"sonner"` (not from component file)
- [ ] Use appropriate toast type (`success`, `error`, `info`, `warning`, or default)
- [ ] Toast appears when triggered
- [ ] Toast respects theme (dark/light mode)
- [ ] Toast auto-dismisses after default duration

---

## Troubleshooting Checklist

### Issue: Toaster not appearing

- [ ] Verify `<Toaster />` is in root layout
- [ ] Verify `<Toaster />` is inside `<ThemeProvider>`
- [ ] Check browser console for errors
- [ ] Verify `sonner` package is installed: `npm list sonner`
- [ ] Check import path is correct: `@/components/ui/sonner`

### Issue: Theme not working

- [ ] Verify `ThemeProvider` wraps `<Toaster />`
- [ ] Check `useTheme()` hook is working in `sonner.tsx`
- [ ] Verify `next-themes` is installed
- [ ] Check theme is being passed to `<Sonner>` component

### Issue: Toast not showing when called

- [ ] Verify `toast` is imported from `"sonner"` (not component file)
- [ ] Check toast is being called (add `console.log` before toast call)
- [ ] Verify `<Toaster />` is rendered (check DOM)
- [ ] Check for JavaScript errors in console

### Issue: Styling issues

- [ ] Verify `toastOptions.classNames` in `sonner.tsx`
- [ ] Check Tailwind classes are correct
- [ ] Verify CSS variables are set (`--popover`, `--popover-foreground`, etc.)
- [ ] Check dark mode classes are applied

### Issue: Icons not showing

- [ ] Verify Lucide icons are imported correctly
- [ ] Check icon names match Lucide exports
- [ ] Verify icons are passed to `icons` prop
- [ ] Check icon size classes (`h-4 w-4`)

---

## Success Criteria ✅

- [ ] Sonner component installed via shadcn CLI
- [ ] Component file created in correct location
- [ ] Component matches official shadcn pattern
- [ ] Toaster added to root layout inside ThemeProvider
- [ ] Toast notifications appear when triggered
- [ ] Toast respects theme (dark/light mode)
- [ ] No linting errors
- [ ] No console errors
- [ ] Toast auto-dismisses correctly

---

## Common Mistakes to Avoid ❌

1. **Don't create component manually** - Use shadcn CLI
2. **Don't place Toaster outside ThemeProvider** - Needs theme access
3. **Don't import toast from component file** - Import from `"sonner"` package
4. **Don't forget "use client" directive** - Component needs client-side rendering
5. **Don't skip environment scan** - Always check directory and existing files first

---

## Reference Links

- [Official shadcn/ui Sonner Docs](https://ui.shadcn.com/docs/components/sonner)
- [Sonner GitHub](https://github.com/emilkowalski/sonner)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)

---

**Last Updated**: 2025-11-14  
**Status**: ✅ Successfully implemented following official guide
