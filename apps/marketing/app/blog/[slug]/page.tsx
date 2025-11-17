import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPostBySlug, getPostSlugs, getRelatedPosts, generateBlogMetadata } from '@/lib/blog'
import { BlogHeader } from '@/components/blog/blog-header'
import { BlogSidebar } from '@/components/blog/blog-sidebar'
import { AuthorBox } from '@/components/blog/author-box'
import { RelatedArticles } from '@/components/blog/related-articles'
import { GetStartedCTA } from '@/components/blog/cta-card'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const slugs = getPostSlugs()
  return slugs.map((slug) => ({
    slug,
  }))
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  try {
    const { slug } = await params
    const post = getPostBySlug(slug)
    return generateBlogMetadata(post)
  } catch (error) {
    return {
      title: 'Post Not Found | StackDock Blog',
      description: 'The requested blog post could not be found.',
    }
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  let post
  let relatedPosts = []

  try {
    const { slug } = await params
    post = getPostBySlug(slug)
    relatedPosts = getRelatedPosts(slug, 3)
  } catch (error) {
    notFound()
  }

  if (!post.published) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-sm font-mono">
            <li>
              <Link
                href="/"
                className="text-neutral-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-1"
              >
                Home
              </Link>
            </li>
            <li className="text-neutral-600">/</li>
            <li>
              <Link
                href="/blog"
                className="text-neutral-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-1"
              >
                Blog
              </Link>
            </li>
            <li className="text-neutral-600">/</li>
            <li className="text-white truncate max-w-xs" aria-current="page">
              {post.title}
            </li>
          </ol>
        </nav>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Table of Contents */}
          <aside className="lg:w-64 lg:flex-shrink-0 order-2 lg:order-1">
            <div className="lg:sticky lg:top-8">
              <BlogSidebar post={post} />
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 order-1 lg:order-2">
            {/* Blog Header */}
            <BlogHeader post={post} />

            {/* Featured Image */}
            {post.image && (
              <div className="mb-8">
                <Image
                  src={post.image}
                  alt={post.imageAlt || post.title}
                  width={post.imageWidth || 800}
                  height={post.imageHeight || 400}
                  className="w-full h-64 md:h-80 object-cover rounded-lg border border-neutral-800"
                  priority
                />
                {post.imageCredit && (
                  <p className="text-sm text-neutral-500 mt-2 text-center">
                    {post.imageCredit}
                  </p>
                )}
              </div>
            )}

            {/* Article Content */}
            <article className="prose prose-invert max-w-none mb-12">
              <div
                className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-neutral-300 prose-strong:text-white prose-a:text-white prose-a:underline hover:prose-a:text-neutral-300 prose-ul:text-neutral-300 prose-ol:text-neutral-300 prose-li:text-neutral-300 prose-blockquote:text-neutral-400 prose-blockquote:border-neutral-700 prose-code:text-blue-400 prose-code:bg-neutral-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </article>

            {/* CTA Card - Embedded in content */}
            <GetStartedCTA />

            {/* Author Box */}
            <AuthorBox author={post.author} />

            {/* Related Articles */}
            {relatedPosts.length > 0 && (
              <RelatedArticles posts={relatedPosts} />
            )}
          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="flex items-center justify-between mt-16 pt-8 border-t border-neutral-900">
          <Link
            href="/blog"
            className="text-neutral-400 hover:text-white font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1"
          >
            ← Back to Blog
          </Link>

          <Link
            href="/"
            className="text-neutral-400 hover:text-white font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1"
          >
            Back to Home →
          </Link>
        </nav>
      </div>
    </div>
  )
}
