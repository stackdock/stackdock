# StackDock MDX API Reference

## Overview

This document provides a comprehensive API reference for all functions, components, and utilities in the StackDock MDX integration.

## Table of Contents

1. [Blog Utilities](#blog-utilities)
2. [MDX Components](#mdx-components)
3. [Blog Components](#blog-components)
4. [Type Definitions](#type-definitions)
5. [Configuration](#configuration)

## Blog Utilities

### Content Management Functions

#### `getAllPosts(): BlogPost[]`
Returns all published blog posts sorted by date (newest first).

```typescript
import { getAllPosts } from '@/lib/blog'

const posts = getAllPosts()
// Returns: Array of BlogPost objects
```

#### `getPostBySlug(slug: string): BlogPost`
Returns a single blog post by its slug.

```typescript
import { getPostBySlug } from '@/lib/blog'

const post = getPostBySlug('my-post')
// Returns: BlogPost object or throws error
```

#### `getPostSlugs(): string[]`
Returns all blog post slugs for static generation.

```typescript
import { getPostSlugs } from '@/lib/blog'

const slugs = getPostSlugs()
// Returns: ['post-1', 'post-2', 'post-3']
```

#### `getPostsByTag(tag: string): BlogPost[]`
Returns all posts that include the specified tag.

```typescript
import { getPostsByTag } from '@/lib/blog'

const posts = getPostsByTag('tutorial')
// Returns: Array of BlogPost objects with 'tutorial' tag
```

#### `getRelatedPosts(slug: string, limit?: number): BlogPost[]`
Returns related posts based on shared tags.

```typescript
import { getRelatedPosts } from '@/lib/blog'

const related = getRelatedPosts('my-post', 3)
// Returns: Array of up to 3 related BlogPost objects
```

### Draft Management Functions

#### `getAllDrafts(): BlogPost[]`
Returns all draft posts sorted by date (newest first).

```typescript
import { getAllDrafts } from '@/lib/blog'

const drafts = getAllDrafts()
// Returns: Array of BlogPost objects from content/drafts/
```

#### `getDraftBySlug(slug: string): BlogPost`
Returns a single draft post by its slug.

```typescript
import { getDraftBySlug } from '@/lib/blog'

const draft = getDraftBySlug('my-draft')
// Returns: BlogPost object or throws error
```

#### `getDraftSlugs(): string[]`
Returns all draft post slugs.

```typescript
import { getDraftSlugs } from '@/lib/blog'

const slugs = getDraftSlugs()
// Returns: ['draft-1', 'draft-2']
```

### Utility Functions

#### `getAllTags(): string[]`
Returns all unique tags from published posts, sorted alphabetically.

```typescript
import { getAllTags } from '@/lib/blog'

const tags = getAllTags()
// Returns: ['javascript', 'nextjs', 'tutorial']
```

#### `formatDate(dateString: string): string`
Formats a date string for display.

```typescript
import { formatDate } from '@/lib/blog'

const formatted = formatDate('2024-12-28')
// Returns: 'December 28, 2024'
```

#### `generateBlogMetadata(post: BlogPost): Metadata`
Generates Next.js metadata for a blog post.

```typescript
import { generateBlogMetadata } from '@/lib/blog'

const metadata = generateBlogMetadata(post)
// Returns: Next.js Metadata object
```

## MDX Components

### Core Components

#### `mdxComponents: MDXComponents`
Main component mapping for MDX content.

```typescript
import { mdxComponents } from '@/components/mdx/mdx-components'

// Used in MDXProvider
<MDXProvider components={mdxComponents}>
  <MDXContent />
</MDXProvider>
```

**Mapped Elements:**
- `h1`, `h2`, `h3`, `h4` - Styled headings
- `p` - Paragraphs with proper spacing
- `a` - Links with external link handling
- `ul`, `ol`, `li` - Lists with proper styling
- `code` - Inline code with background
- `pre` - Code blocks (uses CodeBlock component)
- `blockquote` - Styled blockquotes
- `table`, `thead`, `tbody`, `tr`, `th`, `td` - Tables
- `img` - Images with Next.js optimization
- `hr` - Horizontal rules

### Specialized Components

#### `CodeBlock`
Syntax highlighted code blocks with copy functionality.

```typescript
import { CodeBlock } from '@/components/mdx/code-block'

<CodeBlock className="language-javascript">
  const example = "code";
</CodeBlock>
```

**Props:**
- `children: React.ReactNode` - Code content
- `className?: string` - CSS classes (includes language)

**Features:**
- Syntax highlighting
- Copy to clipboard button
- Language badge
- Responsive design

#### `Callout`
Custom callout boxes for important information.

```typescript
import { Callout } from '@/components/mdx/callout'

<Callout type="info" title="Note">
  This is an informational callout.
</Callout>
```

**Props:**
- `type?: 'info' | 'warning' | 'success' | 'error'` - Callout type
- `title?: string` - Optional title
- `children: React.ReactNode` - Callout content

**Types:**
- `info` - Blue theme, informational
- `warning` - Yellow theme, caution
- `success` - Green theme, positive
- `error` - Red theme, error/alert

#### `TableOfContents`
Auto-generated table of contents from headings.

```typescript
import { TableOfContents } from '@/components/mdx/table-of-contents'

<TableOfContents headings={headings} />
```

**Props:**
- `headings: TOCItem[]` - Array of heading items
- `className?: string` - Additional CSS classes

**Features:**
- Scroll spy functionality
- Collapsible on mobile
- Keyboard navigation
- Active section highlighting

## Blog Components

### Display Components

#### `BlogCard`
Post preview cards for listing pages.

```typescript
import { BlogCard } from '@/components/blog/blog-card'

<BlogCard post={post} />
```

**Props:**
- `post: BlogPost` - Blog post data

**Features:**
- Responsive design
- Metadata display
- Tag support
- Hover effects
- Accessibility attributes

#### `BlogHeader`
Post header with metadata and tags.

```typescript
import { BlogHeader } from '@/components/blog/blog-header'

<BlogHeader post={post} />
```

**Props:**
- `post: BlogPost` - Blog post data

**Features:**
- Author, date, reading time
- Tag display
- Featured image support
- Responsive layout

#### `BlogFooter`
Post footer with sharing and related posts.

```typescript
import { BlogFooter } from '@/components/blog/blog-footer'

<BlogFooter post={post} relatedPosts={relatedPosts} />
```

**Props:**
- `post: BlogPost` - Current post data
- `relatedPosts: BlogPost[]` - Related posts array

**Features:**
- Share functionality
- Related posts display
- Navigation links
- Social sharing

#### `TagList`
Interactive tag filtering interface.

```typescript
import { TagList } from '@/components/blog/tag-list'

<TagList tags={tags} />
```

**Props:**
- `tags: string[]` - Array of tag strings

**Features:**
- Tag selection
- Clear filter
- Responsive design
- Accessibility support

## Type Definitions

### Core Types

#### `BlogPost`
Main blog post interface.

```typescript
interface BlogPost {
  slug: string                    // URL slug
  title: string                   // Post title
  description: string             // SEO description
  date: string                    // Publication date (ISO string)
  author: string                  // Author name
  tags: string[]                  // Array of tags
  image?: string                  // Optional featured image
  published: boolean              // Publication status
  content: string                 // Raw content
  readingTime: string             // Calculated reading time
  tableOfContents: TOCItem[]      // Generated TOC
}
```

#### `TOCItem`
Table of contents item.

```typescript
interface TOCItem {
  id: string                      // Heading ID
  title: string                   // Heading text
  level: number                   // Heading level (1-4)
}
```

### Component Props

#### `CodeBlockProps`
```typescript
interface CodeBlockProps {
  children: React.ReactNode       // Code content
  className?: string              // CSS classes
}
```

#### `CalloutProps`
```typescript
interface CalloutProps {
  type?: 'info' | 'warning' | 'success' | 'error'
  title?: string
  children: React.ReactNode
}
```

#### `TableOfContentsProps`
```typescript
interface TableOfContentsProps {
  headings: TOCItem[]
  className?: string
}
```

#### `BlogCardProps`
```typescript
interface BlogCardProps {
  post: BlogPost
}
```

#### `BlogHeaderProps`
```typescript
interface BlogHeaderProps {
  post: BlogPost
}
```

#### `BlogFooterProps`
```typescript
interface BlogFooterProps {
  post: BlogPost
  relatedPosts: BlogPost[]
}
```

#### `TagListProps`
```typescript
interface TagListProps {
  tags: string[]
}
```

## Configuration

### Next.js Configuration
```javascript
// next.config.mjs
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  turbopack: {
    root: process.cwd(),
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
}
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/*.mdx"
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

## Usage Examples

### Basic Blog Post
```typescript
// app/blog/[slug]/page.tsx
import { getPostBySlug, getPostSlugs } from '@/lib/blog'
import { mdxComponents } from '@/components/mdx/mdx-components'
import { MDXProvider } from '@mdx-js/react'

export async function generateStaticParams() {
  const slugs = getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default function BlogPost({ params }) {
  const post = getPostBySlug(params.slug)
  
  return (
    <article>
      <h1>{post.title}</h1>
      <MDXProvider components={mdxComponents}>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </MDXProvider>
    </article>
  )
}
```

### Blog Listing
```typescript
// app/blog/page.tsx
import { getAllPosts, getAllTags } from '@/lib/blog'
import { BlogCard } from '@/components/blog/blog-card'
import { TagList } from '@/components/blog/tag-list'

export default function BlogPage() {
  const posts = getAllPosts()
  const tags = getAllTags()
  
  return (
    <div>
      <TagList tags={tags} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}
```

### Draft Management
```typescript
// app/drafts/page.tsx
import { getAllDrafts } from '@/lib/blog'
import { BlogCard } from '@/components/blog/blog-card'

export default function DraftsPage() {
  const drafts = getAllDrafts()
  
  return (
    <div>
      <h1>Draft Posts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {drafts.map((draft) => (
          <div key={draft.slug} className="relative">
            <span className="absolute -top-2 -right-2 bg-yellow-600 text-black text-xs font-bold px-2 py-1 rounded">
              DRAFT
            </span>
            <BlogCard post={draft} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

*This API reference is maintained by the StackDock team for internal development and iteration.*

*Version: 1.0.0 | Last updated: December 28, 2024*
