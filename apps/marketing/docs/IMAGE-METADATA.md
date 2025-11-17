# Image Metadata Standards

This document defines the comprehensive image metadata requirements for the StackDock blog system, ensuring accessibility, SEO compliance, and consistent user experience.

## 🎯 Overview

All images used in blog posts must include complete metadata to meet accessibility standards (WCAG 2.1 AA) and SEO best practices. This includes proper alt text, attribution, and technical specifications.

## 📋 Required Metadata Fields

### Frontmatter Fields

Every blog post must include these image metadata fields in the frontmatter:

```yaml
---
title: "Your Blog Post Title"
image: "/blog/2025/10/your-post/hero.jpg"
imageAlt: "Descriptive alt text for screen readers and SEO"
imageCredit: "Photo by StackDock Team"
imageWidth: 1200
imageHeight: 630
---
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | string | ✅ | Path to the image file |
| `imageAlt` | string | ✅ | Descriptive alt text for accessibility |
| `imageCredit` | string | ✅ | Attribution/credit for the image |
| `imageWidth` | number | ✅ | Image width in pixels |
| `imageHeight` | number | ✅ | Image height in pixels |

## ♿ Accessibility Standards

### Alt Text Requirements

**DO:**
- Describe the image content, not just repeat the title
- Use sentence case and be descriptive but concise
- Include relevant context that adds value
- Write for someone who cannot see the image

**DON'T:**
- Use phrases like "image of" or "picture of"
- Repeat the blog post title
- Be overly verbose or too brief
- Leave alt text empty

### Examples

**❌ Poor Alt Text:**
```yaml
imageAlt: "StackDock Dashboard"  # Too generic
imageAlt: "Image of dashboard"   # Unnecessary "image of"
imageAlt: ""                     # Empty
```

**✅ Good Alt Text:**
```yaml
imageAlt: "Modern container orchestration dashboard showing multiple cloud services and infrastructure management tools"
imageAlt: "Architecture diagram illustrating the flow between microservices and database connections"
imageAlt: "Screenshot of the StackDock interface displaying real-time monitoring metrics"
```

## 🔍 SEO Benefits

### Search Engine Optimization

Proper image metadata provides several SEO advantages:

1. **Rich Snippets**: Structured metadata improves search result appearance
2. **Image Search**: Descriptive alt text helps images appear in Google Images
3. **Core Web Vitals**: Proper dimensions prevent layout shift
4. **Accessibility Score**: Improves overall site accessibility rating
5. **User Experience**: Better experience for all users, including those using screen readers

### Technical SEO

- **Image Dimensions**: Prevents layout shift during loading
- **Alt Text**: Improves keyword relevance and context
- **Credit Attribution**: Builds trust and authority
- **Structured Data**: Enables rich snippets in search results

## 🛠️ Implementation

### Blog Post Template

When creating new blog posts, use this template:

```yaml
---
title: "Your Blog Post Title"
description: "Brief description of the post"
date: "2025-01-XX"
author: "StackDock Team"
tags: ["tag1", "tag2", "tag3"]
image: "/blog/2025/01/your-post-slug/hero.jpg"
imageAlt: "Descriptive alt text describing the image content"
imageCredit: "Photo by StackDock Team"
imageWidth: 1200
imageHeight: 630
published: false
---
```

### Component Usage

All image components automatically use the metadata:

```tsx
// Blog post page
<Image
  src={post.image}
  alt={post.imageAlt || post.title}
  width={post.imageWidth || 800}
  height={post.imageHeight || 400}
  className="w-full h-64 md:h-80 object-cover rounded-lg border border-neutral-800"
  priority
/>

// Blog card
<Image
  src={post.image}
  alt={post.imageAlt || post.title}
  fill
  className="object-cover group-hover:scale-105 transition-transform duration-300"
/>
```

## 📏 Image Specifications

### Recommended Dimensions

- **Hero Images**: 1200x630px (Open Graph standard)
- **Diagrams**: Minimum 800px width, maintain aspect ratio
- **Screenshots**: High resolution, readable text
- **Icons**: 24x24px, 32x32px, or 48x48px

### File Formats

- **Photos**: JPG (for photographs)
- **Diagrams**: PNG (for diagrams with text)
- **Icons**: SVG (for scalable icons)
- **Screenshots**: PNG (for code screenshots)

## 🔧 Helper Scripts

### Creating New Blog Posts

Use the provided script to create new blog posts with proper metadata:

```bash
node scripts/create-blog-post.js "post-slug" "Post Title"
```

This automatically generates:
- Proper directory structure
- MDX file with metadata template
- README with usage instructions

### Validation

The blog utilities include validation functions:

```typescript
// Validate image path exists
validateImagePath(imagePath: string): boolean

// Get all images for a post
getPostImages(slug: string): string[]
```

## 📚 Best Practices

### Content Guidelines

1. **Consistency**: Use the same metadata structure across all posts
2. **Accuracy**: Ensure alt text accurately describes the image
3. **Relevance**: Include context that adds value to the content
4. **Attribution**: Always credit image sources properly
5. **Quality**: Use high-quality images with proper dimensions

### Technical Guidelines

1. **Performance**: Optimize images for web delivery
2. **Responsive**: Consider mobile viewing when creating images
3. **Loading**: Use appropriate loading strategies (priority, lazy)
4. **Fallbacks**: Provide fallback alt text for missing metadata
5. **Validation**: Test with screen readers and accessibility tools

## 🚨 Common Mistakes

### To Avoid

1. **Empty Alt Text**: Never leave `imageAlt` empty
2. **Generic Descriptions**: Avoid "image" or "picture" in alt text
3. **Missing Dimensions**: Always include width and height
4. **No Attribution**: Always credit image sources
5. **Inconsistent Format**: Use the same metadata structure everywhere

### Quality Checklist

Before publishing any blog post, verify:

- [ ] `imageAlt` is descriptive and meaningful
- [ ] `imageCredit` is included and accurate
- [ ] `imageWidth` and `imageHeight` are correct
- [ ] Image file exists at the specified path
- [ ] Alt text describes the image content, not the title
- [ ] All metadata follows the established format

## 🔗 Related Documentation

- [Image Organization Guide](./IMAGE-ORGANIZATION.md)
- [Blog System Documentation](./README.md)
- [Accessibility Guidelines](./ACCESSIBILITY.md)
- [SEO Best Practices](./SEO.md)

---

**Remember**: Image metadata is not optional. It's a requirement for accessibility compliance and SEO optimization. Every image must have complete metadata to ensure the best possible experience for all users.
