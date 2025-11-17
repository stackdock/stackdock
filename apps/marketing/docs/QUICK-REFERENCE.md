# StackDock MDX - Quick Reference Guide

## 🚀 Quick Start

### Development Commands
```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm tsc --noEmit
```

### Key URLs
- **Homepage**: `http://localhost:3001/`
- **Blog**: `http://localhost:3001/blog`
- **Drafts**: `http://localhost:3001/drafts` (dev only)
- **Privacy**: `http://localhost:3001/privacy`

## 📝 Content Creation

### Creating a New Blog Post
1. Create file in `content/blog/your-post.mdx`
2. Add frontmatter:
```yaml
---
title: "Your Post Title"
description: "SEO description"
date: "2024-12-28"
author: "Your Name"
tags: ["tag1", "tag2"]
published: true
---
```
3. Write content using Markdown + JSX
4. Test with `pnpm dev`

### Creating a Draft
1. Create file in `content/drafts/your-draft.mdx`
2. Set `published: false` in frontmatter
3. Work on content locally
4. Preview at `/drafts`
5. When ready, move to `content/blog/` and set `published: true`

## 🎨 Available Components

### MDX Components
```mdx
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*

- List item 1
- List item 2

[Link text](https://example.com)

`inline code`

```javascript
// Code block
const example = "code";
```

<Callout type="info" title="Note">
This is an info callout!
</Callout>

<Callout type="warning">
This is a warning callout.
</Callout>
```

### Callout Types
- `info` - Blue, informational
- `warning` - Yellow, caution
- `success` - Green, positive
- `error` - Red, error/alert

## 🏗️ File Structure

```
content/
├── blog/           # Published posts
└── drafts/         # Draft posts (gitignored)

app/
├── blog/           # Blog pages
├── drafts/         # Draft preview
└── privacy/        # Privacy page

components/
├── mdx/            # MDX components
└── blog/           # Blog components
```

## 🔧 Configuration

### Frontmatter Schema
```yaml
---
title: "Required: Post title"
description: "Required: SEO description"
date: "Required: YYYY-MM-DD"
author: "Required: Author name"
tags: ["Required: Array of tags"]
image: "Optional: /path/to/image.png"
published: true  # Required: true for published, false for drafts
---
```

### Required Fields
- `title` - Post title
- `description` - SEO description
- `date` - Publication date (YYYY-MM-DD)
- `author` - Author name
- `tags` - Array of tag strings
- `published` - Boolean (true/false)

## 🎯 Common Tasks

### Adding a New Post
1. Create `content/blog/new-post.mdx`
2. Add frontmatter
3. Write content
4. Test with `pnpm dev`
5. Verify at `/blog`

### Working on Drafts
1. Create `content/drafts/my-draft.mdx`
2. Set `published: false`
3. Work on content
4. Preview at `/drafts`
5. When ready, move to `content/blog/`

### Styling Content
- Use Tailwind classes in JSX
- Follow existing design patterns
- Maintain dark theme consistency
- Use monospace font for code

### Adding Images
```mdx
![Alt text](/path/to/image.png)
```

### Adding Code Blocks
````mdx
```javascript
const example = "code";
console.log(example);
```
````

## 🐛 Troubleshooting

### Build Errors
- Check frontmatter syntax
- Verify JSX usage
- Ensure all required fields present

### Type Errors
- Check `mdx.d.ts` exists
- Verify TypeScript configuration
- Restart development server

### Styling Issues
- Check Tailwind classes
- Verify CSS imports
- Test responsive design

### Content Not Appearing
- Check `published: true`
- Verify file location
- Clear browser cache

## 📚 Documentation Files

- `docs/IMPLEMENTATION-SUMMARY.md` - Complete implementation guide
- `docs/MDX.md` - MDX integration documentation
- `docs/DEVELOPMENT.md` - Development workflow
- `docs/ACCESSIBILITY.md` - Accessibility guidelines
- `docs/SEO.md` - SEO best practices
- `docs/COMPONENTS.md` - Component documentation

## 🔍 Debugging

### Check Build Status
```bash
pnpm build
```

### Verify TypeScript
```bash
pnpm tsc --noEmit
```

### Test Development Server
```bash
pnpm dev
```

### Common Issues
1. **MDX not rendering**: Check frontmatter syntax
2. **Styling broken**: Verify Tailwind classes
3. **Type errors**: Check TypeScript configuration
4. **Build fails**: Check for syntax errors

## 🚀 Deployment

### Production Build
```bash
pnpm build
pnpm start
```

### Static Export
```bash
pnpm build
# Files generated in .next/static
```

### Vercel Deployment
- Connect GitHub repository
- Deploy automatically on push
- Environment variables in Vercel dashboard

## 📞 Support

- **Email**: contact@stackdock.dev
- **GitHub**: https://github.com/stackdock/stackdock
- **Documentation**: Check `docs/` directory

---

*Version: 1.0.0 | Last updated: December 28, 2024*

*This is a private repository for internal development and iteration by the StackDock team.*
