import Link from 'next/link'
import { getAllDrafts, formatDate } from '@/lib/blog'
import { BlogCard } from '@/components/blog/blog-card'

export const metadata = {
  title: 'Draft Posts | StackDock',
  description: 'Local draft blog posts for development and review.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DraftsPage() {
  const drafts = getAllDrafts()

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-12">
          <nav aria-label="Breadcrumb">
            <Link
              href="/"
              className="inline-block mb-8 text-neutral-400 hover:text-white font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-1"
              aria-label="Return to StackDock homepage"
            >
              ← Back to Home
            </Link>
          </nav>
          
          <h1 className="text-4xl md:text-5xl font-mono font-bold mb-4">
            Draft Posts
          </h1>
          <p className="text-neutral-400 font-mono text-lg max-w-3xl">
            Local draft blog posts for development and review. These posts are not published and will not appear in the public blog.
          </p>
        </header>

        {/* Draft Posts Grid */}
        <main className="space-y-8">
          {drafts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-400 font-mono text-lg">
                No draft posts found. Create your first draft in the <code className="bg-neutral-800 px-2 py-1 rounded">content/drafts/</code> directory.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {drafts.map((draft) => (
                <div key={draft.slug} className="relative">
                  {/* Draft Badge */}
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="bg-yellow-600 text-black text-xs font-mono font-bold px-2 py-1 rounded-full">
                      DRAFT
                    </span>
                  </div>
                  
                  <BlogCard post={draft} />
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Development Info */}
        <section className="mt-16 pt-8 border-t border-neutral-900">
          <h2 className="text-lg font-mono font-semibold text-white mb-4">
            Development Information
          </h2>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
            <div className="space-y-4 text-sm font-mono text-neutral-300">
              <div>
                <strong className="text-white">Draft Directory:</strong> <code className="bg-neutral-800 px-2 py-1 rounded">content/drafts/</code>
              </div>
              <div>
                <strong className="text-white">File Format:</strong> <code className="bg-neutral-800 px-2 py-1 rounded">.mdx</code> with frontmatter
              </div>
              <div>
                <strong className="text-white">Git Status:</strong> This directory is gitignored and will not be committed
              </div>
              <div>
                <strong className="text-white">Publishing:</strong> Move files to <code className="bg-neutral-800 px-2 py-1 rounded">content/blog/</code> and set <code className="bg-neutral-800 px-2 py-1 rounded">published: true</code>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-neutral-900">
          <div className="flex items-center justify-between">
            <Link
              href="/blog"
              className="text-neutral-400 hover:text-white font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1"
            >
              ← View Published Posts
            </Link>
            
            <Link
              href="/"
              className="text-neutral-400 hover:text-white font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1"
            >
              Back to Home →
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
