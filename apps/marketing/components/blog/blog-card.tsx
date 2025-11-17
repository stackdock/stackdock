import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, User, ArrowRight, Tag } from 'lucide-react'
import type { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/blog'

interface BlogCardProps {
  post: BlogPost
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="group bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-700 transition-all duration-300 hover:bg-neutral-900/70 hover:shadow-lg hover:shadow-neutral-900/20">
      <Link 
        href={`/blog/${post.slug}`}
        className="block h-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
        aria-label={`Read blog post: ${post.title}`}
      >
        {/* Featured Image */}
        {post.image && (
          <div className="aspect-video relative overflow-hidden bg-neutral-800">
            <Image
              src={post.image}
              alt={post.imageAlt || post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Category/Tag */}
          {post.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-3 h-3 text-neutral-500" />
              <span className="px-2 py-1 bg-neutral-800 text-neutral-300 text-xs font-mono rounded border border-neutral-700">
                {post.tags[0]}
              </span>
            </div>
          )}

          {/* Title */}
          <h2 className="text-lg font-mono font-semibold text-white mb-3 group-hover:text-neutral-200 transition-colors line-clamp-2 leading-tight">
            {post.title}
          </h2>

          {/* Description */}
          <p className="text-sm font-mono text-neutral-400 mb-4 line-clamp-3 leading-relaxed">
            {post.description}
          </p>

          {/* Author */}
          <div className="flex items-center gap-2 mb-4">
            <User className="w-3 h-3 text-neutral-500" />
            <span className="text-xs font-mono text-neutral-400">{post.author}</span>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs font-mono text-neutral-500 pt-4 border-t border-neutral-800">
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
              <span>Read</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}
