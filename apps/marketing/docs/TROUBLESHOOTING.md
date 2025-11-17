# StackDock MDX Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues with the StackDock MDX integration and draft system.

## Table of Contents

1. [Build Issues](#build-issues)
2. [Content Issues](#content-issues)
3. [Styling Issues](#styling-issues)
4. [TypeScript Issues](#typescript-issues)
5. [Performance Issues](#performance-issues)
6. [Accessibility Issues](#accessibility-issues)
7. [Deployment Issues](#deployment-issues)
8. [Debug Commands](#debug-commands)

## Build Issues

### Critical: Error Loop Prevention

**⚠️ IMPORTANT: When encountering cascading errors, ALWAYS follow this sequence:**

1. **STOP EVERYTHING** - Kill all Node processes
2. **CLEAN CACHE** - Remove build artifacts
3. **START FRESH** - Restart dev server cleanly

**Commands:**
```bash
# 1. Kill all Node processes
taskkill /f /im node.exe

# 2. Clean Next.js cache
Remove-Item -Recurse -Force .next

# 3. Start fresh dev server
pnpm dev --port 3001
```

**Why this works:**
- Prevents error cascading and dependency conflicts
- Clears corrupted build cache
- Ensures clean process startup
- Avoids compounding issues from previous failed attempts

**When to use:**
- Multiple consecutive build errors
- Dev server won't start properly
- Module resolution conflicts
- Any time errors seem to be "stacking" on each other

### MDX Compilation Errors

#### Error: "Can't resolve '@mdx-js/loader'"
**Symptoms:**
- Build fails with module resolution error
- MDX files not processing

**Solutions:**
```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install

# Check package.json for correct versions
pnpm list @mdx-js/loader
```

#### Error: "loader does not have serializable options"
**Symptoms:**
- Build fails with serialization error
- MDX loader configuration issues

**Solutions:**
```bash
# Check next.config.mjs for non-serializable options
# Remove functions from rehype/remark plugin options
# Use only plain objects and values
```

#### Error: "Cannot find module '*.mdx'"
**Symptoms:**
- TypeScript errors for MDX imports
- Module resolution failures

**Solutions:**
```bash
# Ensure mdx.d.ts exists
ls -la mdx.d.ts

# Check tsconfig.json includes MDX files
grep -A 5 "include" tsconfig.json

# Restart TypeScript server
# In VS Code: Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

### Next.js Build Errors

#### Error: "Module not found: Can't resolve 'fs'"
**Symptoms:**
- Server-side code in client components
- File system operations in browser

**Solutions:**
```typescript
// Move file operations to server-side functions
// Use dynamic imports for client-side code
// Check for fs usage in client components
```

#### Error: "Cannot read properties of undefined"
**Symptoms:**
- Runtime errors with undefined values
- Missing data in components

**Solutions:**
```typescript
// Add null checks
if (post && post.title) {
  return <h1>{post.title}</h1>
}

// Use optional chaining
return <h1>{post?.title}</h1>
```

## Content Issues

### Blog Posts Not Appearing

#### Posts Not in Blog Listing
**Symptoms:**
- Posts exist but don't show in `/blog`
- Empty blog page

**Solutions:**
```bash
# Check file location
ls -la content/blog/

# Verify frontmatter
head -20 content/blog/your-post.mdx

# Check published status
grep "published:" content/blog/your-post.mdx
```

#### Draft Posts Not Showing
**Symptoms:**
- Drafts not appearing in `/drafts`
- Empty drafts page

**Solutions:**
```bash
# Check draft directory
ls -la content/drafts/

# Verify frontmatter
head -20 content/drafts/your-draft.mdx

# Check published status
grep "published:" content/drafts/your-draft.mdx
```

### Frontmatter Issues

#### Invalid Frontmatter
**Symptoms:**
- Build errors with frontmatter
- Posts not loading

**Solutions:**
```yaml
# Check YAML syntax
---
title: "Post Title"  # Use quotes for special characters
description: "Description"
date: "2024-12-28"   # Use ISO format
author: "Author Name"
tags: ["tag1", "tag2"]  # Use array format
published: true      # Use boolean, not string
---
```

#### Missing Required Fields
**Symptoms:**
- TypeScript errors
- Undefined values in components

**Solutions:**
```typescript
// Check required fields in frontmatter
const requiredFields = ['title', 'description', 'date', 'author', 'tags', 'published']

// Add validation
if (!post.title || !post.description) {
  throw new Error('Missing required fields')
}
```

### Content Rendering Issues

#### MDX Not Rendering
**Symptoms:**
- Raw Markdown showing
- Components not working

**Solutions:**
```typescript
// Check MDXProvider usage
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/mdx/mdx-components'

<MDXProvider components={mdxComponents}>
  <MDXContent />
</MDXProvider>
```

#### Code Blocks Not Highlighted
**Symptoms:**
- Plain text code blocks
- No syntax highlighting

**Solutions:**
```typescript
// Check CodeBlock component usage
import { CodeBlock } from '@/components/mdx/code-block'

<CodeBlock className="language-javascript">
  const code = "example";
</CodeBlock>
```

## Styling Issues

### Tailwind Classes Not Working

#### Classes Not Applied
**Symptoms:**
- Styling not appearing
- Inconsistent design

**Solutions:**
```bash
# Check Tailwind configuration
cat tailwind.config.js

# Verify CSS imports
grep -r "@tailwind" app/

# Clear Next.js cache
rm -rf .next
pnpm dev
```

#### Dark Theme Issues
**Symptoms:**
- Light theme showing
- Inconsistent colors

**Solutions:**
```css
/* Check global CSS */
@import 'tailwindcss';

/* Verify dark theme classes */
.prose {
  color: #d1d5db; /* text-neutral-300 */
}
```

### Component Styling

#### Components Not Styled
**Symptoms:**
- Plain HTML elements
- Missing component styles

**Solutions:**
```typescript
// Check component imports
import { Callout } from '@/components/mdx/callout'

// Verify CSS classes
<div className="bg-neutral-900 text-white p-4 rounded-lg">
```

#### Responsive Design Issues
**Symptoms:**
- Layout breaks on mobile
- Poor mobile experience

**Solutions:**
```typescript
// Use responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

// Test on different screen sizes
// Use browser DevTools responsive mode
```

## TypeScript Issues

### Type Errors

#### "Cannot find module" Errors
**Symptoms:**
- TypeScript compilation fails
- Module resolution errors

**Solutions:**
```bash
# Check module resolution
pnpm tsc --noEmit

# Verify imports
grep -r "import.*from" components/

# Check tsconfig.json paths
grep -A 10 "paths" tsconfig.json
```

#### Interface Errors
**Symptoms:**
- Type mismatches
- Property errors

**Solutions:**
```typescript
// Check interface definitions
interface BlogPost {
  slug: string
  title: string
  // ... other properties
}

// Use proper typing
const post: BlogPost = getPostBySlug(slug)
```

### MDX Type Issues

#### MDX Import Errors
**Symptoms:**
- TypeScript errors with MDX files
- Module resolution failures

**Solutions:**
```typescript
// Check mdx.d.ts
declare module '*.mdx' {
  let MDXComponent: (props: any) => JSX.Element
  export default MDXComponent
}

// Use proper imports
import MDXContent from './content.mdx'
```

## Performance Issues

### Slow Build Times

#### Long Build Process
**Symptoms:**
- Build takes too long
- Timeout errors

**Solutions:**
```bash
# Check build performance
time pnpm build

# Optimize images
# Use Next.js Image component
# Minimize bundle size
```

#### Memory Issues
**Symptoms:**
- Out of memory errors
- Build crashes

**Solutions:**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# Check for memory leaks
# Optimize large files
```

### Runtime Performance

#### Slow Page Loads
**Symptoms:**
- Pages load slowly
- Poor user experience

**Solutions:**
```typescript
// Use dynamic imports
const LazyComponent = dynamic(() => import('./Component'))

// Optimize images
import Image from 'next/image'

// Minimize JavaScript bundle
// Use code splitting
```

## Accessibility Issues

### Screen Reader Issues

#### Content Not Readable
**Symptoms:**
- Screen reader skips content
- Poor navigation

**Solutions:**
```typescript
// Use semantic HTML
<main>
  <article>
    <h1>Post Title</h1>
    <p>Content</p>
  </article>
</main>

// Add ARIA labels
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
  </ol>
</nav>
```

#### Keyboard Navigation Issues
**Symptoms:**
- Tab order incorrect
- Focus not visible

**Solutions:**
```typescript
// Add focus states
<button className="focus:outline-none focus:ring-2 focus:ring-white">
  Click me
</button>

// Use proper tab order
// Test with keyboard navigation
```

### Color Contrast Issues

#### Poor Contrast
**Symptoms:**
- Text hard to read
- Accessibility violations

**Solutions:**
```css
/* Use high contrast colors */
.text-white { color: #ffffff; }
.text-neutral-300 { color: #d1d5db; }
.bg-neutral-900 { background-color: #171717; }

/* Test with contrast checkers */
```

## Deployment Issues

### Build Failures

#### Production Build Errors
**Symptoms:**
- Build fails in production
- Different behavior than development

**Solutions:**
```bash
# Test production build locally
pnpm build
pnpm start

# Check for environment differences
# Verify all dependencies installed
```

#### Vercel Deployment Issues
**Symptoms:**
- Deployment fails
- Build errors in Vercel

**Solutions:**
```bash
# Check Vercel build logs
# Verify build command
# Check environment variables
# Ensure all files committed
```

### Static Generation Issues

#### Static Pages Not Generated
**Symptoms:**
- Dynamic routes not working
- 404 errors

**Solutions:**
```typescript
// Check generateStaticParams
export async function generateStaticParams() {
  const slugs = getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

// Verify static generation
// Check build output
```

## Debug Commands

### General Debugging

```bash
# Check build status
pnpm build

# Verify TypeScript
pnpm tsc --noEmit

# Test development server
pnpm dev

# Check file permissions
ls -la content/blog/
ls -la content/drafts/
```

### Content Debugging

```bash
# Check blog posts
ls -la content/blog/

# Check drafts
ls -la content/drafts/

# Verify frontmatter
head -20 content/blog/your-post.mdx

# Check for syntax errors
grep -n "---" content/blog/your-post.mdx
```

### Performance Debugging

```bash
# Check bundle size
ls -la .next/static/

# Measure build time
time pnpm build

# Check memory usage
node --max-old-space-size=4096 node_modules/.bin/next build
```

### Accessibility Debugging

```bash
# Check HTML structure
curl http://localhost:3001/blog | grep -E "<h[1-6]|<main|<article"

# Test with screen reader
# Use browser accessibility tools
# Check color contrast
```

## Common Solutions

### Quick Fixes

1. **CRITICAL: Stop Error Loops** (Use this first!)
   ```bash
   # Kill all Node processes
   taskkill /f /im node.exe
   
   # Clean Next.js cache
   Remove-Item -Recurse -Force .next
   
   # Start fresh
   pnpm dev --port 3001
   ```

2. **Clear Cache**
   ```bash
   rm -rf .next
   rm -rf node_modules
   pnpm install
   ```

3. **Restart Development Server**
   ```bash
   # Stop server (Ctrl+C)
   pnpm dev
   ```

4. **Check File Locations**
   ```bash
   # Verify content files
   ls -la content/blog/
   ls -la content/drafts/
   ```

5. **Validate Frontmatter**
   ```yaml
   # Check YAML syntax
   ---
   title: "Post Title"
   description: "Description"
   date: "2024-12-28"
   author: "Author"
   tags: ["tag1", "tag2"]
   published: true
   ---
   ```

6. **Test TypeScript**
   ```bash
   pnpm tsc --noEmit
   ```

### When to Seek Help

- Build errors persist after clearing cache
- TypeScript errors that can't be resolved
- Content not appearing after verification
- Performance issues that can't be optimized
- Accessibility violations that need expert review

### Getting Help

- **Email**: contact@stackdock.dev
- **GitHub**: https://github.com/stackdock/stackdock
- **Documentation**: Check other docs in `docs/` directory

---

*This troubleshooting guide is maintained by the StackDock team for internal development and iteration.*

*Version: 1.0.0 | Last updated: December 28, 2024*
