import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import type { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/blog'

interface RelatedArticlesProps {
  posts: BlogPost[]
}

export function RelatedArticles({ posts }: RelatedArticlesProps) {
  if (!posts || posts.length === 0) {
    return null
  }

  return (
    <section className="mt-12 pt-8 border-t border-neutral-900">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-mono font-semibold text-white">
          Related Articles
        </h2>
        <Link
          href="/blog"
          className="text-neutral-400 hover:text-white font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1 flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-700 transition-all duration-300 hover:bg-neutral-900/70"
          >
            <Link
              href={`/blog/${post.slug}`}
              className="block focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-lg"
            >
              {/* Featured Image */}
              {post.image && (
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.imageAlt || post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-neutral-800 text-neutral-400 text-xs font-mono rounded border border-neutral-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-mono font-semibold text-white mb-3 group-hover:text-neutral-200 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                {/* Description */}
                <p className="text-sm font-mono text-neutral-400 mb-4 line-clamp-3">
                  {post.description}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <time dateTime={post.date}>
                        {formatDate(post.date)}
                      </time>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readingTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-neutral-400 group-hover:text-white transition-colors">
                    <span>Read more</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-8 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-mono font-semibold rounded-lg hover:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
        >
          Explore More Articles
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
