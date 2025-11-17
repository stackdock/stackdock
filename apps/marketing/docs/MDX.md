# MDX Integration Documentation

## Overview

This document provides comprehensive guidance for implementing and using MDX (Markdown for JSX) in the StackDock project. MDX allows you to write JSX directly in your Markdown files, enabling rich, interactive content.

## Current Implementation Status

**Status**: Basic MDX support implemented with fallback to React components
**Next Steps**: Full MDX integration with syntax highlighting and advanced features

## Architecture

### Current Setup
- **Next.js 16**: App Router with MDX support
- **TypeScript**: Full type safety
- **Tailwind CSS**: Consistent styling
- **Static Generation**: Pre-rendered pages

### File Structure
```
app/
├── blog/
│   ├── page.tsx              # Blog listing
│   ├── [slug]/
│   │   └── page.tsx          # Dynamic blog post
│   └── example-post/
│       └── page.tsx          # Example blog post
├── drafts/
│   └── page.tsx              # Draft posts listing (dev only)
components/
├── mdx/                      # MDX-specific components
│   ├── mdx-components.tsx    # Component mapping
│   ├── code-block.tsx        # Syntax highlighting
│   ├── callout.tsx           # Callout boxes
│   └── table-of-contents.tsx # TOC generation
└── blog/                     # Blog-specific components
    ├── blog-card.tsx         # Post preview cards
    ├── blog-header.tsx       # Post headers
    ├── blog-footer.tsx       # Post footers
    └── tag-list.tsx          # Tag filtering
content/
├── blog/                     # Published MDX content files
│   └── example-post.mdx      # Example content
└── drafts/                   # Draft MDX content files (gitignored)
    ├── README.md             # Draft usage guide
    └── example-draft.mdx     # Example draft
lib/
└── blog.ts                   # Blog utilities
```

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

## Content Creation

### Draft System

The project includes a draft system for local development:

- **Draft Directory**: `content/drafts/` (gitignored)
- **Draft Page**: `/drafts` (development only, not indexed)
- **Draft Management**: Local only, not committed to version control

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

### Draft Workflow
1. Create draft in `content/drafts/`
2. Set `published: false` in frontmatter
3. Work on content locally
4. Preview at `/drafts` page
5. When ready, move to `content/blog/` and set `published: true`

### MDX File Structure
```mdx
---
title: "My Blog Post"
description: "A great blog post"
date: "2024-12-28"
author: "StackDock Team"
tags: ["tutorial", "nextjs"]
published: true
---

# My Blog Post

This is the content of my blog post.

## Section 1

Some content here.

<Callout type="info" title="Note">
This is an important note!
</Callout>

```javascript
const code = "example";
```

## Section 2

More content...
```

## Components

### MDX Components
The following components are available in MDX files:

#### Headings
- `h1`, `h2`, `h3`, `h4` - Styled headings with proper hierarchy
- Automatic anchor links for navigation
- Consistent typography with monospace font

#### Text Elements
- `p` - Paragraphs with proper spacing
- `a` - Links with hover states and external link handling
- `ul`, `ol`, `li` - Lists with proper indentation
- `blockquote` - Styled blockquotes

#### Code Elements
- `code` - Inline code with background highlighting
- `pre` - Code blocks with syntax highlighting
- Copy button for code blocks
- Language detection and badges

#### Custom Components
- `<Callout>` - Info, warning, success, error callouts
- `<TableOfContents>` - Auto-generated table of contents

### Usage Examples

#### Callouts
```mdx
<Callout type="info" title="Information">
This is an informational callout.
</Callout>

<Callout type="warning">
This is a warning without a title.
</Callout>

<Callout type="success" title="Success!">
Operation completed successfully.
</Callout>

<Callout type="error" title="Error">
Something went wrong.
</Callout>
```

#### Code Blocks
```mdx
```javascript
const example = "This will be syntax highlighted";
console.log(example);
```
```

#### Tables
```mdx
| Feature | Description | Status |
|---------|-------------|--------|
| Multi-cloud | Support for multiple providers | ✅ |
| API-driven | Everything through APIs | ✅ |
| Open source | Community-driven development | ✅ |
```

## Styling

### Design System Integration
All MDX components follow the existing design system:

- **Colors**: Black background with neutral grays
- **Typography**: Monospace font (Courier New)
- **Spacing**: Consistent with Tailwind spacing scale
- **Focus States**: White rings with proper offset
- **Hover States**: Subtle color transitions

### Custom Styles
```css
/* app/blog/[slug]/mdx.css */
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

## Blog Utilities

### Content Management
```typescript
// lib/blog.ts
export interface BlogPost {
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

// Published posts
export function getAllPosts(): BlogPost[]
export function getPostBySlug(slug: string): BlogPost
export function getRelatedPosts(slug: string, limit: number): BlogPost[]

// Draft management
export function getAllDrafts(): BlogPost[]
export function getDraftBySlug(slug: string): BlogPost
export function getDraftSlugs(): string[]
```

### Reading Time Calculation
```typescript
import readingTime from 'reading-time'

const readingTimeResult = readingTime(content)
// Returns: { text: "5 min read", minutes: 5, time: 300000, words: 1000 }
```

### Table of Contents Generation
```typescript
function extractHeadings(content: string): TOCItem[] {
  const headingRegex = /^(#{1,4})\s+(.+)$/gm
  const headings: TOCItem[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const title = match[2].trim()
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    headings.push({ id, title, level })
  }

  return headings
}
```

## SEO Optimization

### Metadata Generation
```typescript
export function generateBlogMetadata(post: BlogPost) {
  return {
    title: `${post.title} | StackDock Blog`,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      images: post.image ? [{ url: post.image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : [],
    },
  }
}
```

### Structured Data
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Post Title",
  "description": "Post description",
  "datePublished": "2024-12-28",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "StackDock",
    "logo": {
      "@type": "ImageObject",
      "url": "https://stackdock.dev/logo.png"
    }
  }
}
```

## Accessibility

### ARIA Labels
```tsx
// Table of contents
<nav aria-label="Table of contents">
  <button aria-expanded={isExpanded} aria-controls="toc-list">
    Table of Contents
  </button>
</nav>

// Code blocks
<pre role="region" aria-label="Code example">
  <code>const example = "code";</code>
</pre>

// Callouts
<div role="alert" aria-label={`${type} callout`}>
  <Icon aria-hidden="true" />
  <div>{children}</div>
</div>
```

### Keyboard Navigation
- Tab order follows logical content flow
- Focus states visible on all interactive elements
- Skip links for main content
- Arrow key navigation for table of contents

### Screen Reader Support
- Semantic HTML structure
- Proper heading hierarchy
- Descriptive alt text for images
- ARIA labels for complex interactions

## Performance

### Static Generation
```typescript
// Generate static params for all blog posts
export async function generateStaticParams() {
  const slugs = getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}
```

### Image Optimization
```tsx
import Image from 'next/image'

<Image
  src="/blog/post-image.png"
  alt="Post image"
  width={800}
  height={400}
  className="rounded-lg border border-neutral-800"
  priority={isAboveFold}
/>
```

### Code Splitting
- MDX components are code-split automatically
- Lazy loading for heavy components
- Dynamic imports for optional features

## Development Workflow

### Creating New Posts
1. Create MDX file in `content/blog/`
2. Add frontmatter with required fields
3. Write content using Markdown and JSX
4. Test locally with `pnpm dev`
5. Build and verify with `pnpm build`

### Content Guidelines
- Use semantic HTML elements
- Include alt text for all images
- Write descriptive headings
- Use callouts for important information
- Test with screen readers

### Testing
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

## Resources

### Documentation
- [MDX Documentation](https://mdxjs.com/)
- [Next.js MDX Guide](https://nextjs.org/docs/app/guides/mdx)
- [Rehype Plugins](https://github.com/rehypejs/rehype)
- [Remark Plugins](https://github.com/remarkjs/remark)

### Tools
- [MDX Playground](https://mdxjs.com/playground/)
- [Markdown Editor](https://dillinger.io/)
- [Syntax Highlighter](https://shiki.matsu.io/)

### Community
- [MDX Discord](https://discord.gg/mdx)
- [GitHub Discussions](https://github.com/mdx-js/mdx/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/mdx)

---

*This documentation is maintained by the StackDock team. For questions or contributions, please contact [contact@stackdock.dev](mailto:contact@stackdock.dev).*
