import Link from 'next/link'
import { Calendar, Clock, User } from 'lucide-react'
import type { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/blog'

interface BlogHeaderProps {
  post: BlogPost
}

export function BlogHeader({ post }: BlogHeaderProps) {
  return (
    <header className="mb-8">
      {/* Category/Tag Badge */}
      {post.tags.length > 0 && (
        <div className="mb-4">
          <Link
            href={`/blog?tag=${post.tags[0]}`}
            className="inline-block px-3 py-1 bg-neutral-800 text-neutral-300 text-sm font-mono rounded-full border border-neutral-700 hover:bg-neutral-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          >
            {post.tags[0]}
          </Link>
        </div>
      )}

      {/* Post Title */}
      <h1 className="text-4xl md:text-5xl font-mono font-bold text-white mb-6 leading-tight">
        {post.title}
      </h1>

      {/* Author and Date */}
      <div className="flex flex-wrap items-center gap-6 text-sm font-mono text-neutral-400 mb-6">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="text-neutral-500">Author</span>
          <span className="text-white">{post.author}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="text-neutral-500">Published</span>
          <time dateTime={post.date} className="text-white">
            {formatDate(post.date)}
          </time>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-neutral-500">Reading time</span>
          <span className="text-white">{post.readingTime}</span>
        </div>
      </div>

      {/* Description */}
      <div className="text-xl font-mono text-neutral-300 mb-6 leading-relaxed">
        {post.description}
      </div>

      {/* Additional Tags */}
      {post.tags.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.slice(1).map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${tag}`}
              className="px-3 py-1 bg-neutral-900/50 text-neutral-400 text-sm font-mono rounded-full border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-300 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
