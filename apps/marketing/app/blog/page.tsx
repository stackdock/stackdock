import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, User, ArrowRight, BookOpen } from 'lucide-react'
import { getAllPosts, formatDate } from '@/lib/blog'
import { BlogCard } from '@/components/blog/blog-card'
import { GetStartedCTA } from '@/components/blog/cta-card'

export const metadata = {
  title: 'Blog | StackDock',
  description: 'Technical articles, tutorials, and insights about multi-cloud management with StackDock.',
  openGraph: {
    title: 'StackDock Blog',
    description: 'Technical articles, tutorials, and insights about multi-cloud management with StackDock.',
    type: 'website',
  },
}

export default function BlogPage() {
  const posts = getAllPosts()

  // Group posts by year for archive-style organization
  const postsByYear = posts.reduce((acc, post) => {
    const year = new Date(post.date).getFullYear()
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(post)
    return acc
  }, {} as Record<number, typeof posts>)

  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
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
          
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/stackdock-favicon.png"
              alt="StackDock"
              width={48}
              height={48}
              className="w-8 h-8"
            />
            <h1 className="text-4xl md:text-5xl font-mono font-bold">
              StackDock Blog
            </h1>
          </div>
          
          <p className="text-neutral-400 font-mono text-lg max-w-3xl mb-6">
            Technical articles, tutorials, and insights about multi-cloud management. 
            Learn how to optimize your cloud infrastructure with StackDock.
          </p>

          {/* Blog Stats */}
          <div className="flex flex-wrap items-center gap-6 text-sm font-mono text-neutral-500">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{posts.length} {posts.length === 1 ? 'article' : 'articles'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Updated {formatDate(posts[0]?.date || new Date().toISOString())}</span>
            </div>
          </div>
        </header>


        {/* Featured Article */}
        {posts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-mono font-semibold text-white mb-6">Featured Article</h2>
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
              <Link
                href={`/blog/${posts[0].slug}`}
                className="block group focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Featured Image */}
                  {posts[0].image && (
                    <div className="lg:w-1/2 aspect-video lg:aspect-auto relative overflow-hidden">
                      <img
                        src={posts[0].image}
                        alt={posts[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="lg:w-1/2 p-8">

                    {/* Title */}
                    <h3 className="text-2xl lg:text-3xl font-mono font-bold text-white mb-4 group-hover:text-neutral-200 transition-colors">
                      {posts[0].title}
                    </h3>

                    {/* Description */}
                    <p className="text-neutral-300 font-mono text-base mb-6 line-clamp-3">
                      {posts[0].description}
                    </p>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-neutral-400 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{posts[0].author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <time dateTime={posts[0].date}>
                          {formatDate(posts[0].date)}
                        </time>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{posts[0].readingTime}</span>
                      </div>
                    </div>

                    {/* Read More */}
                    <div className="flex items-center gap-2 text-white font-mono text-sm group-hover:text-neutral-200 transition-colors">
                      <span>Read article</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Blog Posts Archive */}
        <main className="space-y-12">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400 font-mono text-lg mb-4">
                No blog posts available yet.
              </p>
              <p className="text-neutral-500 font-mono text-sm">
                Check back soon for new content!
              </p>
            </div>
          ) : (
            years.map((year) => (
              <section key={year} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-mono font-semibold text-white">
                    {year}
                  </h2>
                  <div className="flex-1 h-px bg-neutral-800"></div>
                  <span className="text-sm font-mono text-neutral-500">
                    {postsByYear[Number(year)].length} {postsByYear[Number(year)].length === 1 ? 'article' : 'articles'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {postsByYear[Number(year)].map((post) => (
                    <BlogCard key={post.slug} post={post} />
                  ))}
                </div>
              </section>
            ))
          )}
        </main>

        {/* CTA Section */}
        <section className="mt-16">
          <GetStartedCTA />
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-neutral-900">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-neutral-500 font-mono text-sm">
              {posts.length} {posts.length === 1 ? 'article' : 'articles'}
            </div>
            
            <div className="flex items-center gap-6">
              <Link
                href="mailto:contact@stackdock.dev?subject=Blog%20Contribution"
                className="text-neutral-400 hover:text-white font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1"
              >
                Contribute
              </Link>
              <Link
                href="/"
                className="text-neutral-400 hover:text-white font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
