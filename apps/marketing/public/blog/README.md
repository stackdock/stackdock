# Blog Images Organization

This directory contains all images used in blog posts, organized for easy management and scalability.

## Directory Structure

```
public/blog/
├── 2024/
│   ├── 12/
│   │   ├── getting-started-with-stackdock/
│   │   │   ├── hero.jpg                    # Featured image
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

## Naming Conventions

### Post-Specific Images
- **Hero Image**: `hero.jpg` or `hero.png` (1200x630px recommended)
- **Diagrams**: `{purpose}-diagram.{ext}` (e.g., `architecture-diagram.png`)
- **Screenshots**: `{purpose}-screenshot.{ext}` (e.g., `code-example-screenshot.png`)
- **Charts**: `{purpose}-chart.{ext}` (e.g., `comparison-chart.png`)

### Asset Images
- **Logos**: `{company}-logo.{ext}` (e.g., `stackdock-logo.svg`)
- **Icons**: `{purpose}-icon.{ext}` (e.g., `cloud-icon.svg`)
- **Diagrams**: `{purpose}-diagram.{ext}` (e.g., `workflow-diagram.svg`)

## Image Guidelines

### Dimensions
- **Hero Images**: 1200x630px (Open Graph standard)
- **Diagrams**: Minimum 800px width, maintain aspect ratio
- **Screenshots**: High resolution, readable text
- **Icons**: 24x24px, 32x32px, or 48x48px

### Formats
- **Photos**: JPG (for photographs)
- **Diagrams**: PNG (for diagrams with text)
- **Icons**: SVG (for scalable icons)
- **Screenshots**: PNG (for code screenshots)

### Optimization
- Compress images before adding to repository
- Use WebP format when possible for better performance
- Include alt text in blog posts for accessibility

## Usage in Blog Posts

### Frontmatter
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

### In Content
```mdx
![Architecture Diagram](/blog/2024/12/getting-started-with-stackdock/architecture-diagram.png)
```

**Important**: Always include descriptive alt text for accessibility and SEO.

### Shared Assets
```mdx
![StackDock Logo](/blog/assets/logos/stackdock-logo.svg)
```

## Best Practices

1. **Consistent Naming**: Use kebab-case for all filenames
2. **Descriptive Names**: Make filenames self-explanatory
3. **Version Control**: Don't commit large binary files unnecessarily
4. **Alt Text**: Always include descriptive alt text for accessibility
5. **Image Metadata**: Include imageAlt, imageCredit, imageWidth, imageHeight in frontmatter
6. **Responsive**: Consider mobile viewing when creating images
7. **Performance**: Optimize file sizes for web delivery
8. **SEO**: Use descriptive alt text and proper dimensions for search engines

## Migration from Old Structure

If migrating from a flat structure:
1. Create year/month directories
2. Move images to appropriate subdirectories
3. Update frontmatter and content references
4. Test all image links

## Tools

- **Image Optimization**: Use tools like ImageOptim, TinyPNG, or Squoosh
- **Format Conversion**: Use online converters or command-line tools
- **SVG Optimization**: Use SVGO for SVG files
