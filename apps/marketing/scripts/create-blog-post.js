#!/usr/bin/env node

/**
 * Script to create a new blog post directory structure
 * Usage: node scripts/create-blog-post.js "post-slug" "Post Title"
 */

const fs = require('fs')
const path = require('path')

function createBlogPost(slug, title) {
  const date = new Date()
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  
  // Create directory structure
  const postDir = path.join(process.cwd(), 'public/blog', year, month, slug)
  
  try {
    fs.mkdirSync(postDir, { recursive: true })
    console.log(`✅ Created directory: ${postDir}`)
    
    // Create placeholder files
    const heroImage = path.join(postDir, 'hero.jpg')
    const readmeFile = path.join(postDir, 'README.md')
    
    // Create README for the post
    const readmeContent = `# ${title} - Images

This directory contains images for the blog post: "${title}"

## Images

- \`hero.jpg\` - Featured image (1200x630px recommended)
- Add other images as needed

## Usage in MDX

\`\`\`mdx
---
title: "${title}"
image: "/blog/${year}/${month}/${slug}/hero.jpg"
---

![Hero Image](/blog/${year}/${month}/${slug}/hero.jpg)
\`\`\`
`
    
    fs.writeFileSync(readmeFile, readmeContent)
    console.log(`✅ Created README: ${readmeFile}`)
    
    // Create MDX file in content/blog
    const mdxFile = path.join(process.cwd(), 'content/blog', `${slug}.mdx`)
    const mdxContent = `---
title: "${title}"
description: "Description of your blog post"
date: "${date.toISOString().split('T')[0]}"
author: "StackDock Team"
tags: ["tag1", "tag2"]
image: "/blog/${year}/${month}/${slug}/hero.jpg"
imageAlt: "Descriptive alt text for the featured image"
imageCredit: "Photo by StackDock Team"
imageWidth: 1200
imageHeight: 630
published: false
---

# ${title}

Write your blog post content here...

## Introduction

Start with an engaging introduction...

## Main Content

Add your main content sections...

## Conclusion

Wrap up your post with key takeaways...
`
    
    fs.writeFileSync(mdxFile, mdxContent)
    console.log(`✅ Created MDX file: ${mdxFile}`)
    
    console.log(`\n🎉 Blog post structure created successfully!`)
    console.log(`\nNext steps:`)
    console.log(`1. Add your hero image to: ${postDir}/hero.jpg`)
    console.log(`2. Add other images to: ${postDir}/`)
    console.log(`3. Edit the content in: ${mdxFile}`)
    console.log(`4. Set published: true when ready to publish`)
    console.log(`\nImage path: /blog/${year}/${month}/${slug}/hero.jpg`)
    
  } catch (error) {
    console.error('❌ Error creating blog post:', error.message)
    process.exit(1)
  }
}

// Get command line arguments
const args = process.argv.slice(2)

if (args.length < 2) {
  console.log('Usage: node scripts/create-blog-post.js "post-slug" "Post Title"')
  console.log('Example: node scripts/create-blog-post.js "getting-started" "Getting Started with StackDock"')
  process.exit(1)
}

const [slug, ...titleParts] = args
const title = titleParts.join(' ')

// Validate slug
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error('❌ Slug must contain only lowercase letters, numbers, and hyphens')
  process.exit(1)
}

createBlogPost(slug, title)
