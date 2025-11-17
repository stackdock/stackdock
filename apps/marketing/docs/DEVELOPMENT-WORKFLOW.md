# StackDock Development Workflow

## Overview

This document outlines the complete development workflow for the StackDock project, including content creation, code development, testing, and deployment processes.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Content Creation Workflow](#content-creation-workflow)
3. [Code Development Workflow](#code-development-workflow)
4. [Testing Procedures](#testing-procedures)
5. [Deployment Process](#deployment-process)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Best Practices](#best-practices)

## Environment Setup

### Prerequisites
- Node.js 18 or higher
- pnpm (recommended) or npm
- Git
- Code editor (VS Code recommended)

### Initial Setup
```bash
# Clone repository
git clone https://github.com/stackdock/stackdock.git
cd stackdock-waitlist

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Development Server
- **URL**: http://localhost:3001
- **Hot Reload**: Enabled
- **TypeScript**: Strict mode
- **Turbopack**: Enabled for faster builds

## Content Creation Workflow

### 1. Blog Post Creation

#### Published Posts
```bash
# Create new blog post
touch content/blog/my-new-post.mdx

# Add frontmatter
cat > content/blog/my-new-post.mdx << EOF
---
title: "My New Post"
description: "This is a great post about StackDock"
date: "2024-12-28"
author: "Your Name"
tags: ["tutorial", "nextjs", "mdx"]
published: true
---

# My New Post

This is the content of my post...
EOF
```

#### Draft Posts
```bash
# Create draft post
touch content/drafts/my-draft.mdx

# Add frontmatter with published: false
cat > content/drafts/my-draft.mdx << EOF
---
title: "My Draft Post"
description: "This is a work in progress"
date: "2024-12-28"
author: "Your Name"
tags: ["draft", "work-in-progress"]
published: false
---

# My Draft Post

This is a work in progress...
EOF
```

### 2. Content Development Process

#### Step 1: Planning
- [ ] Define post topic and goals
- [ ] Research and gather information
- [ ] Create outline and structure
- [ ] Identify required images or assets

#### Step 2: Writing
- [ ] Create draft in `content/drafts/`
- [ ] Write content using Markdown + JSX
- [ ] Add frontmatter with all required fields
- [ ] Include code examples and callouts

#### Step 3: Review
- [ ] Preview at `/drafts` page
- [ ] Check spelling and grammar
- [ ] Verify all links work
- [ ] Test responsive design
- [ ] Check accessibility

#### Step 4: Publishing
- [ ] Move file to `content/blog/`
- [ ] Set `published: true`
- [ ] Test at `/blog` page
- [ ] Commit to version control

### 3. Content Guidelines

#### Writing Style
- Use clear, concise language
- Include code examples
- Add callouts for important information
- Use proper heading hierarchy
- Include alt text for images

#### Technical Requirements
- Valid frontmatter with all required fields
- Proper Markdown syntax
- Accessible JSX components
- Mobile-responsive content

## Code Development Workflow

### 1. Feature Development

#### New Features
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ... edit files ...

# Test changes
pnpm dev
pnpm build

# Commit changes
git add .
git commit -m "Add new feature: description"

# Push and create PR
git push origin feature/new-feature
```

#### Bug Fixes
```bash
# Create bugfix branch
git checkout -b bugfix/issue-description

# Fix the issue
# ... make changes ...

# Test fix
pnpm dev
pnpm build

# Commit fix
git add .
git commit -m "Fix: issue description"

# Push and create PR
git push origin bugfix/issue-description
```

### 2. Component Development

#### Creating New Components
```bash
# Create component file
touch components/my-new-component.tsx

# Add TypeScript interface
cat > components/my-new-component.tsx << EOF
interface MyComponentProps {
  title: string
  description?: string
}

export function MyComponent({ title, description }: MyComponentProps) {
  return (
    <div className="bg-neutral-900 p-4 rounded-lg">
      <h3 className="text-white font-mono font-semibold">{title}</h3>
      {description && (
        <p className="text-neutral-300 font-mono text-sm mt-2">
          {description}
        </p>
      )}
    </div>
  )
}
EOF
```

#### Component Guidelines
- Use TypeScript interfaces
- Follow existing design patterns
- Include accessibility attributes
- Add proper focus states
- Test with screen readers

### 3. Styling Guidelines

#### Tailwind CSS Usage
```tsx
// Good: Consistent with design system
<div className="bg-neutral-900 text-white font-mono p-4 rounded-lg">

// Bad: Inconsistent colors
<div className="bg-blue-500 text-red-500">
```

#### Design System Colors
- **Background**: `bg-black`, `bg-neutral-900`
- **Text**: `text-white`, `text-neutral-300`, `text-neutral-400`
- **Borders**: `border-neutral-800`, `border-neutral-700`
- **Focus**: `focus:ring-2 focus:ring-white`

## Testing Procedures

### 1. Development Testing

#### Local Testing
```bash
# Start development server
pnpm dev

# Test all pages
curl http://localhost:3001/
curl http://localhost:3001/blog
curl http://localhost:3001/drafts
curl http://localhost:3001/privacy
```

#### Build Testing
```bash
# Test production build
pnpm build

# Check for errors
echo $?  # Should be 0

# Test production server
pnpm start
```

### 2. Content Testing

#### Blog Post Testing
- [ ] Post appears in blog listing
- [ ] Post page loads correctly
- [ ] Metadata is correct
- [ ] Images load properly
- [ ] Links work correctly
- [ ] Mobile responsive

#### Draft Testing
- [ ] Draft appears in drafts page
- [ ] Draft doesn't appear in blog listing
- [ ] Draft page loads correctly
- [ ] Metadata is correct

### 3. Accessibility Testing

#### Manual Testing
- [ ] Tab navigation works
- [ ] Focus states visible
- [ ] Screen reader compatible
- [ ] Color contrast adequate
- [ ] Alt text present

#### Automated Testing
```bash
# Type checking
pnpm tsc --noEmit

# Linting (if configured)
pnpm lint
```

### 4. Performance Testing

#### Build Performance
```bash
# Measure build time
time pnpm build

# Check bundle size
ls -la .next/static/
```

#### Runtime Performance
- Use browser DevTools
- Check Core Web Vitals
- Test on slow connections
- Verify image optimization

## Deployment Process

### 1. Pre-deployment Checklist

#### Code Quality
- [ ] All tests pass
- [ ] TypeScript compilation successful
- [ ] No console errors
- [ ] Build completes successfully

#### Content Quality
- [ ] All posts have proper frontmatter
- [ ] No broken links
- [ ] Images optimized
- [ ] SEO metadata complete

#### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast adequate

### 2. Deployment Steps

#### Vercel Deployment
```bash
# Push to main branch
git add .
git commit -m "Deploy: description of changes"
git push origin main

# Vercel automatically deploys
# Check deployment status in Vercel dashboard
```

#### Manual Deployment
```bash
# Build for production
pnpm build

# Test production build
pnpm start

# Deploy to hosting service
# (Follow hosting service instructions)
```

### 3. Post-deployment Verification

#### Functionality Testing
- [ ] All pages load correctly
- [ ] Blog posts display properly
- [ ] Search engines can crawl
- [ ] Social sharing works

#### Performance Monitoring
- [ ] Page load times acceptable
- [ ] Core Web Vitals good
- [ ] No 404 errors
- [ ] Analytics tracking works

## Troubleshooting Guide

### Common Issues

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Rebuild
pnpm build
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
pnpm tsc --noEmit

# Restart TypeScript server
# In VS Code: Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

#### Content Not Appearing
- Check `published: true` in frontmatter
- Verify file location (`content/blog/`)
- Clear browser cache
- Check for syntax errors

#### Styling Issues
- Verify Tailwind classes
- Check CSS imports
- Test responsive design
- Clear browser cache

### Debug Commands
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

## Best Practices

### 1. Code Quality

#### TypeScript
- Use strict mode
- Define interfaces for all props
- Avoid `any` type
- Use proper type annotations

#### React
- Use functional components
- Implement proper key props
- Avoid inline functions in JSX
- Use proper event handlers

#### CSS
- Use Tailwind utility classes
- Follow design system patterns
- Maintain consistency
- Test responsive design

### 2. Content Quality

#### Writing
- Clear, concise language
- Proper grammar and spelling
- Consistent tone and style
- Include code examples

#### Structure
- Logical heading hierarchy
- Proper paragraph breaks
- Use lists and callouts
- Include relevant images

#### SEO
- Descriptive titles
- Compelling descriptions
- Relevant tags
- Proper metadata

### 3. Accessibility

#### HTML
- Semantic elements
- Proper heading hierarchy
- Alt text for images
- Descriptive link text

#### ARIA
- Use ARIA labels
- Implement proper roles
- Provide context
- Test with screen readers

#### Keyboard
- Tab order logical
- Focus states visible
- Skip links present
- No keyboard traps

### 4. Performance

#### Images
- Use Next.js Image component
- Optimize file sizes
- Include proper alt text
- Use appropriate formats

#### Code
- Minimize bundle size
- Use dynamic imports
- Optimize dependencies
- Monitor performance

#### Content
- Lazy load images
- Minimize external requests
- Use efficient queries
- Cache when appropriate

---

*This workflow guide is maintained by the StackDock team for internal development and iteration.*

*Version: 1.0.0 | Last updated: December 28, 2024*
