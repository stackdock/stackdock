import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import yaml from 'js-yaml'

// Sanitizes a slug to contain only safe URL path characters: a-z, A-Z, 0-9, -, _
function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9-_]/g, '');
}

// Configure gray-matter to use js-yaml 4 compatible parser
const matterOptions = {
  engines: {
    yaml: (s: string) => {
      try {
        return yaml.load(s, { schema: yaml.DEFAULT_SCHEMA })
      } catch (e) {
        return {}
      }
    },
  },
}

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
  // First, let's process headings to add IDs
  let html = markdown
    // Headers with ID generation
    .replace(/^### (.*$)/gim, (match, title) => {
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      return `<h3 id="${id}" class="text-xl font-semibold text-white mt-6 mb-3">${title}</h3>`
    })
    .replace(/^## (.*$)/gim, (match, title) => {
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      return `<h2 id="${id}" class="text-2xl font-semibold text-white mt-8 mb-4">${title}</h2>`
    })
    .replace(/^# (.*$)/gim, (match, title) => {
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      return `<h1 id="${id}" class="text-3xl font-bold text-white mt-8 mb-6">${title}</h1>`
    })
  // Continue processing the rest
  html = html
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // Italic text
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-neutral-900 border border-neutral-800 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-blue-400">$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-neutral-800 text-blue-400 px-1 py-0.5 rounded text-sm">$1</code>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li class="text-neutral-300 mb-1">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="text-neutral-300 mb-1">$1</li>')
    .replace(/(<li.*<\/li>)/gs, '<ul class="list-disc list-inside my-4 space-y-1">$1</ul>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-white underline hover:text-neutral-300">$1</a>')
    // Paragraphs
    .replace(/^(?!<[h|u|p])(.*$)/gim, '<p class="text-neutral-300 mb-4 leading-relaxed">$1</p>')
    // Clean up empty paragraphs
    .replace(/<p class="text-neutral-300 mb-4 leading-relaxed"><\/p>/g, '')
    // Clean up nested lists
    .replace(/<ul class="list-disc list-inside my-4 space-y-1"><ul class="list-disc list-inside my-4 space-y-1">/g, '<ul class="list-disc list-inside my-4 space-y-1">')
    .replace(/<\/ul><\/ul>/g, '</ul>')

  return html
}

const contentDirectory = path.join(process.cwd(), 'content/blog')
const draftsDirectory = path.join(process.cwd(), 'content/drafts')

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  image?: string
  imageAlt?: string
  imageCredit?: string
  imageWidth?: number
  imageHeight?: number
  published: boolean
  content: string
  readingTime: string
  tableOfContents: TOCItem[]
}

export interface TOCItem {
  id: string
  title: string
  level: number
}

// Extract headings from markdown content for TOC
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

    headings.push({
      id,
      title,
      level,
    })
  }

  return headings
}

// Get all blog post slugs
export function getPostSlugs(): string[] {
  try {
    const files = fs.readdirSync(contentDirectory)
    return files
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => file.replace(/\.mdx$/, ''))
  } catch (error) {
    console.error('Error reading blog directory:', error)
    return []
  }
}

// Get all blog posts with metadata
export function getAllPosts(): BlogPost[] {
  const slugs = getPostSlugs()
  
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return posts
}

// Get a single blog post by slug
export function getPostBySlug(slug: string): BlogPost {
  try {
    const fullPath = path.join(contentDirectory, `${slug}.mdx`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents, matterOptions)

    // Extract headings for table of contents
    const tableOfContents = extractHeadings(content)

    // Calculate reading time
    const readingTimeResult = readingTime(content)

    // Convert markdown to HTML
    const htmlContent = markdownToHtml(content)

    return {
      slug,
      title: data.title || '',
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      author: data.author || 'StackDock Team',
      tags: data.tags || [],
      image: data.image,
      published: data.published !== false,
      content: htmlContent,
      readingTime: readingTimeResult.text,
      tableOfContents,
    }
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error)
    throw new Error(`Blog post not found: ${slug}`)
  }
}

// Get posts by tag
export function getPostsByTag(tag: string): BlogPost[] {
  const allPosts = getAllPosts()
  return allPosts.filter((post) => post.tags.includes(tag))
}

// Get all unique tags
export function getAllTags(): string[] {
  const allPosts = getAllPosts()
  const tags = new Set<string>()
  
  allPosts.forEach((post) => {
    post.tags.forEach((tag) => tags.add(tag))
  })

  return Array.from(tags).sort()
}

// Draft management functions
export function getAllDrafts(): BlogPost[] {
  try {
    const files = fs.readdirSync(draftsDirectory)
    const draftFiles = files.filter((file) => file.endsWith('.mdx'))
    
    const drafts = draftFiles
      .map((file) => {
        const rawSlug = file.replace(/\.mdx$/, '')
        const slug = sanitizeSlug(rawSlug)
        try {
          return getDraftBySlug(slug)
        } catch (error) {
          console.error(`Error reading draft ${slug}:`, error)
          return null
        }
      })
      .filter((draft): draft is BlogPost => draft !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return drafts
  } catch (error) {
    console.error('Error reading drafts directory:', error)
    return []
  }
}

export function getDraftBySlug(slug: string): BlogPost {
  try {
    const fullPath = path.join(draftsDirectory, `${slug}.mdx`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents, matterOptions)

    // Extract headings for table of contents
    const tableOfContents = extractHeadings(content)

    // Calculate reading time
    const readingTimeResult = readingTime(content)

    // Convert markdown to HTML
    const htmlContent = markdownToHtml(content)

    return {
      slug,
      title: data.title || '',
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      author: data.author || 'StackDock Team',
      tags: data.tags || [],
      image: data.image,
      published: data.published !== false,
      content: htmlContent,
      readingTime: readingTimeResult.text,
      tableOfContents,
    }
  } catch (error) {
    console.error(`Error reading draft ${slug}:`, error)
    throw new Error(`Draft not found: ${slug}`)
  }
}

export function getDraftSlugs(): string[] {
  try {
    const files = fs.readdirSync(draftsDirectory)
    return files
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => file.replace(/\.mdx$/, ''))
  } catch (error) {
    console.error('Error reading drafts directory:', error)
    return []
  }
}

// Get related posts (by shared tags)
export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPost[] {
  const currentPost = getPostBySlug(currentSlug)
  const allPosts = getAllPosts().filter((post) => post.slug !== currentSlug)

  // Score posts based on shared tags
  const scoredPosts = allPosts.map((post) => {
    const sharedTags = post.tags.filter((tag) => currentPost.tags.includes(tag))
    return {
      post,
      score: sharedTags.length,
    }
  })

  // Sort by score and return top posts
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post)
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Generate metadata for a blog post
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

// Image path utilities
export function getBlogImagePath(slug: string, imageName: string, year?: string, month?: string): string {
  const date = new Date()
  const imageYear = year || date.getFullYear().toString()
  const imageMonth = month || (date.getMonth() + 1).toString().padStart(2, '0')
  
  return `/blog/${imageYear}/${imageMonth}/${slug}/${imageName}`
}

export function getBlogAssetPath(category: 'logos' | 'icons' | 'diagrams', assetName: string): string {
  return `/blog/assets/${category}/${assetName}`
}

// Validate image path exists
export function validateImagePath(imagePath: string): boolean {
  try {
    const fullPath = path.join(process.cwd(), 'public', imagePath)
    return fs.existsSync(fullPath)
  } catch {
    return false
  }
}

// Get all images for a blog post
export function getPostImages(slug: string): string[] {
  try {
    const postDir = path.join(process.cwd(), 'public/blog')
    const yearDirs = fs.readdirSync(postDir).filter(dir => 
      fs.statSync(path.join(postDir, dir)).isDirectory() && /^\d{4}$/.test(dir)
    )
    
    const images: string[] = []
    
    for (const year of yearDirs) {
      const yearPath = path.join(postDir, year)
      const monthDirs = fs.readdirSync(yearPath).filter(dir => 
        fs.statSync(path.join(yearPath, dir)).isDirectory() && /^\d{2}$/.test(dir)
      )
      
      for (const month of monthDirs) {
        const monthPath = path.join(yearPath, month)
        const postDirs = fs.readdirSync(monthPath).filter(dir => 
          fs.statSync(path.join(monthPath, dir)).isDirectory()
        )
        
        for (const postDir of postDirs) {
          if (postDir === slug) {
            const postPath = path.join(monthPath, postDir)
            const files = fs.readdirSync(postPath)
            const imageFiles = files.filter(file => 
              /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)
            )
            
            images.push(...imageFiles.map(file => `/blog/${year}/${month}/${slug}/${file}`))
          }
        }
      }
    }
    
    return images
  } catch (error) {
    console.error(`Error getting images for post ${slug}:`, error)
    return []
  }
}
