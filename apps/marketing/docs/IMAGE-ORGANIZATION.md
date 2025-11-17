# Image Organization Guide

This document explains how to organize and manage images for the StackDock blog.

## 📁 Directory Structure

```
public/blog/
├── 2024/
│   ├── 12/
│   │   ├── getting-started-with-stackdock/
│   │   │   ├── hero.jpg                    # Featured image (1200x630px)
│   │   │   ├── architecture-diagram.png    # Technical diagrams
│   │   │   └── code-example-screenshot.png # Code screenshots
│   │   └── advanced-configuration/
│   │       ├── hero.jpg
│   │       └── config-flowchart.svg
│   └── 11/
│       └── multi-cloud-best-practices/
│           ├── hero.jpg
│           └── comparison-chart.png
└── assets/
    ├── logos/                              # Company/product logos
    ├── icons/                              # Reusable icons
    └── diagrams/                           # Generic diagrams
```

## 🎯 Why This Structure?

### **Chronological Organization**
- **Easy Navigation**: Find images by publication date
- **Scalable**: Works as your blog grows
- **Archive-Friendly**: Easy to move old content
- **Team Collaboration**: Clear naming conventions

### **SEO Benefits**
- **Clean URLs**: `/blog/2024/12/post-slug/hero.jpg`
- **Predictable Paths**: Easy to reference and link
- **CDN Ready**: Can be easily moved to CDN later

## 📝 Usage Examples

### **In Frontmatter**
```yaml
---
title: "Getting Started with StackDock"
image: "/blog/2024/12/getting-started-with-stackdock/hero.jpg"
imageAlt: "Descriptive alt text for screen readers and SEO"
imageCredit: "Photo by StackDock Team"
imageWidth: 1200
imageHeight: 630
---
```

### **In MDX Content**
```mdx
![Architecture Diagram](/blog/2024/12/getting-started-with-stackdock/architecture-diagram.png)

![Code Example](/blog/2024/12/getting-started-with-stackdock/code-screenshot.png)
```

### **Shared Assets**
```mdx
![StackDock Logo](/blog/assets/logos/stackdock-logo.svg)
![Cloud Icon](/blog/assets/icons/cloud-icon.svg)
```

## 🎯 Image Metadata Requirements

### **Required Fields**
All blog post images must include these metadata fields in the frontmatter:

- **`image`**: Path to the image file
- **`imageAlt`**: Descriptive alt text for accessibility and SEO
- **`imageCredit`**: Attribution/credit for the image
- **`imageWidth`**: Image width in pixels (for proper loading)
- **`imageHeight`**: Image height in pixels (for proper loading)

### **Accessibility Standards**
- Alt text must describe the image content, not just repeat the title
- Use sentence case and be descriptive but concise
- Avoid phrases like "image of" or "picture of"
- Include relevant context that adds value

### **SEO Benefits**
- Proper alt text improves search engine understanding
- Image dimensions help with Core Web Vitals
- Credit attribution builds trust and authority
- Structured metadata improves rich snippets

## 🛠️ Helper Functions

The blog utilities provide helper functions for image management:

```typescript
import { getBlogImagePath, getBlogAssetPath, validateImagePath } from '@/lib/blog'

// Generate image path for a post
const heroPath = getBlogImagePath('getting-started', 'hero.jpg')
// Returns: /blog/2024/12/getting-started/hero.jpg

// Generate asset path
const logoPath = getBlogAssetPath('logos', 'stackdock-logo.svg')
// Returns: /blog/assets/logos/stackdock-logo.svg

// Validate image exists
const exists = validateImagePath('/blog/2024/12/getting-started/hero.jpg')
// Returns: boolean
```

## 🚀 Quick Start

### **1. Create New Post Structure**
```bash
node scripts/create-blog-post.js "my-new-post" "My New Post Title"
```

This creates:
- Directory: `public/blog/2024/12/my-new-post/`
- MDX file: `content/blog/my-new-post.mdx`
- README with usage examples

### **2. Add Images**
1. Add `hero.jpg` (1200x630px) to the post directory
2. Add other images as needed
3. Update the MDX file with image references

### **3. Publish**
1. Set `published: true` in frontmatter
2. Test the build: `pnpm build`
3. Deploy

## 📏 Image Guidelines

### **Hero Images**
- **Dimensions**: 1200x630px (Open Graph standard)
- **Format**: JPG for photos, PNG for graphics
- **File Size**: < 500KB
- **Alt Text**: Descriptive and SEO-friendly

### **Content Images**
- **Width**: Minimum 800px
- **Format**: PNG for diagrams, JPG for photos
- **File Size**: < 1MB
- **Alt Text**: Required for accessibility

### **Icons and Logos**
- **Format**: SVG preferred
- **Size**: 24x24px, 32x32px, or 48x48px
- **File Size**: < 50KB
- **Optimization**: Use SVGO

## 🔧 Optimization Tools

### **Image Compression**
- **Online**: [TinyPNG](https://tinypng.com/), [Squoosh](https://squoosh.app/)
- **CLI**: `imagemin`, `sharp`
- **VS Code**: Image Optimizer extension

### **SVG Optimization**
```bash
npx svgo public/blog/assets/icons/icon.svg
```

### **Batch Processing**
```bash
# Compress all images in a directory
find public/blog -name "*.jpg" -exec jpegoptim --max=80 {} \;
```

## 📱 Responsive Images

### **Next.js Image Component**
```tsx
import Image from 'next/image'

<Image
  src="/blog/2024/12/post-slug/hero.jpg"
  alt="Descriptive alt text"
  width={1200}
  height={630}
  priority // For above-the-fold images
/>
```

### **Responsive Sizes**
```tsx
<Image
  src="/blog/2024/12/post-slug/hero.jpg"
  alt="Descriptive alt text"
  width={1200}
  height={630}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

## 🚨 Common Issues

### **Image Not Found**
- Check file path in frontmatter
- Verify file exists in correct directory
- Use `validateImagePath()` helper

### **Large File Sizes**
- Compress images before adding
- Use WebP format when possible
- Consider lazy loading for below-the-fold images

### **Slow Loading**
- Optimize image dimensions
- Use appropriate formats
- Implement lazy loading
- Consider CDN

## 📚 Best Practices

1. **Consistent Naming**: Use kebab-case for all filenames
2. **Descriptive Names**: Make filenames self-explanatory
3. **Alt Text**: Always include descriptive alt text
4. **Optimization**: Compress images before committing
5. **Version Control**: Don't commit large binary files unnecessarily
6. **Responsive**: Consider mobile viewing when creating images
7. **Performance**: Monitor Core Web Vitals impact

## 🔄 Migration

If migrating from a flat structure:

1. **Create new directory structure**
2. **Move images to appropriate subdirectories**
3. **Update frontmatter and content references**
4. **Test all image links**
5. **Update any hardcoded paths**

## 📞 Support

For questions about image organization:
- Check this documentation
- Review existing blog posts for examples
- Ask in the team chat
- Create an issue if you find a bug
