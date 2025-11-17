# StackDock MDX Integration - Implementation Summary

## Overview

This document provides a complete reference for the MDX integration and draft system implemented in the StackDock project. It serves as a comprehensive guide for future development, maintenance, and feature additions.

> **Note**: This is a private repository for internal development and iteration by the StackDock team.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Dependencies](#dependencies)
3. [Configuration](#configuration)
4. [Content Management](#content-management)
5. [Component Architecture](#component-architecture)
6. [Draft System](#draft-system)
7. [Styling System](#styling-system)
8. [SEO & Accessibility](#seo--accessibility)
9. [Development Workflow](#development-workflow)
10. [Troubleshooting](#troubleshooting)
11. [Future Enhancements](#future-enhancements)

## Project Structure

### File Organization
```
stackdock-waitlist/
├── app/
│   ├── blog/
│   │   ├── page.tsx              # Blog listing page
│   │   ├── [slug]/
│   │   │   └── page.tsx          # Dynamic blog post template
│   │   └── example-post/
│   │       └── page.tsx          # Example blog post (React)
│   ├── drafts/
│   │   └── page.tsx              # Draft posts listing (dev only)
│   ├── layout.tsx                # Root layout with metadata
│   ├── page.tsx                  # Homepage
│   └── privacy/
│       └── page.tsx              # Privacy policy
├── components/
│   ├── mdx/                      # MDX-specific components
│   │   ├── mdx-components.tsx    # Component mapping
│   │   ├── code-block.tsx        # Syntax highlighting
│   │   ├── callout.tsx           # Callout boxes
│   │   └── table-of-contents.tsx # TOC generation
│   ├── blog/                     # Blog-specific components
│   │   ├── blog-card.tsx         # Post preview cards
│   │   ├── blog-header.tsx       # Post headers
│   │   ├── blog-footer.tsx       # Post footers
│   │   └── tag-list.tsx          # Tag filtering
│   └── features-grid.tsx         # Homepage features
├── content/
│   ├── blog/                     # Published MDX content
│   │   └── example-post.mdx      # Example content
│   └── drafts/                   # Draft content (gitignored)
│       ├── README.md             # Draft usage guide
│       └── example-draft.mdx     # Example draft
├── docs/                         # Documentation
│   ├── DEVELOPMENT.md            # Development guide
│   ├── ARCHITECTURE.md           # System architecture
│   ├── ACCESSIBILITY.md          # Accessibility guide
│   ├── SEO.md                    # SEO documentation
│   ├── COMPONENTS.md             # Component documentation
│   ├── MDX.md                    # MDX integration guide
│   └── IMPLEMENTATION-SUMMARY.md # This file
├── lib/
│   └── blog.ts                   # Blog utilities and functions
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── stackdock-favicon.png     # App icon
│   └── stackdock-logo.svg        # Logo
├── next.config.mjs               # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── mdx.d.ts                      # MDX type declarations
├── .gitignore                    # Git ignore rules
└── package.json                  # Dependencies
```

## Dependencies

### Core MDX Packages
```json
{
  "dependencies": {
    "@next/mdx": "^16.0.1",
    "@mdx-js/loader": "^3.1.1",
    "@mdx-js/react": "^3.1.1",
    "@types/mdx": "^2.0.13",
    "shiki": "^3.14.0"
  },
  "devDependencies": {
    "rehype-pretty-code": "^0.14.1",
    "rehype-slug": "^6.0.0",
    "rehype-autolink-headings": "^7.1.0",
    "remark-gfm": "^4.0.1",
    "reading-time": "^1.5.0",
    "gray-matter": "^4.0.3"
  }
}
```

### Package Purposes
- **@next/mdx**: Next.js MDX integration
- **@mdx-js/react**: React MDX components
- **@mdx-js/loader**: MDX file processing
- **shiki**: Syntax highlighting engine
- **rehype-pretty-code**: Code block styling
- **rehype-slug**: Heading ID generation
- **rehype-autolink-headings**: Auto-link headings
- **remark-gfm**: GitHub Flavored Markdown
- **reading-time**: Reading time calculation
- **gray-matter**: Frontmatter parsing

## Configuration

### Next.js Configuration
```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  turbopack: {
    root: process.cwd(),
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
}

export default nextConfig
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/*.mdx",
    // ... other includes
  ]
}
```

### MDX Type Declarations
```typescript
// mdx.d.ts
declare module '*.mdx' {
  let MDXComponent: (props: any) => JSX.Element
  export default MDXComponent
}

declare module '*.md' {
  let MDXComponent: (props: any) => JSX.Element
  export default MDXComponent
}
```

### Git Ignore Rules
```gitignore
# draft content
content/drafts/
```

## Content Management

### Frontmatter Schema
```yaml
---
title: "Post Title"
description: "SEO description"
date: "2024-12-28"
author: "Author Name"
tags: ["tag1", "tag2", "tag3"]
image: "/blog/post-image.png"
published: true  # Set to false for drafts
---
```

### Blog Utilities API
```typescript
// lib/blog.ts

// Published posts
export function getAllPosts(): BlogPost[]
export function getPostBySlug(slug: string): BlogPost
export function getPostSlugs(): string[]
export function getPostsByTag(tag: string): BlogPost[]
export function getRelatedPosts(slug: string, limit: number): BlogPost[]

// Draft management
export function getAllDrafts(): BlogPost[]
export function getDraftBySlug(slug: string): BlogPost
export function getDraftSlugs(): string[]

// Utilities
export function getAllTags(): string[]
export function formatDate(dateString: string): string
export function generateBlogMetadata(post: BlogPost): Metadata
```

### Content Types
```typescript
interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  image?: string
  published: boolean
  content: string
  readingTime: string
  tableOfContents: TOCItem[]
}

interface TOCItem {
  id: string
  title: string
  level: number
}
```

## Component Architecture

### MDX Components (`components/mdx/`)

#### mdx-components.tsx
- Maps HTML elements to custom React components
- Maintains design system consistency
- Handles accessibility attributes
- Supports external links with security attributes

#### code-block.tsx
- Syntax highlighted code blocks
- Copy to clipboard functionality
- Language badges
- Responsive design

#### callout.tsx
- Info, warning, success, error callouts
- Icon integration with Lucide React
- Accessible with ARIA attributes
- Consistent styling

#### table-of-contents.tsx
- Auto-generated from headings
- Scroll spy functionality
- Collapsible on mobile
- Keyboard navigation

### Blog Components (`components/blog/`)

#### blog-card.tsx
- Post preview cards
- Metadata display (author, date, reading time)
- Tag support
- Hover effects

#### blog-header.tsx
- Post header with metadata
- Author, date, reading time
- Tag display
- Featured image support

#### blog-footer.tsx
- Share functionality
- Related posts
- Navigation links
- Social sharing

#### tag-list.tsx
- Tag filtering interface
- Interactive tag selection
- Clear filter functionality
- Responsive design

## Draft System

### Purpose
- Local development of blog posts
- Work in progress content
- Not committed to version control
- Preview before publishing

### Workflow
1. Create draft in `content/drafts/`
2. Set `published: false` in frontmatter
3. Work on content locally
4. Preview at `/drafts` page
5. When ready, move to `content/blog/` and set `published: true`

### Draft Management
```typescript
// Get all drafts
const drafts = getAllDrafts()

// Get single draft
const draft = getDraftBySlug('my-draft')

// Draft page access
// Available at /drafts (development only)
// Not indexed by search engines
```

### Draft Page Features
- Draft badge indicators
- Development information
- Local-only access
- Git status information

## Styling System

### Design Principles
- Dark theme with industrial aesthetic
- Monospace typography (Courier New)
- Consistent spacing with Tailwind
- Accessibility-first approach

### MDX Styles (`app/blog/[slug]/mdx.css`)
```css
.prose {
  color: #d1d5db; /* text-neutral-300 */
  font-family: 'Courier New', monospace;
  line-height: 1.7;
}

.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  color: #ffffff; /* text-white */
  font-family: 'Courier New', monospace;
  font-weight: 600;
}
```

### Component Styling
- Tailwind CSS utility classes
- Custom CSS for complex components
- Responsive design patterns
- Focus states for accessibility

## SEO & Accessibility

### SEO Features
- Dynamic metadata generation
- Open Graph tags
- Twitter Card support
- Structured data (JSON-LD)
- Canonical URLs
- Sitemap generation

### Accessibility Features
- WCAG 2.1 AA compliance
- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation
- Screen reader support
- Focus management

### Metadata Example
```typescript
export const metadata = {
  title: "Post Title | StackDock Blog",
  description: "Post description",
  openGraph: {
    title: "Post Title",
    description: "Post description",
    type: 'article',
    publishedTime: '2024-12-28',
    authors: ['Author Name'],
    tags: ['tag1', 'tag2'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Post Title",
    description: "Post description",
  },
}
```

## Development Workflow

### Creating New Posts
1. Create MDX file in `content/blog/` or `content/drafts/`
2. Add frontmatter with required fields
3. Write content using Markdown and JSX
4. Test locally with `pnpm dev`
5. Build and verify with `pnpm build`

### Content Guidelines
- Use semantic HTML elements
- Include alt text for images
- Write descriptive headings
- Use callouts for important information
- Test with screen readers

### Testing Commands
```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm tsc --noEmit

# Linting
pnpm lint
```

## Troubleshooting

### Common Issues

#### Build Errors
**Problem**: MDX compilation fails
**Solution**: Check frontmatter syntax and JSX usage

#### Type Errors
**Problem**: TypeScript errors with MDX imports
**Solution**: Ensure `mdx.d.ts` is properly configured

#### Styling Issues
**Problem**: Components not styled correctly
**Solution**: Check Tailwind classes and CSS imports

#### Performance Issues
**Problem**: Slow build times
**Solution**: Optimize images and reduce bundle size

### Debug Tips
1. Check browser console for errors
2. Verify frontmatter syntax
3. Test with minimal content first
4. Use TypeScript strict mode
5. Check accessibility with screen readers

## Future Enhancements

### Planned Features
- [ ] Full MDX integration with syntax highlighting
- [ ] Advanced rehype/remark plugins
- [ ] Interactive code examples
- [ ] Math equation support
- [ ] Diagram rendering
- [ ] Comment system
- [ ] Search functionality
- [ ] RSS feed generation

### Advanced Plugins
```javascript
// Future configuration
const withMDX = createMDX({
  options: {
    remarkPlugins: [
      remarkGfm,
      remarkMath,
      remarkMermaid,
    ],
    rehypePlugins: [
      rehypeSlug,
      rehypePrettyCode,
      rehypeAutolinkHeadings,
      rehypeKatex,
    ],
  },
})
```

## Quick Reference

### Essential Commands
```bash
# Start development
pnpm dev

# Build production
pnpm build

# Type check
pnpm tsc --noEmit
```

### Key File Locations
- **Blog posts**: `content/blog/`
- **Drafts**: `content/drafts/`
- **Components**: `components/mdx/` and `components/blog/`
- **Utilities**: `lib/blog.ts`
- **Styles**: `app/blog/[slug]/mdx.css`

### Important URLs
- **Homepage**: `/`
- **Blog listing**: `/blog`
- **Draft posts**: `/drafts` (dev only)
- **Privacy policy**: `/privacy`

### Content Creation Checklist
- [ ] Add frontmatter with all required fields
- [ ] Set `published: true` for public posts
- [ ] Include alt text for images
- [ ] Test with screen reader
- [ ] Verify responsive design
- [ ] Check build process

---

*This documentation is maintained by the StackDock team for internal development and iteration.*

*Version: 1.0.0 | Last updated: December 28, 2024*
