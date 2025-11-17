import Link from 'next/link'
import { Share2, ArrowLeft, ArrowRight } from 'lucide-react'
import type { BlogPost } from '@/lib/blog'

interface BlogFooterProps {
  post: BlogPost
  relatedPosts: BlogPost[]
}

export function BlogFooter({ post, relatedPosts }: BlogFooterProps) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = `Check out this article: ${post.title}`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: shareUrl,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied to clipboard!')
      } catch (error) {
        console.log('Error copying to clipboard:', error)
      }
    }
  }

  return (
    <footer className="mt-16 pt-8 border-t border-neutral-900">
      {/* Share Section */}
      <section className="mb-12" aria-labelledby="share-heading">
        <h2 id="share-heading" className="text-lg font-mono font-semibold text-white mb-4">
          Share this article
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-300 font-mono text-sm rounded-lg hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Share this article"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          
          <div className="text-sm font-mono text-neutral-500">
            Found this helpful? Share it with your network!
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mb-12" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-lg font-mono font-semibold text-white mb-6">
            Related articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.slug}
                href={`/blog/${relatedPost.slug}`}
                className="group block p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              >
                <h3 className="font-mono font-semibold text-white mb-2 group-hover:text-neutral-200 transition-colors">
                  {relatedPost.title}
                </h3>
                <p className="text-sm font-mono text-neutral-400 line-clamp-2">
                  {relatedPost.description}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs font-mono text-neutral-500">
                  <span>{relatedPost.readingTime}</span>
                  <span>•</span>
                  <span>{relatedPost.tags.slice(0, 2).join(', ')}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Navigation */}
      <nav className="flex items-center justify-between">
        <Link
          href="/blog"
          className="flex items-center gap-2 text-neutral-400 hover:text-white font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
        
        <Link
          href="/"
          className="flex items-center gap-2 text-neutral-400 hover:text-white font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1"
        >
          <ArrowRight className="w-4 h-4" />
          Back to Home
        </Link>
      </nav>
    </footer>
  )
}
