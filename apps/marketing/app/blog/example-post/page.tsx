import Link from 'next/link'
import { Calendar, Clock, User, Tag } from 'lucide-react'

export const metadata = {
  title: "Getting Started with StackDock: A Developer's Guide | StackDock Blog",
  description: "Learn how to set up and configure StackDock for multi-cloud management. This comprehensive guide covers installation, configuration, and best practices.",
  openGraph: {
    title: "Getting Started with StackDock: A Developer's Guide",
    description: "Learn how to set up and configure StackDock for multi-cloud management. This comprehensive guide covers installation, configuration, and best practices.",
    type: 'article',
    publishedTime: '2024-12-28',
    authors: ['StackDock Team'],
    tags: ['getting-started', 'multi-cloud', 'tutorial', 'developer-guide'],
  },
}

export default function ExamplePostPage() {
  const post = {
    title: "Getting Started with StackDock: A Developer's Guide",
    description: "Learn how to set up and configure StackDock for multi-cloud management. This comprehensive guide covers installation, configuration, and best practices.",
    date: "2024-12-28",
    author: "StackDock Team",
    tags: ["getting-started", "multi-cloud", "tutorial", "developer-guide"],
    readingTime: "8 min read"
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-8">
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

        {/* Blog Post Header */}
        <header className="mb-12">
          {/* Post Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm font-mono text-neutral-400 mb-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readingTime}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-mono font-bold text-white mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Description */}
          <p className="text-xl font-mono text-neutral-300 mb-8 leading-relaxed">
            {post.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-mono text-neutral-500">
              <Tag className="w-4 h-4" />
              <span>Tags:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-neutral-800 text-neutral-300 text-sm font-mono rounded-full border border-neutral-700 hover:border-neutral-600 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="prose prose-invert max-w-none">
          <h2 className="text-2xl md:text-3xl font-mono font-semibold text-white mb-4 border-b border-neutral-800 pb-2">
            What is StackDock?
          </h2>
          
          <p className="text-neutral-300 font-mono text-base leading-relaxed mb-4">
            StackDock is designed to help developers manage websites, applications, servers, databases, and APM tools across multiple cloud providers through their APIs. With StackDock, you get:
          </p>

          <ul className="list-disc list-inside text-neutral-300 font-mono mb-4 space-y-2 ml-4">
            <li><strong className="text-white">One Interface</strong>: Unified management across cloud providers</li>
            <li><strong className="text-white">Less Context Switching</strong>: Single platform for all cloud operations</li>
            <li><strong className="text-white">Open Source</strong>: Transparent, community-driven development</li>
            <li><strong className="text-white">API Driven</strong>: Everything accessible through clean APIs</li>
          </ul>

          <h2 className="text-2xl md:text-3xl font-mono font-semibold text-white mb-4 mt-8 border-b border-neutral-800 pb-2">
            Installation
          </h2>

          <h3 className="text-xl md:text-2xl font-mono font-semibold text-white mb-3 mt-6">
            Prerequisites
          </h3>

          <p className="text-neutral-300 font-mono text-base leading-relaxed mb-4">
            Before installing StackDock, ensure you have:
          </p>

          <ul className="list-disc list-inside text-neutral-300 font-mono mb-4 space-y-2 ml-4">
            <li>Node.js 18 or higher</li>
            <li>pnpm (recommended) or npm</li>
            <li>Access to your cloud provider APIs</li>
          </ul>

          <h3 className="text-xl md:text-2xl font-mono font-semibold text-white mb-3 mt-6">
            Quick Start
          </h3>

          <div className="bg-neutral-900 text-neutral-100 p-4 rounded-lg border border-neutral-700 my-6 overflow-x-auto">
            <pre className="text-sm font-mono leading-relaxed">
              <code>{`# Clone the repository
git clone https://github.com/stackdock/stackdock.git
cd stackdock

# Install dependencies
pnpm install

# Start the development server
pnpm dev`}</code>
            </pre>
          </div>

          <h2 className="text-2xl md:text-3xl font-mono font-semibold text-white mb-4 mt-8 border-b border-neutral-800 pb-2">
            Core Features
          </h2>

          <h3 className="text-xl md:text-2xl font-mono font-semibold text-white mb-3 mt-6">
            Multi-Provider Support
          </h3>

          <p className="text-neutral-300 font-mono text-base leading-relaxed mb-4">
            StackDock supports all major cloud providers:
          </p>

          <ul className="list-disc list-inside text-neutral-300 font-mono mb-4 space-y-2 ml-4">
            <li><strong className="text-white">Amazon Web Services (AWS)</strong></li>
            <li><strong className="text-white">Google Cloud Platform (GCP)</strong></li>
            <li><strong className="text-white">Microsoft Azure</strong></li>
            <li><strong className="text-white">DigitalOcean</strong></li>
            <li><strong className="text-white">Linode</strong></li>
          </ul>

          <h3 className="text-xl md:text-2xl font-mono font-semibold text-white mb-3 mt-6">
            API Management
          </h3>

          <p className="text-neutral-300 font-mono text-base leading-relaxed mb-4">
            All operations are performed through clean, RESTful APIs:
          </p>

          <div className="bg-neutral-900 text-neutral-100 p-4 rounded-lg border border-neutral-700 my-6 overflow-x-auto">
            <pre className="text-sm font-mono leading-relaxed">
              <code>{`// Example: List all resources across providers
const resources = await stackdock.resources.list({
  providers: ['aws', 'gcp'],
  types: ['server', 'database']
})

// Example: Deploy an application
const deployment = await stackdock.deploy({
  provider: 'aws',
  region: 'us-east-1',
  configuration: {
    instances: 3,
    instanceType: 't3.medium'
  }
})`}</code>
            </pre>
          </div>

          <h2 className="text-2xl md:text-3xl font-mono font-semibold text-white mb-4 mt-8 border-b border-neutral-800 pb-2">
            Best Practices
          </h2>

          <h3 className="text-xl md:text-2xl font-mono font-semibold text-white mb-3 mt-6">
            Security
          </h3>

          <ul className="list-disc list-inside text-neutral-300 font-mono mb-4 space-y-2 ml-4">
            <li>Always use environment variables for sensitive credentials</li>
            <li>Enable MFA on all cloud provider accounts</li>
            <li>Regularly rotate API keys and access tokens</li>
            <li>Use least-privilege access principles</li>
          </ul>

          <h3 className="text-xl md:text-2xl font-mono font-semibold text-white mb-3 mt-6">
            Performance
          </h3>

          <ul className="list-disc list-inside text-neutral-300 font-mono mb-4 space-y-2 ml-4">
            <li>Cache frequently accessed data</li>
            <li>Use pagination for large resource lists</li>
            <li>Implement proper error handling and retries</li>
            <li>Monitor API rate limits</li>
          </ul>

          <h2 className="text-2xl md:text-3xl font-mono font-semibold text-white mb-4 mt-8 border-b border-neutral-800 pb-2">
            Getting Help
          </h2>

          <p className="text-neutral-300 font-mono text-base leading-relaxed mb-4">
            Have questions or feedback? We'd love to hear from you! Reach out to us at{' '}
            <a
              href="mailto:contact@stackdock.dev"
              className="text-white underline hover:text-neutral-300 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-sm px-1"
            >
              contact@stackdock.dev
            </a>
            .
          </p>
        </main>

        {/* Navigation */}
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
